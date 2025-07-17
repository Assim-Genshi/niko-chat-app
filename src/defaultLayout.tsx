// src/defaultLayout.tsx
import Navbar from "./components/h-nav";
import MobileBottomNav from "./components/mobilenav";
import { Outlet, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { ProfilePreviewDrawer } from "./components/ui/ProfilePreviewDrawer";
import { useAuth } from "./contexts/AuthContext";
import { supabase } from "./supabase/supabaseClient";
import { Profile } from "./types";
import { ProfileSetupModal } from './components/ProfileSetupModal';

export default function DefaultLayout() {
  const { user, session, loading: authLoading } = useAuth();
  const location = useLocation();
  const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 768);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [profileKey, setProfileKey] = useState(0);

  const handleProfileSetupComplete = () => {
    setShowSetupModal(false);
    setProfileKey(prev => prev + 1);
  };

  useEffect(() => {
    const handleResize = () => setIsMobileView(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (authLoading || !user) {
      return;
    }

    const checkProfileSetup = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('profile_setup_complete, username')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error("Error fetching profile for setup check:", error);
      } else if (data && !data.profile_setup_complete) {
        setShowSetupModal(true);
      } else if (!data) {
        console.warn("Profile not found for setup check.");
      }
    };

    checkProfileSetup();
  }, [user, authLoading, profileKey]);

  // 1. Hide nav ONLY on specific conversation pages
  const isConversationPage = location.pathname.startsWith('/chat/');

  return (
    <>
      <div className="flex flex-row w-full max-h-auto md:min-h-screen md:max-h-screen bg-base-200 overflow-hidden">
        {!isMobileView && <Navbar />}
        <div className="flex w-full justify-center bg-base-100 md:border-base-300 md:border rounded-none md:rounded-3xl overflow-hidden md:overflow-scroll my-0 mr-0 md:my-2 md:mr-2 pb-16 md:pb-0 scrollbar-hide shadow-xl">
          <main className="flex justify-center w-full h-fit overflow-visible">
            <Outlet />
          </main>
          {/* 2. Update the condition to use the new variable */}
          {isMobileView && !isConversationPage && <MobileBottomNav />}
        </div>
      </div>
      {user && (
        <ProfilePreviewDrawer />
      )}
      {showSetupModal && (
        <ProfileSetupModal
          isOpen={showSetupModal}
          onClose={() => setShowSetupModal(false)}
          onProfileSetupComplete={handleProfileSetupComplete}
        />
      )}
      
      {user && <ProfilePreviewDrawer />}
    </>
  );
}