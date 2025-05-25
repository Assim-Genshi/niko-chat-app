import { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import SettingsPopup from "../pages/SettingsPage";
import { useAuth } from "../contexts/AuthContext"; // Use Supabase auth context
import Logo from "./Logo";
import { useProfilePageLogic } from '../pages/profile/ProfilePageLogic'; // Adjust path as needed

import { Session } from "@supabase/supabase-js"; // Import Supabase Session type
import { supabase } from '../supabase/supabaseClient';

//-----HeroUI-----
import { addToast, 
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Avatar
  } from '@heroui/react';
  import { ArrowRightStartOnRectangleIcon, UserIcon, ChevronDoubleLeftIcon, ChatBubbleOvalLeftIcon, BellIcon, Cog6ToothIcon  } from "@heroicons/react/24/solid";




const navLinks = [
  {
    to: "/chat",
    label: "Chat",
    icon: <ChatBubbleOvalLeftIcon className="w-6 h-6 shrink-0" />,
    requiresAuth: false,
  },
  {
    to: "/notification",
    label: "Notifications",
    icon: <BellIcon className="w-6 h-6 shrink-0" />,
    requiresAuth: true,
  },
  {
    to: "/profile",
    label: "Profile",
    icon: <UserIcon className="w-6 h-6 shrink-0" />,
    requiresAuth: true,
  },
];

const Navbar = () => {
  const navigate = useNavigate();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { session } = useAuth();
  const { authUser } = useProfilePageLogic();
  const [isMobile, setIsMobile] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const displayName = authUser?.user_metadata?.name || authUser?.user_metadata?.display_name || authUser?.email?.split('@')[0] || "User";
  const profilePicUrl = authUser?.user_metadata?.profilePic || undefined;

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      addToast({
        title: 'Logout Successful',
        description: 'You have been logged out.',
        color: 'success',
      });
      navigate('/login');
    } catch (error) {
      addToast({
        title: 'Logout Failed',
        description: `Error: ${(error as Error).message}`,
        color: 'danger',
      });
    }
  };

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <>
      <SettingsPopup isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      <aside className={`
        bg-base-200 flex flex-col transition-[width] duration-300 ease-in-out p-4
        ${isMobile || isCollapsed ? "w-20" : "w-64"}
      `}>
        {/* Logo */}
        <div onClick={() => navigate('/')} className="flex items-center gap-3 py-4 cursor-pointer">
          <Logo className="w-11 h-11 shrink-0 text-base-content" />
          <div className={`transition-all duration-300 ${isMobile || isCollapsed ? "opacity-0 w-0" : "opacity-100 w-auto"}`}>
            <h1 className="text-lg text-base-content font-bold whitespace-nowrap">NikoChat</h1>
          </div>
        </div>

        {/* Collapse Toggle */}
        {!isMobile && (
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-full flex items-center justify-center p-2 border border-base-300 rounded-2xl bg-base-200 hover:bg-base-100 transition-all duration-200 shadow-2xl"
          >
            <ChevronDoubleLeftIcon className={`w-6 h-6 shrink-0 transition-transform ${isCollapsed ? "rotate-180" : "rotate-0"}`} />
          </button>
        )}

        {/* Navigation */}
        <nav className="flex-1 flex flex-col gap-2 mt-2">
          {navLinks
            .filter(link => !link.requiresAuth || session)
            .map(({ to, label, icon }) => (
              <NavLink
                to={to}
                key={to}
                className={({ isActive }: { isActive: boolean }) =>
                  `flex items-center text-base-content gap-3 px-2 py-2 rounded-2xl hover:bg-base-100/60 transition-colors duration-300 ${
                    isActive ? "bg-base-content text-base-200 hover:bg-base-content" : ""
                  }`
                }
              >
                {icon}
                <span className={`transition-all duration-300 ${isMobile || isCollapsed ? "opacity-0 w-0" : "opacity-100 w-auto"} whitespace-nowrap`}>
                  {label}
                </span>
              </NavLink>
            ))}
        </nav>

        {/* Settings */}
        <div className="flex flex-col gap-2">
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-3 px-2 py-2 rounded-2xl text-base-content hover:bg-base-100/60 transition-colors"
          >
            <Cog6ToothIcon className="w-6 h-6 shrink-0" />
            <span className={`transition-all duration-300 ${isMobile || isCollapsed ? "opacity-0 w-0" : "opacity-100 w-auto"} whitespace-nowrap`}>
              Settings
            </span>
          </button>
        </div>

        <div className="border-t border-base-300 my-2"></div>

        {/* User Profile */}
        {session && (
          <Dropdown>
            <DropdownTrigger>
              <div className={`flex items-center gap-3 p-2 bg-base-300 hover:bg-base-300/60 rounded-2xl transition-all duration-300 cursor-pointer ${isMobile || isCollapsed ? "justify-start p-1" : ""}`}>
                <Avatar className="shrink-0 overflow-hidden" src={profilePicUrl} alt="Profile" />
                <div className={`flex flex-col items-start overflow-hidden transition-all duration-300 ${isMobile || isCollapsed ? "w-0 opacity-0" : "w-40 opacity-100"}`}>
                  <p className="font-medium text-sm text-base-content truncate w-fit">{displayName}</p>
                  <p className="text-xs text-base-content/70 truncate w-fit">{authUser?.email || "not provided"}</p>
                </div>
              </div>
            </DropdownTrigger>
            <DropdownMenu aria-label="User Actions">
            <DropdownItem startContent={<ArrowRightStartOnRectangleIcon className="size-6"/>} className="text-danger" color="danger" onPress={handleLogout} key="new">Logout</DropdownItem>
            </DropdownMenu>
          </Dropdown>
        )}
      </aside>
    </>
  );
};

export default Navbar;
