import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../supabase/supabaseClient';
import { Area } from 'react-easy-crop';
import { addToast } from "@heroui/react";
import { Profile } from '../../types'; // Assuming you have a comprehensive Profile type

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

const createImageBlob = async (imageSrc: string, croppedAreaPixels: Area, rotation: number): Promise<Blob> => {
  // ... (your existing createImageBlob function - no changes needed here)
  const imageElement = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new window.Image();
    img.src = imageSrc;
    img.onload = () => resolve(img);
    img.onerror = (error) => reject(error);
  });

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error("Canvas context not available.");
  }

  canvas.width = croppedAreaPixels.width;
  canvas.height = croppedAreaPixels.height;

  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.translate(-canvas.width / 2, -canvas.height / 2);

  ctx.drawImage(
    imageElement,
    croppedAreaPixels.x,
    croppedAreaPixels.y,
    croppedAreaPixels.width,
    croppedAreaPixels.height,
    0,
    0,
    canvas.width,
    canvas.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('Canvas to Blob conversion failed'));
      }
    }, 'image/jpeg');
  });
};

export const useProfilePageLogic = () => {
  const { session, user: authUser, refreshSession } = useAuth();

  // --- Full Profile Data from 'profiles' table ---
  const [profileData, setProfileData] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  // --- Avatar Modal State & Logic ---
  const [isAvatarModalOpen, setAvatarModalOpen] = useState(false);
  const [avatarSrcForCropper, setAvatarSrcForCropper] = useState<string | null>(null);
  const [avatarCrop, setAvatarCrop] = useState({ x: 0, y: 0 });
  const [avatarZoom, setAvatarZoom] = useState(1);
  const [avatarRotation, setAvatarRotation] = useState(0);
  const [croppedAvatarAreaPixels, setCroppedAvatarAreaPixels] = useState<Area | null>(null);
  const [isUpdatingAvatar, setIsUpdatingAvatar] = useState(false);

  // --- Banner Modal State & Logic ---
  const [isBannerModalOpen, setBannerModalOpen] = useState(false);
  const [bannerSrcForCropper, setBannerSrcForCropper] = useState<string | null>(null);
  const [bannerCrop, setBannerCrop] = useState({ x: 0, y: 0 });
  const [bannerZoom, setBannerZoom] = useState(1);
  const [bannerRotation, setBannerRotation] = useState(0);
  const [croppedBannerAreaPixels, setCroppedBannerAreaPixels] = useState<Area | null>(null);
  const [isUpdatingBanner, setIsUpdatingBanner] = useState(false);

  // --- Edit Profile (Text Details) Modal State & Logic ---
  const [isEditDetailsModalOpen, setIsEditDetailsModalOpen] = useState(false);
  const [isUpdatingProfileTextDetails, setIsUpdatingProfileTextDetails] = useState(false);


  // --- Fetch Full Profile Data ---
  const fetchProfileData = useCallback(async () => {
    if (!authUser) {
      setProfileData(null);
      setProfileLoading(false);
      return;
    }
    setProfileLoading(true);
    setProfileError(null);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*') // Select all columns from your Profile type
        .eq('id', authUser.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found, which can be valid
        throw error;
      }
      setProfileData(data as Profile | null);
    } catch (err: any) {
      console.error("Error fetching profile:", err);
      setProfileError(err.message);
      addToast({ title: "Error fetching profile", description: err.message, color: "danger" });
    } finally {
      setProfileLoading(false);
    }
  }, [authUser]);

  useEffect(() => {
    if (authUser) {
      fetchProfileData();
    }
  }, [authUser, fetchProfileData]);


  // --- File Handling & Image Upload Logic ---
  const handleFileSelect = useCallback((
    e: React.ChangeEvent<HTMLInputElement>,
    setSrcForCropper: React.Dispatch<React.SetStateAction<string | null>>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      addToast({
        title: "File Size Error",
        description: `The uploaded image should be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB.`,
        color: "danger",
      });
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (reader.result) {
        setSrcForCropper(reader.result as string);
      }
    };
    reader.onerror = () => {
      addToast({ title: "File Read Error", description: "Could not read the selected image file.", color: "danger" });
    };
    e.target.value = "";
  }, []);

  const genericSaveImage = async (
    imageType: 'avatar' | 'banner',
    srcForCropper: string | null,
    croppedAreaPixelsToUse: Area | null,
    rotationToUse: number,
    setIsUpdating: React.Dispatch<React.SetStateAction<boolean>>,
    closeModal: () => void
  ) => {
    if (!srcForCropper || !croppedAreaPixelsToUse || !authUser || !authUser.id) {
      addToast({ title: "Error", description: "Missing data for image save.", color: "danger" });
      return;
    }

    setIsUpdating(true);
    try {
      const blob = await createImageBlob(srcForCropper, croppedAreaPixelsToUse, rotationToUse);
      const isAvatar = imageType === 'avatar';
      const bucket = isAvatar ? 'avatars' : 'banners';
      const filePath = `${authUser.id}/${imageType}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, blob, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(filePath);
      if (!publicUrlData || !publicUrlData.publicUrl) {
        throw new Error(`Could not get public URL for the ${imageType}.`);
      }
      const newImageUrl = `${publicUrlData.publicUrl}?t=${new Date().getTime()}`;

      // Update auth.users.user_metadata
      const metadataField = isAvatar ? 'profilePic' : 'bannerUrl';
      await supabase.auth.updateUser({
        data: { ...(authUser.user_metadata || {}), [metadataField]: newImageUrl },
      });

      // Update public.profiles table
      const profileUpdateField = isAvatar ? 'avatar_url' : 'banner_url';
      const { error: profileUpdateError } = await supabase
        .from('profiles')
        .update({ [profileUpdateField]: newImageUrl })
        .eq('id', authUser.id);

      if (profileUpdateError) {
        console.warn(`Failed to update profiles.${profileUpdateField}:`, profileUpdateError);
        addToast({ title: "Profile Sync Warning", description: `${imageType} updated, but profile sync issue.`, color: "warning" });
      }

      addToast({ title: `${imageType.charAt(0).toUpperCase() + imageType.slice(1)} Updated`, description: `Your ${imageType} has been successfully updated.`, color: "success" });
      fetchProfileData(); // Refetch profile data to get new image URL
      if (typeof refreshSession === 'function') await refreshSession();
      closeModal();
    } catch (error: any) {
      addToast({ title: "Update Failed", description: error.message, color: "danger" });
    } finally {
      setIsUpdating(false);
    }
  };

  const saveAvatar = () => genericSaveImage('avatar', avatarSrcForCropper, croppedAvatarAreaPixels, avatarRotation, setIsUpdatingAvatar, closeAvatarModal);
  const saveBanner = () => genericSaveImage('banner', bannerSrcForCropper, croppedBannerAreaPixels, bannerRotation, setIsUpdatingBanner, closeBannerModal);

  const resetAvatarCropperState = () => {
    setAvatarSrcForCropper(null);
    setCroppedAvatarAreaPixels(null);
    setAvatarCrop({ x: 0, y: 0 });
    setAvatarZoom(1);
    setAvatarRotation(0);
  };

  const resetBannerCropperState = () => {
    setBannerSrcForCropper(null);
    setCroppedBannerAreaPixels(null);
    setBannerCrop({ x: 0, y: 0 });
    setBannerZoom(1);
    setBannerRotation(0);
  };

  // --- Update Profile Text Details (Username, Description) ---
  const updateProfileTextDetails = async (details: { newUsername: string; newDescription: string }) => {
    if (!authUser) {
      addToast({ title: "Error", description: "Not authenticated.", color: "danger" });
      return;
    }
    if (!details.newUsername.trim()) {
        addToast({ title: "Username Required", description: "Please enter a username.", color: "warning" });
        return;
    }

    setIsUpdatingProfileTextDetails(true);
    try {
      // 1. Update public.profiles table
      const { error: profileUpdateError } = await supabase
        .from('profiles')
        .update({
          username: details.newUsername.trim(),
          description: details.newDescription.trim(),
          // profile_setup_complete: true, // If this update implies setup is now complete
        })
        .eq('id', authUser.id);

      if (profileUpdateError) {
        if (profileUpdateError.message.includes('duplicate key value violates unique constraint "profiles_username_key"')) {
          addToast({ title: "Username Taken", description: "That username is already in use.", color: "danger" });
        } else if (profileUpdateError.message.includes('profiles_username_key')) { // Catch other username issues
            addToast({ title: "Username Error", description: "Problem with username. It might be taken or invalid.", color: "danger" });
        } else {
          throw profileUpdateError;
        }
        return; // Stop if profile update failed
      }

      // 2. Optionally update auth.users.user_metadata if you store username there too
      // This is good if your handle_new_user trigger or other parts of app rely on metadata.username
      // Compare with existing metadata username to avoid unnecessary updates
      const currentMetaUsername = authUser.user_metadata?.username;
      if (details.newUsername.trim() !== currentMetaUsername) {
        await supabase.auth.updateUser({
          data: {
            ...(authUser.user_metadata || {}),
            username: details.newUsername.trim(),
            // If 'name' in metadata should be full_name and username is separate:
            name: profileData?.full_name || authUser.user_metadata?.name, // Keep existing full_name
          },
        });
      }

      addToast({ title: "Profile Updated", description: "Your details have been saved.", color: "success" });
      fetchProfileData(); // Refresh profile data
      if (typeof refreshSession === 'function') await refreshSession();
      closeEditDetailsModal();

    } catch (error: any) {
      addToast({ title: "Update Failed", description: error.message, color: "danger" });
    } finally {
      setIsUpdatingProfileTextDetails(false);
    }
  };


  return {
    authUser,
    profileData,
    profileLoading,
    profileError,

    isAvatarModalOpen,
    openAvatarModal: () => { resetAvatarCropperState(); setAvatarModalOpen(true); },
    closeAvatarModal: () => { setAvatarModalOpen(false); resetAvatarCropperState(); },
    avatarSrcForCropper,
    avatarCrop, setAvatarCrop,
    avatarZoom, setAvatarZoom,
    avatarRotation, setAvatarRotation,
    onAvatarCropComplete: (_: Area, pixels: Area) => setCroppedAvatarAreaPixels(pixels),
    handleAvatarFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => { resetAvatarCropperState(); handleFileSelect(e, setAvatarSrcForCropper);},
    saveAvatar,
    isUpdatingAvatar,

    isBannerModalOpen,
    openBannerModal: () => { resetBannerCropperState(); setBannerModalOpen(true); },
    closeBannerModal: () => { setBannerModalOpen(false); resetBannerCropperState(); },
    bannerSrcForCropper,
    bannerCrop, setBannerCrop,
    bannerZoom, setBannerZoom,
    bannerRotation, setBannerRotation,
    onBannerCropComplete: (_: Area, pixels: Area) => setCroppedBannerAreaPixels(pixels),
    handleBannerFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => { resetBannerCropperState(); handleFileSelect(e, setBannerSrcForCropper); },
    saveBanner,
    isUpdatingBanner,

    isEditDetailsModalOpen,
    openEditDetailsModal: () => setIsEditDetailsModalOpen(true),
    closeEditDetailsModal: () => setIsEditDetailsModalOpen(false),
    updateProfileTextDetails,
    isUpdatingProfileTextDetails,
    
    refreshProfileData: fetchProfileData, // Expose to allow manual refresh if needed
  };
};

function closeBannerModal(): void {
  throw new Error('Function not implemented.');
}
function closeAvatarModal(): void {
  throw new Error('Function not implemented.');
}

function closeEditDetailsModal() {
  throw new Error('Function not implemented.');
}

