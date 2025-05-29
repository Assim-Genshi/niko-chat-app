import React from 'react';
import { useFriends } from '../features/friends/useFriends'; // Assuming you have this hook
import { Button, Card, Spinner, Avatar } from '@heroui/react';
import { CheckIcon, XMarkIcon, BellAlertIcon } from '@heroicons/react/24/solid'; // Changed UserIcon to BellAlertIcon

const NotificationsPage: React.FC = () => {
  const {
      incomingRequests,
      loading,
      error,
      respondRequest
  } = useFriends();

  // Helper to render a user card
  const renderUserCard = (
    user: any, // Use `any` or the correct Profile type from your hook
    actions: React.ReactNode,
    key?: string | number
  ) => (
    <Card key={key || user.id} className="flex flex-row bg-base-200 items-center justify-between py-2.5 px-4 rounded-xl shadow-sm">
      <div className="flex items-center space-x-3 min-w-0">
        <Avatar src={user.avatar_url || '/avatar.png'} alt={user.username || 'user'} />
        <span className='truncate font-medium'>{user.username || user.full_name || 'User'} wants to be your friend.</span>
      </div>
      <div className='flex-shrink-0'>
          {actions}
      </div>
    </Card>
  );

  return (
    <div className="flex flex-col w-full max-w-3xl bg-base-100 mx-auto p-4 sm:p-6 gap-4">
      <h2 className="text-2xl font-bold text-base-content text-center mb-4">Notifications</h2>

      <h3 className="text-xl font-semibold mb-3 text-base-content/80">Friend Requests</h3>
      {loading && <div className='flex justify-center p-8'><Spinner /></div>}
      {error && <p className="text-danger-500 text-center">Error loading requests.</p>}
      {!loading && !error && (
          <ul className="space-y-3">
              {incomingRequests.length === 0 && (
                  <li className="text-base-content/60 text-center p-12 bg-base-200 rounded-xl">
                      <BellAlertIcon className="w-16 h-16 mx-auto text-base-content/30 mb-4" />
                      You have no new friend requests right now.
                  </li>
              )}
              {incomingRequests.map(req =>
                  renderUserCard(
                      req.friend,
                      <div className="space-x-2">
                          <Button isIconOnly radius='md' size="sm" variant="flat" color="success" onPress={() => respondRequest(req.friend.id, 'accepted')} aria-label="Accept">
                              <CheckIcon className='w-6 h-6 shrink-0' />
                          </Button>
                          <Button isIconOnly radius='md' size="sm" color="danger" variant="flat" onPress={() => respondRequest(req.friend.id, 'rejected')} aria-label="Reject">
                              <XMarkIcon className='w-6 h-6 shrink-0' />
                          </Button>
                      </div>,
                      req.id // Use request ID as key
                  )
              )}
          </ul>
      )}
      {/* You could add other types of notifications here later */}
    </div>
  );
};

export default NotificationsPage;