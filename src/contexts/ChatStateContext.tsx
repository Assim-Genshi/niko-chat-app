import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { ConversationPreview } from '../features/chat/useConversations'; // Adjust path

interface ChatStateContextType {
  selectedConversation: ConversationPreview | null;
  selectConversation: (conversation: ConversationPreview | null) => void;
}

const ChatStateContext = createContext<ChatStateContextType | undefined>(undefined);

export const ChatStateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedConversation, setSelectedConversation] = useState<ConversationPreview | null>(null);

  // Use useCallback to ensure the function reference is stable unless needed
  const selectConversation = useCallback((conversation: ConversationPreview | null) => {
    setSelectedConversation(conversation);
  }, []);

  return (
    <ChatStateContext.Provider value={{ selectedConversation, selectConversation }}>
      {children}
    </ChatStateContext.Provider>
  );
};

// Custom hook for easy access
export const useChatState = () => {
  const context = useContext(ChatStateContext);
  if (context === undefined) {
    throw new Error('useChatState must be used within a ChatStateProvider');
  }
  return context;
};