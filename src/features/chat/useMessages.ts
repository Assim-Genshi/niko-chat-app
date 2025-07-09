// src/features/chat/useMessages.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../supabase/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { Message } from '../../types';
import { addToast } from "@heroui/react";

const MESSAGES_PER_PAGE = 30;

export const useMessages = (conversationId: number | null) => {
  const { session, user } = useAuth();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const pageRef = useRef(0);
  const channelRef = useRef<any>(null);

  // Function to mark all incoming messages in the current conversation as read
  const markAsRead = useCallback(async () => {
    if (!conversationId || !user) return;
    try {
      await supabase.rpc('mark_messages_as_read', {
        p_conversation_id: conversationId
      });
    } catch (err) {
      console.error("Failed to mark messages as read:", err);
    }
  }, [conversationId, user]);

  // Helper function to fetch message with full profile data
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

    // Optimistically update the UI by filtering out the message
    setMessages(prev => prev.filter(m => m.id !== messageId));

    try {
      // Perform the "soft delete" in the database
      const { error } = await supabase
        .from('messages')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', messageId);

      if (error) {
        // If the delete fails, we would ideally add the message back to the list.
        // For now, we'll show an error.
        throw error;
      }
    } catch (err: any) {
      addToast({ title: "Error", description: "Could not delete message.", color: "danger" });
    }
  }, [conversationId, user]);

  // Send a Text Message (with optimistic UI)
  const sendTextMessage = useCallback(async (content: string, tempIdToRetry?: string) => {
    if (!conversationId || !user) return;
    const tempId = tempIdToRetry || `temp_${Date.now()}_${Math.random()}`;
    
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
      setMessages(prev => prev.map(m => 
        m.temp_id === tempId ? { ...m, status: 'sending' } : m
      ));
    }

    try {
      const { data: savedMessage, error: insertError } = await supabase
        .from('messages')
        .insert({ 
          conversation_id: conversationId, 
          sender_id: user.id, 
          content: content.trim() 
        })
        .select(`*, sender:profiles(*)`)
        .single();
      
      if (insertError) throw insertError;
      
      setMessages(prev => prev.map(m => 
        m.temp_id === tempId ? { ...savedMessage, status: 'success' } : m
      ));
    } catch (err: any) {
      console.error('Send message error:', err);
      setMessages(prev => prev.map(m => 
        m.temp_id === tempId ? { ...m, status: 'error' } : m
      ));
      addToast({ 
        title: "Send Error", 
        description: "Message failed to send.", 
        color: "danger" 
      });
    }
  }, [conversationId, user]);
  
  // Send an Image Message (with optimistic UI)

  
  const sendImageMessage = useCallback(async (file: File) => {
    if (!conversationId || !user || !file) return;
    
    // Debug logging
    console.log('Debug info:', {
      conversationId,
      userId: user.id,
      userRole: user.role,
      fileName: file.name,
      fileSize: file.size
    });
    
    const tempId = `temp_${Date.now()}_${Math.random()}`;
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
      const fileExt = file.name.split('.').pop();
      const filePath = `${conversationId}/${Date.now()}.${fileExt}`;
      
      console.log('Uploading to path:', filePath);
      
      const { error: uploadError } = await supabase.storage
        .from('chatimages')
        .upload(filePath, file);
      
      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }
      
      const { data: { publicUrl } } = supabase.storage
        .from('chatimages')
        .getPublicUrl(filePath);
      
      if (!publicUrl) throw new Error("Could not get public URL for image.");
      
      console.log('Public URL:', publicUrl);
      console.log('About to insert message with:', {
        conversation_id: conversationId,
        sender_id: user.id,
        image_url: publicUrl
      });
      
      const { data: savedMessage, error: insertError } = await supabase
        .from('messages')
        .insert({ 
          conversation_id: conversationId, 
          sender_id: user.id, 
          image_url: publicUrl 
        })
        .select(`*, sender:profiles(*)`)
        .single();
      
      if (insertError) {
        console.error('Insert error details:', insertError);
        throw insertError;
      }
      
      URL.revokeObjectURL(localImageUrl);
      setMessages(prev => prev.map(m => 
        m.temp_id === tempId ? { ...savedMessage, status: 'success' } : m
      ));
    } catch (err: any) {
      console.error('Send image error:', err);
      URL.revokeObjectURL(localImageUrl);
      setMessages(prev => prev.map(m => 
        m.temp_id === tempId ? { ...m, status: 'error' } : m
      ));
      addToast({ 
        title: "Image Send Error", 
        description: "Failed to send image.", 
        color: "danger" 
      });
    }
  }, [conversationId, user]);

  // Load More Messages (Pagination)
  const loadMoreMessages = useCallback(async () => {
    if (loadingMore || !hasMore || !conversationId) return;
    
    setLoadingMore(true);
    const currentPage = pageRef.current + 1;
    const rangeStart = currentPage * MESSAGES_PER_PAGE;
    
    try {
      const { data, error: fetchError } = await supabase
        .from('messages')
        .select(`*, sender:profiles(*), read_at:message_read_statuses(read_at)`)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .range(rangeStart, rangeStart + MESSAGES_PER_PAGE - 1);
      
      if (fetchError) throw fetchError;
      
      const newMessages = (data || []).map((msg: any) => ({
        ...msg,
        status: 'success' as const,
        read_at: msg.read_at?.length > 0 ? msg.read_at[0].read_at : null
      })).reverse();
      
      setMessages(prev => [...newMessages, ...prev]);
      setHasMore(data.length === MESSAGES_PER_PAGE);
      pageRef.current = currentPage;
    } catch (err: any) {
      console.error('Load more messages error:', err);
      setError(err);
    }
    
    setLoadingMore(false);
  }, [loadingMore, hasMore, conversationId]);

  // Main effect for initial load and real-time subscriptions
  useEffect(() => {
    if (!conversationId || !user) {
      setMessages([]);
      setLoading(false);
      return;
    }

    // Cleanup previous channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    // Fetch initial messages
    const fetchInitialMessages = async () => {
      setLoading(true);
      pageRef.current = 0;
      setHasMore(true);
      setError(null);
      
      try {
        const { data, error: fetchError } = await supabase
          .from('messages')
          .select(`*, sender:profiles(*), read_at:message_read_statuses(read_at)`)
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: false })
          .range(0, MESSAGES_PER_PAGE - 1);
        
        if (fetchError) throw fetchError;
        
        const newMessages = (data || []).map((msg: any) => ({
          ...msg,
          status: 'success' as const,
          read_at: msg.read_at?.length > 0 ? msg.read_at[0].read_at : null
        })).reverse();
        
        setMessages(newMessages);
        setHasMore(data.length === MESSAGES_PER_PAGE);
        
        // Mark messages as read after initial load
        await markAsRead();
      } catch (err: any) {
        console.error('Fetch initial messages error:', err);
        setError(err);
      }
      
      setLoading(false);
    };
    
    fetchInitialMessages();

    // Setup real-time subscriptions with unique channel name
    const channelName = `chat-${conversationId}-${user.id}-${Date.now()}`;
    const channel = supabase.channel(channelName);
    channelRef.current = channel;
    
    // Handle new messages
    const handleNewMessage = async (payload: any) => {
      console.log('New message received:', payload);
      const newMessage = payload.new;
      
      // Skip if it's our own message (already handled optimistically)
      if (newMessage.sender_id === user.id) {
        return;
      }
      
      // Fetch the complete message with profile data
      const fullMessage = await fetchMessageWithProfile(newMessage.id);
      if (fullMessage) {
        setMessages(prev => {
          // Check if message already exists
          const exists = prev.some(m => m.id === fullMessage.id);
          if (exists) return prev;
          
          return [...prev, { ...fullMessage, status: 'success' }];
        });
        
        // Mark new message as read immediately
        await markAsRead();
      }
    };
    
    // Handle read status updates
    const handleReadStatus = (payload: any) => {
      console.log('Read status update:', payload);
      const { message_id, read_at } = payload.new;
      
      setMessages(prev => prev.map(m => 
        m.id === message_id ? { ...m, read_at: read_at } : m
      ));
    };

    // Subscribe to changes
    channel
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        handleNewMessage
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'message_read_statuses'
          // Remove conversation filter here - use message_id instead
        },
        handleReadStatus
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
      });

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [conversationId, user?.id, markAsRead, fetchMessageWithProfile]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []);

  return { 
    messages, 
    loading, 
    deleteMessage,
    loadingMore, 
    hasMore, 
    error,
    sendTextMessage, 
    sendImageMessage, 
    loadMoreMessages 
  };
};