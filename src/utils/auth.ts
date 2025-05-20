// src/utils/auth.ts
import { supabase } from '../supabase/supabaseClient';
import { addToast } from "@heroui/react";
import { Session } from '@supabase/supabase-js';

// Add `navigate` as a parameter to both functions
export const signUp = async (
  name: string,
  email: string,
  password: string,
  navigate: (path: string) => void
) => {
  try {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });

    if (error) throw error;

    addToast({
      title: "Sign Up Success",
      description: "We’ve sent you a confirmation email. Please verify your email before logging in.",
      color: "success",
    });

    // Redirect to login page after successful sign-up
    navigate("/login"); // <-- New redirection logic
  } catch (error) {
    addToast({
      title: "Sign Up Failed",
      description: `Error: ${(error as Error).message}`,
      color: "danger",
    });
  }
};

export const login = async (
  email: string,
  password: string,
  navigate: (path: string) => void
) => {
  try {
    const { error, session } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    addToast({
      title: "Login Success",
      description: "Welcome back!",
      color: "success",
    });

    // Redirect to home page after successful login
    navigate("/"); // <-- New redirection logic
  } catch (error) {
    addToast({
      title: "Login Failed",
      description: `Error: ${(error as Error).message}`,
      color: "danger",
    });
  }
};
