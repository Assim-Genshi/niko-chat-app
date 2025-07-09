import React, { useEffect, useRef, useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { useProfilePageLogic } from './ProfilePageLogic'; // You'll extend this hook
import { useNavigate } from "react-router-dom";
import clsx from 'clsx';

import { IconCopy, IconCheck } from '@tabler/icons-react'; // Added IconUserEdit
import {
  PencilSquareIcon,
  CloudArrowUpIcon,
  Cog6ToothIcon,
  PencilIcon
} from "@heroicons/react/24/solid";
import {
  Button,
  Input,
  Image, // Keep if used, but Avatar is used more
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Avatar,
  Card,
  CardBody,
  Tooltip,
  Textarea // Assuming HeroUI has Textarea, otherwise use HTML
} from "@heroui/react";
import { ThemeToggle } from '../../components/ThemeSwitcher';
import { PlanBadge } from '../../components/PlanBadge';

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const {
    authUser,
    isAvatarModalOpen, openAvatarModal, closeAvatarModal,
    avatarSrcForCropper, avatarCrop, setAvatarCrop, avatarZoom, setAvatarZoom,
    avatarRotation, setAvatarRotation, onAvatarCropComplete, handleAvatarFileSelect,
    saveAvatar, isUpdatingAvatar,

    isBannerModalOpen, openBannerModal, closeBannerModal,
    bannerSrcForCropper, bannerCrop, setBannerCrop, bannerZoom, setBannerZoom,
    bannerRotation, setBannerRotation, onBannerCropComplete, handleBannerFileSelect,
    saveBanner, isUpdatingBanner,

    // ---- NEW from ProfilePageLogic (Assumed) ----
    profileData, // { username, description, chatamata_id, ... }
    isEditDetailsModalOpen,
    openEditDetailsModal,
    closeEditDetailsModal,
    updateProfileTextDetails,
    isUpdatingProfileTextDetails,
    // ---- END NEW ----

  } = useProfilePageLogic();


  // User display details
  const displayName = authUser?.user_metadata?.name || authUser?.user_metadata?.display_name || authUser?.user_metadata?.username || authUser?.email?.split('@')[0] || "User";
  const profilePicUrl = profileData?.avatar_url || "/profile/default-avatar.jpg";
  const bannerUrl = profileData?.banner_url || "/profile/default-banner.jpg";

  // State for the Edit Profile Details Modal form
  const [editingUsername, setEditingUsername] = useState('');
  const [editingDescription, setEditingDescription] = useState('');

  useEffect(() => {
    console.log("ProfilePage authUser:", authUser);
    console.log("ProfilePage profileData:", profileData); // For debugging
    if (profileData) {
      setEditingUsername(profileData.username || '');
      setEditingDescription(profileData.description || '');
    } else if (authUser) {
      // Fallback if profileData isn't loaded yet but we have authUser metadata
      setEditingUsername(authUser.user_metadata?.username || displayName.split(' ')[0].toLowerCase() || '');
    }
  }, [profileData, authUser, displayName]); // Update form when profileData is available

  // Common drag & drop logic (no changes needed here)
  const useFileDrop = (onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    const handleClick = () => inputRef.current?.click();
    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) {
        const syntheticEvent = {
          target: { files: [file] }
        } as unknown as React.ChangeEvent<HTMLInputElement>;
        onFileSelect(syntheticEvent);
      }
    }, [onFileSelect]);

    return {
      inputRef,
      isDragging,
      handleClick,
      handleDrop,
      handleDragOver: (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); },
      handleDragLeave: () => setIsDragging(false),
    };
  };
  const avatarUpload = useFileDrop(handleAvatarFileSelect);
  const bannerUpload = useFileDrop(handleBannerFileSelect);

  const [copied, setCopied] = useState(false);

  
  const [copiedChatamataId, setCopiedChatamataId] = useState(false);
  const handleCopyChatamataId = async () => {
    if (!profileData?.chatamata_id) return;
    try {
      await navigator.clipboard.writeText(profileData.chatamata_id);
      setCopiedChatamataId(true);
      setTimeout(() => setCopiedChatamataId(false), 1500);
    } catch (err) {
      console.error('Copy failed', err);
    }
  };

  const handleSaveProfileDetails = async () => {
    if (updateProfileTextDetails) {
      await updateProfileTextDetails({
        newUsername: editingUsername,
        newDescription: editingDescription,
      });
      // Modal should close on success from within updateProfileTextDetails or via isEditDetailsModalOpen
    }
  };


  return (
    <div className="container h-full max-w-2xl pb-4 pr-4 pl-4 pt-0 space-y-4 bg-base-100 overflow-y-auto"> {/* Changed to overflow-y-auto */}
      <div className='w-full justify-between md:hidden flex items-center space-x-4 mt-2'>
        <ThemeToggle/>
        <div className="flex items-center space-x-2">
          <Button variant="light" color="default" isIconOnly onPress={() => navigate('/settings')} aria-label="Settings">
            <Cog6ToothIcon className='w-6 h-6'/>
          </Button>
        </div>
      </div>

      {/* Banner & Profile Pic Section */}
      <div className="relative">
        <div className='w-full max-w-none aspect-[3/1] rounded-2xl bg-base-300'> {/* Placeholder aspect ratio div */} 
        
          <img
            src={bannerUrl}
            alt="Banner"
            className="w-full h-full  aspect-[3/1] object-cover rounded-2xl z-10"
          />
          <div
            className='absolute inset-0 flex items-center justify-center bg-base-100/30 z-20 backdrop-blur-sm opacity-0 hover:opacity-100 transition-opacity cursor-pointer rounded-2xl'
            onClick={openBannerModal}
            aria-label="Edit banner"
          >
            <PencilSquareIcon className="w-8 h-8 text-base-content/80" />
          </div>
        </div>
        
        <div className="absolute left-4 -bottom-10 md:-bottom-16 w-fit group">

          <Avatar
            src={profilePicUrl}
            alt="Profile"
            className="w-28 h-28 md:w-36 md:h-36 rounded-full border-4 md:border-8 border-base-100 object-cover z-30"
          />
          <div
            className='absolute inset-0 flex items-center justify-center bg-base-100/30 z-40 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer border-4 md:border-8 border-base-100'
            onClick={openAvatarModal}
            aria-label="Edit avatar"
          >
            <PencilSquareIcon className="w-8 h-8 text-base-content/80" />
          </div>
        </div>
      </div>

      <div className="pt-8 md:pt-12 space-y-1"> {/* Added padding top for avatar overlap */}
        {/* Display Name (Full Name) */}
          <div className="flex w-fit items-end space-x-2 ">
            <h1 className="text-2xl text-base-content md:text-3xl font-bold capitalize">{displayName}</h1>
            {profileData && <PlanBadge plan={profileData.plan} />}
          </div>

        {/* Chatamata ID */}
        {profileData?.chatamata_id && (
          <Tooltip content={copiedChatamataId ? "Copied!" : "Copy Chatamata ID"}>
            <div onClick={handleCopyChatamataId} className="flex w-fit items-center space-x-2 cursor-pointer hover:opacity-70 transition-opacity">
              <p className="text-sm text-primary-500 font-medium">{profileData.chatamata_id}</p>
              <div className="relative w-3 h-3 text-base-content/50">
                <IconCopy className={clsx('absolute inset-0 transition-all w-3 h-3', copiedChatamataId ? 'opacity-0 scale-0' : 'opacity-100 scale-100')} />
                <IconCheck className={clsx('absolute inset-0 transition-all text-success-500 w-3 h-3', copiedChatamataId ? 'opacity-100 scale-100' : 'opacity-0 scale-0')} />
              </div>
            </div>
          </Tooltip>
        )}
      </div>

      <div className='w-full justify-between flex items-center space-x-4'>
        <Button className="bg-brand-500 text-white w-full" radius='full' variant="solid" isIconOnly onPress={openEditDetailsModal} aria-label="Edit profile details">
            <PencilIcon className="w-6 h-6" />
          </Button>
      </div>

      {/* About Section */}
      <div className="flex flex-col space-y-4">
        <Card>
          <CardBody className='gap-2'>
            <h3 className="text-md font-semibold text-base-content/90">About you</h3>
            <p className='text-base-content/80'>
              {profileData?.description || "meow?!"}
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardBody className='gap-2'>
            <h3 className="text-md font-semibold text-base-content/90">Joined Chatamata</h3>
            <p className='text-base-content/80'>
              {profileData?.joined_at ? new Date(profileData.joined_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : "N/A"}
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardBody className='gap-2'>
            <h3 className="text-md font-semibold text-base-content/90">Email</h3>
            <p className='text-base-content/80'>
              {authUser?.email}
            </p>
          </CardBody>
        </Card>
      </div>

      {/* ---- MODALS ---- */}
      {/* Avatar Modal */}
      <Modal
      isOpen={isAvatarModalOpen}
      onOpenChange={closeAvatarModal}
      classNames={{
        header: "border-b-[1px] border-base-content/10 text-sm",
        closeButton: "top-2",
      }}
      >
        <ModalContent>
          <>
            <ModalHeader>
              Edit Profile Picture
            </ModalHeader>
            <ModalBody className="space-y-4">
              {/* Drop zone */}
              <div
                onClick={avatarUpload.handleClick}
                onDrop={avatarUpload.handleDrop}
                onDragOver={avatarUpload.handleDragOver}
                onDragLeave={avatarUpload.handleDragLeave}
                className={`flex flex-col items-center justify-center border-2 border-dashed rounded-lg text-center gap-1 p-6 cursor-pointer transition-all my-3 ${
                  avatarUpload.isDragging ? 'border-primary-500 bg-primary-50' : 'border-base-content/20 bg-base-200'
                }`}
              >
                <CloudArrowUpIcon className='w-8 h-8 text-base-content'/>
                <p className="text-md text-base-content">
                  {avatarUpload.isDragging ? "Drop image here..." : "Choose a file or drag & drop it here"}
                </p>
                <p className="text-sm text-base-content/60 mb-4">
                  PNG, JPG, GIF up to 2MB
                </p>
                <Button
                size="sm"
                radius="sm"
                color="default"
                variant="faded"
                onPress={avatarUpload.handleClick}
                className={`transition-all ${
                  avatarUpload.isDragging ? 'opacity-0' : 'opacity-100'
                }`}
                >
                  Browse files
                </Button>
              </div>
              <input
                ref={avatarUpload.inputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarFileSelect}
                className="hidden"
              />
              {avatarSrcForCropper && (
                <div className="relative w-full h-64 md:h-80 bg-base-300 rounded-lg overflow-hidden">
                  <Cropper
                    image={avatarSrcForCropper}
                    crop={avatarCrop}
                    zoom={avatarZoom}
                    rotation={avatarRotation}
                    aspect={1}
                    cropShape="round"
                    onCropChange={setAvatarCrop}
                    onZoomChange={setAvatarZoom}
                    onRotationChange={setAvatarRotation}
                    onCropComplete={onAvatarCropComplete}
                  />
                </div>
              )}
            </ModalBody>
            {avatarSrcForCropper && (
              <ModalFooter>
                <Button
                  onPress={saveAvatar}
                  isLoading={isUpdatingAvatar}
                  className='bg-base-content text-base-100'
                >
                  Save Avatar
                </Button>
              </ModalFooter>
            )}
          </>
        </ModalContent>
      </Modal>

      {/* Banner Modal */}
      <Modal
      isOpen={isBannerModalOpen}
      onOpenChange={closeBannerModal}
      classNames={{
        header: "border-b-[1px] border-base-content/10 text-sm",
        closeButton: "top-2",
      }}
      >
        <ModalContent>
          <>
            <ModalHeader>Edit Banner Image</ModalHeader>
            <ModalBody className="space-y-4">
              <div
                onClick={bannerUpload.handleClick}
                onDrop={bannerUpload.handleDrop}
                onDragOver={bannerUpload.handleDragOver}
                onDragLeave={bannerUpload.handleDragLeave}
                className={`flex flex-col items-center justify-center border-2 border-dashed rounded-lg text-center gap-1 p-6 cursor-pointer transition-all my-3 ${
                  bannerUpload.isDragging ? 'border-primary-500 bg-primary-50' : 'border-base-content/20 bg-base-200' // Use bannerUpload.isDragging
                }`}
              >
                <CloudArrowUpIcon className='w-8 h-8 text-base-content'/>
                <p className="text-md text-base-content">
                  {bannerUpload.isDragging ? "Drop image here..." : "Choose a file or drag & drop it here"}
                </p>
                <p className="text-sm text-base-content/60 mb-4">
                  PNG, JPG, GIF up to 2MB
                </p>
                <Button
                size="sm"
                radius="sm"
                color="default"
                variant="faded"
                onPress={bannerUpload.handleClick}
                className={`transition-all ${
                  bannerUpload.isDragging ? 'opacity-0' : 'opacity-100'
                }`}
                >
                  Browse files
                </Button>
              </div>
              <input
                ref={bannerUpload.inputRef}
                type="file"
                accept="image/*"
                onChange={handleBannerFileSelect}
                className="hidden"
              />
              {bannerSrcForCropper && (
                <div className="relative w-full h-64 md:h-80 bg-base-300 rounded-lg overflow-hidden">
                  <Cropper
                    image={bannerSrcForCropper}
                    crop={bannerCrop}
                    zoom={bannerZoom}
                    rotation={bannerRotation}
                    aspect={16 / 6}
                    onCropChange={setBannerCrop}
                    onZoomChange={setBannerZoom}
                    onRotationChange={setBannerRotation}
                    onCropComplete={onBannerCropComplete}
                  />
                </div>
              )}
            </ModalBody>
            {bannerSrcForCropper && (
              <ModalFooter>
                <Button
                  onPress={saveBanner}
                  isLoading={isUpdatingBanner}
                  className='bg-base-content text-base-100'
                >
                  Save Banner
                </Button>
              </ModalFooter>
            )}
          </>
        </ModalContent>
      </Modal>

      {/* Edit Profile Details Modal */}
      {profileData && ( // Only render if profileData is available to prefill
        <Modal
          isOpen={isEditDetailsModalOpen}
          onOpenChange={closeEditDetailsModal}
          size="md"
          scrollBehavior='inside'
        >
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader className="text-lg font-semibold">Edit Profile Details</ModalHeader>
                <ModalBody className="space-y-4">
                  <div>
                    <label htmlFor="profile-username" className="block text-sm font-medium text-base-content/80 mb-1">
                      Username (Chatamata)
                    </label>
                    <Input
                      id="profile-username"
                      value={editingUsername}
                      onChange={(e) => setEditingUsername(e.target.value)}
                      placeholder="Your unique username"
                      fullWidth
                      radius="lg"
                      description="This is your unique @username within Chatamata."
                    />
                  </div>
                  <div>
                    <label htmlFor="profile-description" className="block text-sm font-medium text-base-content/80 mb-1">
                      About You (Description)
                    </label>
                    <Textarea
                      id="profile-description"
                      value={editingDescription}
                      onChange={(e) => setEditingDescription(e.target.value)}
                      placeholder="Tell everyone a little about yourself..."
                      fullWidth
                      radius="lg"
                      minRows={4}
                    />
                  </div>
                </ModalBody>
                <ModalFooter>
                  <Button variant="flat" color="default" onPress={onClose} disabled={isUpdatingProfileTextDetails}>
                    Cancel
                  </Button>
                  <Button color="primary" onPress={handleSaveProfileDetails} isLoading={isUpdatingProfileTextDetails}>
                    Save Details
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>
      )}
    </div>
  );
};

export default ProfilePage;