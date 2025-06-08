import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../supabase/supabaseClient'; // Adjust path
import { useAuth } from '../../contexts/AuthContext'; // Adjust path
import { addToast } from "@heroui/react";

// Define a type based on the RPC function's output
export interface ConversationPreview {
  conversation_id: number;
  is_group: boolean;
  display_name: string | null;
  display_avatar: string | null;
  latest_message_content: string | null;
  latest_message_created_at: string | null;
  other_participant_id: string | null;
  group_name: string | null;
}

export const useConversations = () => {
  const { session } = useAuth();
  const [conversations, setConversations] = useState<ConversationPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchConversations = useCallback(async () => {
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
    fetchConversations();
  }, [fetchConversations]);

  // Listen for changes in 'participants' or 'messages' to refresh (simple approach)
  useEffect(() => {
      const refreshConvoList = (payload: any) => {
          console.log("Change detected, refreshing conversations:", payload);
          fetchConversations();
      };

      const participantsChannel = supabase
          .channel('public:participants:convos')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'participants' }, refreshConvoList)
          .subscribe();

      const messagesChannel = supabase
          .channel('public:messages:convos')
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, refreshConvoList)
          .subscribe();

      return () => {
          supabase.removeChannel(participantsChannel);
          supabase.removeChannel(messagesChannel);
      };
  }, [fetchConversations]);


  return { conversations, loading, error, refetch: fetchConversations };
};