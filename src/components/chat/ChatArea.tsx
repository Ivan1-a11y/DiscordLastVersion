import React, { useEffect, useRef, useState } from 'react';
import { Hash, Volume2, Bell, Pin, Users, Phone, PhoneOff, Video, Mic, MicOff, Headphones, MoreVertical, UserMinus, Ban } from 'lucide-react';
import { useChatStore } from '../../store/useChatStore';
import { useServerStore } from '../../store/useServerStore';
import { useFriendStore } from '../../store/useFriendStore';
import { useVoiceStore } from '../../store/useVoiceStore';
import { MessageItem } from './MessageItem';
import { MessageInput } from './MessageInput';
import { Avatar } from '../common/Avatar';
import { StatusBadge } from '../common/StatusBadge';
import { ConfirmModal } from '../common/ConfirmModal';
import { getSocket } from '../../lib/socket';

export const ChatArea: React.FC = () => {
  const {
    messages,
    isLoading,
    typingUsers,
    replyingTo,
    fetchChannelMessages,
    fetchDMMessages,
    sendChannelMessage,
    sendDMMessage,
    deleteChannelMessage,
    deleteDMMessage,
    toggleChannelReaction,
    toggleDMReaction,
    setReplyingTo,
    addMessage,
    removeMessage,
    updateMessageReactions,
    setTypingUser,
    clearTypingUsers,
  } = useChatStore();

  const { servers, currentServerId, currentChannelId } = useServerStore();
  const { activeDMUser, removeFriend, blockUser } = useFriendStore();
  const [isDMMenuOpen, setIsDMMenuOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'remove' | 'block' | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const {
    startDirectCall,
    isDirectCall,
    directCallUser,
    toggleMute,
    toggleDeafen,
    leaveVoiceChannel,
    participants,
    isMuted,
    isDeafened,
  } = useVoiceStore();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentServer = servers.find((s) => s.id === currentServerId);
  const currentChannel = currentServer?.channels.find((c) => c.id === currentChannelId);

  // Load messages when currentChannelId changes or activeDMUser changes
  useEffect(() => {
    clearTypingUsers();
    if (currentChannelId) {
      fetchChannelMessages(currentChannelId);
      const socket = getSocket();
      socket.emit('channel:join', { channelId: currentChannelId });

      return () => {
        socket.emit('channel:leave', { channelId: currentChannelId });
      };
    } else if (activeDMUser) {
      fetchDMMessages(activeDMUser.id);
      const socket = getSocket();
      socket.emit('dm:join', { targetUserId: activeDMUser.id });

      return () => {
        socket.emit('dm:leave', { targetUserId: activeDMUser.id });
      };
    }
  }, [currentChannelId, activeDMUser?.id]);

  // Socket event listeners for real-time messages & reactions
  useEffect(() => {
    const socket = getSocket();

    const handleNewChannelMessage = ({ channelId, message }: any) => {
      if (channelId === currentChannelId) {
        addMessage(message);
      }
    };

    const handleDeletedChannelMessage = ({ channelId, messageId }: any) => {
      if (channelId === currentChannelId) {
        removeMessage(messageId);
      }
    };

    const handleReactionsUpdatedChannel = ({ channelId, messageId, reactions }: any) => {
      if (channelId === currentChannelId) {
        updateMessageReactions(messageId, reactions);
      }
    };

    const handleNewDM = ({ message }: any) => {
      if (activeDMUser && (message.senderId === activeDMUser.id || message.receiverId === activeDMUser.id)) {
        addMessage(message);
      }
    };

    const handleDeletedDM = ({ messageId }: any) => {
      removeMessage(messageId);
    };

    const handleReactionsUpdatedDM = ({ messageId, reactions }: any) => {
      updateMessageReactions(messageId, reactions);
    };

    const handleTypingChannel = ({ channelId, user, isTyping }: any) => {
      if (channelId === currentChannelId) {
        setTypingUser(user, isTyping);
      }
    };

    const handleTypingDM = ({ senderId, user, isTyping }: any) => {
      if (activeDMUser && activeDMUser.id === senderId) {
        setTypingUser(user, isTyping);
      }
    };

    socket.on('message:new_channel', handleNewChannelMessage);
    socket.on('message:deleted_channel', handleDeletedChannelMessage);
    socket.on('message:reactions_updated_channel', handleReactionsUpdatedChannel);
    socket.on('message:new_dm', handleNewDM);
    socket.on('message:deleted_dm', handleDeletedDM);
    socket.on('message:reactions_updated_dm', handleReactionsUpdatedDM);
    socket.on('user:typing_channel', handleTypingChannel);
    socket.on('user:typing_dm', handleTypingDM);

    return () => {
      socket.off('message:new_channel', handleNewChannelMessage);
      socket.off('message:deleted_channel', handleDeletedChannelMessage);
      socket.off('message:reactions_updated_channel', handleReactionsUpdatedChannel);
      socket.off('message:new_dm', handleNewDM);
      socket.off('message:deleted_dm', handleDeletedDM);
      socket.off('message:reactions_updated_dm', handleReactionsUpdatedDM);
      socket.off('user:typing_channel', handleTypingChannel);
      socket.off('user:typing_dm', handleTypingDM);
    };
  }, [currentChannelId, activeDMUser?.id]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSendMessage = async (content: string, attachments?: any[]) => {
    if (currentChannelId) {
      await sendChannelMessage(currentChannelId, content, attachments);
    } else if (activeDMUser) {
      await sendDMMessage(activeDMUser.id, content, attachments);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (currentChannelId) {
      await deleteChannelMessage(currentChannelId, messageId);
    } else if (activeDMUser) {
      await deleteDMMessage(activeDMUser.id, messageId);
    }
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    if (currentChannelId) {
      await toggleChannelReaction(currentChannelId, messageId, emoji);
    } else if (activeDMUser) {
      await toggleDMReaction(activeDMUser.id, messageId, emoji);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen bg-[#313338] select-none overflow-hidden">
      {/* Channel / DM Header */}
      <div className="h-12 px-4 border-b border-[#1f2023] flex items-center justify-between shadow-xs shrink-0 bg-[#313338]">
        {currentChannel ? (
          <div className="flex items-center gap-2 truncate">
            <Hash className="w-6 h-6 text-[#80848e] shrink-0" />
            <h3 className="font-bold text-white text-base truncate">{currentChannel.name}</h3>
            {currentChannel.topic && (
              <>
                <div className="w-[1px] h-4 bg-[#4e5058] mx-2 hidden sm:block" />
                <p className="text-xs text-[#949ba4] truncate max-w-md hidden sm:block">
                  {currentChannel.topic}
                </p>
              </>
            )}
          </div>
        ) : activeDMUser ? (
          <>
            <div className="flex items-center gap-3 truncate">
              <Avatar
                src={activeDMUser.avatarUrl}
                name={activeDMUser.displayName || activeDMUser.username}
                size="sm"
                status={activeDMUser.status}
              />
              <div className="truncate">
                <h3 className="font-bold text-white text-sm leading-tight truncate">
                  {activeDMUser.displayName || activeDMUser.username}
                </h3>
                <p className="text-[11px] text-[#949ba4] leading-tight truncate">
                  {activeDMUser.customStatus || `@${activeDMUser.username}#${activeDMUser.tag}`}
                </p>
              </div>
            </div>

            {/* Direct Message Call Controls */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => startDirectCall(activeDMUser, false)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md font-semibold text-xs transition-colors shadow-xs ${
                  isDirectCall && directCallUser?.id === activeDMUser.id
                    ? 'bg-[#23a55a] text-white hover:bg-[#1f9250]'
                    : 'bg-[#2b2d31] hover:bg-[#23a55a] text-[#dbdee1] hover:text-white'
                }`}
                title="Начать голосовой звонок (Voice Call)"
              >
                <Phone className="w-4 h-4" />
                <span>
                  {isDirectCall && directCallUser?.id === activeDMUser.id ? 'В звонке' : 'Позвонить'}
                </span>
              </button>

              <button
                onClick={() => startDirectCall(activeDMUser, true)}
                className="p-2 rounded-md bg-[#2b2d31] hover:bg-[#5865F2] text-[#dbdee1] hover:text-white transition-colors"
                title="Начать видеозвонок (Video Call)"
              >
                <Video className="w-4 h-4" />
              </button>

              {/* More Actions Menu */}
              <div className="relative">
                <button
                  onClick={() => setIsDMMenuOpen(!isDMMenuOpen)}
                  className="p-2 rounded-md bg-[#2b2d31] hover:bg-[#35373c] text-[#dbdee1] hover:text-white transition-colors"
                  title="Дополнительные действия"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>

                {isDMMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsDMMenuOpen(false)}
                    />
                    <div className="absolute right-0 top-10 z-50 w-48 bg-[#111214] p-1.5 rounded-lg shadow-xl border border-[#232428] space-y-0.5 animate-in fade-in duration-150">
                      <button
                        onClick={() => {
                          setIsDMMenuOpen(false);
                          setConfirmAction('remove');
                        }}
                        className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded text-xs font-medium text-[#dbdee1] hover:bg-[#da373c] hover:text-white transition-colors"
                      >
                        <UserMinus className="w-4 h-4 shrink-0 text-[#f23f43] group-hover:text-white" />
                        <span>Удалить из друзей</span>
                      </button>

                      <button
                        onClick={() => {
                          setIsDMMenuOpen(false);
                          setConfirmAction('block');
                        }}
                        className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded text-xs font-medium text-[#dbdee1] hover:bg-[#da373c] hover:text-white transition-colors"
                      >
                        <Ban className="w-4 h-4 shrink-0 text-[#f23f43] group-hover:text-white" />
                        <span>Заблокировать</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </>
        ) : (
          <div />
        )}
      </div>

      {/* Active 1-on-1 Direct Call Panel */}
      {isDirectCall && directCallUser && (
        <div className="bg-[#232428] border-b border-[#1f2023] px-4 py-3 flex items-center justify-between animate-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <Avatar
              src={directCallUser.avatarUrl}
              name={directCallUser.displayName || directCallUser.username}
              size="md"
              isSpeaking={participants.some((p) => p.userId === directCallUser.id && p.isSpeaking)}
            />
            <div>
              <p className="text-sm font-bold text-white flex items-center gap-2">
                <span>Звонок с {directCallUser.displayName || directCallUser.username}</span>
                <span className="text-[10px] bg-[#23a55a]/20 text-[#23a55a] px-2 py-0.5 rounded-full font-mono border border-[#23a55a]/30">
                  RTC Active
                </span>
              </p>
              <p className="text-xs text-[#949ba4]">
                {participants.length > 0 ? 'Соединение установлено' : 'Вызов / Ожидание ответа...'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleMute}
              className={`p-2 rounded-full transition-colors ${
                isMuted ? 'bg-[#f23f43] text-white' : 'bg-[#383a40] text-white hover:bg-[#474a52]'
              }`}
              title={isMuted ? 'Включить микрофон' : 'Выключить микрофон'}
            >
              {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            <button
              onClick={toggleDeafen}
              className={`p-2 rounded-full transition-colors ${
                isDeafened ? 'bg-[#f23f43] text-white' : 'bg-[#383a40] text-white hover:bg-[#474a52]'
              }`}
              title={isDeafened ? 'Включить звук' : 'Заглушить звук'}
            >
              <Headphones className="w-4 h-4" />
            </button>

            <button
              onClick={leaveVoiceChannel}
              className="px-3.5 py-1.5 rounded-lg bg-[#f23f43] hover:bg-[#da373b] text-white text-xs font-semibold flex items-center gap-1.5 shadow-md transition-colors"
              title="Завершить звонок"
            >
              <PhoneOff className="w-4 h-4" />
              <span>Завершить</span>
            </button>
          </div>
        </div>
      )}

      {/* Messages Scrollable List */}
      <div className="flex-1 overflow-y-auto py-4 space-y-1">
        {/* Welcome Banner at Top of Stream */}
        <div className="px-4 pb-6 pt-2">
          {currentChannel ? (
            <div className="space-y-1">
              <div className="w-16 h-16 rounded-full bg-[#2b2d31] flex items-center justify-center text-white mb-2">
                <Hash className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-bold text-white">Welcome to #{currentChannel.name}!</h2>
              <p className="text-xs text-[#949ba4]">
                This is the start of the #{currentChannel.name} channel.
              </p>
            </div>
          ) : activeDMUser ? (
            <div className="space-y-1">
              <Avatar
                src={activeDMUser.avatarUrl}
                name={activeDMUser.displayName || activeDMUser.username}
                size="lg"
              />
              <h2 className="text-2xl font-bold text-white pt-2">
                {activeDMUser.displayName || activeDMUser.username}
              </h2>
              <p className="text-xs text-[#949ba4]">
                This is the beginning of your direct message history with @{activeDMUser.username}.
              </p>
            </div>
          ) : null}
        </div>

        {/* Message Items */}
        {messages.map((message) => (
          <MessageItem
            key={message.id}
            message={message}
            onReply={(msg) => {
              const authorName = (msg as any).author?.displayName || (msg as any).author?.username || 'User';
              setReplyingTo({ id: msg.id, authorName, content: msg.content });
            }}
            onDelete={handleDeleteMessage}
            onReact={handleReaction}
          />
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Typing Indicator Bar */}
      <div className="h-5 px-4 text-xs text-[#949ba4] flex items-center">
        {typingUsers.length > 0 && (
          <div className="flex items-center gap-1.5 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-[#5865F2]" />
            <span>
              <strong>
                {typingUsers.map((u) => u.displayName || u.username).join(', ')}
              </strong>{' '}
              {typingUsers.length === 1 ? 'is' : 'are'} typing...
            </span>
          </div>
        )}
      </div>

      {/* Message Input Box */}
      <MessageInput
        placeholder={
          currentChannel
            ? `Message #${currentChannel.name}`
            : activeDMUser
            ? `Message @${activeDMUser.displayName || activeDMUser.username}`
            : 'Type a message...'
        }
        onSend={handleSendMessage}
        replyingTo={replyingTo}
        onCancelReply={() => setReplyingTo(null)}
        channelId={currentChannelId || undefined}
        dmUserId={activeDMUser?.id}
      />

      {/* Confirmation Modal for Remove Friend & Block User */}
      {activeDMUser && (
        <ConfirmModal
          isOpen={Boolean(confirmAction)}
          title={
            confirmAction === 'remove'
              ? `Удалить "${activeDMUser.displayName || activeDMUser.username}" из друзей?`
              : `Заблокировать "${activeDMUser.displayName || activeDMUser.username}"?`
          }
          description={
            confirmAction === 'remove' ? (
              <span>
                Вы уверены, что хотите удалить пользователя{' '}
                <strong className="text-white">
                  @{activeDMUser.username}#{activeDMUser.tag}
                </strong>{' '}
                из списка друзей?
              </span>
            ) : (
              <span>
                Вы уверены, что хотите заблокировать{' '}
                <strong className="text-white">
                  @{activeDMUser.username}#{activeDMUser.tag}
                </strong>
                ? Пользователь будет удален из друзей и больше не сможет отправлять вам сообщения.
              </span>
            )
          }
          confirmLabel={confirmAction === 'remove' ? 'Удалить из друзей' : 'Заблокировать'}
          cancelLabel="Отмена"
          variant="danger"
          isLoading={actionLoading}
          onConfirm={async () => {
            setActionLoading(true);
            try {
              if (confirmAction === 'remove') {
                await removeFriend(activeDMUser.id);
              } else if (confirmAction === 'block') {
                await blockUser(activeDMUser.id);
              }
              setConfirmAction(null);
            } catch (err) {
              console.error(err);
            } finally {
              setActionLoading(false);
            }
          }}
          onClose={() => !actionLoading && setConfirmAction(null)}
        />
      )}
    </div>
  );
};
