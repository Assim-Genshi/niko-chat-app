// src/features/chat/useConversations.ts
import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../supabase/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { addToast } from "@heroui/react";
import { ConversationPreview } from '../../types';

export const useConversations = () => {
  const { session, user } = useAuth();
  const [conversations, setConversations] = useState<ConversationPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  // --- NEW: State for search functionality ---
  const [searchQuery, setSearchQuery] = useState('');

  // The initial fetch for all conversations
  const fetchAllConversations = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: rpcError } = await supabase.rpc('get_user_conversations');
      if (rpcError) throw rpcError;
      setConversations(data || []);
    } catch (err: any) {
      setError(err);
      addToast({ title: "Error", description: `Failed to fetch conversations: ${err.message}`, color: "danger" });
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    fetchAllConversations();
  }, [fetchAllConversations]);


  // --- NEW: Robust Real-time Subscription Logic ---
  useEffect(() => {
    if (!user) return;

    // Helper function to fetch a single, updated conversation and update state
    const updateSingleConversation = async (conversationId: number) => {
        const { data, error } = await supabase
            .rpc('get_user_conversations')
            .eq('conversation_id', conversationId)
            .single();

        if (error || !data) {
            console.error('Could not refetch single conversation:', error);
            return;
        }

        const updatedConvo = data as ConversationPreview;

        setConversations(currentList => {
            const listWithoutOld = currentList.filter(c => c.conversation_id !== conversationId);
            return [updatedConvo, ...listWithoutOld];
        });
    };

    const handleMessageInsert = (payload: any) => {
        updateSingleConversation(payload.new.conversation_id);
    };

    const handleProfileUpdate = (payload: any) => {
        // When a profile updates, we could refetch every conversation with that user,
        // but a simpler approach is to just refetch the whole list. This is less frequent.
        fetchAllConversations();
    };

    // When we're added to a new chat (e.g., friend request accepted)
    const handleNewParticipant = (payload: any) => {
        if (payload.new.user_id === user.id) {
            fetchAllConversations(); // Refetch the list to show the new conversation
        }
    };
    
    // Subscriptions
    const messages = supabase.channel('public:messages:useConversations')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, handleMessageInsert)
        .subscribe();
        
    const profiles = supabase.channel('public:profiles:useConversations')
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, handleProfileUpdate)
        .subscribe();
        
    const participants = supabase.channel('public:participants:useConversations')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'participants' }, handleNewParticipant)
        .subscribe();

    // Cleanup
    return () => {
        supabase.removeChannel(messages);
        supabase.removeChannel(profiles);
        supabase.removeChannel(participants);
    };

  }, [user, fetchAllConversations]);


  // --- NEW: Memoized filtering for search ---
  const filteredConversations = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return conversations; // Return all if search is empty
    }
    return conversations.filter(convo =>
      convo.display_name?.toLowerCase().includes(query)
    );
  }, [searchQuery, conversations]);


  return {
    conversations: filteredConversations, // Return the filtered list
    loading,
    error,
    refetch: fetchAllConversations,
    searchQuery,         // Expose search query
    setSearchQuery       // Expose the setter for the input
  };
};