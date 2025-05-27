import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../supabase/supabaseClient'; // Adjust path
import { useAuth } from '../../contexts/AuthContext'; // Adjust path
//import { Profile } from '../../types';
import { addToast } from "@heroui/react";
import { useProfilePageLogic } from '@/pages/profile/ProfilePageLogic';

// Define a type for a Profile (adjust based on your profiles table)
export interface Profile {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
}

// Define a type for our friendship data structure
export interface Friendship {
  id: number;
  friend: Profile;
  status: 'pending' | 'accepted' | 'rejected' | 'blocked';
  is_requester: boolean; // True if the current user sent the 'pending' request
}

export const useFriends = () => {
  const { session } = useAuth();
  const user = session?.user;

  const [friends, setFriends] = useState<Profile[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<Friendship[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<Friendship[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // --- Data Fetching ---
  const fetchFriendships = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('friendships')
        .select(`
          id,
          status,
          action_user_id,
          user_one:profiles!friendships_user_one_id_fkey(id, username, full_name, avatar_url),
          user_two:profiles!friendships_user_two_id_fkey(id, username, full_name, avatar_url)
        `)
        .or(`user_one_id.eq.${user.id},user_two_id.eq.${user.id}`);

      if (fetchError) throw fetchError;

      const acceptedList: Profile[] = [];
      const incomingList: Friendship[] = [];
      const outgoingList: Friendship[] = [];

      data.forEach((item: any) => {
        const friendProfile = item.user_one.id === user.id ? item.user_two : item.user_one;
        const isRequester = item.action_user_id === user.id;

        if (item.status === 'accepted') {
          acceptedList.push(friendProfile);
        } else if (item.status === 'pending') {
          const friendshipData = {
            id: item.id,
            friend: friendProfile,
            status: item.status,
            is_requester: isRequester,
          };
          if (isRequester) {
            outgoingList.push(friendshipData);
          } else {
            incomingList.push(friendshipData);
          }
        }
      });

      setFriends(acceptedList);
      setIncomingRequests(incomingList);
      setOutgoingRequests(outgoingList);

    } catch (err: any) {
      setError(err);
      addToast({ title: "Error", description: `Failed to fetch friends: ${err.message}`, color: "danger" });
    } finally {
      setLoading(false);
    }
  }, [user]);

  // --- Initial Fetch ---
  useEffect(() => {
    fetchFriendships();
  }, [fetchFriendships]);


  // --- Actions ---
  const searchUsers = async (query: string): Promise<Profile[]> => {
    if (!user || !query.trim()) return [];
    try {
      const { data, error: searchError } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url, updated_at') // Include updated_at
        .ilike('username', `%${query}%`)
        .neq('id', user.id)
        .limit(10);
  
      if (searchError) throw searchError;
      return data || [];
    } catch (err: any) {
      addToast({ title: "Search Error", description: err.message, color: "danger" });
      return [];
    }
  };

  const sendRequest = async (receiverId: string) => {
    try {
      const { error: rpcError } = await supabase.rpc('send_friend_request', {
        p_receiver_id: receiverId,
      });
      if (rpcError) throw rpcError;
      addToast({ title: "Success", description: "Friend request sent!", color: "success" });
      fetchFriendships(); // Refresh lists
    } catch (err: any) {
      addToast({ title: "Error", description: `Failed to send request: ${err.message}`, color: "danger" });
    }
  };

  const respondRequest = async (senderId: string, response: 'accepted' | 'rejected') => {
      try {
          const { error: rpcError } = await supabase.rpc('respond_to_friend_request', {
              p_sender_id: senderId,
              p_response: response,
          });
          if (rpcError) throw rpcError;
          addToast({ title: "Success", description: `Request ${response}!`, color: "success" });
          fetchFriendships(); // Refresh lists
      } catch (err: any)          {
          addToast({ title: "Error", description: `Failed to respond: ${err.message}`, color: "danger" });
      }
  };

  // --- Realtime (Optional - Basic Example) ---
  useEffect(() => {
      if (!user) return;

      const friendshipChannel = supabase
          .channel('public:friendships')
          .on(
              'postgres_changes',
              {
                  event: '*',
                  schema: 'public',
                  table: 'friendships',
                  // Filter for changes affecting the current user.
                  // This requires RLS to be set up correctly and might need more specific filters
                  // depending on performance needs. A simpler way is often just to refetch.
                  // filter: `user_one_id=eq.${user.id}` // This filter syntax might need checking
              },
              (payload) => {
                  console.log('Friendship change detected:', payload);
                  addToast({ title: "Friends Update", description: "Your friends list or requests have been updated.", color: "default" });
                  fetchFriendships(); // Refetch data on any change
              }
          )
          .subscribe();

      return () => {
          supabase.removeChannel(friendshipChannel);
      };
  }, [user, fetchFriendships]);


  return {
    friends,
    incomingRequests,
    outgoingRequests,
    loading,
    error,
    searchUsers,
    sendRequest,
    respondRequest,
    refetch: fetchFriendships, // Expose refetch function
  };
};