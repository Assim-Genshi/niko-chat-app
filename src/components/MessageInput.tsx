// src/components/MessageInput.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Button, Popover, PopoverTrigger, PopoverContent, toast } from '@heroui/react';
import {
  PhotoIcon,
  PaperAirplaneIcon,
  FaceSmileIcon,
  CloudArrowUpIcon
} from '@heroicons/react/24/solid';
import { IconX } from '@tabler/icons-react';
import { cn } from '../lib/utils';

import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';
import { useThemeStore } from '../lib/useThemeStore';

interface MessageInputProps {
  onSendText: (text: string) => void;
  onSendImage: (file: File) => void;
  isSending: boolean;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  onSendText,
  onSendImage,
  isSending
}) => {
  // ─────────────────────── state ───────────────────────
  const [text, setText]           = useState('');
  const [imagePreview, setPrev]   = useState<string | null>(null);
  const [imageFile, setImgFile]   = useState<File | null>(null);
  const [isDragging, setDrag]     = useState(false);

  // ─────────────────────── refs ────────────────────────
  const fileInputRef  = useRef<HTMLInputElement>(null);
  const textareaRef   = useRef<HTMLTextAreaElement>(null);

  // current theme (light / dark)
  const { theme } = useThemeStore();

  // ─────────────────── auto‑resize textarea ────────────
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    const max = 128; // 8rem == max‑h‑32
    ta.style.height = `${Math.min(ta.scrollHeight, max)}px`;
  }, [text]);

  // ───────────────────── emoji insert ──────────────────
  const insertEmoji = (emoji: any) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const { selectionStart: start, selectionEnd: end } = ta;
    const newVal = text.slice(0, start) + emoji.native + text.slice(end);
    setText(newVal);
    // reset cursor after React update
    setTimeout(() => {
      ta.focus();
      ta.selectionStart = ta.selectionEnd = start + emoji.native.length;
    }, 0);
  };

  // ─────────────────── file helpers ────────────────────
  const readImage = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => setPrev(reader.result as string);
    reader.readAsDataURL(file);
  };

  const validateAndStoreFile = (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file.');
      return;
    }
    setImgFile(file);
    readImage(file);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    validateAndStoreFile(e.target.files?.[0] ?? null);

  const clearImage = () => {
    setPrev(null);
    setImgFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ─────────────────── send handler ────────────────────
  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed && !imageFile) return;

    if (imageFile) {
      onSendImage(imageFile);
      if (trimmed) onSendText(trimmed);
    } else {
      onSendText(trimmed);
    }

    setText('');
    clearImage();
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  // ─────────────── drag‑and‑drop + paste ───────────────
  const onDragOver = (e: React.DragEvent<HTMLFormElement>) => {
    e.preventDefault(); e.stopPropagation();
    setDrag(true);
  };
  const onDragLeave = (e: React.DragEvent<HTMLFormElement>) => {
    e.preventDefault(); e.stopPropagation();
    setDrag(false);
  };
  const onDrop = (e: React.DragEvent<HTMLFormElement>) => {
    e.preventDefault(); e.stopPropagation();
    setDrag(false);
    validateAndStoreFile(e.dataTransfer.files?.[0] ?? null);
  };
  const onPaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const file = e.clipboardData.files?.[0];
    if (file && file.type.startsWith('image/')) {
      e.preventDefault();
      validateAndStoreFile(file);
    }
  };

  // ─────────────────────── jsx ─────────────────────────
  return (
    <div className="p-2 bg-base-100 sticky bottom-0">
      <form
        onSubmit={handleSend}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={cn(
          'relative flex flex-col items-start gap-1 px-2 py-2 bg-base-200 rounded-3xl w-full shadow-md border-2 border-transparent',
          isDragging && 'border-brand-500 border-dashed bg-brand-500/10'
        )}
      >
        {/* drag‑overlay */}
        {isDragging && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-base-100/80 backdrop-blur rounded-3xl">
            <CloudArrowUpIcon className="w-12 h-12 text-brand-500" />
            <p className="font-bold text-brand-500">Drop image to upload</p>
          </div>
        )}

        {/* image preview */}
        {imagePreview && (
          <div className="relative ml-2 mb-1">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-24 max-h-32 object-cover rounded-lg"
            />
            <button
              type="button"
              onClick={clearImage}
              className="absolute -top-2 -right-2 p-1 bg-base-300 rounded-full hover:bg-danger text-base-content hover:text-danger-content transition-colors"
              aria-label="Remove image"
            >
              <IconX className="size-4" />
            </button>
          </div>
        )}

        {/* textarea */}
        <textarea
          ref={textareaRef}
          value={text}
          placeholder="Type a message…"
          onChange={(e) => setText(e.target.value)}
          onPaste={onPaste}
          rows={1}
          className="w-full pt-2 pb-2 px-1.5 text-sm bg-transparent focus:outline-none resize-none overflow-y-auto min-h-10 max-h-32 text-base-content placeholder-base-content/60"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend(e);
            }
          }}
        />

        {/* actions */}
        <div className="w-full flex justify-between items-center">
          <div className="flex gap-1">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
            <Button
              size="sm"
              radius="full"
              variant="light"
              isIconOnly
              className="bg-base-100 shadow-sm"
              onPress={() => fileInputRef.current?.click()}
              aria-label="Attach image"
            >
              <PhotoIcon className="w-4 h-4" />
            </Button>

            {/* emoji picker */}
            <Popover placement="top-start">
              <PopoverTrigger>
                <Button
                  size="sm"
                  radius="full"
                  variant="light"
                  isIconOnly
                  className="bg-base-100 shadow-sm"
                  aria-label="Add emoji"
                >
                  <FaceSmileIcon className="w-4 h-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-0 border-none bg-transparent shadow-lg rounded-2xl">
                <Picker
                  data={data}
                  onEmojiSelect={insertEmoji}
                  theme={theme}
                  previewPosition="none"
                />
              </PopoverContent>
            </Popover>
          </div>

          <Button
            type="submit"
            size="sm"
            radius="full"
            color="primary"
            isIconOnly
            isDisabled={(!text.trim() && !imageFile) || isSending}
            className="bg-brand-500 text-white shadow-sm"
            aria-label="Send message"
          >
            <PaperAirplaneIcon className="w-4 h-4" />
          </Button>
        </div>
      </form>
    </div>
  );
};
