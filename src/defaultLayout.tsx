// src/defaultLayout.tsx
import Navbar from "./components/h-nav";
import MobileBottomNav from "./components/mobilenav";
import { Outlet } from "react-router-dom";
import { useState, useEffect } from "react";
import { ProfilePreviewDrawer } from "./components/ui/ProfilePreviewDrawer";
import { useAuth } from "./contexts/AuthContext"; // <--- IMPORT
import { supabase } from "./supabase/supabaseClient"; // <--- IMPORT
import { Profile } from "./types"; // <--- IMPORT

export default function DefaultLayout() {
  const { user, session, loading: authLoading } = useAuth();
  const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 768);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [profileKey, setProfileKey] = useState(0); // To force profile refetch/re-check

  useEffect(() => {
    const handleResize = () => setIsMobileView(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (authLoading || !user) { // Wait for auth to load and user to be available
      return;
    }

    const checkProfileSetup = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('profile_setup_complete, username') // Check username too for initial modal state
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = 0 rows, which is fine if profile not created yet
        console.error("Error fetching profile for setup check:", error);
      } else if (data && !data.profile_setup_complete) {
        setShowSetupModal(true);
      } else if (!data) {
        // Profile might not exist yet if trigger hasn't run or there was an issue.
        // This case might indicate an issue, but for now, assume trigger works.
        // Could default to showing modal if profile is missing.
        console.warn("Profile not found for setup check, user might need to re-login for trigger to run or check DB.");
        // For robustness, you might want to show the modal if the profile itself is missing
        // or if key fields like username are null even if profile_setup_complete was somehow true.
      }
    };

    checkProfileSetup();
  }, [user, authLoading, profileKey]); // Rerun if user changes or profileKey changes


  return (
    <>
      <div className="flex flex-row w-full max-h-auto md:min-h-screen md:max-h-screen bg-base-200 overflow-hidden">
        {!isMobileView && <Navbar />}
        <div className="flex w-full justify-center bg-base-100 md:border-base-300 md:border rounded-none md:rounded-2xl overflow-hidden md:overflow-scroll my-0 mr-0 md:my-2 md:mr-2 pb-16 md:pb-0">
          <main className="flex justify-center w-full h-fit overflow-visible">
            <Outlet />
          </main>
          {isMobileView && <MobileBottomNav />}
        </div>
      </div>
      {user && ( // Only render modal if user is loaded
        <ProfilePreviewDrawer />
      )}
    </>
  );
}