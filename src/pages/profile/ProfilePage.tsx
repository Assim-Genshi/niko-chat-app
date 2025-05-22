import React from 'react';
import { IconEdit, IconPhotoEdit, IconUserCircle, IconPhoto } from "@tabler/icons-react"; // Example icons
import Cropper from 'react-easy-crop';
import { useProfilePageLogic } from './ProfilePageLogic'; // Adjust path as needed
import { useEffect } from 'react';

//------- HeroUI -------
import { PencilSquareIcon } from "@heroicons/react/24/solid";
import { Button, Input, Image as HeroImage, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Avatar } from "@heroui/react"; // Adjust imports as needed


const ProfilePage: React.FC = () => {
  const {
    authUser,
    // Avatar
    isAvatarModalOpen, openAvatarModal, closeAvatarModal,
    avatarSrcForCropper, avatarCrop, setAvatarCrop, avatarZoom, setAvatarZoom,
    avatarRotation, setAvatarRotation, onAvatarCropComplete, handleAvatarFileSelect,
    saveAvatar, isUpdatingAvatar,
    // Banner
    isBannerModalOpen, openBannerModal, closeBannerModal,
    bannerSrcForCropper, bannerCrop, setBannerCrop, bannerZoom, setBannerZoom,
    bannerRotation, setBannerRotation, onBannerCropComplete, handleBannerFileSelect,
    saveBanner, isUpdatingBanner,
  } = useProfilePageLogic();

  const displayName = authUser?.user_metadata?.name || authUser?.user_metadata?.display_name || authUser?.email?.split('@')[0] || "User";
  const profilePicUrl = authUser?.user_metadata?.profilePic || undefined; // Let HeroImage handle undefined with a fallback or style it
  const bannerUrl = authUser?.user_metadata?.bannerUrl || "/default-banner.jpg"; // Provide a default banner path

  useEffect(() => {
    console.log("authUser updated in ProfilePage:", authUser);
    console.log("New profile pic URL from authUser:", authUser?.user_metadata?.profilePic);
    console.log("New banner URL from authUser:", authUser?.user_metadata?.bannerUrl);
  }, [authUser]);
  
  return (
    
    <div className="container h-full p-4 space-y-8 bg-base-100 overflow-scroll">
      {/* Banner Section */}
      <div className="relative group rounded-lg overflow-hidden">
        <div 
          className='absolute w-full h-full flex items-center justify-center bg-base-content/60 z-50 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer'
          onClick={openBannerModal}
          aria-label="Edit avatar"
          >
              <PencilSquareIcon className="w-8 h-8 text-base-100" />
          </div>
        <HeroImage
          src={bannerUrl}
          alt="Banner"
          className="w-full aspect-[2.77/1]"
          fallbackSrc="/default-banner.jpg" // Ensure HeroImage has a fallback or handle it
        />
      </div>

      {/* Profile Info Section */}
      <div className="flex flex-col items-center md:flex-row md:items-end -mt-16 md:-mt-24 px-4 space-x-0 md:space-x-6">
        <div className="relative group">
          <div 
          className='absolute w-full h-full flex items-center justify-center bg-base-content/60 border-4 border-base-100 z-50 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer'
          onClick={openAvatarModal}
          aria-label="Edit avatar"
          >
              <PencilSquareIcon className="w-8 h-8 text-base-100" />
          </div>
            <Avatar
              src={profilePicUrl}
              alt="Profile"
              className="w-32 h-32 md:w-48 md:h-48 rounded-full border-4 border-base-100 shadow-lg object-cover z-6"
            />
           
        </div>
        <div className="mt-4 md:mt-0 md:pb-4 text-center md:text-left">
          <h1 className="text-2xl md:text-4xl font-bold">{displayName}</h1>
          <p className="text-md text-gray-600">{authUser?.email}</p>
          <p className="text-sm text-gray-500 mt-1">
            Member since: {authUser?.created_at ? new Date(authUser.created_at).toLocaleDateString() : "N/A"}
          </p>
        </div>
      </div>

      {/* Other profile content can go here, e.g., bio, stats, etc. */}
      <div className="pt-8 border-t">
          <h2 className="text-xl font-semibold">About</h2>
          <p className="text-gray-700 mt-2">
              This is where additional profile information like a biography or other details would go.
              You can customize this section further based on your application's needs.
          </p>
      </div>


      {/* Avatar Editing Modal */}
      <Modal isOpen={isAvatarModalOpen} onOpenChange={closeAvatarModal}>
        <ModalContent>
          {(modalCtrl) => (
            <>
              <ModalHeader>Edit Profile Picture</ModalHeader>
              <ModalBody className="space-y-4">
                <Input type="file" accept="image/*" onChange={handleAvatarFileSelect} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"/>
                {avatarSrcForCropper && (
                  <div className="relative w-full h-64 md:h-80 bg-gray-100 rounded">
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
              <ModalFooter>
               {/*<Button variant="light" color="primary" onPress={() => modalCtrl.close()}>Cancel</Button>*/}
                <Button color="primary" onPress={saveAvatar} disabled={isUpdatingAvatar || !avatarSrcForCropper}>
                  {isUpdatingAvatar ? "Saving..." : "Save Avatar"}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Banner Editing Modal */}
      <Modal isOpen={isBannerModalOpen} onOpenChange={closeBannerModal}>
        <ModalContent>
           {(modalCtrl) => (
            <>
              <ModalHeader>Edit Banner Image</ModalHeader>
              <ModalBody className="space-y-4">
                <Input type="file" accept="image/*" onChange={handleBannerFileSelect} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"/>
                {bannerSrcForCropper && (
                  <div className="relative w-full h-64 md:h-80 bg-gray-100 rounded">
                    <Cropper
                      image={bannerSrcForCropper}
                      crop={bannerCrop}
                      zoom={bannerZoom}
                      rotation={bannerRotation}
                      aspect={16 / 6} // Common banner aspect ratio, adjust as needed
                      onCropChange={setBannerCrop}
                      onZoomChange={setBannerZoom}
                      onRotationChange={setBannerRotation}
                      onCropComplete={onBannerCropComplete}
                    />
                  </div>
                )}
                 
              </ModalBody>
              <ModalFooter>
                {/*<Button variant="light" color="primary" onPress={() => modalCtrl.close()}>Cancel</Button> */}
                <Button color="primary" onPress={saveBanner} disabled={isUpdatingBanner || !bannerSrcForCropper}>
                  {isUpdatingBanner ? "Saving..." : "Save Banner"}
                </Button>
              </ModalFooter>
            </>
           )}
        </ModalContent>
      </Modal>

    </div>
  );
};

export default ProfilePage;