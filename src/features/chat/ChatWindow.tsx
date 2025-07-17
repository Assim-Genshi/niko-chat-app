// ChatWindow.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useMessages } from './useMessages';
import {
  Button, Avatar, Skeleton, ScrollShadow, Tooltip, Image,
  Dropdown, DropdownTrigger, DropdownMenu, DropdownItem,
  Modal, ModalContent, ModalHeader, ModalFooter, ModalBody, addToast
} from '@heroui/react';
import {
  EllipsisVerticalIcon, ArrowDownIcon, CheckIcon, ArrowLeftIcon, ClockIcon,
  ArrowPathIcon, ArrowUturnLeftIcon, ExclamationCircleIcon
} from '@heroicons/react/24/solid';
import { useAuth } from '../../contexts/AuthContext';
import { usePresence } from '../../contexts/PresenceContext';
import { useProfilePreview } from '../../contexts/ProfilePreviewContext';
import { Profile, ConversationPreview, Message } from '../../types';
import { supabase } from '../../supabase/supabaseClient';
import { PlanBadge } from '../../components/PlanBadge';
import { cn } from '../../lib/utils';
import { IconCopy, IconTrash } from '@tabler/icons-react';
import { MessageInput } from '../../components/MessageInput';
import { useNavigate } from 'react-router-dom';

interface ChatWindowProps {
  conversation: ConversationPreview;
}

// Utility: render message text with clickable links
const RenderMessageContent: React.FC<{ content: string }> = ({ content }) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = content.split(urlRegex);
  return (
    <p className="text-sm whitespace-pre-wrap break-words">
      {parts.map((part, i) =>
        urlRegex.test(part) ? (
          <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">
            {part}
          </a>
        ) : (
          <React.Fragment key={i}>{part}</React.Fragment>
        )
      )}
    </p>
  );
};

// Helpers
const shouldStartNewGroup = (cur: Message, prev?: Message) => {
  if (!prev) return true;
  if (cur.sender_id !== prev.sender_id) return true;
  return new Date(cur.created_at).getMinutes() !== new Date(prev.created_at).getMinutes();
};

const isLastInGroup = (cur: Message, next?: Message) => {
  if (!next) return true;
  if (cur.sender_id !== next.sender_id) return true;
  return new Date(cur.created_at).getMinutes() !== new Date(next.created_at).getMinutes();
};

const isNewDay = (cur: Message, prev?: Message) => {
  if (!prev) return true;
  return new Date(cur.created_at).toDateString() !== new Date(prev.created_at).toDateString();
};

const formatDateSeparator = (dateString: string): string => {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const compare = (d1: Date, d2: Date) => d1.setHours(0, 0, 0, 0) === d2.setHours(0, 0, 0, 0);

  if (compare(date, today)) return 'Today';
  if (compare(date, yesterday)) return 'Yesterday';

  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const DateSeparator: React.FC<{ date: string }> = ({ date }) => (
  <div className="relative py-4 flex justify-center">
    <span className="bg-base-50 px-3 text-xs font-medium text-base-content/60">
      {formatDateSeparator(date)}
    </span>
  </div>
);

// Message bubble
const MessageBubble: React.FC<{
  msg: Message;
  isOwnMessage: boolean;
  startsNewGroup: boolean;
  isLastInGroup: boolean;
  onRetry: (content: string, tempId: string) => void;
  onDelete: () => void;
}> = ({ msg, isOwnMessage, startsNewGroup, isLastInGroup, onRetry, onDelete }) => {
  const bubbleClasses = cn(
    "relative w-fit max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg px-2 py-2 shadow-sm",
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
          {isLastInGroup && <Avatar src={msg.sender?.avatar_url || '/profile/avatar.jpg'} size="sm" />}
        </div>
        <div className={bubbleClasses}>
          {msg.content && <RenderMessageContent content={msg.content} />}
          {msg.image_url && (
            <Image
              src={msg.image_url}
              alt="Chat image"
              className={cn("rounded-lg w-full max-w-xs h-auto", { 'opacity-60': msg.status === 'sending' })}
            />
          )}
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
            <Button isIconOnly variant="light" className="p-[1px] rounded-full">
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
  const { session } = useAuth();
  const userId = session?.user?.id;
  const { messages, loading, loadingMore, loadMoreMessages, hasMore, sendTextMessage, sendImageMessage, deleteMessage } = useMessages(conversation.conversation_id);

  const [messageToDelete, setMessageToDelete] = useState<Message | null>(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const prevScrollHeightRef = useRef<number | null>(null);
  const initialScrollDoneRef = useRef(false);
  const navigate = useNavigate();

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
      const nearBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 250;
      if (nearBottom) scrollToBottom('smooth');
    }
  }, [messages, scrollToBottom]);

  const handleScroll = useCallback(async () => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 1;
    setShowScrollToBottom(!isAtBottom);

    if (container.scrollTop === 0 && hasMore && !loading && !loadingMore) {
      prevScrollHeightRef.current = container.scrollHeight;
      await loadMoreMessages();
    }
  }, [hasMore, loading, loadingMore, loadMoreMessages]);

  const confirmDelete = () => {
    if (messageToDelete) {
      deleteMessage(messageToDelete.id);
      setMessageToDelete(null);
    }
  };

  return (
    <>
      <div className="w-full py-10 md:py-0 flex flex-col h-full relative">
        {/* Header */}
        <div className="fixed w-full p-3 flex items-center space-x-3 md:sticky top-0 z-20 cursor-pointer bg-base-100/80 backdrop-blur-md">
          <Button isIconOnly size='sm' onPress={() => navigate('/chat')} className="flex md:hidden bg-transparent" aria-label="Back">
            <ArrowLeftIcon className='w-5 h-5'/>
          </Button>
          <Avatar src={conversation.display_avatar || '/profile/avatar.jpg'} size="md" />
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-base-content">{conversation.display_name}</h2>
              <PlanBadge plan={(conversation as any).other_participant_plan} />
            </div>
          </div>
        </div>

        {/* Messages */}
        <ScrollShadow ref={messagesContainerRef} onScroll={handleScroll} className="h-full" size={60}>
          <div className="flex flex-col flex-grow p-4 overflow-y-auto bg-base-50">
            {loadingMore && <div className="flex justify-center py-2"><Skeleton className="h-5 w-20 rounded-lg" /></div>}
            {!loading && messages.map((msg, index) => {
              const previous = messages[index - 1];
              const next = messages[index + 1];
              const showDateSeparator = isNewDay(msg, previous);
              const startsNewGroup = shouldStartNewGroup(msg, previous);
              const lastInGroup = isLastInGroup(msg, next);

              return (
                <React.Fragment key={msg.temp_id || msg.id}>
                  {showDateSeparator && <DateSeparator date={msg.created_at} />}
                  <div className={cn("py-0.5", startsNewGroup && index > 0 && "mt-2")}>
                    <MessageBubble
                      msg={msg}
                      isOwnMessage={msg.sender_id === userId}
                      startsNewGroup={startsNewGroup}
                      isLastInGroup={lastInGroup}
                      onRetry={sendTextMessage}
                      onDelete={() => setMessageToDelete(msg)}
                    />
                  </div>
                </React.Fragment>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        </ScrollShadow>

        {/* Scroll to Bottom */}
        {showScrollToBottom && (
          <Button isIconOnly onPress={() => scrollToBottom('smooth')} className="absolute bottom-32 right-6 z-10 rounded-full shadow-lg bg-base-100 border" aria-label="Scroll to bottom">
            <ArrowDownIcon className='w-5 h-5' />
          </Button>
        )}

        {/* Input */}
        <MessageInput onSendText={sendTextMessage} onSendImage={sendImageMessage} isSending={false} />
      </div>

      {/* Delete Modal */}
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
