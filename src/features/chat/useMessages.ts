// src/features/chat/useMessages.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../supabase/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { Message } from '../../types';
import { addToast } from "@heroui/react";

const MESSAGES_PER_PAGE = 30;

export const useMessages = (conversationId: number | null) => {
  const { user } = useAuth();
  const [error, setError] = useState<Error | null>(null);
  const channelRef = useRef<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const pageRef = useRef(0);

  const markAsRead = useCallback(async () => {
    if (!conversationId || !user) return;
    try {
      await supabase.rpc('mark_messages_as_read', { p_conversation_id: conversationId });
    } catch (err) {
      console.error("Failed to mark messages as read:", err);
    }
  }, [conversationId, user]);

  const fetchMessageWithProfile = useCallback(async (messageId: number) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`*, sender:profiles(*)`)
        .eq('id', messageId)
        .single();
      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Failed to fetch message with profile:', err);
      return null;
    }
  }, []);

  const deleteMessage = useCallback(async (messageId: number) => {
    if (!conversationId || !user) return;
    setMessages(prev => prev.filter(m => m.id !== messageId));
    try {
      const { error } = await supabase.from('messages').update({ deleted_at: new Date().toISOString() }).eq('id', messageId);
      if (error) throw error;
    } catch (err: any) {
      addToast({ title: "Error", description: "Could not delete message.", color: "danger" });
    }
  }, [conversationId, user]);

  const sendTextMessage = useCallback(async (content: string, tempIdToRetry?: string) => {
    if (!conversationId || !user) return;
    const tempId = tempIdToRetry || `temp_${Date.now()}`;
    
    if (!tempIdToRetry) {
      const optimisticMessage: Message = {
        id: -1,
        temp_id: tempId,
        created_at: new Date().toISOString(),
        content: content.trim(),
        image_url: null,
        conversation_id: conversationId,
        sender_id: user.id,
        status: 'sending',
        read_at: null,
        sender: {
          id: user.id,
          username: user.user_metadata?.username || 'You',
          avatar_url: user.user_metadata?.profilePic || null,
          plan: user.user_metadata?.plan || 'free',
          full_name: user.user_metadata?.fullName || null,
          banner_url: null,
          description: null,
          chatamata_id: null,
          joined_at: null,
          updated_at: null,
          profile_setup_complete: true,
        },
      };
      setMessages(prev => [...prev, optimisticMessage]);
    } else {
      setMessages(prev => prev.map(m => m.temp_id === tempId ? { ...m, status: 'sending' } : m));
    }

    try {
      const { data } = await supabase
        .from('messages')
        .insert({ conversation_id: conversationId, sender_id: user.id, content: content.trim() })
        .select(`*, sender:profiles(*)`)
        .single();
      setMessages(prev => prev.map(m => m.temp_id === tempId ? { ...data, status: 'success' } : m));
    } catch {
      setMessages(prev => prev.map(m => m.temp_id === tempId ? { ...m, status: 'error' } : m));
      addToast({ title: "Send Error", description: "Message failed to send.", color: "danger" });
    }
  }, [conversationId, user]);

  const sendImageMessage = useCallback(async (file: File) => {
    if (!conversationId || !user) return;
    const tempId = `temp_${Date.now()}`;
    const localImageUrl = URL.createObjectURL(file);

    const optimisticMessage: Message = {
      id: -1,
      temp_id: tempId,
      created_at: new Date().toISOString(),
      content: null,
      image_url: localImageUrl,
      conversation_id: conversationId,
      sender_id: user.id,
      status: 'sending',
      read_at: null,
      sender: {
        id: user.id,
        username: user.user_metadata?.username || 'You',
        avatar_url: user.user_metadata?.profilePic || null,
        plan: user.user_metadata?.plan || 'free',
        full_name: user.user_metadata?.fullName || null,
        banner_url: null,
        description: null,
        chatamata_id: null,
        joined_at: null,
        updated_at: null,
        profile_setup_complete: true,
      },
    };
    setMessages(prev => [...prev, optimisticMessage]);

    try {
      const ext = file.name.split('.').pop();
      const path = `${conversationId}/${Date.now()}.${ext}`;
      await supabase.storage.from('chatimages').upload(path, file);
      const { data: { publicUrl } } = supabase.storage.from('chatimages').getPublicUrl(path);
      const { data: saved } = await supabase
        .from('messages')
        .insert({ conversation_id: conversationId, sender_id: user.id, image_url: publicUrl })
        .select(`*, sender:profiles(*)`)
        .single();
      URL.revokeObjectURL(localImageUrl);
      setMessages(prev => prev.map(m => m.temp_id === tempId ? { ...saved, status: 'success' } : m));
    } catch {
      URL.revokeObjectURL(localImageUrl);
      setMessages(prev => prev.map(m => m.temp_id === tempId ? { ...m, status: 'error' } : m));
      addToast({ title: "Image Send Error", description: "Failed to send image.", color: "danger" });
    }
  }, [conversationId, user]);

  const loadMoreMessages = useCallback(async () => {
    if (loadingMore || !hasMore || !conversationId) return;
    setLoadingMore(true);
    const currentPage = pageRef.current + 1;
    const page = pageRef.current + 1;
    const from = page * MESSAGES_PER_PAGE;
    const to = from + MESSAGES_PER_PAGE - 1;

    try {
      const { data } = await supabase
        .from('messages')
        .select(`*, sender:profiles(*), read_at:message_read_statuses(read_at)`)
        .eq('conversation_id', conversationId)
        .is('deleted_at', null) // <-- FIX: Filter out deleted messages
        .order('created_at', { ascending: false })
        .range(currentPage * MESSAGES_PER_PAGE, (currentPage + 1) * MESSAGES_PER_PAGE - 1);
      const newMessages = (data || []).map(msg => ({
        ...msg,
        status: 'success' as const,
        read_at: msg.read_at?.[0]?.read_at || null,
      })).reverse();

      setMessages(prev => [...newMessages, ...prev]);
      setHasMore(data?.length === MESSAGES_PER_PAGE);
      pageRef.current = page;
    } catch (err) {
      setError(err as Error);
    }
    setLoadingMore(false);
  }, [loadingMore, hasMore, conversationId]);

  useEffect(() => {
    if (!conversationId || !user) {
      setMessages([]);
      setLoading(false);
      return;
    }

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase.channel(`chat-${conversationId}-${user.id}-${Date.now()}`);
    channelRef.current = channel;

    const fetchInitial = async () => {
      setLoading(true);
      pageRef.current = 0;
      setHasMore(true);
      try {
        const { data } = await supabase
          .from('messages')
          .select(`*, sender:profiles(*), read_at:message_read_statuses(read_at)`)
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: false })
          .range(0, MESSAGES_PER_PAGE - 1);
        const initialMessages = (data || []).map(msg => ({
          ...msg,
          status: 'success' as const,
          read_at: msg.read_at?.[0]?.read_at || null,
        })).reverse();
        setMessages(initialMessages);
        setHasMore(data.length === MESSAGES_PER_PAGE);
        await markAsRead();
      } catch (err) {
        console.error('Initial fetch failed:', err);
        setError(err as Error);
      }
      setLoading(false);
    };

    fetchInitial();

    const handleNewMessage = async ({ new: newMsg }: any) => {
      if (newMsg.sender_id === user.id) return;
      const full = await fetchMessageWithProfile(newMsg.id);
      if (full) {
        setMessages(prev => prev.some(m => m.id === full.id) ? prev : [...prev, { ...full, status: 'success' }]);
        await markAsRead();
      }
    };

    const handleReadStatus = ({ new: { message_id, read_at } }: any) => {
      setMessages(prev => prev.map(m => m.id === message_id ? { ...m, read_at } : m));
    };

    channel
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      }, handleNewMessage)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'message_read_statuses'
      }, handleReadStatus)
      .subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [conversationId, user?.id, markAsRead, fetchMessageWithProfile]);

  return { messages, loading, loadingMore, hasMore, sendTextMessage, sendImageMessage, loadMoreMessages, deleteMessage };
};


