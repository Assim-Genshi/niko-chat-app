// src/app/providers.tsx
import React from 'react';
import { AuthProvider } from '../contexts/AuthContext';
import { PresenceProvider } from '../contexts/PresenceContext';
import { ChatStateProvider } from '../contexts/ChatStateContext';
import { ProfilePreviewProvider } from '../contexts/ProfilePreviewContext'; // <--- IMPORT
import { HeroUIProvider } from '@heroui/react';
import { ToastProvider } from '@heroui/toast';

const Providers: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <HeroUIProvider>
      <ToastProvider />
      <AuthProvider>
        <PresenceProvider>
          <ChatStateProvider>
            <ProfilePreviewProvider> {/* <--- ADD HERE */}
              {children}
            </ProfilePreviewProvider>
          </ChatStateProvider>
        </PresenceProvider>
      </AuthProvider>
    </HeroUIProvider>
  );
};

export default Providers;