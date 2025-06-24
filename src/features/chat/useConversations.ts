import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '../../supabase/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { addToast } from "@heroui/react";
import { ConversationPreview } from '../../types';

export const useConversations = () => {
  const { session, user } = useAuth();
  const [conversations, setConversations] = useState<ConversationPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const channelRef = useRef<any>(null);
  const initialLoadRef = useRef(false);

  // This function fetches the entire, up-to-date list.
  const fetchAllConversations = useCallback(async () => {
    if (!session) return;
    
    // Only show the main skeleton on the very first load
    if (!initialLoadRef.current) {
      setLoading(true);
    }
    setError(null);
    
    try {
      const { data, error: rpcError } = await supabase.rpc('get_user_conversations');
      if (rpcError) throw rpcError;
      
      // Sort the conversations to ensure the most recent is always first
      const sortedData = (data || []).sort((a: ConversationPreview, b: ConversationPreview) => 
        new Date(b.latest_message_created_at || 0).getTime() - new Date(a.latest_message_created_at || 0).getTime()
      );
      setConversations(sortedData);
      initialLoadRef.current = true;

    } catch (err: any) {
      console.error('Fetch conversations error:', err);
      setError(err);
      addToast({ 
        title: "Error", 
        description: `Failed to fetch conversations: ${err.message}`, 
        color: "danger" 
      });
    } finally {
      setLoading(false);
    }
  }, [session]); // Removed conversations.length dependency

  // Optimized update function for real-time changes
  const updateConversationFromMessage = useCallback((messagePayload: any) => {
    const { conversation_id, created_at, content, image_url, sender_id } = messagePayload;
    
    setConversations(prev => {
      const updated = prev.map(convo => {
        if (convo.conversation_id === conversation_id) {
          return {
            ...convo,
            latest_message_created_at: created_at,
            latest_message_content: content || (image_url ? '📷 Image' : 'Message'),
            // Only increment unread count if it's not from the current user
            unread_count: sender_id === user?.id ? convo.unread_count : (convo.unread_count || 0) + 1
          };
        }
        return convo;
      });
      
      // Re-sort conversations by latest message time
      return updated.sort((a, b) => 
        new Date(b.latest_message_created_at || 0).getTime() - new Date(a.latest_message_created_at || 0).getTime()
      );
    });
  }, [user?.id]);

  // Handle read status updates
  const updateReadStatus = useCallback((readPayload: any) => {
    const { conversation_id } = readPayload;
    
    setConversations(prev => prev.map(convo => {
      if (convo.conversation_id === conversation_id) {
        return {
          ...convo,
          unread_count: 0 // Reset unread count when messages are read
        };
      }
      return convo;
    }));
  }, []);

  // Initial fetch when the hook mounts
  useEffect(() => {
    fetchAllConversations();
  }, [fetchAllConversations]);

  // Real-time subscriptions
  useEffect(() => {
    if (!user) return;

    // Cleanup previous channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    // Create unique channel name
    const channelName = `conversations-${user.id}-${Date.now()}`;
    const channel = supabase.channel(channelName);
    channelRef.current = channel;

    // Handle new messages
    const handleNewMessage = (payload: any) => {
      console.log('New message for conversations:', payload);
      updateConversationFromMessage(payload.new);
    };

    // Handle message read status updates
    const handleReadStatusUpdate = (payload: any) => {
      console.log('Read status update for conversations:', payload);
      updateReadStatus(payload.new);
    };

    // Handle new conversations (when someone starts a new chat)
    const handleNewConversation = () => {
      console.log('New conversation detected, refetching...');
      fetchAllConversations();
    };

    // Subscribe to relevant changes
    channel
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        handleNewMessage
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'message_read_statuses'
        },
        handleReadStatusUpdate
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'participants'
        },
        handleNewConversation
      )
      .subscribe((status, err) => {
        console.log('Conversations subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('Realtime channel for conversations is subscribed.');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Realtime channel error:', err);
        }
      });

    // Cleanup function
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user, updateConversationFromMessage, updateReadStatus, fetchAllConversations]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []);

  // Memoized filtering for search
  const filteredConversations = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return conversations;
    return conversations.filter(convo =>
      convo.display_name?.toLowerCase().includes(query) ||
      convo.latest_message_content?.toLowerCase().includes(query)
    );
  }, [searchQuery, conversations]);

  // Manual refresh function
  const refetch = useCallback(() => {
    fetchAllConversations();
  }, [fetchAllConversations]);

  return {
    conversations: filteredConversations,
    loading,
    error,
    refetch,
    searchQuery,
    setSearchQuery
  };
};