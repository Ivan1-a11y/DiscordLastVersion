import React, { useState, useRef, useEffect } from 'react';
import { PlusCircle, Smile, X, CornerDownRight, Image as ImageIcon } from 'lucide-react';
import { Attachment } from '../../types';
import { getSocket } from '../../lib/socket';

interface MessageInputProps {
  placeholder: string;
  onSend: (content: string, attachments?: Attachment[]) => Promise<void>;
  replyingTo: { id: string; authorName: string; content: string } | null;
  onCancelReply: () => void;
  channelId?: string;
  dmUserId?: string;
}

const COMMON_EMOJIS = ['😀', '😂', '😍', '🔥', '🚀', '👍', '❤️', '🎉', '✨', '💯', '🤔', '👀', '🎮', '🎙️', '⚡'];

export const MessageInput: React.FC<MessageInputProps> = ({
  placeholder,
  onSend,
  replyingTo,
  onCancelReply,
  channelId,
  dmUserId,
}) => {
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<number | null>(null);

  // Focus textarea when replyingTo changes
  useEffect(() => {
    if (replyingTo && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [replyingTo]);

  const handleTyping = () => {
    const socket = getSocket();
    if (channelId) {
      socket.emit('typing:channel', { channelId, isTyping: true });
    } else if (dmUserId) {
      socket.emit('typing:dm', { receiverId: dmUserId, isTyping: true });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = window.setTimeout(() => {
      if (channelId) {
        socket.emit('typing:channel', { channelId, isTyping: false });
      } else if (dmUserId) {
        socket.emit('typing:dm', { receiverId: dmUserId, isTyping: false });
      }
    }, 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    if (!content.trim() && attachments.length === 0) return;

    const textToSend = content.trim();
    const attachmentsToSend = [...attachments];

    setContent('');
    setAttachments([]);
    setShowEmojiPicker(false);

    // Stop typing immediately
    const socket = getSocket();
    if (channelId) {
      socket.emit('typing:channel', { channelId, isTyping: false });
    } else if (dmUserId) {
      socket.emit('typing:dm', { receiverId: dmUserId, isTyping: false });
    }

    await onSend(textToSend, attachmentsToSend);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      reader.onload = () => {
        const url = reader.result as string;
        setAttachments((prev) => [
          ...prev,
          {
            id: `att_${Date.now()}_${i}`,
            name: file.name,
            url,
            size: file.size,
            type: file.type || 'application/octet-stream',
          },
        ]);
      };
      reader.readAsDataURL(file);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const addEmoji = (emoji: string) => {
    setContent((prev) => prev + emoji);
    setShowEmojiPicker(false);
    textareaRef.current?.focus();
  };

  return (
    <div className="p-4 pt-0 select-none relative">
      {/* Replying Banner */}
      {replyingTo && (
        <div className="bg-[#2b2d31] rounded-t-lg px-3 py-1.5 flex items-center justify-between text-xs text-[#b5bac1] border-x border-t border-[#35373c]">
          <div className="flex items-center gap-1.5 truncate">
            <CornerDownRight className="w-3.5 h-3.5 text-[#80848e] shrink-0" />
            <span>
              Replying to <strong className="text-white">@{replyingTo.authorName}</strong>
            </span>
            <span className="truncate italic max-w-xs text-[#949ba4]">
              {replyingTo.content}
            </span>
          </div>
          <button
            onClick={onCancelReply}
            className="p-1 hover:text-white rounded transition-colors"
            title="Cancel reply"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Attachments Preview Banner */}
      {attachments.length > 0 && (
        <div className="bg-[#2b2d31] p-3 flex gap-3 overflow-x-auto border-x border-t border-[#35373c] rounded-t-lg">
          {attachments.map((att, index) => (
            <div
              key={att.id}
              className="relative w-24 h-24 bg-[#1e1f22] rounded-lg overflow-hidden border border-[#383a40] shrink-0 flex items-center justify-center group"
            >
              {att.type.startsWith('image/') || att.url.startsWith('data:image') ? (
                <img src={att.url} alt={att.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-[10px] text-[#dbdee1] p-1 break-all text-center">
                  {att.name}
                </span>
              )}
              <button
                type="button"
                onClick={() => removeAttachment(index)}
                className="absolute top-1 right-1 w-5 h-5 bg-[#000000]/80 rounded-full flex items-center justify-center text-white hover:bg-[#f23f43] transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Main Input Box */}
      <div
        className={`bg-[#383a40] rounded-lg flex items-center px-4 py-2.5 focus-within:ring-1 focus-within:ring-[#5865F2] ${
          replyingTo || attachments.length > 0 ? 'rounded-t-none' : ''
        }`}
      >
        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          multiple
          className="hidden"
        />

        {/* Upload Attachment Button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="text-[#b5bac1] hover:text-white p-1 rounded-full hover:bg-[#4e5058]/50 transition-colors mr-2 shrink-0"
          title="Upload File or Image"
        >
          <PlusCircle className="w-6 h-6" />
        </button>

        {/* Text Area */}
        <textarea
          ref={textareaRef}
          rows={1}
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            handleTyping();
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-white placeholder-[#80848e] text-sm focus:outline-hidden resize-none max-h-32 leading-5"
        />

        {/* Emoji Button */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="text-[#b5bac1] hover:text-[#f0b232] p-1 rounded-full hover:bg-[#4e5058]/50 transition-colors ml-2 shrink-0"
            title="Add Emoji"
          >
            <Smile className="w-6 h-6" />
          </button>

          {/* Quick Emoji Picker Popover */}
          {showEmojiPicker && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setShowEmojiPicker(false)}
              />
              <div className="absolute bottom-10 right-0 z-40 bg-[#2b2d31] p-3 rounded-xl shadow-2xl border border-[#1f2023] w-64 animate-in fade-in duration-150">
                <p className="text-[11px] font-bold uppercase text-[#949ba4] mb-2">
                  Popular Emojis
                </p>
                <div className="grid grid-cols-5 gap-2">
                  {COMMON_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => addEmoji(emoji)}
                      className="text-xl p-1.5 rounded hover:bg-[#383a40] transition-colors"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
