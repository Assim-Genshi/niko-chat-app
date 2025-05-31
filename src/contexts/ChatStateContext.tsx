// src/contexts/ChatStateContext.tsx
import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { ConversationPreview } from '../features/chat/useConversations'; // Adjust path
import { useNavigate } from 'react-router-dom';

interface ChatStateContextType {
  selectedConversation: ConversationPreview | null;
  selectConversation: (conversation: ConversationPreview | null) => void; // This is for UI clicks that should also navigate
  selectConversationById: (conversation: ConversationPreview | null) => void; // Changed: This is for setting state from URL, expects object or null
}

const ChatStateContext = createContext<ChatStateContextType | undefined>(undefined);

export const ChatStateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedConversation, setSelectedConversation] = useState<ConversationPreview | null>(null);
  const navigate = useNavigate();

  // This function is called when a user clicks a conversation in the list.
  // It updates the state AND navigates.
  const selectConversation = useCallback((conversation: ConversationPreview | null) => {
    setSelectedConversation(conversation);
    if (conversation) {
      navigate(`/chat/${conversation.conversation_id}`);
    } else {
      navigate('/chat');
    }
  }, [navigate]);

  // This function is called by ChatLayout's useEffect to sync the URL with the state.
  // It ONLY sets the state, no navigation here to avoid loops.
  const selectConversationById = useCallback((conversation: ConversationPreview | null) => {
    setSelectedConversation(conversation);
  }, []);

  return (
    <ChatStateContext.Provider value={{ selectedConversation, selectConversation, selectConversationById }}>
      {children}
    </ChatStateContext.Provider>
  );
};

export const useChatState = () => {
  const context = useContext(ChatStateContext);
  if (context === undefined) {
    throw new Error('useChatState must be used within a ChatStateProvider');
  }
  return context;
};