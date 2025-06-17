import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../supabase/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { addToast } from "@heroui/react";
import { Profile } from '../../types'; // <--- IMPORT THE FULL PROFILE TYPE

// Remove any local Profile interface definition if it exists in this file.

export interface Friendship {
  id: number;
  friend: Profile; // Now uses the imported, comprehensive Profile type
  status: 'pending' | 'accepted' | 'rejected' | 'blocked';
  is_requester: boolean;
}

export const useFriends = () => {
  const { session } = useAuth();
  const user = session?.user;

  const [friends, setFriends] = useState<Profile[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<Friendship[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<Friendship[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchFriendships = useCallback(async () => {
    if (!user) {
        setLoading(false); // Ensure loading is set to false if no user
        return;
    }
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('friendships')
        .select(`
          id,
          status,
          action_user_id,
          user_one:profiles!friendships_user_one_id_fkey(
            id, username, full_name, avatar_url, banner_url, 
            description, chatamata_id, joined_at, updated_at, profile_setup_complete, plan
          ),
          user_two:profiles!friendships_user_two_id_fkey(
            id, username, full_name, avatar_url, banner_url, 
            description, chatamata_id, joined_at, updated_at, profile_setup_complete, plan
          )
        `)
        .or(`user_one_id.eq.${user.id},user_two_id.eq.${user.id}`);

      if (fetchError) throw fetchError;

      const acceptedList: Profile[] = [];
      const incomingList: Friendship[] = [];
      const outgoingList: Friendship[] = [];

      if (data) { // Check if data is not null
        data.forEach((item: any) => {
          const friendProfileData = item.user_one?.id === user.id ? item.user_two : item.user_one;
          
          if (!friendProfileData || !friendProfileData.id) { // Check if profile data or id exists
              console.warn("Friendship record found with missing or incomplete profile data:", item);
              return; 
          }

          // Ensure all expected fields are present, provide defaults if necessary
          const friendProfile: Profile = {
            id: friendProfileData.id,
            username: friendProfileData.username || null,
            full_name: friendProfileData.full_name || null,
            avatar_url: friendProfileData.avatar_url || null,
            banner_url: friendProfileData.banner_url || null,
            description: friendProfileData.description || null,
            chatamata_id: friendProfileData.chatamata_id || null,
            joined_at: friendProfileData.joined_at || null,
            updated_at: friendProfileData.updated_at || null,
            profile_setup_complete: friendProfileData.profile_setup_complete || false,
            plan: friendProfileData.plan || null,
          };

          const isRequester = item.action_user_id === user.id;

          if (item.status === 'accepted') {
            acceptedList.push(friendProfile);
          } else if (item.status === 'pending') {
            const friendshipData: Friendship = {
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
      }

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
        .select(`
            id, username, full_name, avatar_url, banner_url, plan, 
            description, chatamata_id, joined_at, updated_at, profile_setup_complete
        `) // <--- UPDATED: Select all fields
        .ilike('username', `%${query}%`) // Or search by full_name, chatamata_id too if desired
        .neq('id', user.id)
        .limit(10);
  
      if (searchError) throw searchError;
      return (data as Profile[]) || []; // Cast to Profile[]
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

