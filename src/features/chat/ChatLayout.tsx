import React, { useEffect } from 'react';
import { ConversationList } from './ConversationList';
import { ChatWindow } from './ChatWindow';
import { useChatState } from '../../contexts/ChatStateContext';
import { useConversations, ConversationPreview } from './useConversations';
import { IconMessageCircle2 } from '@tabler/icons-react';
import { Drawer, DrawerContent, DrawerBody, Button, useDisclosure } from "@heroui/react";
import { XMarkIcon } from '@heroicons/react/24/solid';
import { useParams, useNavigate } from 'react-router-dom';

const MOBILE_BREAKPOINT = 768;

export const ChatLayout: React.FC = () => {
  const { selectedConversation, selectConversationById, selectConversation } = useChatState(); // selectConversation (navigating one) is re-added as it's used in handleSelectConversationInUI
  const { conversations, loading: convosLoading } = useConversations();
  const { conversationId } = useParams<{ conversationId?: string }>();
  const navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Effect to sync URL -> ChatState
  useEffect(() => {
    if (convosLoading) {
      return;
    }

    const idToSelect = conversationId ? parseInt(conversationId, 10) : null;

    if (idToSelect) {
        const foundConvo = conversations.find(c => c.conversation_id === idToSelect);
        // Pass the full object (or null) to the state setter
        selectConversationById(foundConvo || null); // <--- CORRECTED CALL

        if (!foundConvo && conversations.length > 0) {
            console.warn(`Conversation ID ${idToSelect} not found in loaded conversations.`);
            navigate('/chat', { replace: true });
        }
    } else {
        selectConversationById(null); // Clear selection if no ID in URL
    }
  // selectConversationById comes from useChatState, which is stable due to useCallback in provider
  }, [conversationId, conversations, convosLoading, selectConversationById, navigate]);


  // Handler for list clicks (this function will be passed to ConversationList)
  // It will call the 'selectConversation' from context which handles navigation AND state.
  const handleSelectConversationInUI = (conversation: ConversationPreview) => {
    // Use the context's main selectConversation which also navigates
    // This line was: navigate(`/chat/${conversation.conversation_id}`); which is now done by selectConversation from context
    selectConversation(conversation); // This function from context now also handles navigation

    if (typeof window !== "undefined" && window.innerWidth < MOBILE_BREAKPOINT) {
        onOpen();
    }
  };

  return (
    <div className="flex flex-row h-full sm:h-[calc(100vh-36px)] w-full sm:border sm:border-base-300 rounded-xl overflow-hidden shadow-lg sm:m-2 place-self-center">
      {/* Conversation List Container */}
      <div className={`
          w-full sm:w-1/4 flex flex-col
          ${selectedConversation && ''} {/* Keep mobile hide logic */}
      `}>
        <ConversationList
            onSelectConversation={handleSelectConversationInUI} // <--- Pass this specific handler
            selectedConversationId={selectedConversation?.conversation_id || null}
        />
      </div>

      {/* Chat Window Container */}
      <div className="flex-grow flex-col bg-base-100 hidden sm:flex"> {/* Keep desktop show logic */}
        {selectedConversation ? (
          <ChatWindow conversation={selectedConversation} />
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
                    <ChatWindow conversation={selectedConversation} />
                  )}
                </DrawerBody>
              </DrawerContent>
          </Drawer>
      </div>
    </div>
  );
};