import React, { useState } from 'react';
import {
  ChevronDown,
  Hash,
  Volume2,
  Plus,
  Settings,
  UserPlus,
  LogOut,
  Users,
  MessageSquare,
  Trash2,
  MicOff,
  Headphones,
  Check,
} from 'lucide-react';
import { useServerStore } from '../../store/useServerStore';
import { useFriendStore } from '../../store/useFriendStore';
import { useVoiceStore } from '../../store/useVoiceStore';
import { useAuthStore } from '../../store/useAuthStore';
import { Avatar } from '../common/Avatar';
import { ConfirmModal } from '../common/ConfirmModal';
import { VoiceStatusBar } from './VoiceStatusBar';
import { UserControlsBar } from './UserControlsBar';
import { Channel } from '../../types';

export const ChannelSidebar: React.FC = () => {
  const { user } = useAuthStore();
  const {
    servers,
    currentServerId,
    currentChannelId,
    selectChannel,
    openCreateChannel,
    openServerSettings,
    leaveServer,
    deleteChannel,
  } = useServerStore();

  const {
    friends,
    conversations,
    incomingRequests,
    activeTab,
    activeDMUser,
    setActiveTab,
    setActiveDMUser,
  } = useFriendStore();

  const {
    activeVoiceChannelId,
    joinVoiceChannel,
    leaveVoiceChannel,
    participants,
  } = useVoiceStore();

  const [isServerMenuOpen, setIsServerMenuOpen] = useState(false);
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});
  const [channelToDelete, setChannelToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isLeaveServerOpen, setIsLeaveServerOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage((prev) => (prev === msg ? null : prev)), 2500);
  };

  const currentServer = servers.find((s) => s.id === currentServerId);
  const isServerOwner = currentServer?.ownerId === user?.id;

  const toggleCategory = (categoryId: string) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  const handleVoiceChannelClick = (channel: Channel) => {
    if (activeVoiceChannelId === channel.id) {
      // If already connected and clicked, simply view channel
      selectChannel(channel.id);
    } else {
      // Connect to voice
      selectChannel(channel.id);
      joinVoiceChannel(channel.id, currentServer!.id, channel.name);
    }
  };

  return (
    <div className="w-60 h-full bg-[#2b2d31] flex flex-col shrink-0 select-none border-r border-[#1f2023] relative overflow-hidden">
      {/* ========================================================= */}
      {/* SERVER VIEW */}
      {/* ========================================================= */}
      {currentServer ? (
        <>
          {/* Server Header Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsServerMenuOpen(!isServerMenuOpen)}
              className="w-full h-12 px-4 flex items-center justify-between font-bold text-white shadow-xs border-b border-[#1f2023] hover:bg-[#35373c] transition-colors"
            >
              <span className="truncate">{currentServer.name}</span>
              <ChevronDown
                className={`w-5 h-5 text-[#949ba4] transition-transform duration-200 ${
                  isServerMenuOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Server Menu Dropdown */}
            {isServerMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsServerMenuOpen(false)}
                />
                <div className="absolute top-13 left-2 right-2 z-50 bg-[#111214] p-1.5 rounded-lg shadow-xl border border-[#232428] space-y-0.5 animate-in fade-in duration-150">
                  <button
                    onClick={() => {
                      setIsServerMenuOpen(false);
                      openServerSettings();
                    }}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs font-medium text-[#949ba4] hover:bg-[#5865F2] hover:text-white transition-colors"
                  >
                    <span>Server Settings</span>
                    <Settings className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => {
                      setIsServerMenuOpen(false);
                      openCreateChannel();
                    }}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs font-medium text-[#949ba4] hover:bg-[#5865F2] hover:text-white transition-colors"
                  >
                    <span>Create Channel</span>
                    <Plus className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => {
                      setIsServerMenuOpen(false);
                      const inviteUrl = `${window.location.origin}/join/${currentServer.inviteCode}`;
                      navigator.clipboard.writeText(inviteUrl);
                      showToast('Ссылка-приглашение скопирована в буфер обмена!');
                    }}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs font-medium text-[#5865F2] hover:bg-[#5865F2] hover:text-white transition-colors"
                  >
                    <span>Invite People</span>
                    <UserPlus className="w-4 h-4" />
                  </button>

                  <div className="h-[1px] bg-[#232428] my-1" />

                  <button
                    onClick={() => {
                      setIsServerMenuOpen(false);
                      setIsLeaveServerOpen(true);
                    }}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs font-medium text-[#f23f43] hover:bg-[#f23f43] hover:text-white transition-colors"
                  >
                    <span>Leave Server</span>
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Channels List */}
          <div className="flex-1 min-h-0 overflow-y-auto px-2 py-3 space-y-4">
            {/* Render Categories */}
            {currentServer.categories.map((category) => {
              const isCollapsed = collapsedCategories[category.id];
              return (
                <div key={category.id} className="space-y-0.5">
                  {/* Category Header */}
                  <div className="flex items-center justify-between px-1 group cursor-pointer text-[#949ba4] hover:text-[#dbdee1]">
                    <div
                      onClick={() => toggleCategory(category.id)}
                      className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider flex-1 truncate"
                    >
                      <ChevronDown
                        className={`w-3 h-3 transition-transform ${
                          isCollapsed ? '-rotate-90' : ''
                        }`}
                      />
                      <span className="truncate">{category.name}</span>
                    </div>
                    <button
                      onClick={openCreateChannel}
                      className="p-0.5 hover:text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Create Channel"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Category Channels */}
                  {!isCollapsed &&
                    category.channels.map((channel) => {
                      const isSelected = currentChannelId === channel.id;
                      const isVoiceActive = activeVoiceChannelId === channel.id;

                      if (channel.type === 'VOICE') {
                        return (
                          <div key={channel.id} className="space-y-0.5">
                            <div
                              onClick={() => handleVoiceChannelClick(channel)}
                              className={`group flex items-center justify-between px-2 py-1.5 rounded-md text-xs font-medium cursor-pointer transition-colors ${
                                isVoiceActive
                                  ? 'bg-[#35373c] text-white'
                                  : isSelected
                                  ? 'bg-[#35373c] text-[#dbdee1]'
                                  : 'text-[#949ba4] hover:bg-[#35373c]/50 hover:text-[#dbdee1]'
                              }`}
                            >
                              <div className="flex items-center gap-2 truncate">
                                <Volume2
                                  className={`w-4 h-4 shrink-0 ${
                                    isVoiceActive ? 'text-[#23a55a]' : ''
                                  }`}
                                />
                                <span className="truncate">{channel.name}</span>
                              </div>
                              {isServerOwner && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setChannelToDelete({ id: channel.id, name: channel.name });
                                  }}
                                  className="opacity-0 group-hover:opacity-100 p-1 hover:text-[#f23f43] transition-opacity"
                                  title="Delete Channel"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>

                            {/* Connected Participants Tree */}
                            {isVoiceActive && participants.length > 0 && (
                              <div className="pl-6 pr-2 space-y-1 py-1">
                                {participants.map((p) => (
                                  <div
                                    key={p.userId}
                                    className="flex items-center justify-between text-xs py-0.5"
                                  >
                                    <div className="flex items-center gap-2 truncate">
                                      <Avatar
                                        src={p.user?.avatarUrl}
                                        name={p.user?.displayName || 'User'}
                                        size="xs"
                                        isSpeaking={p.isSpeaking}
                                      />
                                      <span
                                        className={`truncate ${
                                          p.isSpeaking ? 'text-[#23a55a] font-semibold' : 'text-[#dbdee1]'
                                        }`}
                                      >
                                        {p.user?.displayName || p.user?.username}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1 text-[#949ba4]">
                                      {p.isMuted && <MicOff className="w-3 h-3 text-[#f23f43]" />}
                                      {p.isDeafened && (
                                        <Headphones className="w-3 h-3 text-[#f23f43]" />
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      }

                      // Text Channel
                      return (
                        <div
                          key={channel.id}
                          onClick={() => selectChannel(channel.id)}
                          className={`group flex items-center justify-between px-2 py-1.5 rounded-md text-xs font-medium cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-[#35373c] text-white'
                              : 'text-[#949ba4] hover:bg-[#35373c]/50 hover:text-[#dbdee1]'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <Hash className="w-4 h-4 shrink-0 text-[#80848e]" />
                            <span className="truncate">{channel.name}</span>
                          </div>
                          {isServerOwner && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setChannelToDelete({ id: channel.id, name: channel.name });
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1 hover:text-[#f23f43] transition-opacity"
                              title="Delete Channel"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                </div>
              );
            })}

            {/* Channels without Category */}
            {currentServer.channels
              .filter((c) => !c.categoryId)
              .map((channel) => {
                const isSelected = currentChannelId === channel.id;
                return (
                  <div
                    key={channel.id}
                    onClick={() =>
                      channel.type === 'VOICE'
                        ? handleVoiceChannelClick(channel)
                        : selectChannel(channel.id)
                    }
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-xs font-medium cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-[#35373c] text-white'
                        : 'text-[#949ba4] hover:bg-[#35373c]/50 hover:text-[#dbdee1]'
                    }`}
                  >
                    {channel.type === 'VOICE' ? (
                      <Volume2 className="w-4 h-4 text-[#80848e]" />
                    ) : (
                      <Hash className="w-4 h-4 text-[#80848e]" />
                    )}
                    <span className="truncate">{channel.name}</span>
                  </div>
                );
              })}
          </div>
        </>
      ) : (
        /* ========================================================= */
        /* DIRECT MESSAGES / HOME VIEW */
        /* ========================================================= */
        <>
          {/* Friends Navigation Header */}
          <div className="h-12 px-3 border-b border-[#1f2023] flex items-center shadow-xs">
            <button
              onClick={() => {
                setActiveTab('online');
                setActiveDMUser(null);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                !activeDMUser
                  ? 'bg-[#383a40] text-white'
                  : 'text-[#949ba4] hover:bg-[#35373c] hover:text-[#dbdee1]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-[#949ba4]" />
                <span>Friends</span>
              </div>
              {incomingRequests.length > 0 && (
                <span className="bg-[#f23f43] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {incomingRequests.length}
                </span>
              )}
            </button>
          </div>

          {/* DM Conversations List */}
          <div className="flex-1 min-h-0 overflow-y-auto px-2 py-3 space-y-1">
            <div className="flex items-center justify-between px-2 pt-2 pb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#949ba4]">
                Direct Messages
              </span>
              <button
                onClick={() => {
                  setActiveTab('all');
                  setActiveDMUser(null);
                }}
                className="text-[#949ba4] hover:text-white"
                title="Find or Start a Conversation"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* List of active friends to DM */}
            {friends.map((friend) => {
              const isSelected = activeDMUser?.id === friend.user.id;
              return (
                <div
                  key={friend.user.id}
                  onClick={() => setActiveDMUser(friend.user)}
                  className={`flex items-center gap-3 px-2 py-2 rounded-md cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-[#35373c] text-white'
                      : 'text-[#949ba4] hover:bg-[#35373c]/50 hover:text-[#dbdee1]'
                  }`}
                >
                  <Avatar
                    src={friend.user.avatarUrl}
                    name={friend.user.displayName || friend.user.username}
                    size="sm"
                    status={friend.user.status}
                  />
                  <div className="truncate flex-1">
                    <p className="text-sm font-medium leading-none truncate">
                      {friend.user.displayName || friend.user.username}
                    </p>
                    <p className="text-[11px] text-[#80848e] leading-tight truncate mt-1">
                      {friend.user.customStatus || `@${friend.user.username}`}
                    </p>
                  </div>
                </div>
              );
            })}

            {friends.length === 0 && (
              <div className="p-4 text-center">
                <p className="text-xs text-[#949ba4]">No active conversations yet.</p>
                <button
                  onClick={() => {
                    setActiveTab('add');
                    setActiveDMUser(null);
                  }}
                  className="mt-2 text-xs text-[#5865F2] hover:underline"
                >
                  Add a friend to get started!
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Voice Status Indicator if connected */}
      <VoiceStatusBar />

      {/* User Controls Panel at Bottom */}
      <UserControlsBar />

      {/* Confirm Leave Server Modal */}
      {currentServer && (
        <ConfirmModal
          isOpen={isLeaveServerOpen}
          title={`Покинуть "${currentServer.name}"?`}
          description={
            <span>
              Вы уверены, что хотите покинуть сервер{' '}
              <strong className="text-white">{currentServer.name}</strong>? 
              Вы не сможете вернуться, пока не получите новое приглашение.
            </span>
          }
          confirmLabel="Покинуть сервер"
          cancelLabel="Отмена"
          variant="danger"
          onConfirm={async () => {
            await leaveServer(currentServer.id);
            setIsLeaveServerOpen(false);
          }}
          onClose={() => setIsLeaveServerOpen(false)}
        />
      )}

      {/* Confirm Delete Channel Modal */}
      {currentServer && channelToDelete && (
        <ConfirmModal
          isOpen={Boolean(channelToDelete)}
          title={`Удалить канал #${channelToDelete.name}?`}
          description={
            <span>
              Вы уверены, что хотите удалить канал{' '}
              <strong className="text-white">#{channelToDelete.name}</strong>? 
              Все сообщения и история в этом канале будут безвозвратно удалены.
            </span>
          }
          confirmLabel="Удалить канал"
          cancelLabel="Отмена"
          variant="danger"
          onConfirm={async () => {
            await deleteChannel(currentServer.id, channelToDelete.id);
            setChannelToDelete(null);
          }}
          onClose={() => setChannelToDelete(null)}
        />
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#1e1f22] text-white text-xs px-4 py-2.5 rounded-lg shadow-2xl border border-[#35373c] flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <Check className="w-4 h-4 text-[#23a55a] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
