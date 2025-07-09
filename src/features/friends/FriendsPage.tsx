import React, { useState, useEffect } from 'react';
import { useFriends } from './useFriends'; // Your existing hook
import { useConversations } from '../chat/useConversations'; // Adjust path
import { usePresence } from '../../contexts/PresenceContext'; // Adjust path to your PresenceContext
import { Button, Input, User, Spinner, Avatar, Image, Tabs, Tab, Chip, addToast } from '@heroui/react';
import { UserPlusIcon, MagnifyingGlassIcon, ChatBubbleOvalLeftIcon } from '@heroicons/react/24/solid'; // Added Chat icon
import { useNavigate } from 'react-router-dom'; // <--- Import useNavigate
import { useProfilePreview } from '../../contexts/ProfilePreviewContext'; // <--- IMPORT
import { Profile } from '@/types';
import { PlanBadge } from '../../components/PlanBadge'; // Import it

const FriendsPage: React.FC = () => {
    const {
        friends,
        outgoingRequests,
        loading: friendsLoading,
        error: friendsError,
        searchUsers,
        sendRequest,
    } = useFriends();

    const { conversations, loading: conversationsLoading } = useConversations();
    const { onlineUsers } = usePresence();
    const navigate = useNavigate(); // <--- Use navigate hook
    const { viewProfile } = useProfilePreview();

    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Profile[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [activeTab, setActiveTab] = useState<string | number>("add");

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
            alert("Conversations loading...");
            return;
        }
        const dmConversation = conversations.find(
            (convo) => !convo.is_group && convo.other_participant_id === friend.id
        );

        if (dmConversation) {
            navigate(`/chat/${dmConversation.conversation_id}`);
        } else {
            addToast({
                title: "Conversation Not Found",
                description: `You can start a new chat with ${friend.username} from their profile.`,
                color: "default"
            });
        }
    };

    const renderUserCard = (
        user: Profile, // This Profile type comes from useFriends (which should be the comprehensive one)
        actions: React.ReactNode,
        key?: string | number
    ) => {
        const isOnline = onlineUsers.has(user.id);
        const handleCardClick = () => {
            console.log('FriendsPage: Clicking to view profile:', user);
            if (user && user.id) {
                viewProfile(user); // This 'user' object MUST be the full Profile type
            } else {
                console.error("FriendsPage: Invalid user data for profile preview", user);
            }
        };
        return (
            <div key={key || user.id}  className="relative coursor-pointer w-full max-w-60 gap-2 bg-base-200 border border-base-300 flex flex-col items-center justify-start p-2 rounded-3xl shadow-lg">

                {/* avatar */}
                <div onClick={handleCardClick} className="relative w-full cursor-pointer hover:opacity-80">
                    <Image src={user.avatar_url || '/profile/avatar.jpg'} className='w-full aspect-squire object-cover rounded-2xl shadow-xl' />
                </div>
                {/* content box */}
                <div className='w-full flex flex-col items-start p-2'>
                    <div className='flex flex-row w-full gap-2 items-center'>
                        <p className="font-bold text-2xl">{user.username || user.full_name || 'User'}</p>
                        <PlanBadge plan={user.plan} />
                    </div> 
                    <div>
                        <p className="text-xs mb-2 text-base-contnt/60">{user.description || 'meow?'}</p>

                    </div>
                    <div className='flex flex-row w-full gap-2 items-center justify-between'>

                        <p className="text-xs text-base-contnt/60">{isOnline ? 'Online' : 'Offline'}</p>
                    <div className='flex flex-row gap-2'>
                        {actions}
                    </div>
                        
                    </div>

                </div>


            </div>
        );
    };

    return (
        <div className="flex flex-col w-full max-w-[1000px] bg-base-100 mx-auto p-4 sm:p-6 gap-4">
            <Tabs
                aria-label="Friends Management Options"
                variant="solid"
                radius="lg"
                className="w-full"
                classNames={{
                    cursor: "w-full bg-base-content",
                    tab: "",
                    tabContent: "group-data-[selected=true]:text-base-100",
                  }}
                selectedKey={activeTab}
                onSelectionChange={setActiveTab}
            >
                <Tab key="add" title="Add Friend">
                    <div className="p-4 min-h-[300px]">
                        <h3 className="text-lg font-semibold mb-4 text-center text-base-content">Find New Friends</h3>
                        <form onSubmit={handleSearch} className="flex space-x-2 mb-6 max-w-lg mx-auto">
                            <Input
                                isClearable={true}
                                radius='full'
                                placeholder="Search by username..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="flex-grow"
                            />
                            <Button isIconOnly radius='full' type="submit" variant="solid" className='bg-brand-500 text-white' isLoading={isSearching} disabled={isSearching || !searchQuery.trim()}>
                                {!isSearching && <MagnifyingGlassIcon className='w-6 h-6 shrink-0' />}
                            </Button>
                        </form>
                        {isSearching && <div className='flex justify-center p-8'><Spinner /></div>}
                        {!isSearching && searchResults.length > 0 && (
                            <ul className="flex flex-row flex-wrap gap-2">
                                {searchResults.map(userProfile =>
                                    renderUserCard(
                                        userProfile,

                                        <Button startContent={<UserPlusIcon className='w-5 h-5' />} radius='md' size="sm" variant="flat" color="success" onPress={() => sendRequest(userProfile.id)} aria-label="Add Friend">
                                            Invite
                                        </Button>
                                    )
                                )}
                            </ul>
                        )}
                        {/* !isSearching && searchQuery && searchResults.length === 0 && (
                            <p className="mt-6 text-center text-base-content/60">No users found matching "{searchQuery}".</p>
                        )} */}
                    </div>
                </Tab>

                <Tab
                    key="friends"
                    title={
                        <div className="flex items-center space-x-2">
                            <span>Friends</span>

                            {friends.length !== 0 && (
                                <Chip size="sm" variant="solid" className="aspect-square bg-base-content text-base-100">
                                    {friends.length}
                                </Chip>
                            )}
                        </div>
                    }
                >
                    <div className="p-4 min-h-[300px]">
                        {friendsLoading && <div className='flex justify-center p-8'><Spinner /></div>}
                        {friendsError && <p className="text-danger-500 text-center">Error loading friends.</p>}
                        {!friendsLoading && !friendsError && (
                            <ul className="flex flex-row flex-wrap gap-2">
                                {friends.length === 0 && <li className="text-base-content/60 text-center p-8">Your friends list is empty.</li>}
                                {friends.map(friend =>
                                    renderUserCard(
                                        friend,
                                        <Button
                                            radius='md' 
                                            size="sm"
                                            variant="flat"
                                            color="warning"
                                            onPress={() => handleMessageFriend(friend)}
                                            startContent={<ChatBubbleOvalLeftIcon className="w-5 h-5" />}
                                        >
                                            Message
                                        </Button>
                                    )
                                )}
                            </ul>
                        )}
                    </div>
                </Tab>

                <Tab key="outgoing"
                    title={
                        <div className="flex items-center space-x-2">
                            <span>Outgoing</span>

                            {outgoingRequests.length !== 0 && (<Chip size="sm" variant="solid" className='aspect-square' color="warning">
                                {outgoingRequests.length}
                            </Chip>)}

                        </div>
                    }
                >
                    <div className="p-4 min-h-[300px]">
                        {friendsLoading && <div className='flex justify-center p-8'><Spinner size="sm" /></div>}
                        {!friendsLoading && (
                            <ul className="flex flex-row flex-wrap gap-2">
                                {outgoingRequests.length === 0 && <li className="text-base-content/60 text-center p-8">No outgoing requests.</li>}
                                {outgoingRequests.map(req =>
                                    renderUserCard(
                                        req.friend,
                                        <>
                                      
                                           <Button size="sm" radius='md' variant="flat" color="danger">Cancel</Button>
                                            <Button size="sm" radius='md' variant="flat" color="default" isDisabled>Pending</Button> 
                                        
                                        </>,
                                        
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
