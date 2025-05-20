// src/pages/HomePage.tsx
import React from 'react';
import Navbar from '../components/Navbar';
import { Link } from '@heroui/react';

const HomePage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar /> {/* Add the navbar to your home page */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900">Welcome to Your App!</h1>
          {/* Your homepage content here */}
          <Link 
                className="text-brand-color font-semibold hover:text-brand-500"
                showAnchorIcon 
                href="/Chat">
                 Create account
              </Link>
        </div>
      </main>
    </div>
  );
};

export default HomePage;
