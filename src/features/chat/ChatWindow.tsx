import React, { useState, useEffect, useRef, useCallback } from 'react'; // Added useCallback
import { useMessages } from './useMessages'; // Adjust path
import { ConversationPreview } from './useConversations'; // Adjust path
import { Button, Input, Avatar, Skeleton } from '@heroui/react'; // Removed Image, Spinner, as Avatar and Skeleton cover them
import { IconSend, IconArrowDown } from '@tabler/icons-react';
import { ArrowDownIcon, PaperAirplaneIcon } from '@heroicons/react/24/solid';
import { useAuth } from '../../contexts/AuthContext'; // Adjust path
import { useSoundSettingsStore } from '../../lib/useSoundSettingsStore'; // Your sound store path

interface ChatWindowProps {
  conversation: ConversationPreview;
}

const MessageSkeleton: React.FC<{ isOwnMessage?: boolean }> = ({ isOwnMessage }) => (
  <div className={`flex mb-4 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
    <div className={`flex items-end max-w-xs md:max-w-md ${isOwnMessage ? 'flex-row-reverse' : ''}`}>
      <Skeleton className="rounded-full flex-shrink-0">
        <div className={`w-8 h-8 rounded-full bg-default-300 ${isOwnMessage ? 'ml-2' : 'mr-2'}`} />
      </Skeleton>
      <div className={`p-3 rounded-lg space-y-1.5 ${isOwnMessage ? 'bg-default-200' : 'bg-default-200'}`}>
        <Skeleton className="w-32 rounded-lg">
          <div className="h-3 w-32 rounded-lg bg-default-300" />
        </Skeleton>
        <Skeleton className="w-24 rounded-lg">
          <div className="h-3 w-24 rounded-lg bg-default-300" />
        </Skeleton>
      </div>
    </div>
  </div>
);

export const ChatWindow: React.FC<ChatWindowProps> = ({ conversation }) => {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const { messages, loading, sendMessage, loadMoreMessages, hasMore } = useMessages(conversation.conversation_id);
  const [newMessage, setNewMessage] = useState('');
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);

  // --- Typing Sound Logic ---
  const { typingSoundEnabled, typingSoundDelay } = useSoundSettingsStore();
  const soundsRef = useRef<HTMLAudioElement[]>([]);
  const lastSoundTimeRef = useRef(0);
  const soundIndexRef = useRef(0); // To cycle through sounds

  // Initialize sounds once
  useEffect(() => {
    // Ensure Audio objects are only created client-side
    if (typeof window !== "undefined") {
      soundsRef.current = [
        new Audio("/meow-1.mp3"), // Ensure these paths are correct (e.g., in your /public folder)
        new Audio("/meow-2.mp3"),
        new Audio("/meow-3.mp3")
      ];
      // Optional: preload sounds and set initial volume
      soundsRef.current.forEach(sound => {
        sound.load(); // Prepares the audio file for playing
        sound.volume = 0.3; // Adjust volume as needed (0.0 to 1.0)
      });
    }
  }, []); // Empty dependency array means this runs once on mount

  const playTypingSound = useCallback(() => {
    if (typingSoundEnabled && soundsRef.current.length > 0) {
      const now = Date.now();
      // typingSoundDelay is used here as a throttle between sound plays
      if (now - lastSoundTimeRef.current > typingSoundDelay) {
        const soundToPlay = soundsRef.current[soundIndexRef.current];
        if (soundToPlay) {
          soundToPlay.currentTime = 0; // Rewind to start
          soundToPlay.play().catch(error => {
            // Audio play can be interrupted or fail, especially if user hasn't interacted with the page
            console.error("Error playing typing sound:", error);
          });
          lastSoundTimeRef.current = now;
          soundIndexRef.current = (soundIndexRef.current + 1) % soundsRef.current.length;
        }
      }
    }
  }, [typingSoundEnabled, typingSoundDelay]); // Re-create if settings change

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    playTypingSound(); // Play sound on input change
  };
  // --- End Typing Sound Logic ---

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      const isScrolledToBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 100;
      if (isScrolledToBottom) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        setShowScrollToBottom(false);
      } else if (messages.length > 0) { // Only show if there are messages to scroll up from
        setShowScrollToBottom(true);
      }
    }
  }, [messages]);

  const handleScroll = () => {
    const container = messagesContainerRef.current;
    if (container) {
      const isNearBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 200;
      setShowScrollToBottom(!isNearBottom);
      if (isNearBottom && loading && messages.length > 0) { // Hide if scrolled to bottom during initial load more
        setShowScrollToBottom(false);
      }
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !userId) return;
    const success = await sendMessage(newMessage);
    if (success) {
      setNewMessage('');
      // Ensure DOM updates before scrolling, requestAnimationFrame can also be used
      setTimeout(scrollToBottom, 0);
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e as unknown as React.FormEvent); // Cast for form submission context
    }
    // You could also trigger playTypingSound() here for specific keys if preferred
    // but onChange generally covers typing well.
  };

  return (
    <div className="w-full flex flex-col h-full relative">
      {/* Header */}
      <div className="p-3 border-b border-base-300 flex items-center space-x-3 sticky top-0 z-10">
        <Avatar
            src={conversation.display_avatar || '/avatar.png'}
            alt={conversation.display_name || 'Chat'}
            size="md"
        />
        <div className="flex flex-col">
            <h2 className="text-base font-semibold text-base-content">{conversation.display_name}</h2>
        </div>
      </div>

      {/* Messages Area */}
      <div ref={messagesContainerRef} onScroll={handleScroll} className="flex-grow p-4 overflow-y-auto bg-base-50 space-y-4">
          {loading && messages.length === 0 && (
            <>
              <MessageSkeleton />
              <MessageSkeleton isOwnMessage />
              <MessageSkeleton />
            </>
          )}
          {hasMore && !loading && (
              <div className="text-center my-2">
                  <Button variant="light" color="default" onPress={loadMoreMessages} isLoading={loading} size="sm">
                    Load More Messages
                  </Button>
              </div>
          )}
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex ${msg.sender_id === userId ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex items-end max-w-sm md:max-w-lg ${msg.sender_id === userId ? 'flex-row-reverse' : 'flex-row'}`}>
               <Avatar
                 src={msg.sender?.avatar_url || '/avatar.png'}
                 alt={msg.sender?.username || 'user'}
                 size="sm"
                 className={`flex-shrink-0 ${msg.sender_id === userId ? 'ml-2' : 'mr-2'}`}
               />
               <div
                 className={`px-3.5 py-2.5 rounded-2xl shadow-sm ${
                   msg.sender_id === userId
                     ? 'bg-primary-500 text-white rounded-br-sm'
                     : 'bg-base-200 text-base-content border border-base-300 rounded-bl-sm'
                 }`}
               >
                  <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                  <p className={`text-xs mt-1.5 text-right ${msg.sender_id === userId ? 'text-white/60' : 'text-base-content/60'}`}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                  </p>
               </div>
            </div>
          </div>
        ))}
         <div ref={messagesEndRef} />
      </div>

       {showScrollToBottom && (
        <Button
          isIconOnly
          variant="flat"
          color="default"
          //onpress={scrollToBottom}
          className="absolute bottom-20 right-6 z-20 rounded-full shadow-lg bg-base-100 hover:bg-base-200"
          aria-label="Scroll to bottom"
        >
          <IconArrowDown size={20} />
        </Button>
      )}

      {/* Input Area */}
      <div className="p-3 border-t border-base-300 bg-base-100 sticky bottom-0">
        <form onSubmit={handleSend} className="flex items-center space-x-2">
          <Input
            placeholder="Type a message..."
            value={newMessage}
            onChange={handleInputChange} // Use the new handler
            onKeyDown={handleInputKeyDown} // Keep Enter key functionality separate
            fullWidth
            size="lg"
            className="flex-grow"
            autoComplete="off"
            radius='lg'
          />
          <Button
            type="submit"
            isIconOnly
            color="primary"
            size="lg"
            variant="solid"
            isDisabled={!newMessage.trim() || loading}
            aria-label="Send message"
            radius='lg'
            className="flex-shrink-0"
            isLoading={loading}
          >
            <PaperAirplaneIcon className='w-6 h-6' />
          </Button>
        </form>
      </div>
    </div>
  );
};