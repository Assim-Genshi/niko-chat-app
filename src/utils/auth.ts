// src/utils/auth.ts
// src/utils/auth.ts
import { supabase } from '../supabase/supabaseClient';
import { addToast } from "@heroui/react";
// Session type might not be needed here if not used

export const signUp = async (
  fullName: string,      // Changed from 'name' to 'fullName' for clarity
  username: string,      // New parameter for the user-chosen username
  chatamataId: string, // New parameter for the generated Chatamata ID
  email: string,
  password: string,
  navigate: (path: string) => void
) => {
  try {
    // What you pass in options.data is what raw_user_meta_data in the trigger will see
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          fullName: fullName, // For profiles.full_name
          username: username, // For profiles.username
          chatamataId: chatamataId // For profiles.chatamata_id
          // 'name' field from your old signup is now 'fullName'
          // 'profilePic', 'bannerUrl', 'description' will be null initially
        },
      },
    });

    if (error) throw error;

    addToast({
      title: "Sign Up Success",
      description: "We’ve sent you a confirmation email. Please verify your email before logging in.",
      color: "success",
    });
    navigate("/login");
  } catch (error: any) {
    addToast({
      title: "Sign Up Failed",
      description: error.message || "An unexpected error occurred.",
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
    const { error } = await supabase.auth.signInWithPassword({
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


