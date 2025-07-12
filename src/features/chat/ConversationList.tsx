import React, { useMemo, useRef, useState, useCallback, useEffect } from 'react';
import { useConversations } from './useConversations';
import { usePresence } from '../../contexts/PresenceContext';
import { Input, Skeleton, Card, Badge, Avatar, Button, Chip, Image } from '@heroui/react';
import { useNavigate } from 'react-router-dom';
import { MagnifyingGlassIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid';
import { ConversationPreview } from '../../types';
import { cn } from '../../lib/utils';

interface ConversationListProps {
  onSelectConversation: (conversation: ConversationPreview) => void; // This will trigger navigation
  selectedConversationId?: number | null;
}

// --- NEW: Horizontal Online User List Component ---
const OnlineUserList: React.FC<{
  onlineUsers: Set<string>;
  conversations: ConversationPreview[];
  onSelectConversation: (conversation: ConversationPreview) => void;
}> = ({ onlineUsers, conversations, onSelectConversation }) => {
  const scrollContainerRef = useRef<HTMLUListElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  // Determine which list to show: online users first, or recent chats as a fallback.
  const activeConversations = useMemo(() => {
    const onlineConvos = conversations.filter(c => !c.is_group && c.other_participant_id && onlineUsers.has(c.other_participant_id));
    if (onlineConvos.length > 0) {
      return onlineConvos;
    }
    // Fallback to the 3 most recent conversations if no one is online
    return conversations.slice(0, 3);
  }, [onlineUsers, conversations]);
  
  // Don't render the section if there's nothing to show
  if (activeConversations.length === 0) {
    return null;
  }

  const updateArrowVisibility = useCallback(() => {
    const container = scrollContainerRef.current;
    if (container) {
      const atStart = container.scrollLeft === 0;
      const atEnd = Math.abs(container.scrollWidth - container.scrollLeft - container.clientWidth) < 1;
      const hasOverflow = container.scrollWidth > container.clientWidth;
      
      setShowLeftArrow(!atStart && hasOverflow);
      setShowRightArrow(!atEnd && hasOverflow);
    }
  }, []);

  useEffect(() => {
    updateArrowVisibility();
    // Re-check when the list changes
    const timer = setTimeout(updateArrowVisibility, 100);
    return () => clearTimeout(timer);
  }, [activeConversations, updateArrowVisibility]);

  const handleScroll = () => {
    updateArrowVisibility();
  };
  

  const scroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (container) {
      const scrollAmount = container.clientWidth * 0.8;
      container.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="relative h-fit w-full">
      
      {/* Left Arrow Button */}
      <Button isIconOnly size="sm" variant="flat"
        className={cn("absolute left-0 top-1/2 -translate-y-1/2 z-10 rounded-full shadow-md transition-opacity", showLeftArrow ? 'opacity-100' : 'opacity-0 pointer-events-none')}
        onPress={() => scroll('left')}
      >
        <ChevronLeftIcon className="w-5 h-5"/>
      </Button>

      <ul ref={scrollContainerRef} onScroll={handleScroll} className="flex items-center justify-between gap-4 px-2 :overflow-auto scroll-smooth hide-scrollbar">
        {activeConversations.map(convo => (
          <li key={convo.conversation_id} className="flex-shrink-0 overflow-visible">
            <div className='active:scale-95 transition-transform duration-150 cursor-pointer'>
             <Image
              isBlurred
              onClick={() => onSelectConversation(convo)}
              alt='user avatar'
              radius='full'
              classNames={{
                 blurredImg: [
                  "blur-md",
                   "top-1",
                   "-left-1",
                   "opacity-40",
                   "scale-80",
                 ],
              }}
              src={convo.display_avatar || '/profile/avatar.jpg'}
              width={60}
              height={60}
            /> 
            <p className="text-xs text-base-content/70 w-full text-center">{convo.display_name}</p>
            </div>
          </li>
        ))}
      </ul>

      {/* Right Arrow Button */}
      <Button isIconOnly size="sm" variant="flat"
        className={cn("absolute right-0 top-1/2 -translate-y-1/2 z-10 rounded-full shadow-md transition-opacity", showRightArrow ? 'opacity-100' : 'opacity-0 pointer-events-none')}
        onPress={() => scroll('right')}
      >
        <ChevronRightIcon className="w-5 h-5"/>
      </Button>
    </div>
  );
};

// --- Main Conversation List Component ---
const ConversationItemSkeleton: React.FC = () => ( 
  <li className="p-1">
    <Card shadow="none" className="w-full bg-transparent hover:bg-base-200/50">
        <div className="flex items-center">
            <Skeleton className="rounded-full">
                <div className="h-10 w-10 rounded-full bg-default-300" />
            </Skeleton>
            <div className="ml-3 space-y-2 flex-grow">
                <Skeleton className="w-3/5 rounded-lg">
                    <div className="h-3 w-3/5 rounded-lg bg-default-200" />
                </Skeleton>
                <Skeleton className="w-4/5 rounded-lg">
                    <div className="h-3 w-4/5 rounded-lg bg-default-200" />
                </Skeleton>
            </div>
        </div>
    </Card>
  </li>
);

function formatMessageDate(dateString?: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    return isToday ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : date.toLocaleDateString([], { day: 'numeric', month: 'short' });
}

export const ConversationList: React.FC<ConversationListProps> = ({ onSelectConversation, selectedConversationId }) => {
  const { conversations, loading, error, searchQuery, setSearchQuery } = useConversations();
  const { onlineUsers } = usePresence();
  const navigate = useNavigate();

  // Check if we're currently searching
  const isSearching = searchQuery.trim().length > 0;

  return (
    <div className="w-full p-2 h-full flex flex-col space-y-3">
       <h2 className="w-full text-2xl font-bold px-3 pt-3 sticky top-0 text-warning z-10">Chats</h2>
       <div className="px-1">
        <Input
          size='sm' variant='faded' radius='full' color='warning' placeholder="Search chats..."
          className="w-full" isClearable value={searchQuery}
          onValueChange={setSearchQuery}
          startContent={<MagnifyingGlassIcon className='w-5 h-5'/>}
        />
       </div>

      {/* --- RENDER THE NEW ONLINE USER LIST (only when not searching) --- */}
      {!loading && !isSearching && conversations.length > 0 && (
          <OnlineUserList 
            onlineUsers={onlineUsers}
            conversations={conversations}
            onSelectConversation={onSelectConversation}
          />
      )}
      
      {/* Only show divider when online user list is visible */}
      {!loading && !isSearching && conversations.length > 0 && (
        <> </>
      )}

      {error && <p className="text-danger-500 p-3 text-center">Error loading chats.</p>}
      {!error && (
        <div className="overflow-y-auto flex-grow">
          {loading && (
            <ul className='gap-2 p-1 overflow-visible'>
              {[...Array(5)].map((_, index) => (
                <ConversationItemSkeleton key={index} />
              ))}
            </ul>
          )}
          {!loading && conversations.length === 0 && (
            <div className='w-full flex flex-col items-center justify-center text-base-content gap-2 p-6 text-center'>
                <img src="/emtylist.png" alt="kitty" className='max-w-20' />
                <p>It's quiet... too quiet.</p>
                <Button onPress={() => navigate('/friends')}>Invite Friends</Button> 
            </div>
          )}
          {!loading && conversations.length > 0 && (
            <ul className="space-y-1">
              {conversations.map(convo => {
                const isDmAndOtherUserOnline = !convo.is_group && convo.other_participant_id && onlineUsers.has(convo.other_participant_id);
                const isSelected = convo.conversation_id === selectedConversationId;

                return (
                  <li key={convo.conversation_id} className="rounded-lg transition-colors duration-150 ease-in-out" onClick={() => onSelectConversation(convo)}>
                    <Card shadow='none' radius='lg' className={`w-full p-2 cursor-pointer border border-transparent active:scale-95 transition-all duration-50 ${isSelected ? 'bg-base-100/60' : 'bg-transparent hover:bg-base-200/50'}`}>
                      <div className="flex items-center space-x-3 w-full min-w-0">
                        <div className="flex-shrink-0 w-10 h-10">
                          <Badge content="" color="success" shape="circle" placement="bottom-right"
                            isInvisible={!isDmAndOtherUserOnline}
                            className={`border-2 ${isSelected ? 'border-base-100' : 'border-base-200'}`}
                          >
                            <Avatar src={convo.display_avatar || '/profile/avatar.jpg'} alt={convo.display_name || 'Chat'} size="md"/>
                          </Badge>
                        </div>
                        <div className="flex-grow gap-0 min-w-0">
                          <p className="font-semibold text-md truncate text-base-content">
                            {convo.display_name || 'Chat'} 
                          </p>
                          <p className="text-sm truncate text-base-content/70">
                            {convo.latest_message_content ? (convo.latest_message_content.startsWith('gqvlesfrcjmzadnzwgfy') ? '📷 Image' : convo.latest_message_content) : 'No messages yet...'}
                          </p>
                        </div>
                        <div className='flex flex-col min-w-14 justify-end items-end space-y-1'>
                          <p className='text-xs text-base-content/40'>
                            {formatMessageDate(convo.latest_message_created_at || '')}
                          </p>
                          {convo.unread_count > 0 && (
                            <Chip className='aspect-square' color='danger' size="sm">{convo.unread_count}</Chip>
                          )}
                        </div>
                      </div>
                    </Card>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};