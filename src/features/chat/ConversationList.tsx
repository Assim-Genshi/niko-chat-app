import React from 'react';
import { useConversations, ConversationPreview } from './useConversations'; // Adjust path
import { User, Spinner, Skeleton, Card } from '@heroui/react'; // Added Skeleton

interface ConversationListProps {
  onSelectConversation: (conversation: ConversationPreview) => void;
}

const ConversationItemSkeleton: React.FC = () => (
  <li className="p-3 flex items-center space-x-3">
    <Skeleton className="rounded-full">
      <div className="h-10 w-10 rounded-full bg-default-300" />
    </Skeleton>
    <div className="space-y-2 flex-grow">
      <Skeleton className="w-3/5 rounded-lg">
        <div className="h-3 w-3/5 rounded-lg bg-default-200" />
      </Skeleton>
      <Skeleton className="w-4/5 rounded-lg">
        <div className="h-3 w-4/5 rounded-lg bg-default-200" />
      </Skeleton>
    </div>
  </li>
);

export const ConversationList: React.FC<ConversationListProps> = ({ onSelectConversation }) => {
  const { conversations, loading, error } = useConversations();

  return (
    <div className="min-w-60 md:min-w-72 lg:min-w-80 sm:border-r sm:border-base-300 p-2 h-full flex flex-col">
      <h2 className="text-xl font-semibold p-3 sticky top-0 z-10">Chats</h2>
      {error && <p className="text-danger-500 p-3 text-center">Error loading chats.</p>}
      {!error && (
        <div className="overflow-y-auto flex-grow">
          {loading && (
            <ul className="space-y-2 p-1 overflow-visible">
              {[...Array(5)].map((_, index) => (
                <ConversationItemSkeleton key={index} />
              ))}
            </ul>
          )}
          {!loading && conversations.length === 0 && (
            <li className="text-base-content/60 text-center list-none overflow-visible">No conversations yet.</li>
          )}
          {!loading && conversations.length > 0 && (
            <ul className="space-y-1 p-1">
              {conversations.map(convo => (
                <li
                  key={convo.conversation_id}
                  // **** UPDATED THIS LINE ****
                  className="cursor-pointer flex items-center overflow-visible"
                  onClick={() => onSelectConversation(convo)}
                >
                  <Card shadow='sm' className='w-full p-3'>
                    <User
                    avatarProps={{
                      src: convo.display_avatar || '/avatar.png',
                      alt: convo.display_name || 'Chat',
                      size: 'md',
                      className: '', // Keeps avatar size fixed
                    }}
                    description={
                      <span className="text-sm text-neutral-500 truncate">
                        Last: {convo.latest_message_content || 'No messages yet...'}
                      </span>
                    }
                    name={
                      <span className="font-medium text-base-content truncate">
                        {convo.display_name || 'Chat'}
                      </span>
                    }
                    // **** UPDATED THIS LINE ****
                    // Use flex-grow to fill width and min-w-0 to allow truncation
                    className="w-fit min-w-0"
                  />
                  </Card>
                  
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};