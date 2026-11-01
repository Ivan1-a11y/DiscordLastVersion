import React, { useState } from 'react';
import { Reply, Trash2, Smile, CornerDownRight } from 'lucide-react';
import { ServerMessage, DirectMessage, User } from '../../types';
import { Avatar } from '../common/Avatar';
import { useAuthStore } from '../../store/useAuthStore';

interface MessageItemProps {
  message: ServerMessage | DirectMessage;
  onReply: (message: ServerMessage | DirectMessage) => void;
  onDelete: (messageId: string) => void;
  onReact: (messageId: string, emoji: string) => void;
}

// Simple markdown renderer for bold, italic, code blocks, and links
function renderMarkdown(content: string) {
  if (!content) return null;

  // Split into lines to check for code blocks
  const parts: React.ReactNode[] = [];
  const lines = content.split('\n');
  let inCodeBlock = false;
  let codeBuffer: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('```')) {
      if (inCodeBlock) {
        // Close code block
        parts.push(
          <pre
            key={`cb-${i}`}
            className="my-1.5 p-3 rounded-md bg-[#1e1f22] text-[#e0e1e5] font-mono text-xs overflow-x-auto border border-[#232428]"
          >
            <code>{codeBuffer.join('\n')}</code>
          </pre>
        );
        codeBuffer = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      continue;
    }

    // Inline formatting: `code`, **bold**, *italic*
    const formattedLine = line
      .split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g)
      .map((seg, idx) => {
        if (seg.startsWith('`') && seg.endsWith('`') && seg.length > 2) {
          return (
            <code
              key={idx}
              className="px-1.5 py-0.5 rounded bg-[#1e1f22] text-[#eb5757] font-mono text-[11px]"
            >
              {seg.slice(1, -1)}
            </code>
          );
        }
        if (seg.startsWith('**') && seg.endsWith('**') && seg.length > 4) {
          return <strong key={idx} className="font-bold text-white">{seg.slice(2, -2)}</strong>;
        }
        if (seg.startsWith('*') && seg.endsWith('*') && seg.length > 2) {
          return <em key={idx} className="italic text-[#dbdee1]">{seg.slice(1, -1)}</em>;
        }
        return seg;
      });

    parts.push(
      <span key={`line-${i}`} className="block leading-relaxed">
        {formattedLine.length > 0 ? formattedLine : '\u00A0'}
      </span>
    );
  }

  return parts;
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  onReply,
  onDelete,
  onReact,
}) => {
  const { user: currentUser } = useAuthStore();
  const [showEmojiMenu, setShowEmojiMenu] = useState(false);

  const author = (message as any).author as User | undefined;
  const isAuthor = author?.id === currentUser?.id;

  const dateObj = new Date(message.createdAt);
  const timeString = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateString = dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' });

  const quickEmojis = ['❤️', '👍', '🔥', '🚀', '😂', '🎉', '👀'];

  return (
    <div className="group relative flex flex-col px-4 py-1.5 hover:bg-[#2e3035]/60 transition-colors">
      {/* Reply Banner if applicable */}
      {message.replyTo && (
        <div className="flex items-center gap-2 text-xs text-[#949ba4] pl-7 mb-1">
          <CornerDownRight className="w-3.5 h-3.5 text-[#80848e] shrink-0" />
          <span className="font-semibold text-[#dbdee1]">@{message.replyTo.authorName}</span>
          <span className="truncate max-w-md italic opacity-80">{message.replyTo.content}</span>
        </div>
      )}

      <div className="flex gap-4">
        {/* Author Avatar */}
        <Avatar
          src={author?.avatarUrl}
          name={author?.displayName || author?.username || 'User'}
          size="md"
        />

        {/* Message Body */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 leading-none mb-1">
            <span className="font-semibold text-sm text-white hover:underline cursor-pointer">
              {author?.displayName || author?.username || 'User'}
            </span>
            <span className="text-[11px] text-[#949ba4]">
              {dateString} at {timeString}
            </span>
            {message.isEdited && (
              <span className="text-[10px] text-[#949ba4]">(edited)</span>
            )}
          </div>

          {/* Text Content */}
          <div className="text-sm text-[#dbdee1] break-words select-text">
            {renderMarkdown(message.content)}
          </div>

          {/* Attachments Preview */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-2 space-y-2">
              {message.attachments.map((att, idx) => (
                <div key={idx} className="max-w-md rounded-lg overflow-hidden border border-[#232428] bg-[#1e1f22]">
                  {att.type.startsWith('image/') || att.url.startsWith('data:image') || att.url.endsWith('.png') || att.url.endsWith('.jpg') ? (
                    <img
                      src={att.url}
                      alt={att.name}
                      className="max-h-80 w-auto object-contain cursor-pointer rounded-lg hover:opacity-95 transition-opacity"
                      onClick={() => window.open(att.url, '_blank')}
                    />
                  ) : (
                    <div className="p-3 flex items-center justify-between text-xs">
                      <span className="font-mono text-[#dbdee1] truncate">{att.name}</span>
                      <a
                        href={att.url}
                        download={att.name}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#5865F2] hover:underline"
                      >
                        Download
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Reactions Row */}
          {message.reactions && message.reactions.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
              {message.reactions.map((r) => {
                const hasReacted = currentUser && r.users?.includes(currentUser.id);
                return (
                  <button
                    key={r.emoji}
                    onClick={() => onReact(message.id, r.emoji)}
                    className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs border transition-colors ${
                      hasReacted
                        ? 'bg-[#5865F2]/20 border-[#5865F2] text-[#5865F2]'
                        : 'bg-[#2b2d31] border-[#383a40] text-[#b5bac1] hover:bg-[#35373c]'
                    }`}
                  >
                    <span>{r.emoji}</span>
                    <span className="font-semibold text-[11px]">{r.count}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Floating Hover Action Toolbar */}
      <div className="absolute top-0 right-4 -translate-y-1/2 hidden group-hover:flex items-center bg-[#313338] border border-[#232428] rounded-md shadow-md overflow-hidden z-10">
        {/* Quick Reactions */}
        <div className="flex items-center border-r border-[#232428]">
          {quickEmojis.slice(0, 3).map((emoji) => (
            <button
              key={emoji}
              onClick={() => onReact(message.id, emoji)}
              className="p-1.5 hover:bg-[#383a40] transition-colors text-xs"
              title={`React with ${emoji}`}
            >
              {emoji}
            </button>
          ))}
        </div>

        {/* Reply */}
        <button
          onClick={() => onReply(message)}
          className="p-1.5 hover:bg-[#383a40] text-[#b5bac1] hover:text-white transition-colors"
          title="Reply"
        >
          <Reply className="w-4 h-4" />
        </button>

        {/* Delete (if author) */}
        {isAuthor && (
          <button
            onClick={() => onDelete(message.id)}
            className="p-1.5 hover:bg-[#383a40] text-[#f23f43] transition-colors"
            title="Delete Message"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
