import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useMessages } from './useMessages';
import { ConversationPreview } from './useConversations';
import { Button, Input, Avatar, Skeleton, ScrollShadow } from '@heroui/react';
import { ArrowDownIcon, PaperAirplaneIcon } from '@heroicons/react/24/solid';
import { useAuth } from '../../contexts/AuthContext';
import { useSoundSettingsStore } from '../../lib/useSoundSettingsStore';
import { usePresence } from '../../contexts/PresenceContext';
import { useProfilePreview } from '../../contexts/ProfilePreviewContext';
import { Profile } from '../../types';
import { supabase } from '../../supabase/supabaseClient';


interface ChatWindowProps {
  conversation: ConversationPreview;
}

const MessageSkeleton: React.FC<{ isOwnMessage?: boolean }> = ({ isOwnMessage }) => (
  // ... (No changes to this component)
  <div className={`flex mb-4 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
    <div className={`flex items-end space-x-2 max-w-xs md:max-w-md ${isOwnMessage ? 'flex-row-reverse' : ''}`}>
      <Skeleton className="rounded-full w-fit h-fit flex-shrink-0">
        <div className={`w-8 h-8 aspect-square rounded-full shrink-0 bg-default-300`} />
      </Skeleton>
      <div className={`p-3 rounded-2xl space-y-1.5 ${isOwnMessage ? 'bg-default-200 rounded-br-sm' : 'rounded-bl-sm bg-default-200'}`}>
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
  const prevScrollHeightRef = useRef<number | null>(null);
  
  // A ref to track if the initial scroll for this conversation has been done.
  const initialScrollDoneRef = useRef(false);

  // ... (other hooks like useProfilePreview, usePresence are unchanged)
  const { viewProfile } = useProfilePreview();
  const { onlineUsers } = usePresence();

  // ... (handleHeaderClick and sound logic are unchanged)
    const handleHeaderClick = async () => {
    // ...
    if (conversation.is_group || !conversation.other_participant_id) {
      if (conversation.is_group) {
          alert(`Group profile previews for '${conversation.group_name || 'Group'}' not implemented yet.`);
      }
      return;
    }

    const { data: fullProfile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', conversation.other_participant_id)
        .single();

    if (fullProfile) {
        viewProfile(fullProfile as Profile);
    } else {
        console.warn("Could not fetch full profile for preview, using partial info:", error);
        const partialProfile: Profile = {
          id: conversation.other_participant_id,
          username: conversation.display_name,
          full_name: conversation.display_name,
          avatar_url: conversation.display_avatar,
          banner_url: null,
          description: null,
          chatamata_id: null,
          joined_at: null,
          updated_at: null,
          profile_setup_complete: false,
        };
        viewProfile(partialProfile);
    }
  };

  const isOtherUserOnline = !conversation.is_group && conversation.other_participant_id && onlineUsers.has(conversation.other_participant_id);
  
  const { typingSoundEnabled, typingSoundDelay } = useSoundSettingsStore();
  const soundsRef = useRef<HTMLAudioElement[]>([]);
  const lastSoundTimeRef = useRef(0);
  const soundIndexRef = useRef(0);

  useEffect(() => {
    if (typeof window !== "undefined") {
      soundsRef.current = [
        new Audio("/meow-1.mp3"),
        new Audio("/meow-2.mp3"),
        new Audio("/meow-3.mp3")
      ];
      soundsRef.current.forEach(sound => {
        sound.load();
        sound.volume = 0.3;
      });
    }
  }, []);

  const playTypingSound = useCallback(() => {
    if (typingSoundEnabled && soundsRef.current.length > 0) {
      const now = Date.now();
      if (now - lastSoundTimeRef.current > typingSoundDelay) {
        const soundToPlay = soundsRef.current[soundIndexRef.current];
        if (soundToPlay) {
          soundToPlay.currentTime = 0;
          soundToPlay.play().catch(error => console.error("Error playing typing sound:", error));
          lastSoundTimeRef.current = now;
          soundIndexRef.current = (soundIndexRef.current + 1) % soundsRef.current.length;
        }
      }
    }
  }, [typingSoundEnabled, typingSoundDelay]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    playTypingSound();
  };

  // --- CORRECTED SCROLL LOGIC ---

  // Effect 1: Handles the INITIAL scroll when the component first appears.
  useEffect(() => {
    // When the component first mounts (forced by the key prop in the parent),
    // this ref is false. We wait for the initial message load to complete.
    if (!loading && messages.length > 0 && !initialScrollDoneRef.current) {
      // Use 'auto' for an instant scroll, which is best for initial load.
      scrollToBottom('auto');
      // Mark the initial scroll as done for this conversation view.
      initialScrollDoneRef.current = true;
    }
  }, [loading, messages.length]); // Runs when loading state or messages change.


  // Effect 2: Handles scrolling for subsequent updates (new messages, loading old ones).
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
  
    // Logic to preserve scroll position when loading *older* messages.
    if (prevScrollHeightRef.current !== null) {
      container.scrollTop = container.scrollHeight - prevScrollHeightRef.current;
      prevScrollHeightRef.current = null; // Reset after adjusting.
    } else if (initialScrollDoneRef.current) {
      // For NEW messages arriving live, only scroll if the user is already near the bottom.
      const isNearBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 200; // A bit of tolerance
      if (isNearBottom) {
        scrollToBottom('smooth');
      }
    }
  }, [messages]); // This effect runs only when the messages array itself changes.


  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    // Logic for showing/hiding the "scroll to bottom" button
    const isNearBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 200;
    setShowScrollToBottom(!isNearBottom);

    // Logic for infinite scroll (loading more messages)
    if (container.scrollTop === 0 && hasMore && !loading) {
      prevScrollHeightRef.current = container.scrollHeight;
      loadMoreMessages();
    }
  }, [hasMore, loading, loadMoreMessages]);


  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !userId) return;
    const success = await sendMessage(newMessage);
    if (success) {
      setNewMessage('');
      setTimeout(() => scrollToBottom('auto'), 0);
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e as unknown as React.FormEvent);
    }
  };

  // --- JSX RENDER ---
  // The entire return (...) part is exactly the same as before.
  // I won't paste it again to keep this short.
  return (
    <div className="w-full flex flex-col h-full relative">
      {/* Header */}
      <div
        onClick={handleHeaderClick}
        className="p-3 flex items-center space-x-3 sticky top-0 z-10 cursor-pointer hover:bg-base-200/50 transition-colors"
      >
        <div className='relative'>
             <Avatar
                src={conversation.display_avatar || '/avatar.png'}
                alt={conversation.display_name || 'Chat'}
                size="md"
            />
        </div>
        <div className="flex flex-col">
            <h2 className="text-base font-semibold text-base-content">{conversation.display_name}</h2>
            {isOtherUserOnline ? <p className='text-xs text-green-500'>Online</p> : <p className='text-xs text-gray-400'>Offline</p> }
        </div>
      </div>

      {/* Messages Area */}
      <ScrollShadow ref={messagesContainerRef} onScroll={handleScroll} className='h-full' size={60}>
        <div className="flex-grow p-4 overflow-y-auto bg-base-50 space-y-4">
            <p className='w-full text-xs text-center text-base-content/50'>This is the beginning of your conversation with {conversation.display_name}</p>
          {loading && messages.length === 0 && (
            <>
              <MessageSkeleton />
              <MessageSkeleton isOwnMessage />
              <MessageSkeleton />
            </>
          )}
          {hasMore && ( // Removed !loading to prevent the button from disappearing during load
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
          onPress={() => scrollToBottom('smooth')}
          className="absolute bottom-20 right-6 z-20 rounded-full shadow-lg shadow-base-content bg-base-100 text-base-content border-t border-base-300/80"
          aria-label="Scroll to bottom"
        >
          <ArrowDownIcon className='w-4 h-4' />
        </Button>
      )}
      </ScrollShadow>

      {/* Input Area */}
      <div className="p-3 bg-base-100 sticky bottom-0">
        <form onSubmit={handleSend} className="flex items-center space-x-2">
          <Input
            placeholder="Type a message..."
            value={newMessage}
            onChange={handleInputChange}
            onKeyDown={handleInputKeyDown}
            fullWidth
            size="md"
            className="flex-grow"
            autoComplete="off"
            radius='full'
          />
          <Button
            type="submit"
            isIconOnly
            color="primary"
            size="sm"
            variant="solid"
            isDisabled={!newMessage.trim()}
            aria-label="Send message"
            radius='full'
            className="flex-shrink-0"
          >
            <PaperAirplaneIcon className='w-4 h-4' />
          </Button>
        </form>
      </div>
    </div>
  );
};