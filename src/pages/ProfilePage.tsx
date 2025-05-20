import { useState } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input, Image } from "@heroui/react";
import { useAuth } from "../contexts/AuthContext"; // Use Supabase auth context
import { IconEdit } from "@tabler/icons-react";
import { Session } from "@supabase/supabase-js";

interface ProfileProps {
  isOpen: boolean;
  onClose: () => void;
}

const ProfilePage = ({ isOpen, onClose }: ProfileProps) => {
  const { session } = useAuth();
  const authUser = session?.user;
  const [selectedImg, setSelectedImg] = useState<string | null>(null);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = async () => {
      if (reader.result) {
        setSelectedImg(reader.result as string);
        // Add Supabase profile update logic here
        // Example: await supabase.storage.from('profiles').upload(authUser.id, file);
      }
    };
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onClose}>
      <ModalContent>
        {(handleClose) => (
          <>
            <ModalHeader className="flex flex-col items-center gap-1">
              <h2 className="text-lg font-bold">Profile</h2>
              <p className="text-xs text-zinc-500">Manage your account information</p>
            </ModalHeader>

            <ModalBody className="text-center space-y-6">
              {/* Avatar Section */}
              <div className="relative">
                <Image
                  src={selectedImg || authUser?.user_metadata?.profilePic || "/avatar.png"}
                  alt="Profile"
                  className="w-32 h-32 rounded-full border-4 border-zinc-200"
                />
                <label htmlFor="avatar-upload" className="absolute bottom-0 right-0 bg-primary text-white rounded-full p-1 cursor-pointer">
                  <IconEdit className="h-4 w-4" />
                </label>
                <Input type="file" id="avatar-upload" className="hidden" accept="image/*" onChange={handleImageUpload} />
              </div>

              {/* User Information */}
              <div className="space-y-3">
                <p className="text-lg font-medium">{authUser?.user_metadata?.fullName || "Guest"}</p>
                <p className="text-sm text-zinc-500">{authUser?.email || "not provided"}</p>
                <p className="text-xs text-zinc-400">Member since: {new Date(authUser?.created_at || "").toLocaleDateString()}</p>
              </div>
            </ModalBody>

            <ModalFooter>
              <Button variant="light" color="danger" onPress={handleClose}>
                Close
              </Button>
              {isUpdatingProfile && (
                <Button variant="light" color="primary" disabled>
                  Updating...
                </Button>
              )}
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default ProfilePage;
