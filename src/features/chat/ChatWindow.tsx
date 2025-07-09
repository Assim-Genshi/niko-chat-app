import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useMessages } from './useMessages';
import { Button, Input, Avatar, Skeleton, ScrollShadow, Tooltip, Image, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, DropdownSection, Modal, ModalContent, ModalHeader, ModalFooter, ModalBody, addToast } from '@heroui/react';
import {
  ArrowDownIcon, PaperAirplaneIcon, CheckIcon, ClockIcon,
  ExclamationCircleIcon, ArrowPathIcon, PhotoIcon, EllipsisVerticalIcon,
  ArrowUturnLeftIcon,
} from '@heroicons/react/24/solid';
import { useAuth } from '../../contexts/AuthContext';
import { useSoundSettingsStore } from '../../lib/useSoundSettingsStore';
import { usePresence } from '../../contexts/PresenceContext';
import { useProfilePreview } from '../../contexts/ProfilePreviewContext';
import { Profile, ConversationPreview, Message } from '../../types';
import { supabase } from '../../supabase/supabaseClient';
import { PlanBadge } from '../../components/PlanBadge';
import { cn } from '../../lib/utils';
import { IconCopy, IconTrash, IconArrowBack } from '@tabler/icons-react';

interface ChatWindowProps {
  conversation: ConversationPreview;
}

// Helper function to determine if a message should start a new group
const shouldStartNewGroup = (currentMsg: Message, previousMsg: Message | undefined): boolean => {
  if (!previousMsg) return true;
  if (currentMsg.sender_id !== previousMsg.sender_id) return true;
  const currentTimestamp = new Date(currentMsg.created_at);
  const previousTimestamp = new Date(previousMsg.created_at);
  if (currentTimestamp.getMinutes() !== previousTimestamp.getMinutes()) return true;
  return false;
};

const MessageSkeleton: React.FC<{ isOwnMessage: boolean }> = ({ isOwnMessage }) => (
  <div className={cn("flex items-end gap-2 w-full", isOwnMessage ? "justify-end" : "justify-start")}>
    <div className={cn("flex items-end gap-2", isOwnMessage && "flex-row-reverse")}>
      <div className="w-8 shrink-0 self-end">
        <Skeleton className="w-8 h-8 rounded-full bg-base-300" />
      </div>
      <div className={cn("p-2 shadow-sm rounded-2xl w-20", isOwnMessage ? "bg-brand-500/20 rounded-br-sm" : "bg-base-300 rounded-bl-sm")}>
        <Skeleton className="w-4/5 h-3 rounded-lg mb-2 bg-base-content/10" />
        <Skeleton className="w-3/5 h-3 rounded-lg bg-base-content/10" />
      </div>
    </div>
  </div>
);

const MessageBubble: React.FC<{
  msg: Message;
  isOwnMessage: boolean;
  startsNewGroup: boolean;
  onRetry: (content: string, tempId: string) => void;
  onDelete: () => void;
}> = ({ msg, isOwnMessage, startsNewGroup, onRetry, onDelete }) => {
  const bubbleClasses = cn(
    "relative w-fit max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg px-3.5 py-2.5 shadow-sm",
    isOwnMessage ? "bg-brand-500 text-white" : "bg-base-200 text-base-content border border-base-300",
    startsNewGroup ? (isOwnMessage ? "rounded-t-2xl rounded-bl-2xl rounded-br-sm" : "rounded-t-2xl rounded-br-2xl rounded-bl-sm") : "rounded-l-2xl rounded-r-2xl"
  );

  const handleCopy = () => {
    if (!msg.content) return;
    navigator.clipboard.writeText(msg.content);
    addToast({ title: "Copied to clipboard!", color: "success" });
  };

  return (
    <div className={cn("flex items-end gap-2 group w-full", isOwnMessage ? "justify-end" : "justify-start")}>
      <div className={cn("flex items-center gap-2", isOwnMessage && "flex-row-reverse")}>
        <div className="w-8 shrink-0 self-end">
          {startsNewGroup && <Avatar src={msg.sender?.avatar_url || '/avatar.png'} size="sm" />}
        </div>

        <div className={bubbleClasses}>
          {msg.content && <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>}
          {msg.image_url && <Image src={msg.image_url} alt="Chat image" className={cn("rounded-lg max-w-xs h-auto", { 'opacity-60': msg.status === 'sending' })} />}
          <div className="flex items-center justify-end mt-1.5 gap-1.5 text-xs">
            {isOwnMessage && msg.status === 'error' && (
              <Tooltip content="Failed. Click to retry." color="danger">
                <button onClick={() => onRetry(msg.content!, msg.temp_id!)}>
                  <ArrowPathIcon className="w-4 h-4 text-red-300 cursor-pointer" />
                </button>
              </Tooltip>
            )}
            <p className={isOwnMessage ? 'text-white/60' : 'text-base-content/60'}>
              {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
            </p>
            {isOwnMessage && msg.status === 'sending' && <ClockIcon className="w-3.5 h-3.5 text-white/80" />}
            {isOwnMessage && msg.status !== 'sending' && msg.read_at && <CheckIcon className="w-4 h-4 text-white/80" />}
          </div>
        </div>

        <Dropdown>
          <DropdownTrigger>
            <Button isIconOnly variant="light" className='p-[1px] rounded-full'>
              <EllipsisVerticalIcon className="w-5 h-5 text-base-content/60 hidden group-hover:block" />
            </Button>
          </DropdownTrigger>
          <DropdownMenu aria-label="Message Actions">
            <DropdownItem key="copy" startContent={<IconCopy className="w-4 h-4" />} onPress={handleCopy}>Copy</DropdownItem>
            <DropdownItem key="reply" startContent={<ArrowUturnLeftIcon className="w-4 h-4" />} onPress={() => addToast({ title: "Coming Soon!", description: "Replying to messages is on the way." })}>Reply</DropdownItem>
            {isOwnMessage && (
              <DropdownItem key="delete" className="text-danger" color="danger" startContent={<IconTrash className="w-4 h-4" />} onPress={onDelete}>Delete</DropdownItem>
            )}
          </DropdownMenu>
        </Dropdown>
      </div>
    </div>
  );

};

export const ChatWindow: React.FC<ChatWindowProps> = ({ conversation }) => {
  const { session, user } = useAuth();
  const userId = session?.user?.id;
  const { messages, loading, loadingMore, hasMore, sendTextMessage, sendImageMessage, loadMoreMessages, deleteMessage } = useMessages(conversation.conversation_id);

  const [newMessage, setNewMessage] = useState('');
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<Message | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const prevScrollHeightRef = useRef<number | null>(null);
  const initialScrollDoneRef = useRef(false);

  const { viewProfile } = useProfilePreview();
  const { onlineUsers } = usePresence();

  const handleHeaderClick = async () => {
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
        plan: "free",
      };
      viewProfile(partialProfile);
    }
  };

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  useEffect(() => {
    if (!loading && messages.length > 0 && !initialScrollDoneRef.current) {
      scrollToBottom('auto');
      initialScrollDoneRef.current = true;
    }
  }, [loading, messages.length, scrollToBottom]);

  useEffect(() => {
    if (!initialScrollDoneRef.current) return;
    const container = messagesContainerRef.current;
    if (!container) return;

    if (prevScrollHeightRef.current !== null) {
      container.scrollTop = container.scrollHeight - prevScrollHeightRef.current;
      prevScrollHeightRef.current = null;
    } else {
      const isNearBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 250;
      if (isNearBottom) {
        scrollToBottom('smooth');
      }
    }
  }, [messages, scrollToBottom]);

  const handleScroll = useCallback(async () => {
    const container = messagesContainerRef.current;
    if (!container) return;

    // Logic for showing/hiding the "scroll to bottom" button
    const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 1;
    setShowScrollToBottom(!isAtBottom);

    // Logic for infinite scroll
    if (container.scrollTop === 0 && hasMore && !loading && !loadingMore) {
      prevScrollHeightRef.current = container.scrollHeight;
      await loadMoreMessages();
    }
  }, [hasMore, loading, loadingMore, loadMoreMessages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    sendTextMessage(newMessage);
    setNewMessage('');
    setTimeout(() => scrollToBottom('smooth'), 50);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) sendImageMessage(file);
    e.target.value = "";
  };

  const confirmDelete = () => {
    if (messageToDelete) {
      deleteMessage(messageToDelete.id);
      setMessageToDelete(null); // Close modal
    }
  };

  return (
    <>
      <div className="w-full flex flex-col h-full relative">
        
        <div className="p-3 flex items-center space-x-3 sticky top-0 z-20 cursor-pointer bg-base-100/80 backdrop-blur-md" onClick={handleHeaderClick}>
          <Avatar src={conversation.display_avatar || '/avatar.png'} size="md" />
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-base-content">{conversation.display_name}</h2>
              <PlanBadge plan={(conversation as any).other_participant_plan} />
            </div>
            {onlineUsers.has(conversation.other_participant_id || '') ? <p className='text-xs text-green-500'>Online</p> : <p className='text-xs text-gray-400'>Offline</p>}
          </div>
        </div>

        <ScrollShadow ref={messagesContainerRef} onScroll={handleScroll} className='h-full' size={60}>
          <div className="flex flex-col flex-grow p-4 overflow-y-auto bg-base-50 space-y-1">
            {loadingMore && <div className="flex justify-center py-2"><Skeleton className="h-5 w-20 rounded-lg" /></div>}

            {loading && (
              <div className="flex flex-col space-y-4 p-4">
                <MessageSkeleton isOwnMessage={false} />
                <MessageSkeleton isOwnMessage />
                <MessageSkeleton isOwnMessage={false} />
                <MessageSkeleton isOwnMessage />
              </div>
            )}

            {!loading && messages.map((msg, index) => {
              const previousMsg = messages[index - 1];
              const startsNewGroup = shouldStartNewGroup(msg, previousMsg);
              return (
                <MessageBubble key={msg.temp_id || msg.id} msg={msg} isOwnMessage={msg.sender_id === userId} startsNewGroup={startsNewGroup} onRetry={sendTextMessage} onDelete={() => setMessageToDelete(msg)} />
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        </ScrollShadow>

        {showScrollToBottom && (
          <Button isIconOnly onPress={() => scrollToBottom('smooth')} className="absolute bottom-24 right-6 z-10 rounded-full shadow-lg bg-base-100 border" aria-label="Scroll to bottom">
            <ArrowDownIcon className='w-5 h-5' />
          </Button>
        )}

        <div className="p-3 bg-base-100 sticky bottom-0">
          <form onSubmit={handleSend} className="flex items-center space-x-2">
            <input type="file" ref={imageInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
            <Button isIconOnly variant="light" onPress={() => imageInputRef.current?.click()}>
              <PhotoIcon className="w-6 h-6 text-gray-500" />
            </Button>
            <Input
              placeholder="Type a message..." value={newMessage}
              onValueChange={setNewMessage} fullWidth radius='full'
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { handleSend(e); } }}
            />
            <Button type="submit" isIconOnly color="primary" radius='full' isDisabled={!newMessage.trim()} className='bg-brand-500 text-white'>
              <PaperAirplaneIcon className='w-6 h-6' />
            </Button>
          </form>
        </div>
      </div>

      {/* --- Delete Confirmation Modal --- */}
      <Modal isOpen={!!messageToDelete} onClose={() => setMessageToDelete(null)}>
        <ModalContent>
          <ModalHeader>
            <p className='flex flex-row items-center gap-2'>
              <ExclamationCircleIcon className='w-5 h-5' /> Delete Message
            </p>
            </ModalHeader>
          <ModalBody>
            <p>Are you sure you want to permanently delete this message?</p>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={() => setMessageToDelete(null)}>Cancel</Button>
            <Button color="danger" onPress={confirmDelete}>Delete</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};
