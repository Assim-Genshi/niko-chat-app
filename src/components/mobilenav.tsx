import { NavLink } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useProfilePageLogic } from '../pages/profile/ProfilePageLogic';
import { useFriends } from '../features/friends/useFriends'; // <-- Import useFriends

// HeroUI and Heroicons
import { Avatar, Badge } from '@heroui/react'; // <-- Import Badge
import {
  ChatBubbleOvalLeftIcon,
  BellIcon,
  UserCircleIcon,
  UserGroupIcon // <-- Import UserGroupIcon
} from "@heroicons/react/24/solid";

const FALLBACK_PROFILE_PIC = "https://placehold.co/64x64/7F9CF5/E0E7FF?text=User";

const MobileBottomNav = () => {
  const { session } = useAuth();
  const { authUser } = useProfilePageLogic();
  const { incomingRequests, loading: friendsLoading } = useFriends(); // <-- Use useFriends hook

  const profilePicUrl = authUser?.user_metadata?.profilePic || undefined;
  const displayName = authUser?.user_metadata?.name ||
                      authUser?.user_metadata?.display_name ||
                      authUser?.email?.split('@')[0] ||
                      "User";

  const incomingCount = incomingRequests?.length || 0;

  const navItems = [
    {
      to: "/chat",
      label: "Chat",
      icon: <ChatBubbleOvalLeftIcon className="w-6 h-6 shrink-0" />,
      requiresAuth: false,
    },
    { // <-- Added Friends Link
      to: "/friends",
      label: "Friends",
      icon: <UserGroupIcon className="w-6 h-6 shrink-0" />,
      requiresAuth: true,
    },
    { // <-- Updated Notifications Link
      to: "/notifications",
      label: "Notifications",
      icon: (
        <Badge
          content={incomingCount > 9 ? '9+' : incomingCount}
          color="danger"
          shape="circle"
          size="sm" // Adjusted size for better fit
          isInvisible={incomingCount === 0}
          className="flex items-center justify-center" // For centering the icon within badge context
          showOutline={false}
        >
          <BellIcon className="w-6 h-6 shrink-0" />
        </Badge>
      ),
      requiresAuth: true,
    },
    {
      to: "/profile",
      label: "Profile",
      icon: (
        <Avatar 
          src={profilePicUrl || FALLBACK_PROFILE_PIC}
          alt={displayName}
          className="w-7 h-7 shrink-0 rounded-full"
          fallback={<UserCircleIcon className="w-7 h-7 shrink-0" />}
          
        />
      ),
      requiresAuth: true,
    },
  ];

  const visibleNavItems = navItems.filter(item => !item.requiresAuth || session);

  return (
    <nav className="fixed bottom-2 left-2 right-2 h-16 bg-base-200 backdrop-blur-md border-t-1 border-base-100 dark:border-white flex items-center rounded-xl justify-around shadow-[0_5px_25px_-5px_rgba(0,0,0,0.15)] z-50 lg:hidden">
      {visibleNavItems.map((item, index) => (
        <NavLink
          to={item.to}
          key={item.label || index}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-300 w-1/4 h-full
             ${isActive ? "text-base-content scale-110" : "text-base-content/60 hover:text-base-content"}` // Enhanced active/hover states
          }
        >
          <div className="flex items-center justify-center h-6"> {/* Ensure icon area has consistent height */}
            {item.icon}
          </div>
          <span className="text-xs mt-1">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
};

export default MobileBottomNav;