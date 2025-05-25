import React, { useEffect, useRef, useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { useProfilePageLogic } from './ProfilePageLogic';

import {
  PencilSquareIcon,
  CloudArrowUpIcon
} from "@heroicons/react/24/solid";
import {
  Button,
  Input,
  Image,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Avatar, 
  Card, 
  CardHeader, 
  CardBody, 
  CardFooter
} from "@heroui/react";

const ProfilePage: React.FC = () => {
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
  } = useProfilePageLogic();

  const displayName = authUser?.user_metadata?.name || authUser?.user_metadata?.display_name || authUser?.email?.split('@')[0] || "User";
  const profilePicUrl = authUser?.user_metadata?.profilePic || "/profile/default-avatar.jpg";
  const bannerUrl = authUser?.user_metadata?.bannerUrl || "/profile/default-banner.jpg";

  useEffect(() => {
    console.log("authUser updated in ProfilePage:", authUser);
  }, [authUser]);

  // Common drag & drop logic
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

  return (
    <div className="container h-full max-w-4xl p-4 space-y-4 bg-base-100 overflow-scroll">
      <div className="relative">
        <div className='w-full aspect-[3/1]'></div>
        <div className='w-full h-16 md:h-24'></div>

        {/* Banner Edit Button Overlay */}
        <div
          className='absolute insert-0 flex top-1 w-full aspect-[3/1] items-center justify-center rounded-2xl bg-base-100/60 z-20 backdrop-blur-sm opacity-0 hover:opacity-100 transition-opacity cursor-pointer'
          onClick={openBannerModal}
          aria-label="Edit banner"
        >
          <PencilSquareIcon className="w-8 h-8 text-base-content" />
        </div>

        {/* Banner Image */}
        <div className='absolute insert-0 top-1 w-full aspect-[3/1]'>
          <Image
          src={bannerUrl}
          alt="Banner"
          className="w-full h-full aspect-[3/1] object-cover rounded-2xl z-10"
        />
        </div>
        

        {/* Profile Picture */}
        <div className="absolute left-4 bottom-0 w-fit group">
          <div
            className='absolute w-32 h-32 md:w-48 md:h-48 flex items-center justify-center bg-base-100/60 border-8 border-base-100 z-40 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer'
            onClick={openAvatarModal}
            aria-label="Edit avatar"
          >
            <PencilSquareIcon className="w-8 h-8 text-base-content" />
          </div>
          <Avatar
            src={profilePicUrl}
            alt="Profile"
            className="w-32 h-32 md:w-48 md:h-48 rounded-full border-8 border-base-100 object-cover z-30"
          />
        </div>
      </div>

      {/* User Info */}
        <div className="">
          <h1 className="text-2xl text-base-content md:text-4xl font-bold capitalize">{displayName}</h1>
          <p className="text-sm text-base-content/60">CatLover#1</p>
          
        </div>

      {/* About Section */}
      <div className="flex flex-col space-y-4">
        
        <Card>
          <CardBody className='gap-2'>
            <p className="text-md font-medium">About</p>
            <p className='mb-2'>
            This is where additional profile information like a biography or other details would go.
            </p>
            <p className="text-md font-medium">Member Since</p>
            <p>
            {authUser?.created_at ? new Date(authUser.created_at).toLocaleDateString() : "N/A"}
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <p className="text-md font-medium">Email</p>            
            <p>
              {authUser?.email}
            </p>
          </CardBody>
        </Card>
      </div>

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
                onPress={bannerUpload.handleClick}
                className={`transition-all ${
                  avatarUpload.isDragging ? 'opacity-0' : 'opacity-100'
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
    </div>
  );
};

export default ProfilePage;
