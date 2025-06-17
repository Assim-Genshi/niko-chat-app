//src/components/ProfileSetupModal.tsx
import React, { useState, useEffect, ChangeEvent } from 'react';
import { supabase } from '../supabase/supabaseClient'; // Adjust
import { useAuth } from '../contexts/AuthContext'; // Adjust
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input, Avatar, Textarea, addToast } from '@heroui/react'; // Assuming Textarea exists
import { Profile } from '../types'; // Adjust
import { IconUpload, IconUserCircle } from '@tabler/icons-react';

interface ProfileSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileSetupComplete: () => void; // Callback after successful setup
}

// Max file size for avatar (e.g., 1MB)
const MAX_AVATAR_SIZE = 2 * 1024 * 1024;

export const ProfileSetupModal: React.FC<ProfileSetupModalProps> = ({ isOpen, onClose, onProfileSetupComplete }) => {
  const { session, user } = useAuth(); // user object from useAuth
  const [username, setUsername] = useState('');
  const [description, setDescription] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [initialUsername, setInitialUsername] = useState('');

  useEffect(() => {
    // Pre-fill username if available from metadata (e.g., derived from email or full name)
    if (isOpen && user) {
      const fetchInitialProfile = async () => {
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('username, full_name') // Fetch username and full_name to prefill
          .eq('id', user.id)
          .single();

        if (profileData) {
          // The modal screenshot shows "Username" with "James Brown" prefilled.
          // This suggests "Username" field in modal might be for display/full name,
          // or the unique username. Let's assume it's for profiles.username
          // and prefill it from existing profiles.username or profiles.full_name
          const prefill = profileData.username || profileData.full_name || '';
          setUsername(prefill);
          setInitialUsername(prefill); // Store initial to check if it changed
        }
        if (error) console.error("Error fetching initial profile for modal:", error);
      };
      fetchInitialProfile();
    }
  }, [isOpen, user]);

  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > MAX_AVATAR_SIZE) {
        addToast({ title: "Image too large", description: "Max file size is 1MB.", color: "danger" });
        return;
      }
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    if (!user) return;
    if (!username.trim()) {
      addToast({ title: "Username Required", description: "Please enter a username.", color: "warning" });
      return;
    }

    setIsLoading(true);
    try {
      let newAvatarUrl: string | undefined = undefined;

      // 1. Upload avatar if changed
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const filePath = `${user.id}/avatar.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, avatarFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
        newAvatarUrl = urlData?.publicUrl;
      }

      // 2. Prepare profile data
      const profileUpdates: Partial<Profile> & { profile_setup_complete: boolean } = {
        username: username.trim(),
        description: description.trim(),
        profile_setup_complete: true,
      };
      if (newAvatarUrl) {
        profileUpdates.avatar_url = newAvatarUrl;
      }

      // 3. Update public.profiles table
      const { error: profileUpdateError } = await supabase
        .from('profiles')
        .update(profileUpdates)
        .eq('id', user.id);

      if (profileUpdateError) {
        // Handle unique username conflict specifically
        if (profileUpdateError.message.includes('duplicate key value violates unique constraint "profiles_username_key"')) {
          addToast({ title: "Username Taken", description: "That username is already in use. Please choose another.", color: "danger" });
        } else {
          throw profileUpdateError;
        }
        setIsLoading(false);
        return;
      }

      // 4. Update auth.users.user_metadata (especially for avatar_url if it changed)
      // Also update username in metadata if you store it there and it changed
      const metadataUpdates: any = {};
      if (newAvatarUrl) {
        metadataUpdates.profilePic = newAvatarUrl;
      }
      // If username in profiles is the primary one and it changed from initial, update metadata too
      if (username.trim() !== initialUsername && username.trim() !== user.user_metadata?.username) {
         metadataUpdates.username = username.trim(); // If you store username in metadata
      }
      // If full_name in the modal was for 'username' from profiles, and you also want to sync it to metadata.name
      // (Assuming "James Brown" from screenshot was full_name used as prefill for 'username' field here)
      // metadataUpdates.name = username.trim();


      if (Object.keys(metadataUpdates).length > 0) {
        const { error: userUpdateError } = await supabase.auth.updateUser({
          data: metadataUpdates,
        });
        if (userUpdateError) throw userUpdateError;
      }

      addToast({ title: "Profile Set Up!", description: "Welcome to Chatamata!", color: "success" });
      onProfileSetupComplete(); // Call the callback
      onClose(); // Close the modal

    } catch (error: any) {
      addToast({ title: "Setup Failed", description: error.message, color: "danger" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onClose} size="md" scrollBehavior="inside" isDismissable={false}>
      <ModalContent>
        {(modalOnClose) => (
          <>
            <ModalHeader className="text-xl font-semibold text-center">Set up your profile</ModalHeader>
            <ModalBody className="space-y-6 px-6 py-4">
              <div className="flex flex-col items-center space-y-3">
                <div className="relative group">
                  <Avatar
                    src={avatarPreview || user?.user_metadata?.profilePic || undefined}
                    icon={<IconUserCircle size={64} />}
                    size="lg"
                    className="w-24 h-24 text-large"
                  />
                  <label
                    htmlFor="profile-setup-avatar-upload"
                    className="absolute -bottom-1 -right-1 p-1.5 bg-primary-500 text-white rounded-full cursor-pointer hover:bg-primary-600 transition-colors group-hover:opacity-100 opacity-75"
                  >
                    <IconUpload size={16} strokeWidth={2.5}/>
                  </label>
                  <input
                    id="profile-setup-avatar-upload"
                    type="file"
                    className="hidden"
                    accept="image/png, image/jpeg, image/webp"
                    onChange={handleAvatarChange}
                  />
                </div>
                <p className="text-xs text-base-content/60">Upload Image (Max 1MB)</p>
              </div>

              <div>
                <label htmlFor="setup-username" className="block text-sm font-medium text-base-content/80 mb-1">
                  Username
                </label>
                <Input
                  id="setup-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g., niko_the_cat"
                  fullWidth
                  radius="lg"
                />
                 <p className="text-xs text-base-content/60 mt-1">This will be your unique @username in Chatamata.</p>
              </div>

              <div>
                <label htmlFor="setup-description" className="block text-sm font-medium text-base-content/80 mb-1">
                  About you
                </label>
                <Textarea
                  id="setup-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell us a little about yourself..."
                  fullWidth
                  radius="lg"
                  minRows={3}
                />
              </div>
            </ModalBody>
            <ModalFooter className="gap-3">
              <Button variant="flat" color="default" onPress={modalOnClose} disabled={isLoading}>
                Cancel
              </Button>
              <Button color="primary" onPress={handleSave} isLoading={isLoading}>
                Save Changes
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};