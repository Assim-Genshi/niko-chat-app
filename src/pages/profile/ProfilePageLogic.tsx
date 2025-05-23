import { useState, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext'; // Adjust path as needed
import { supabase } from '../../supabase/supabaseClient'; // Adjust path as needed
import { Area } from 'react-easy-crop';
import { addToast } from "@heroui/react"; // Assuming addToast is from here
import { Session } from '@supabase/supabase-js';

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

// Helper function to create a cropped image blob generic
const createImageBlob = async (imageSrc: string, croppedAreaPixels: Area, rotation: number): Promise<Blob> => {
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
    const { session, user: authUser, refreshSession } = useAuth(); // Assuming useAuth provides user and a way to refresh
  // If useAuth only provides session, then: const authUser = session?.user;
  

  // Avatar Modal State & Logic
  const [isAvatarModalOpen, setAvatarModalOpen] = useState(false);
  const [avatarSrcForCropper, setAvatarSrcForCropper] = useState<string | null>(null);
  const [avatarCrop, setAvatarCrop] = useState({ x: 0, y: 0 });
  const [avatarZoom, setAvatarZoom] = useState(1);
  const [avatarRotation, setAvatarRotation] = useState(0);
  const [croppedAvatarAreaPixels, setCroppedAvatarAreaPixels] = useState<Area | null>(null);
  const [isUpdatingAvatar, setIsUpdatingAvatar] = useState(false);

  // Banner Modal State & Logic
  const [isBannerModalOpen, setBannerModalOpen] = useState(false);
  const [bannerSrcForCropper, setBannerSrcForCropper] = useState<string | null>(null);
  const [bannerCrop, setBannerCrop] = useState({ x: 0, y: 0 });
  const [bannerZoom, setBannerZoom] = useState(1);
  const [bannerRotation, setBannerRotation] = useState(0);
  const [croppedBannerAreaPixels, setCroppedBannerAreaPixels] = useState<Area | null>(null);
  const [isUpdatingBanner, setIsUpdatingBanner] = useState(false);

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
    if (!srcForCropper || !croppedAreaPixelsToUse) {
      addToast({ title: "Error", description: "No image source or crop area defined.", color: "danger" });
      return;
    }
    if (!authUser || !authUser.id) {
      addToast({ title: "Authentication Error", description: "User not authenticated.", color: "danger" });
      return;
    }

    setIsUpdating(true);
    try {
      const blob = await createImageBlob(srcForCropper, croppedAreaPixelsToUse, rotationToUse);
      const filePath = `${authUser.id}/${imageType}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from(imageType === 'avatar' ? 'avatars' : 'banners') // Assuming separate buckets or handled by policies
        .upload(filePath, blob, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from(imageType === 'avatar' ? 'avatars' : 'banners')
        .getPublicUrl(filePath);

      if (!publicUrlData || !publicUrlData.publicUrl) {
        throw new Error(`Could not get public URL for the ${imageType}.`);
      }
      const newImageUrl = `${publicUrlData.publicUrl}?t=${new Date().getTime()}`; // Cache buster

      const metadataField = imageType === 'avatar' ? 'profilePic' : 'bannerUrl';
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          ...(authUser.user_metadata || {}),
          [metadataField]: newImageUrl,
        },
      });

      if (updateError) {
        console.error("Error updating user metadata:", updateError);
        throw updateError;
      }

      addToast({ title: `${imageType.charAt(0).toUpperCase() + imageType.slice(1)} Updated`, description: `Your ${imageType} has been successfully updated.`, color: "success" });
      console.log("Calling refreshSession after user metadata update...");
       if (typeof refreshSession === 'function') {
         await refreshSession(); // Refresh session to get new metadata
      }
      closeModal();
    } catch (error) {
        console.error(`Failed to save ${imageType}:`, error); // Log the full error
        addToast({ title: "Update Failed", description: `Error: ${(error as Error).message}`, color: "danger" });
      } finally {
        setIsUpdating(false); // This is correctly placed 
      }
    };

  const saveAvatar = () => genericSaveImage('avatar', avatarSrcForCropper, croppedAvatarAreaPixels, avatarRotation, setIsUpdatingAvatar, () => setAvatarModalOpen(false));
  const saveBanner = () => genericSaveImage('banner', bannerSrcForCropper, croppedBannerAreaPixels, bannerRotation, setIsUpdatingBanner, () => setBannerModalOpen(false));

  

  // Reset cropper states when modal is closed or new image selected
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


  return {
    authUser,
    // Avatar
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

    // Banner
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
  };
};