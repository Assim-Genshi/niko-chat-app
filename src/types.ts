// src/types.ts
import { User, Session } from '@supabase/supabase-js';

// Profile type based on your 'profiles' table and needs
export interface Profile {
  id: string; // Corresponds to auth.users.id
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  updated_at: string | null;
}

// You might extend this later with online status, etc.

// Type for a message
export interface Message {
    id: number;
    sender_id: string;
    conversation_id: number;
    content: string;
    created_at: string;
    sender: Profile; // We'll often want to join with sender's profile
}

// Type for a conversation
export interface Conversation {
    id: number;
    is_group: boolean;
    created_at: string;
    group_name: string | null;
    group_avatar_url: string | null;
    created_by: string | null;
    participants: Participant[]; // Include participants
    latest_message?: Message | null; // Optional: for previews
    display_name?: string; // For DMs, the other user's name
    display_avatar?: string; // For DMs, the other user's avatar
}

// Type for a participant
export interface Participant {
    user_id: string;
    conversation_id: number;
    joined_at: string;
    profile: Profile; // Include profile data
}

// Type for a friendship (as used in useFriends hook)
export interface Friendship {
  id: number;
  friend: Profile;
  status: 'pending' | 'accepted' | 'rejected' | 'blocked';
  is_requester: boolean;
}

// Extend AuthContext if needed (example)
export interface AuthContextType {
    session: Session | null;
    user: User | null; // Add user for easier access
    // refreshSession?: () => Promise<void>; // Add refresh if you implement it
}