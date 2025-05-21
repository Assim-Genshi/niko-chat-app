// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js'; // Import User
import { supabase } from '../supabase/supabaseClient';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  refreshSession: () => Promise<void>;
  loading: boolean; // <-- Added loading here
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  refreshSession: async () => {},
  loading: true, // Default loading to true
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    console.log("Attempting to refresh session..."); // Debug log
    const { data, error } = await supabase.auth.refreshSession();

    if (error) {
      console.error('Error refreshing session:', error.message);
      // If refresh fails (e.g., refresh token expired), it might sign the user out.
      // Supabase onAuthStateChange should handle this by setting session to null.
      // Explicitly clear local state if needed, though onAuthStateChange should be the source of truth.
      // setSession(null);
      // setUser(null);
    } else {
      console.log("Session refreshed successfully:", data.session); // Debug log
      console.log("User from refreshed session:", data.user); // Debug log
      // onAuthStateChange should ideally pick this up and update state.
      // However, explicitly setting it here can make the UI update faster.
      setSession(data.session);
      setUser(data.user ?? null);
    }
    // If onAuthStateChange doesn't fire or is delayed after refreshSession,
    // you might need to force an update or rely on direct state setting.
    // Let's also fetch the user anew to ensure metadata is fresh if refreshSession doesn't provide it updated.
    const { data: { user: freshUser } } = await supabase.auth.getUser();
    console.log("Fresh user after refreshSession call:", freshUser); // Debug log
    setUser(freshUser ?? null);

  }, []);

  useEffect(() => {
    setLoading(true);
    supabase.auth.getSession().then(({ data }) => {
      console.log("Initial session:", data.session); // Debug log
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log('Auth event:', event, "Current session:", currentSession); // Debug log
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setLoading(false);

        // If user data was updated (like profile pic), onAuthStateChange with USER_UPDATED
        // should provide the new user object.
        // If not, refreshSession might be needed, but updateUser should trigger this.
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []); // Removed refreshSession from dependency array for the main listener, it's a standalone utility

  return (
    <AuthContext.Provider value={{ session, user, refreshSession, loading }}>
      {children} {/* Removed !loading condition to let consumers decide based on loading state */}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};