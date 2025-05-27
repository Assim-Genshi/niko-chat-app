import React, { useState, useCallback } from 'react'; // Added useCallback
import { ConversationList } from './ConversationList';
import { ChatWindow } from './ChatWindow';
import { ConversationPreview } from './useConversations'; // Adjust path
import { IconMessageCircle2, IconX } from '@tabler/icons-react'; // Import Icons
import {
  Drawer,
  DrawerContent,
  DrawerBody,
  Button,
  useDisclosure,
} from "@heroui/react";

// Define the mobile breakpoint (Tailwind's md = 768px)
const MOBILE_BREAKPOINT = 768;

export const ChatLayout: React.FC = () => {
  const [selectedConversation, setSelectedConversation] = useState<ConversationPreview | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();

  /**
   * Handles selecting a conversation.
   * - Sets the selected conversation.
   * - Checks if the screen is mobile *before* opening the drawer.
   */
  const handleSelectConversation = useCallback((conversation: ConversationPreview) => {
    setSelectedConversation(conversation);

    // Check if window exists (client-side) and if width is below the breakpoint
    if (typeof window !== "undefined" && window.innerWidth < MOBILE_BREAKPOINT) {
        onOpen(); // Only open drawer on mobile
    }
  }, [onOpen]); // Depend on onOpen

  /**
   * Handles closing the mobile drawer.
   */
  const handleCloseDrawer = () => {
    onClose();
  };

  return (
    // Main flex container for the layout
    <div className="flex flex-row h-full sm:h-[calc(100vh-36px)] w-full sm:bg-base-200 sm:border sm:border-base-300 rounded-xl overflow-hidden shadow-sm sm:m-2 place-self-center">

      {/* Conversation List Container */}
      <div className="w-full md:w-1/4 md:max-w-xs flex flex-col">
        <ConversationList onSelectConversation={handleSelectConversation} />
      </div>

      {/* Desktop Chat Window Container */}
      <div className="flex-grow flex-col bg-base-100 hidden md:flex">
        {selectedConversation ? (
          <ChatWindow conversation={selectedConversation} />
        ) : (
          <div className="flex-grow flex flex-col items-center justify-center text-neutral-500 p-6 text-center">
            <IconMessageCircle2 size={64} strokeWidth={1.5} className="mb-4 text-neutral-400" />
            <h3 className="text-xl font-medium">Select a Conversation</h3>
            <p className="text-sm text-neutral-400">Choose from your existing chats or start a new one.</p>
          </div>
        )}
      </div>

      {/* Mobile Drawer Container (Wrapper is md:hidden) */}
      <div className="md:hidden">
        <Drawer
            isOpen={isOpen}
            onClose={handleCloseDrawer}
            placement="right"
            size="full"
            backdrop="opaque"
        >
          <DrawerContent className="bg-base-100 flex flex-col h-full relative">
            <Button
              isIconOnly
              variant="light"
              color="default"
              onPress={handleCloseDrawer}
              className="absolute top-3 right-3 z-50 bg-base-100/50 backdrop-blur-sm rounded-full"
              aria-label="Close chat"
            >
               <IconX size={24} />
            </Button>
            <DrawerBody className="p-0 h-full">
              {selectedConversation && (
                <ChatWindow conversation={selectedConversation} />
              )}
            </DrawerBody>
          </DrawerContent>
        </Drawer>
      </div>
    </div>
  );
};