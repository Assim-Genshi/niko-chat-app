import React, { useState } from 'react';
import { useFriends, Profile } from './useFriends'; // Assuming you have this hook
import { Button, Input, Card, Spinner, Avatar, Tabs, Tab, Chip } from '@heroui/react';
import { UserPlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/solid';

const FriendsPage: React.FC = () => {
  const {
    friends,
    outgoingRequests,
    loading,
    error,
    searchUsers,
    sendRequest,
  } = useFriends();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [isSearching, setIsSearching] = useState(false);

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

  const renderUserCard = (
    user: Profile,
    actions: React.ReactNode,
    key?: string | number
  ) => (
    <Card key={key || user.id} className="flex flex-row bg-base-200 items-center justify-between py-2.5 px-4 rounded-xl shadow-sm">
      <div className="flex items-center space-x-3 min-w-0">
        <Avatar src={user.avatar_url || '/avatar.png'} alt={user.username || 'user'} />
        <span className='truncate font-medium'>{user.username || user.full_name || 'User'}</span>
      </div>
      <div className='flex-shrink-0'>
          {actions}
      </div>
    </Card>
  );

  return (
    <div className="flex flex-col w-full max-w-4xl bg-base-100 mx-auto p-4 sm:p-6 gap-4 rounded-2xl shadow-md my-4">
      <Tabs
          aria-label="Friends Management Options"
          color="primary"
          variant="solid"
          radius="lg"
          className="w-full"
      >
        {/* ================== Tab 1: Add Friend ================== */}
        <Tab key="add" title="Add Friend">
            <div className="p-4 min-h-[300px]">
                <h3 className="text-lg font-semibold mb-4 text-center">Find New Friends</h3>
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
                        {searchResults.map(user =>
                            renderUserCard(
                                user,
                                <Button isIconOnly radius='md' size="sm" variant="flat" color="success" onPress={() => sendRequest(user.id)} aria-label="Add Friend">
                                    <UserPlusIcon className='w-6 h-6 shrink-0' />
                                </Button>
                            )
                        )}
                    </ul>
                )}
                {!isSearching && searchQuery && searchResults.length === 0 && !isSearching && (
                    <p className="mt-6 text-center text-base-content/60">No users found matching "{searchQuery}".</p>
                )}
            </div>
        </Tab>

        {/* ================== Tab 2: Friends List ================== */}
        <Tab key="friends" title={
            <div className="flex items-center space-x-2">
              <span>Friends</span>
              <Chip size="sm" variant="faded">
              {friends.length}
              </Chip>
            </div>
          }>
            <div className="p-4 min-h-[300px]">
                {loading && <div className='flex justify-center p-8'><Spinner /></div>}
                {error && <p className="text-danger-500 text-center">Error loading friends.</p>}
                {!loading && !error && (
                    <ul className="space-y-3">
                        {friends.length === 0 && <li className="text-base-content/60 text-center p-8">Your friends list is empty.</li>}
                        {friends.map(friend =>
                           renderUserCard(
                               friend,
                               <Button size="sm" variant="ghost" color="primary">Message</Button>
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
              <Chip size="sm" variant="faded">
                {outgoingRequests.length}
              </Chip>
            </div>
          }
        >
            <div className="p-4 min-h-[300px]">
                {loading && <div className='flex justify-center p-8'><Spinner size="sm" /></div>}
                {!loading && (
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