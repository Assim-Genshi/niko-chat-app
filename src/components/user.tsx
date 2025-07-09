// src/components/user.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase/supabaseClient';
import { 
  addToast,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Avatar
 } from '@heroui/react';
import { useAuth } from '../contexts/AuthContext';
import { useProfilePageLogic } from '../pages/profile/ProfilePageLogic'; // Adjust path as needed
import { Session } from "@supabase/supabase-js";
import { ArrowRightStartOnRectangleIcon, UserIcon, ChevronDoubleLeftIcon, ChatBubbleOvalLeftIcon, BellIcon, Cog6ToothIcon  } from "@heroicons/react/24/solid";



const User = () => {
  const navigate = useNavigate();
  const { session } = useAuth(); // Get Supabase session
  const { authUser, profileData, } = useProfilePageLogic(); // Type-cast Supabase user

  const displayName = authUser?.user_metadata?.name || authUser?.user_metadata?.display_name || authUser?.user_metadata?.username || authUser?.email?.split('@')[0] || "User";
  const profilePicUrl = profileData?.avatar_url || "/profile/default-avatar.jpg";



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

  return (
    <div>
      <Dropdown showArrow>
        <DropdownTrigger>
          <Avatar 
          className="shrink-0 overflow-hidden cursor-pointer " 
          src={profilePicUrl} 
          alt="Profile"
          />
        </DropdownTrigger>
        <DropdownMenu>
        <DropdownItem onPress={() => navigate('/profile')} key="profile" className="h-14 gap-2">
            <p className="font-semibold text-base-content">Signed in as</p>
            <p className="font-semibold text-base-content">{authUser?.email || "not provided"}</p>
          </DropdownItem>
          <DropdownItem startContent={<ArrowRightStartOnRectangleIcon className="size-6"/>} className="text-danger" color="danger" onPress={handleLogout} key="logout">Logout</DropdownItem>

        </DropdownMenu>
      </Dropdown>
      
    </div>
  );
};

export default User;
