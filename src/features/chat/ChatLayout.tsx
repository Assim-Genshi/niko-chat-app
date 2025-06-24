import React, { useEffect } from 'react';
import { ConversationList } from './ConversationList';
import { ChatWindow } from './ChatWindow';
import { useChatState } from '../../contexts/ChatStateContext';
import { useConversations } from './useConversations';
import { IconMessageCircle2 } from '@tabler/icons-react';
import { Drawer, DrawerContent, DrawerBody, Button, useDisclosure } from "@heroui/react";
import { XMarkIcon } from '@heroicons/react/24/solid';
import { useParams, useNavigate } from 'react-router-dom';
import { ConversationPreview } from '../../types';

const MOBILE_BREAKPOINT = 768;

export const ChatLayout: React.FC = () => {
  const { selectedConversation, selectConversationById, selectConversation } = useChatState();
  const { conversations, loading: convosLoading } = useConversations();
  const { conversationId } = useParams<{ conversationId?: string }>();
  const navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure();

  // ... (No changes to useEffect or handlers)
  useEffect(() => {
    if (convosLoading) {
      return;
    }
    const idToSelect = conversationId ? parseInt(conversationId, 10) : null;
    if (idToSelect) {
        const foundConvo = conversations.find(c => c.conversation_id === idToSelect);
        selectConversationById(foundConvo || null);
        if (!foundConvo && conversations.length > 0) {
            console.warn(`Conversation ID ${idToSelect} not found in loaded conversations.`);
            navigate('/chat', { replace: true });
        }
    } else {
        selectConversationById(null);
    }
  }, [conversationId, conversations, convosLoading, selectConversationById, navigate]);

  const handleSelectConversationInUI = (conversation: ConversationPreview) => {
    selectConversation(conversation);
    if (typeof window !== "undefined" && window.innerWidth < MOBILE_BREAKPOINT) {
        onOpen();
    }
  };


  return (
    <div className="flex flex-row h-full sm:h-[calc(100vh-18px)] w-full overflow-hidden place-self-center">
      {/* Conversation List Container */}
      <div className={`
          w-full sm:w-1/4 min-w-64 sm:max-w-80 flex flex-col
          ${selectedConversation && ''} {/* Keep mobile hide logic */}
      `}>
        <ConversationList
            onSelectConversation={handleSelectConversationInUI}
            selectedConversationId={selectedConversation?.conversation_id || null}
        />
      </div>

      {/* Chat Window Container */}
      <div className="flex-grow flex-col bg-base-100 hidden sm:flex">
        {selectedConversation ? (
          // FIX: Add a unique key to force a remount when the conversation changes
          <ChatWindow 
            key={selectedConversation.conversation_id} 
            conversation={selectedConversation} 
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-neutral-500 p-6 text-center">
            <IconMessageCircle2 size={64} strokeWidth={1.5} className="mb-4 text-neutral-400" />
            <h3 className="text-xl font-medium">Select a Conversation</h3>
            <p className="text-sm text-neutral-400">Choose from your existing chats or start a new one.</p>
          </div>
        )}
      </div>

      {/* Mobile Drawer */}
      <div className="md:hidden">
          <Drawer isOpen={isOpen} onClose={onClose} placement="right" size="full" closeButton={<></>}>
               <DrawerContent className="bg-base-100 flex flex-col h-full relative">
                <Button size='sm' isIconOnly onPress={onClose} className='absolute top-4 right-2 bg-transparent z-50'>
                  <XMarkIcon className='h-5 w-5  text-base-content'/>
                </Button>
                <DrawerBody className="p-0 h-full">
                  {selectedConversation && (
                    // FIX: Also add the key to the mobile view
                    <ChatWindow 
                      key={selectedConversation.conversation_id} 
                      conversation={selectedConversation} 
                    />
                  )}
                </DrawerBody>
              </DrawerContent>
          </Drawer>
      </div>
    </div>
  );
};