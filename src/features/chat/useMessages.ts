import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../supabase/supabaseClient'; // Adjust path
import { useAuth } from '../../contexts/AuthContext'; // Adjust path
import { Message, Profile } from '../../types'; // Adjust path
import { addToast } from "@heroui/react";

const MESSAGES_PER_PAGE = 20;

export const useMessages = (conversationId: number | null) => {
  const { session } = useAuth();
  const user = session?.user;


  const [messages, setMessages] = useState<Message[]>([]);
  const [participants, setParticipants] = useState<Map<string, Profile>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const pageRef = useRef(0);

  // --- Fetch Participants ---
  const fetchParticipants = useCallback(async (convoId: number) => {
    try {
        const { data, error } = await supabase
            .from('participants')
            .select('profiles(*)')
            .eq('conversation_id', convoId);

        if (error) throw error;

        const profilesMap = new Map<string, Profile>();
        data?.forEach((p: any) => {
            if (p.profiles) {
                profilesMap.set(p.profiles.id, p.profiles);
            }
        });
        setParticipants(profilesMap);
    } catch (err: any) {
        addToast({ title: "Error", description: `Failed to fetch participants: ${err.message}`, color: "danger" });
    }
  }, []);

  

  // --- Fetch Messages (with pagination) ---
  const fetchMessages = useCallback(async (convoId: number, loadMore = false) => {
    if (!hasMore && loadMore) return; // Don't fetch if no more messages

    setLoading(true);
    setError(null);

    const currentPage = loadMore ? pageRef.current + 1 : 0;
    const rangeStart = currentPage * MESSAGES_PER_PAGE;
    const rangeEnd = rangeStart + MESSAGES_PER_PAGE - 1;

    try {
      const { data, error: fetchError } = await supabase
        .from('messages')
        .select(`*, sender:profiles(id, username, avatar_url)`) // Join profiles directly
        .eq('conversation_id', convoId)
        .order('created_at', { ascending: false })
        .range(rangeStart, rangeEnd);

      if (fetchError) throw fetchError;

      const newMessages = (data || []).map((msg: any) => ({
          ...msg,
          // If sender join didn't work, we'd use the participants map here
          sender: msg.sender || participants.get(msg.sender_id) || { id: msg.sender_id, username: 'Unknown' }
      })).reverse(); // Reverse to display oldest first in the new batch

      setMessages(prev => loadMore ? [...newMessages, ...prev] : newMessages);
      setHasMore(data.length === MESSAGES_PER_PAGE);
      pageRef.current = currentPage;

    } catch (err: any) {
      setError(err);
      addToast({ title: "Error", description: `Failed to fetch messages: ${err.message}`, color: "danger" });
    } finally {
      setLoading(false);
    }
  }, [hasMore, participants]);


  // --- Send Message ---
  const sendMessage = async (content: string): Promise<boolean> => {
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
  };


  // --- Realtime Subscription ---
  useEffect(() => {
    if (!conversationId) {
        // Clear state if no conversation is selected
        setMessages([]);
        setParticipants(new Map());
        setHasMore(true);
        return;
    };

      // Reset when conversation changes
      setMessages([]);
      setParticipants(new Map());
      setHasMore(true);
      pageRef.current = 0;

      fetchParticipants(conversationId);
      fetchMessages(conversationId, false); // Fetch initial batch

      const channel = supabase
          .channel(`public:messages:convo_${conversationId}`)
          .on(
              'postgres_changes',
              {
                  event: 'INSERT',
                  schema: 'public',
                  table: 'messages',
                  filter: `conversation_id=eq.${conversationId}`
              },
              async (payload) => {
                console.log('New message received!', payload);
                const newMessage = payload.new as Message; // Keep as Message for structure

                let senderProfile = participants.get(newMessage.sender_id);
                if (!senderProfile) {
                   const { data, error } = await supabase
                      .from('profiles')
                      .select('*')
                      .eq('id', newMessage.sender_id)
                      .single();
                   if (data) {
                       senderProfile = data;
                       setParticipants(prev => new Map(prev).set(data.id, data));
                   }
                }

                // Create the full message object for state update
                const messageForState: Message = {
                    ...newMessage,
                    // Ensure 'sender' ALWAYS matches the 'Profile' type
                    sender: senderProfile || {
                        id: newMessage.sender_id,
                        username: 'Loading...', // Or 'Unknown User'
                        full_name: null,
                        avatar_url: null,
                        updated_at: null
                    }
                };

                setMessages(prev => {
                    // Avoid adding duplicates
                    if (prev.some(m => m.id === messageForState.id)) {
                        return prev;
                    }
                    return [...prev, messageForState]; // Add the correctly typed message
                });
            }
          )
          .subscribe();

      return () => {
          supabase.removeChannel(channel);
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]); // <--- ONLY depend on conversationId!

  return { messages, participants, loading, error, hasMore, sendMessage, loadMoreMessages: () => fetchMessages(conversationId!, true) };
};