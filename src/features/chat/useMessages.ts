// src/features/chat/useMessages.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../supabase/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { Message, Profile } from '../../types';
import { addToast } from "@heroui/react";

const MESSAGES_PER_PAGE = 20;

export const useMessages = (conversationId: number | null) => {
  const { session } = useAuth();
  const user = session?.user;

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const pageRef = useRef(0);
  // We no longer need the participants map in state, as we join profiles directly.

  // --- Send Message (this can stay outside as it's returned) ---
  const sendMessage = useCallback(async (content: string): Promise<boolean> => {
      if (!conversationId || !user || !content.trim()) return false;
      try {
          const { error: insertError } = await supabase
              .from('messages')
              .insert({
                  conversation_id: conversationId,
                  sender_id: user.id,
                  content: content.trim(),
              });
          if (insertError) throw insertError;
          return true;
      } catch (err: any) {
          addToast({ title: "Send Error", description: `Failed to send message: ${err.message}`, color: "danger" });
          return false;
      }
  }, [conversationId, user]);

  // --- Load More Messages (this can also stay outside) ---
  const loadMoreMessages = useCallback(async () => {
    if (!hasMore || loading || !conversationId) return;

    setLoading(true);
    const currentPage = pageRef.current + 1;
    const rangeStart = currentPage * MESSAGES_PER_PAGE;
    const rangeEnd = rangeStart + MESSAGES_PER_PAGE - 1;

    try {
        const { data, error: fetchError } = await supabase
            .from('messages')
            .select(`*, sender:profiles(*), read_at:message_read_statuses(read_at)`)
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: false })
            .range(rangeStart, rangeEnd);
        
        if (fetchError) throw fetchError;

        const newMessages = (data || []).map((msg: any) => ({
            ...msg,
            read_at: msg.read_at.length > 0 ? msg.read_at[0].read_at : null
        })).reverse();

        setMessages(prev => [...newMessages, ...prev]);
        setHasMore(data.length === MESSAGES_PER_PAGE);
        pageRef.current = currentPage;

    } catch (err: any) {
        setError(err);
    } finally {
        setLoading(false);
    }
  }, [conversationId, hasMore, loading]);


  // --- Main Effect for Fetching and Subscriptions ---
  useEffect(() => {
    // If no conversation is selected, do nothing.
    if (!conversationId) {
      setMessages([]);
      return;
    }

    // --- Define async functions INSIDE the effect ---

    const markAsRead = async () => {
        try {
            await supabase.rpc('mark_messages_as_read', { p_conversation_id: conversationId });
        } catch (err: any) {
            console.error("Failed to mark messages as read:", err.message);
        }
    };

    const fetchInitialMessages = async () => {
        setLoading(true);
        pageRef.current = 0; // Reset pagination
        setHasMore(true);

        const { data, error: fetchError } = await supabase
            .from('messages')
            .select(`*, sender:profiles(*), read_at:message_read_statuses(read_at)`)
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: false })
            .range(0, MESSAGES_PER_PAGE - 1);
        
        if (fetchError) {
            setError(fetchError);
            addToast({ title: "Error", description: `Failed to fetch messages: ${fetchError.message}`, color: "danger" });
        } else {
            const newMessages = (data || []).map((msg: any) => ({
                ...msg,
                read_at: msg.read_at.length > 0 ? msg.read_at[0].read_at : null
            })).reverse();
            setMessages(newMessages);
            setHasMore(data.length === MESSAGES_PER_PAGE);
            // Mark initial batch as read
            markAsRead();
        }
        setLoading(false);
    };

    // --- Execute initial fetch ---
    fetchInitialMessages();


    // --- Setup Realtime Subscriptions ---

    const handleNewMessage = async (payload: any) => {
        const newMessage = payload.new as Message;
        // Fetch sender profile if not already loaded (less likely now, but good fallback)
        const { data: senderData } = await supabase.from('profiles').select('*').eq('id', newMessage.sender_id).single();
        const messageForState: Message = { ...newMessage, sender: senderData!, read_at: null };
        
        setMessages(prev => {
            if (prev.some(m => m.id === messageForState.id)) return prev;
            return [...prev, messageForState];
        });
        
        // If the new message is not from the current user, mark it as read
        if (newMessage.sender_id !== user?.id) {
            markAsRead();
        }
    };
    
    const handleReadStatus = (payload: any) => {
        const { message_id, read_at, user_id } = payload.new;
        // Update a message's read_at only if it's not our own read status update
        if (user_id !== user?.id) {
            setMessages(prev => prev.map(m => 
                m.id === message_id ? { ...m, read_at } : m
            ));
        }
    };

    const messagesChannel = supabase
        .channel(`messages:convo_${conversationId}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` }, handleNewMessage)
        .subscribe();
      
    const readStatusChannel = supabase
        .channel(`read_status:convo_${conversationId}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'message_read_statuses' }, handleReadStatus)
        .subscribe();

    // --- Cleanup ---
    return () => {
        supabase.removeChannel(messagesChannel);
        supabase.removeChannel(readStatusChannel);
    };

  }, [conversationId, user?.id]); // The effect now ONLY depends on conversationId and userId

  return { messages, loading, error, hasMore, sendMessage, loadMoreMessages };
};