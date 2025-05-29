import React, { useState, useEffect } from 'react';
import { useFriends, Profile } from './useFriends'; // Your existing hook
import { useConversations, ConversationPreview } from '../chat/useConversations'; // Adjust path
import { usePresence } from '../../contexts/PresenceContext'; // Adjust path to your PresenceContext
import { Button, Input, Card, Spinner, Avatar, Tabs, Tab, Chip } from '@heroui/react';
import { UserPlusIcon, MagnifyingGlassIcon, ChatBubbleLeftEllipsisIcon } from '@heroicons/react/24/solid'; // Added Chat icon

const FriendsPage: React.FC = () => {
  const {
    friends,
    outgoingRequests,
    loading: friendsLoading, // Renamed to avoid conflict
    error: friendsError,     // Renamed
    searchUsers,
    sendRequest,
  } = useFriends();

  const { conversations, loading: conversationsLoading } = useConversations(); // For finding chat IDs
  const { onlineUsers } = usePresence();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState<string | number>("add"); // Default to "add" tab

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setSearchResults([]);
    try {
        const results = await searchUsers(searchQuery);
        setSearchResults(results);
    } catch (searchError) {
        console.error("Search failed:", searchError);
    } finally {
        setIsSearching(false);
    }
  };

  const handleMessageFriend = (friend: Profile) => {
    if (conversationsLoading) {
        console.log("Conversations still loading, please wait.");
        // Optionally show a toast
        return;
    }
    // Find the DM conversation with this friend
    // Note: other_participant_id in ConversationPreview is the ID of the *other* user in the DM
    const dmConversation = conversations.find(
        (convo) => !convo.is_group && convo.other_participant_id === friend.id
    );

    if (dmConversation) {
        console.log(`Opening chat with ${friend.username}`);
          
        // NEXT STEP:
        // 1. Navigate to your ChatLayout, e.g., /chat
        // 2. Pass the dmConversation.conversation_id (or the whole dmConversation object)
        //    to ChatLayout so it can select and display this chat.
        //    This could be via URL params, route state, or a global state/context.
        // Example (if using a global state setter like selectConversation from a context):
        // selectConversation(dmConversation);
        // navigate('/chat'); // Assuming you use react-router or similar
        alert(`Found DM with ${friend.username}. Conversation ID: ${dmConversation.conversation_id}`);
    } else {
        console.warn('No existing DM found with ${friend.username || friend.id}.');
        // FUTURE: You might want an RPC to "get or create DM conversation" here
        // if one doesn't exist when clicking message.
        alert('No DM found with ${friend.username}. You might need a feature to create one on demand.');
    }
  };

  const renderUserCard = (
    user: Profile,
    actions: React.ReactNode,
    key?: string | number
  ) => {
    const isOnline = onlineUsers.has(user.id);
    return (
        <Card key={key || user.id} className="flex flex-row bg-base-200 items-center justify-between py-2.5 px-4 rounded-xl shadow-sm">
            <div className="flex items-center space-x-3 min-w-0">
                <div className="relative">
                    <Avatar src={user.avatar_url || '/avatar.png'} alt={user.username || 'user'} />
                    {isOnline && (
                        <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full ring-2 ring-base-200 bg-success-500" />
                    )}
                </div>
                <span className='truncate font-medium text-base-content'>{user.username || user.full_name || 'User'}</span>
            </div>
            <div className='flex-shrink-0'>
                {actions}
            </div>
        </Card>
    );
  };

  return (
    <div className="flex flex-col w-full max-w-4xl bg-base-100 mx-auto p-4 sm:p-6 gap-4">
      <Tabs
          aria-label="Friends Management Options"
          color="primary"
          variant="solid"
          radius="lg"
          className="w-full"
          selectedKey={activeTab}
          onSelectionChange={setActiveTab}
      >
        {/* ================== Tab 1: Add Friend ================== */}
        <Tab key="add" title="Add Friend">
            <div className="p-4 min-h-[300px]">
                <h3 className="text-lg font-semibold mb-4 text-center text-base-content">Find New Friends</h3>
                <form onSubmit={handleSearch} className="flex space-x-2 mb-6 max-w-lg mx-auto">
                    <Input
                        radius='lg'
                        placeholder="Search by username..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="flex-grow"
                        startContent={<MagnifyingGlassIcon className='w-5 h-5 text-default-400'/>}
                    />
                    <Button isIconOnly radius='lg' type="submit" variant="solid" color="primary" isLoading={isSearching} disabled={isSearching || !searchQuery.trim()}>
                        {!isSearching && <MagnifyingGlassIcon className='w-6 h-6 shrink-0' />}
                    </Button>
                </form>
                {isSearching && <div className='flex justify-center p-8'><Spinner /></div>}
                {!isSearching && searchResults.length > 0 && (
                    <ul className="space-y-3">
                        {searchResults.map(userProfile => // Renamed to avoid conflict with 'user' from useAuth
                            renderUserCard(
                                userProfile,
                                <Button isIconOnly radius='md' size="sm" variant="flat" color="success" onPress={() => sendRequest(userProfile.id)} aria-label="Add Friend">
                                    <UserPlusIcon className='w-6 h-6 shrink-0' />
                                </Button>
                            )
                        )}
                    </ul>
                )}
                {!isSearching && searchQuery && searchResults.length === 0 && (
                    <p className="mt-6 text-center text-base-content/60">No users found matching "{searchQuery}".</p>
                )}
            </div>
        </Tab>

        {/* ================== Tab 2: Friends List ================== */}
        <Tab key="friends" title={
            <div className="flex items-center space-x-2">
              <span>Friends</span>
              <Chip size="sm" variant="shadow" className='aspect-square' color="primary">
                {friends.length}
              </Chip>
            </div>
          }>
            <div className="p-4 min-h-[300px]">
                {friendsLoading && <div className='flex justify-center p-8'><Spinner /></div>}
                {friendsError && <p className="text-danger-500 text-center">Error loading friends.</p>}
                {!friendsLoading && !friendsError && (
                    <ul className="space-y-3">
                        {friends.length === 0 && <li className="text-base-content/60 text-center p-8">Your friends list is empty.</li>}
                        {friends.map(friend =>
                           renderUserCard(
                               friend,
                               <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  color="primary" 
                                  onPress={() => handleMessageFriend(friend)}
                                  startContent={<ChatBubbleLeftEllipsisIcon className="w-5 h-5"/>}
                                >
                                  Message
                                </Button>
                           )
                        )}
                    </ul>
                )}
            </div>
        </Tab>

        {/* ================== Tab 3: Outgoing Requests ================== */}
        <Tab key="outgoing"
        title={
            <div className="flex items-center space-x-2">
              <span>Outgoing</span>
              <Chip size="sm" variant="shadow" className='aspect-square' color="warning">
                {outgoingRequests.length}
              </Chip>
            </div>
          }
        >
            <div className="p-4 min-h-[300px]">
                {friendsLoading && <div className='flex justify-center p-8'><Spinner size="sm" /></div>}
                {!friendsLoading && (
                    <ul className="space-y-3">
                        {outgoingRequests.length === 0 && <li className="text-base-content/60 text-center p-8">No outgoing requests.</li>}
                        {outgoingRequests.map(req =>
                            renderUserCard(
                                req.friend,
                                <Button size="sm" variant="bordered" color="default" isDisabled>Pending</Button>,
                                req.id
                            )
                        )}
                    </ul>
                )}
            </div>
        </Tab>
      </Tabs>
    </div>
  );
};


export default FriendsPage;