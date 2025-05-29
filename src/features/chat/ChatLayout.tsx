import React from 'react'; // Removed useState, useCallback
import { ConversationList } from './ConversationList';
import { ChatWindow } from './ChatWindow';
import { useChatState } from '../../contexts/ChatStateContext'; // Adjust path
import { IconMessageCircle2 } from '@tabler/icons-react';
import {
  Drawer,
  DrawerContent,
  DrawerBody,
  Button,
  useDisclosure,
} from "@heroui/react";
import { ConversationPreview } from './useConversations';
import { XMarkIcon } from '@heroicons/react/24/solid';

const MOBILE_BREAKPOINT = 768;

export const ChatLayout: React.FC = () => {
  const { selectedConversation, selectConversation } = useChatState(); // <--- Use context
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Updated handler using context + mobile logic
  const handleSelectConversation = (conversation: ConversationPreview) => {
    selectConversation(conversation); // Set state via context
    if (typeof window !== "undefined" && window.innerWidth < MOBILE_BREAKPOINT) {
        onOpen();
    }
  };

  return (
    <div className="flex flex-row h-full sm:h-[calc(100vh-36px)] w-full sm:border sm:border-base-300 rounded-xl overflow-hidden shadow-lg sm:m-2 place-self-center">
      {/* Conversation List Container */}
            <div
              className={`w-full sm:w-1/3 flex flex-col ${
                selectedConversation ? 'sm:flex' : ''
                }`}
              >
        <ConversationList
            onSelectConversation={handleSelectConversation}
            selectedConversationId={selectedConversation?.conversation_id || null} // Pass selected ID
        />
      </div>

      <div className="flex-col w-full min-w-96 bg-base-100 hidden md:flex">
        {selectedConversation ? (
          <ChatWindow conversation={selectedConversation} />
        ) : (
          <div className="w-full flex flex-col items-center justify-center text-neutral-500 p-6 text-center">
            <IconMessageCircle2 size={64} strokeWidth={1.5} className="mb-4 text-neutral-400" />
            <h3 className="text-xl font-medium">Select a Conversation</h3>
            <p className="text-sm text-neutral-400">Choose from your existing chats or start a new one.</p>
          </div>
        )}
      </div>


      <div className="md:hidden">
        <Drawer isOpen={isOpen} onClose={onClose} placement="right" size="full" closeButton={<></>}>
          <DrawerContent className="bg-base-100 flex flex-col h-full relative">
            <Button size='sm' isIconOnly onPress={onClose} className='absolute top-4 right-2 bg-transparent z-50'>
              <XMarkIcon className='h-5 w-5  text-base-content'/>
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