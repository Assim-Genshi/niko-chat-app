import { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import Logo from "./Logo";
import { useProfilePageLogic } from '../pages/profile/ProfilePageLogic';
import { supabase } from '../supabase/supabaseClient';
import { useFriends } from '../features/friends/useFriends';

//-----HeroUI-----
import { 
  addToast, 
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Avatar,
  Badge // <-- Import Badge
  } from '@heroui/react';
import {
  ArrowRightStartOnRectangleIcon,
  UserIcon,
  ChevronDoubleLeftIcon,
  ChatBubbleOvalLeftIcon,
  BellIcon,
  Cog6ToothIcon,
  UserGroupIcon
} from "@heroicons/react/24/solid";

const Navbar = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const { authUser, profileData } = useProfilePageLogic();
  const { incomingRequests, loading: friendsLoading } = useFriends();
  const [isMobile, setIsMobile] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const incomingCount = incomingRequests?.length || 0;

  const navLinks = [
    {
      to: "/chat",
      label: "Chat",
      icon: <ChatBubbleOvalLeftIcon className="w-6 h-6 shrink-0" />,
      requiresAuth: false,
    },
    {
      to: "/friends",
      label: "Friends",
      icon: <UserGroupIcon className="w-6 h-6 shrink-0" />,
      requiresAuth: true,
    },
    {
      to: "/notifications",
      label: "Notifications",
      icon: ( // <-- Use Badge for icon
        <Badge
          content={incomingCount > 9 ? '9+' : incomingCount}
          color="danger"
          shape="circle"
          size="sm"
          isInvisible={incomingCount === 0}
          showOutline={false}
          className="flex items-center justify-center"
        >
          <BellIcon className="w-6 h-6 shrink-0" />
        </Badge>
      ),
      requiresAuth: true,
    },
    {
      to: "/profile",
      label: "Profile",
      icon: <UserIcon className="w-6 h-6 shrink-0" />,
      requiresAuth: true,
    },
  ];

  const displayName = profileData?.username || authUser?.user_metadata?.display_name || authUser?.user_metadata?.username || authUser?.email?.split('@')[0] || "User";
  const profilePicUrl = profileData?.avatar_url || authUser?.user_metadata?.profilePic || "/profile/default-avatar.jpg";

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
    } catch (error: any) {
      addToast({
        title: 'Logout Failed',
        description: `Error: ${error.message}`,
        color: 'danger',
      });
    }
  };

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    handleResize(); // Initial check
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <aside className={`
      bg-base-200 flex flex-col transition-[width] duration-300 ease-in-out p-4
      ${isMobile || isCollapsed ? "w-20" : "w-64"}
    `}>
      <div onClick={() => navigate('/')} className="flex items-center gap-3 pb-4 cursor-pointer overflow-hidden">
        <Logo className="w-11 h-11 shrink-0 text-base-content" />
        <div className={`transition-all duration-300 ${isMobile || isCollapsed ? "opacity-0 w-0 blur-md" : "opacity-100 w-auto"}`}>
          <h1 className="text-lg text-base-content font-bold whitespace-nowrap">ChataMata</h1>
        </div>
      </div>

      {!isMobile && (
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full flex items-center justify-center p-2 mb-2 border border-base-300 rounded-2xl bg-base-200 hover:bg-base-100 transition-all duration-200 shadow-sm"
        >
          <ChevronDoubleLeftIcon className={`w-6 h-6 shrink-0 transition-transform ${isCollapsed ? "rotate-180" : "rotate-0"}`} />
        </button>
      )}

      <nav className="flex-1 flex flex-col gap-2 mt-2">
        {navLinks
          .filter(link => !link.requiresAuth || session)
          .map(({ to, label, icon }) => ( 
            <NavLink
              to={to}
              key={to} // Use 'to' as key for better stability
              className={({ isActive }: { isActive: boolean }) =>
                `flex items-center gap-3 px-3 py-2 rounded-2xl hover:bg-base-100/60 transition-colors duration-300 overflow-hidden ${
                  isActive ? "bg-base-content text-base-100 hover:bg-base-content" : "text-base-content"
                }`
              }
            >
              <div className="flex items-center justify-center w-6 h-6 shrink-0"> {/* Ensure icon wrapper has fixed size */}
                {icon}
              </div>
              <span className={`transition-all duration-300 ${isMobile || isCollapsed ? "opacity-0 w-0 blur-md" : "opacity-100 w-auto"} whitespace-nowrap`}>
                {label}
              </span>
            </NavLink>
          ))}
      </nav>

      

      {session && (
           <Dropdown>
              <DropdownTrigger>
                <div className={`flex items-center gap-3 p-2 bg-base-300 hover:bg-base-300/60 rounded-2xl transition-all duration-300 cursor-pointer ${isMobile || isCollapsed ? "justify-start p-1" : ""}`}>
                  <Avatar className="shrink-0 overflow-hidden" src={profilePicUrl} alt="Profile" />
                  <div className={`flex flex-col items-start overflow-hidden transition-all duration-300 ${isMobile || isCollapsed ? "w-0 opacity-0 blur-md" : "w-40 opacity-100"}`}>
                    <h1 className="font-medium text-sm text-base-content truncate w-fit">{displayName}</h1>
                    <p className="text-xs text-base-content/70 truncate w-fit">{authUser?.email || "not provided"}</p>
                  </div>
                </div>
              </DropdownTrigger>
              <DropdownMenu aria-label="User Actions">
                <DropdownItem startContent={<Cog6ToothIcon className="size-6" />} color="default" onPress={() => navigate('/settings')} key="settings">
                  Sitting
                </DropdownItem>
                <DropdownItem startContent={<ArrowRightStartOnRectangleIcon className="size-6" />} className="text-danger" color="danger" onPress={handleLogout} key="logout">
                  Logout
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
      )}
    </aside>
  );
};

export default Navbar;