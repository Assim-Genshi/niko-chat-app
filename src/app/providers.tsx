// src/app/providers.tsx
import React from 'react';
import { AuthProvider } from '../contexts/AuthContext';
import { PresenceProvider } from '../contexts/PresenceContext';
import { ChatStateProvider } from '../contexts/ChatStateContext';
import { HeroUIProvider } from '@heroui/react'; // Assuming this is your UI library's provider
import { ToastProvider } from '@heroui/toast';   // Assuming this is your toast provider

const Providers: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <HeroUIProvider> {/* UI Library provider often goes near the outside */}
      <ToastProvider /> {/* Toast provider */}
      <AuthProvider>
        <PresenceProvider>
          <ChatStateProvider> {/* ChatStateProvider is now inside BrowserRouter via main.tsx */}
            {children}
          </ChatStateProvider>
        </PresenceProvider>
      </AuthProvider>
    </HeroUIProvider>
  );
};

export default Providers;