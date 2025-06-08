import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { Profile } from '../types'; // Assuming your Profile type is in src/types.ts

interface ProfilePreviewContextType {
  isPreviewOpen: boolean;
  profileData: Profile | null;
  viewProfile: (profile: Profile) => void;
  closeProfilePreview: () => void;
}

const ProfilePreviewContext = createContext<ProfilePreviewContextType | undefined>(undefined);

export const ProfilePreviewProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [profileData, setProfileData] = useState<Profile | null>(null);

  const viewProfile = useCallback((profile: Profile) => {
    console.log('Context: viewProfile called with:', profile);
    setProfileData(profile);
    setIsPreviewOpen(true);
    console.log('Context: isPreviewOpen SET TO true, profileData SET TO:', profile);
  }, []);

  const closeProfilePreview = useCallback(() => {
    console.log('ProfilePreviewContext: closeProfilePreview called'); // <--- ADD THIS
    setIsPreviewOpen(false);
    // Optionally clear data on close, though it might be fine to keep it until next view
    // setProfileData(null);
  }, []);

  return (
    <ProfilePreviewContext.Provider value={{ isPreviewOpen, profileData, viewProfile, closeProfilePreview }}>
      {children}
    </ProfilePreviewContext.Provider>
  );
};

export const useProfilePreview = () => {
  const context = useContext(ProfilePreviewContext);
  if (context === undefined) {
    throw new Error('useProfilePreview must be used within a ProfilePreviewProvider');
  }
  return context;
};