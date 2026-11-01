import React from 'react';
import { ServerSidebar } from './ServerSidebar';
import { ChannelSidebar } from './ChannelSidebar';
import { MemberList } from './MemberList';
import { ChatArea } from '../chat/ChatArea';
import { VoiceRoom } from '../voice/VoiceRoom';
import { FriendsDashboard } from '../friends/FriendsDashboard';
import { SettingsModal } from '../modals/SettingsModal';
import { CreateServerModal } from '../modals/CreateServerModal';
import { JoinServerModal } from '../modals/JoinServerModal';
import { CreateChannelModal } from '../modals/CreateChannelModal';
import { ServerSettingsModal } from '../modals/ServerSettingsModal';
import { IncomingCallDialog } from '../voice/IncomingCallDialog';
import { InstallAppModal } from '../modals/InstallAppModal';
import { useServerStore } from '../../store/useServerStore';
import { useFriendStore } from '../../store/useFriendStore';

export const DiscordLayout: React.FC = () => {
  const {
    servers,
    currentServerId,
    currentChannelId,
    isInstallModalOpen,
    closeInstallModal,
  } = useServerStore();
  const { activeDMUser } = useFriendStore();

  const currentServer = servers.find((s) => s.id === currentServerId);
  const currentChannel = currentServer?.channels.find((c) => c.id === currentChannelId);

  const isVoiceChannel = currentChannel?.type === 'VOICE';

  return (
    <div className="flex w-screen h-screen overflow-hidden bg-[#1e1f22]">
      {/* 1. Leftmost Server Rail */}
      <ServerSidebar />

      {/* 2. Channels Sidebar / DM List */}
      <ChannelSidebar />

      {/* 3. Center Main View */}
      {currentServer ? (
        isVoiceChannel ? (
          <VoiceRoom />
        ) : (
          <ChatArea />
        )
      ) : activeDMUser ? (
        <ChatArea />
      ) : (
        <FriendsDashboard />
      )}

      {/* 4. Right Member List (Only shown inside Server text chat) */}
      {currentServer && !isVoiceChannel && <MemberList />}

      {/* Global Modals & Overlays */}
      <IncomingCallDialog />
      <SettingsModal />
      <CreateServerModal />
      <JoinServerModal />
      <CreateChannelModal />
      <ServerSettingsModal />
      <InstallAppModal isOpen={isInstallModalOpen} onClose={closeInstallModal} />
    </div>
  );
};
