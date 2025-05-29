// src/contexts/PresenceContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { supabase } from '../supabase/supabaseClient'; // Adjust path
import { useAuth } from './AuthContext'; // Adjust path
import { RealtimeChannel, User } from '@supabase/supabase-js';

interface PresenceState {
  [key: string]: { online_at: string }[];
}

interface PresenceContextType {
  onlineUsers: Set<string>;
  presenceState: PresenceState;
}

const PresenceContext = createContext<PresenceContextType | undefined>(undefined);

export const PresenceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { session } = useAuth();
  const user: User | undefined = session?.user;
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [presenceState, setPresenceState] = useState<PresenceState>({});
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!user) {
      if (channelRef.current) {
         supabase.removeChannel(channelRef.current).catch(console.error);
         channelRef.current = null;
      }
      setOnlineUsers(new Set());
      setPresenceState({});
      return;
    }

    // Only create one channel instance per user session
    if (channelRef.current) return;

    const channel = supabase.channel('online-users', {
      config: { presence: { key: user.id } },
    });
    channelRef.current = channel;

    const handleSync = () => {
      const state = channel.presenceState<any>();
      setPresenceState(state);
      setOnlineUsers(new Set(Object.keys(state)));
    };

    channel
      .on('presence', { event: 'sync' }, handleSync)
      .on('presence', { event: 'join' }, ({ key }) => {
          setOnlineUsers(prev => new Set(prev).add(key));
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
         setOnlineUsers(prev => {
             const newSet = new Set(prev);
             newSet.delete(key);
             return newSet;
         });
      })
      .subscribe(async (status, err) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ online_at: new Date().toISOString() });
        } else if (err) {
            console.error(`Presence subscription error:`, err);
        }
      });

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current).catch(console.error);
        channelRef.current = null;
      }
    };
  }, [user]);

  return (
    <PresenceContext.Provider value={{ onlineUsers, presenceState }}>
      {children}
    </PresenceContext.Provider>
  );
};

export const usePresence = () => {
  const context = useContext(PresenceContext);
  if (context === undefined) {
    throw new Error('usePresence must be used within a PresenceProvider');
  }
  return context;
};