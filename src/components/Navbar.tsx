// src/components/Navbar.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase/supabaseClient';
import { addToast } from '@heroui/react';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const { session } = useAuth();
  const navigate = useNavigate();

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
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <span className="font-bold text-xl">Your App Name</span>
          </div>
          <div className="flex items-center">
            {session ? (
              <button onClick={handleLogout} className="px-4 py-2 rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors duration-200">
                Logout
              </button>
            ) : (
              <button onClick={() => navigate('/login')} className="px-4 py-2 rounded-md text-sm font-medium text-white bg-primary hover:bg-primary/90 transition-colors duration-200">
                Login
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
