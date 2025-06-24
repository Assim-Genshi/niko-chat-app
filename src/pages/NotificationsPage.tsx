import React from 'react';
import { useFriends } from '../features/friends/useFriends'; // Assuming you have this hook
import { Button, Card, Spinner, Avatar, Image, User } from '@heroui/react';
import { CheckIcon, XMarkIcon, BellAlertIcon } from '@heroicons/react/24/solid'; // Changed UserIcon to BellAlertIcon
import { Profile } from '../types'

const NotificationsPage: React.FC = () => {

  const {
      incomingRequests,
      loading,
      error,
      respondRequest
  } = useFriends();

  

  // Helper to render a user card
  const renderUserCard = (
    user: any,
    topAction?: React.ReactNode,
    bottomAction?: React.ReactNode,
    key?: string | number
  ) => (
    <div key={key || user.id} className="relative w-full max-w-80 gap-2 bg-base-content flex flex-col items-center justify-start p-3 rounded-3xl shadow-lg">
      <div className="relative w-full">
        <Image src={user.banner_url || '/banner.png'} className='w-full aspect-[2/1] object-cover rounded-2xl shadow-xl' />
        {topAction && (
          <div className="absolute top-2 right-2 z-10">
            {topAction}
          </div>
        )}
      </div>
  
      <div className='flex flex-row w-full gap-5 items-center justify-between my-4 '>
        <User
          avatarProps={{
            src: user.avatar_url || '/avatar.png'
          }}
          description={user.chatamata_id}
          name={
            <p className='text-base-100'>
              {user.username || user.full_name || 'User'}
            </p>
          }
          
        />
         
          {bottomAction}
         
      </div>
    </div>
  );

  return (
    <div className="flex flex-col w-full max-w-3xl bg-base-100 mx-auto p-4 sm:p-6 gap-4">
      <h2 className="text-2xl font-bold text-base-content text-center mb-4">Notifications</h2>

      <h3 className="text-xl font-semibold mb-3 text-base-content/80">Friend Requests</h3>
      {loading && <div className='flex justify-center p-8'><Spinner /></div>}
      {error && <p className="text-danger-500 text-center">Error loading requests.</p>}
      {!loading && !error && (
          <ul className="flex flex-row w-full space-x-3">
              {incomingRequests.length === 0 && (
                  <li className="text-base-content/60 w-full text-center p-12 bg-base-200 rounded-2xl">
                      <BellAlertIcon className="w-16 h-16 mx-auto text-base-content/30 mb-4" />
                      You have no new friend requests right now.
                  </li>
              )}
              {incomingRequests.map(req =>
                renderUserCard(
                  req.friend,
                  // Top Action (Reject Button)
                  <Button
                    isIconOnly
                    radius='full'
                    size='sm'
                    color="danger"
                    variant="flat"
                    className="p-1 backdrop-blur-md shadow-lg"
                    onPress={() => respondRequest(req.friend.id, 'rejected')}
                    aria-label="Reject"
                  >
                    <XMarkIcon className='w-4 h-4' />
                  </Button>,
                  // Bottom Action (Accept Button)
                  <Button
                    startContent={<CheckIcon className='w-4 h-4 shrink-0' />}
                    radius='lg'
                    size="md"
                    variant="shadow"
                    color="success"
                    onPress={() => respondRequest(req.friend.id, 'accepted')}
                    aria-label="Accept"
                  >
                    Accept
                  </Button>,
                  req.id
                )
              )}
          </ul>
      )}
      {/* could add other types of notifications here later */}
    </div>
  );
};

export default NotificationsPage;