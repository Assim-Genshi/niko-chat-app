// src/types.ts
import { User, Session } from '@supabase/supabase-js';

// Profile type based on your 'profiles' table and needs
export interface Profile {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  banner_url: string | null;       // <-- Ensure this is here
  description: string | null;      // <-- Ensure this is here
  chatamata_id: string | null;   // <-- Ensure this is here
  joined_at: string | null;        // <-- Ensure this is here (TIMESTAMPTZ from DB)
  updated_at: string | null;       // <-- Ensure this is here (TIMESTAMPTZ from DB)
  profile_setup_complete: boolean;
  plan: 'free' | 'verified' | 'premium' | 'vip'; // <-- ADD THIS LINE
  
  // Add more fields as needed
}

// You might extend this later with online status, etc.

// Type for a message
export interface Message {
  id: number;
  sender_id: string;
  conversation_id: number;
  content: string | null; // <-- Can be null now
  created_at: string;
  sender: Profile;
  image_url: string | null;
  // NEW: Add a field to know if the message has been read by others
  read_at: string | null; 
  temp_id?: string; // A temporary ID generated on the client
  status?: 'sending' | 'success' | 'error'; // The status of the message
}

// Type for a conversation
export interface ConversationPreview {
  conversation_id: number;
  is_group: boolean;
  display_name: string | null;
  display_avatar: string | null;
  latest_message_content: string | null;
  latest_message_created_at: string | null;
  other_participant_id: string | null;
  group_name: string | null;
  unread_count: number; // <-- NEW
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