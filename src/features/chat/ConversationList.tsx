import React from 'react';
import { useConversations } from './useConversations';
import { usePresence } from '../../contexts/PresenceContext';
import { Input, Skeleton, Card, Badge, Avatar, Button, Chip } from '@heroui/react';
import { useNavigate } from 'react-router-dom';
import { MagnifyingGlassIcon } from '@heroicons/react/24/solid';
import { ConversationPreview } from '../../types'; // Your existing type

interface ConversationListProps {
  onSelectConversation: (conversation: ConversationPreview) => void; // This will trigger navigation
  selectedConversationId?: number | null;
}

const ConversationItemSkeleton: React.FC = () => ( 
  <li className="p-1">
    <Card shadow="none" className=" w-full bg-transparent hover:bg-base-200/50">
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

  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  return isToday
    ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : date.toLocaleDateString([], { day: 'numeric', month: 'short' });
}

export const ConversationList: React.FC<ConversationListProps> = ({ onSelectConversation, selectedConversationId }) => {
  const { 
    conversations, 
    loading, 
    error,
    searchQuery,
    setSearchQuery 
  } = useConversations();

  const { onlineUsers } = usePresence();
  const navigate = useNavigate();

  return (
    <div className="w-full sm:border-r sm:border-base-300 p-2 h-full flex space-y-3 flex-col">
      {/* ... (Keep Header and Search/Filter UI) ... */}
       <h2 className="w-full text-2xl font-bold p-3 sticky top-0 z-10">Chats</h2>
       <Input
         size='sm'
         variant='flat'
         radius='full'
         placeholder="Search chats..."
         className="w-full"
         isClearable
         value={searchQuery} // Control the input value
         onValueChange={setSearchQuery} // Update state on change
         startContent={<MagnifyingGlassIcon className='w-5 h-5 text-default-400'/>}
       />
      <div className='flex-row w-full space-x-2'>
        <Button variant='flat' size='sm' radius='full' color='default' className='w-fit font-semibold' >all</Button>
        <Button variant='flat' size='sm' radius='full' color='default' className='w-fit font-semibold' >groups</Button>
        <Button variant='flat' size='sm' radius='full' color='default' className='w-fit font-semibold' >unread</Button>
      </div>

      {error && <p className="text-danger-500 p-3 text-center">Error loading chats.</p>}
      {!error && (
        <div className="overflow-y-auto flex-grow">
          {loading && (
            <ul className='space-y-2 p-1 overflow-visible'>
              {[...Array(5)].map((_, index) => (
                <ConversationItemSkeleton key={index} />
              ))}
            </ul>
          )}
          {!loading && conversations.length === 0 && (
            <>
              <div className='w-full flex flex-col items-center justify-center text-base-content p-6 text-center'>
                <p>no one to chat with yet</p>
                <Button onPress={() => navigate('/friends')}>invite friends</Button> 
              </div>
            </>
          )}
          {!loading && conversations.length > 0 && (
            <ul className="space-y-1">
              {conversations.map(convo => {
                const isDmAndOtherUserOnline = !convo.is_group && convo.other_participant_id && onlineUsers.has(convo.other_participant_id);
                const isSelected = convo.conversation_id === selectedConversationId;

                const avatarComponent = (
                  <Avatar
                    src={convo.display_avatar || '/avatar.png'}
                    alt={convo.display_name || 'Chat'}
                    size="md"
                  />
                );

                return (
                  <li
                    key={convo.conversation_id}
                    className={`rounded-lg transition-colors duration-150 ease-in-out`}
                    onClick={() => onSelectConversation(convo)} // <--- Just call the prop
                  >
                    {/* ... (Keep Card and inner layout) ... */}
                    <Card shadow='none' radius='lg' className={`w-full p-2 cursor-pointer border border-opacity-0 border-base-300 ${isSelected ? 'border border-opacity-100 bg-base-200' : 'bg-transparnt'}`}>
                      <div className="flex items-center space-x-3 w-full min-w-0">
                        <div className="flex-shrink-0 w-10 h-10">
                          <Badge
                            content=""
                            color="success"
                            shape="circle"
                            placement="bottom-right"
                            isInvisible={!isDmAndOtherUserOnline}
                            className={`border-2  ${isSelected ? 'border-base-200' : 'border-base-100'}`}
                          >
                            {avatarComponent}
                          </Badge>
                        </div>
                        <div className="flex-grow gap-0 min-w-0">
                          <div className="flex justify-between items-center"> {/* NEW WRAPPER */}
                            <p className={`font-semibold text-md truncate`}>
                              {convo.display_name || 'Chat'}
                            </p>
                            
                          </div>
                          <p className={`text-sm truncate`}>
                            {'last: ' + convo.latest_message_content || 'No messages yet...'}
                          </p>
                          
                          
                        </div>
                        <div className='flex flex-col justify-end items-end space-y-1'>
                          <p className='text-xs text-base-content/40 self-start'>
                            {formatMessageDate(convo.latest_message_created_at || '')}
                          </p>
                          {/* NEW: Unread count badge */}
                            {convo.unread_count > 0 && (
                              <Chip className='aspect-squire' size="sm">{convo.unread_count}</Chip>
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
