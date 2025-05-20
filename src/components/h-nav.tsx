import { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import ProfilePopup from "../pages/ProfilePage";
import SettingsPopup from "../pages/SettingsPage";
import { useAuth } from "../contexts/AuthContext"; // Use Supabase auth context
import { useThemeStore } from "../lib/useThemeStore";
import { Menu, Transition } from "@headlessui/react";
import { 
  IconMessageCircleFilled, 
  IconSettingsFilled, 
  IconMoonFilled, 
  IconSunFilled, 
  IconLogout, 
  IconUserFilled, 
  IconChevronLeftPipe, 
  IconBellFilled 
} from "@tabler/icons-react";
import Logo from "./Logo";
import { Session } from "@supabase/supabase-js"; // Import Supabase Session type

//-----HeroUI-----
import { addToast,  } from '@heroui/react';
import { supabase } from '../supabase/supabaseClient';

interface AuthUser {
  fullName?: string;
  email?: string;
  profilePic?: string;
}

const Navbar = () => {
    const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { session } = useAuth(); // Get Supabase session
  const authUser = session?.user as AuthUser; // Type-cast Supabase user
  const [isMobile, setIsMobile] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { theme, setTheme } = useThemeStore();

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
      <ProfilePopup isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
      <SettingsPopup isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      <aside
        className={`
          bg-base-200 flex flex-col transition-[width] duration-300 ease-in-out p-4
          ${isMobile || isCollapsed ? "w-20" : "w-64"}
        `}
      >
        {/* Logo and App Name */}
        <div className="flex items-center gap-3 py-4">
          <Logo
            className="w-11 h-11 shrink-0 text-base-content"
          />
          <div className={`transition-all duration-300 ${isMobile || isCollapsed ? "opacity-0 w-0" : "opacity-100 w-auto"}`}>
            <h1 className="text-lg font-bold whitespace-nowrap">NikoChat</h1>
          </div>
        </div>

        {/* Toggle Button */}
        {!isMobile && (
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-full flex items-center justify-center p-2 border border-base-300 rounded-2xl bg-base-200 hover:bg-base-100 transition-all duration-200 shadow-2xl"
          >
            <div className={`w-6 h-6 shrink-0 transition-transform duration-300 ${isCollapsed ? "rotate-180" : "rotate-0"}`}>
              <IconChevronLeftPipe className="w-4 h-4" /> {/* Added size class */}
            </div>
          </button>
        )}

        {/* Navigation Menu */}
        <nav className="flex-1 flex flex-col gap-2 mt-2">
          <NavLink 
            to="/" 
            className={({ isActive }: { isActive: boolean }) => // Explicit type for isActive
              `flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-base-100/60 transition-colors ${
                isActive ? "bg-base-100" : ""
              }`
            }
          >
            <IconMessageCircleFilled className="w-6 h-6 shrink-0" />
            <span className={`transition-all duration-300 ${isMobile || isCollapsed ? "opacity-0 w-0" : "opacity-100 w-auto"} whitespace-nowrap`}>
              Chat
            </span>
          </NavLink>
          
          {session && ( // Use Supabase session instead of authUser
            <>
              <NavLink
                to="/notification"
                className={({ isActive }: { isActive: boolean }) =>
                  `flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-base-100/60 transition-colors ${
                    isActive ? "bg-base-100" : ""
                  }`
                }
              >
                <IconBellFilled className="w-6 h-6 shrink-0" />
                <span className={`transition-all duration-300 ${isMobile || isCollapsed ? "opacity-0 w-0" : "opacity-100 w-auto"} whitespace-nowrap`}>
                  Notifications
                </span>
              </NavLink>
              
              <NavLink
                to="/profile"
                className={({ isActive }: { isActive: boolean }) =>
                  `flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-base-100/60 transition-colors ${
                    isActive ? "bg-base-100" : ""
                  }`
                }
              >
                <IconUserFilled className="w-6 h-6 shrink-0" />
                <span className={`transition-all duration-300 ${isMobile || isCollapsed ? "opacity-0 w-0" : "opacity-100 w-auto"} whitespace-nowrap`}>
                  Profile
                </span>
              </NavLink>
            </>
          )}
        </nav>

        {/* Settings and Theme Toggle */}
        <div className="flex flex-col gap-2">
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-base-100 transition-colors"
          >
            <IconSettingsFilled className="w-6 h-6 shrink-0" />
            <span className={`transition-all duration-300 ${isMobile || isCollapsed ? "opacity-0 w-0" : "opacity-100 w-auto"} whitespace-nowrap`}>
              Settings
            </span>
          </button>

          <button
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            className="flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-base-100 transition-colors"
          >
            <div
              className={`w-6 h-6 shrink-0 transition-transform duration-300 ${
                theme === "light" ? "rotate-0" : "rotate-180"
              }`}
            >
              {theme === "light" ? <IconMoonFilled className="w-4 h-4" /> : <IconSunFilled className="w-4 h-4" />}
            </div>
            <span className={`transition-all duration-300 ${isMobile || isCollapsed ? "opacity-0 w-0" : "opacity-100 w-auto"} whitespace-nowrap`}>
              Toggle Theme
            </span>
          </button>
        </div>

        <div className="border-t border-base-300 my-2"></div>

        {/* User Profile Section - Improved Typings */}
        {session && ( // Use Supabase session for authentication check
          <Menu as="div" className="relative">
            <Menu.Button className="w-full">
              <div className={`
                flex items-center gap-3 p-2 hover:bg-base-100 rounded-2xl transition-all duration-300 ease-in-out
                ${isMobile || isCollapsed ? "justify-start" : ""}
              `}>
                <div className="w-8 h-8 shrink-0 rounded-full overflow-hidden">
                  <img
                    src={authUser?.profilePic || "/avatar.png"}
                    alt="Profile"
                    className="w-9 h-9 object-cover transition-transform duration-300 hover:scale-105"
                  />
                </div>
                <div className={`
                  flex flex-col items-start overflow-hidden
                  transition-all duration-300 ease-in-out
                  ${isMobile || isCollapsed ? "w-0 opacity-0" : "w-40 opacity-100"}
                `}>
                  <p className="font-medium text-sm truncate w-fit">
                    {authUser?.fullName || "Guest"} {/* Fallback for undefined */}
                  </p>
                  <p className="text-xs text-base-content/70 truncate w-fit">
                    {authUser?.email || "not provided"} {/* Fallback for undefined */}
                  </p>
                </div>
              </div>
            </Menu.Button>

            <Transition
              enter="transition duration-200 ease-out"
              enterFrom="transform scale-95 opacity-0"
              enterTo="transform scale-100 opacity-100"
              leave="transition duration-150 ease-in"
              leaveFrom="transform scale-100 opacity-100"
              leaveTo="transform scale-95 opacity-0"
            >
              <Menu.Items className="absolute bottom-16 left-2 w-48 bg-base-100 border border-base-300 rounded-2xl shadow-lg p-2">
                <Menu.Item>
                  {({ active }: { active: boolean }) => ( // Explicit type for active
                    <button
                      onClick={() => setIsProfileOpen(true)}
                      className={`
                        w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm
                        transition-colors duration-150
                        ${active ? "bg-base-200" : ""}
                      `}
                    >
                      <IconUserFilled className="w-4 h-4" />
                      <span>Profile</span>
                    </button>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }: { active: boolean }) => ( // Explicit type for active
                    <button onClick={handleLogout} className="px-4 py-2 rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors duration-200">
                    Logout
                  </button>
                  )}
                </Menu.Item>
              </Menu.Items>
            </Transition>
          </Menu>
        )}
      </aside>
    </>
  );
};

export default Navbar;
