// src/components/ui/ProfilePreviewDrawer.tsx (or your preferred path)
import React from 'react';
import { useProfilePreview } from '../../contexts/ProfilePreviewContext'; // Adjust path
import { Drawer, DrawerContent, DrawerBody, Button, Avatar, Badge, Image, Card, CardBody } from '@heroui/react'; // Added Badge
import { Profile } from '../../types'; // Adjust path
import { usePresence } from '../../contexts/PresenceContext'; // To show online status
import { XMarkIcon } from '@heroicons/react/24/solid';

export const ProfilePreviewDrawer: React.FC = () => {
  const { isPreviewOpen, profileData, closeProfilePreview } = useProfilePreview();
  const { onlineUsers } = usePresence();

  if (!isPreviewOpen || !profileData) {
    return null; // Don't render if not open or no profile data in context
  }

  const isOnline = onlineUsers.has(profileData.id);

  return (
    <Drawer
      isOpen={isPreviewOpen}
      onClose={closeProfilePreview} // This prop should close the drawer
      placement="right"             // Slide in from the right (or "left")
      size="full"                     // Adjust size: "sm", "md", "lg", "xl" (e.g., "md" for a sidebar-like feel)
      closeButton={<></>}           // Hide default close button if we add a custom one inside
      className="space-y-1 z-50"              // Ensure it's above other content if needed
    >
      <DrawerContent className="bg-base-100 max-w-2xl flex flex-col h-full relative shadow-xl">
        {/* Custom Close Button */}
        <Button
          isIconOnly
          variant="light" // Use light or ghost for less emphasis
          size="sm"
          onPress={closeProfilePreview}
          className="absolute top-4 right-4 z-10 text-base-content/70 hover:text-base-content hover:bg-base-200/50"
          aria-label="Close profile preview"
        >
          <XMarkIcon className="w-6 h-6" />
        </Button>

        {/* Drawer Body for scrollable content */}
        <DrawerBody className="pt-16 pb-6 space-y-2 overflow-y-auto"> {/* Added more top padding for close button */}
        <div className="relative">
        <div className='w-full aspect-[3/1] rounded-2xl bg-base-300'> {/* Placeholder aspect ratio div */}
          <Image
            src={profileData.banner_url || '/avatar.png'}
            alt="Banner"
            className="w-full aspect-[3/1] h-full object-cover rounded-2xl z-10"
          />
        </div>
        
        <div className="absolute left-4 -bottom-10 md:-bottom-16 w-fit group">
        <Badge
                content="" // Empty content for a dot
                size='lg'
                color="success"
                shape="circle"
                placement="bottom-right"
                isInvisible={!isOnline}
                className="border-2 border-base-100" // border-background if drawer bg is base-100
              >
               <Avatar
            src={profileData.avatar_url || '/avatar.png'}
            alt={profileData.username || 'Profile Picture'}
            className="w-28 h-28 md:w-36 md:h-36 rounded-full border-4 md:border-8 border-base-100 object-cover z-30"
          /> 
              </Badge>
        </div>
      </div>
         
          {/* Profile Header Section */}
          <div className="pt-8 md:pt-12 space-y-1"> {/* Added padding top for avatar overlap */}
        {/* Display Name (Full Name) */}
          <div  className="flex w-fit items-center space-x-2 cursor-pointer hover:opacity-70 transition-opacity">
            <h1 className="text-2xl text-base-content md:text-3xl font-bold capitalize">{profileData.username || 'User'}</h1>
            <div className="relative w-5 h-5 text-base-content/70">
            </div>
          </div>

        {/* Chatamata ID */}
            <div className="flex w-fit items-center space-x-2 cursor-pointer hover:opacity-70 transition-opacity">
              <p className="text-sm text-primary-500 font-medium">{profileData.chatamata_id}</p>
              <div className="relative w-3 h-3 text-base-content/50">
              </div>
            </div>
        </div>

          {/* Description / About Me */}
          <div className='space-y-2'>
          <Card>
          <CardBody className='gap-2'>
            <h3 className="text-md font-semibold text-base-content/90">About</h3>
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
        <div/>
          {/* Other Details */}
            {profileData.updated_at && (
              <p className=" text-sm text-center font-semibold text-base-content/90" >
                Profile updated: {new Date(profileData.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </p>
            )}
          </div>
        </DrawerBody>
        
        {/* Optional: A fixed footer inside DrawerContent if you need actions always visible */}
        {/* <div className="p-4 border-t border-base-300 mt-auto">
            <Button fullWidth color="primary" variant="flat" onPress={closeProfilePreview}>
                Done
            </Button>
        </div> */}

      </DrawerContent>
    </Drawer>
  );
};