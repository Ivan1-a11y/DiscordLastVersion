import React from 'react';
import { Mic, MicOff, Headphones, Settings } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useVoiceStore } from '../../store/useVoiceStore';
import { Avatar } from '../common/Avatar';

export const UserControlsBar: React.FC = () => {
  const { user, openSettings } = useAuthStore();
  const { isMuted, isDeafened, toggleMute, toggleDeafen, isSpeaking } = useVoiceStore();

  const displayName = user?.displayName || user?.username || 'Мой аккаунт';
  const displayTag = user?.customStatus
    ? user.customStatus
    : user?.tag
    ? `#${user.tag}`
    : user?.username
    ? `@${user.username}`
    : 'Нажмите для настроек';

  return (
    <div className="h-[52px] bg-[#232428] px-2 flex items-center justify-between shrink-0 select-none border-t border-[#1f2023] w-full z-10">
      {/* User Info (Click opens Settings) */}
      <button
        onClick={openSettings}
        className="flex items-center gap-2 p-1 rounded-md hover:bg-[#35373c] transition-colors truncate text-left min-w-0 flex-1 mr-1 group cursor-pointer"
        title="Настройки профиля и пользователя"
      >
        <Avatar
          src={user?.avatarUrl}
          name={displayName}
          size="sm"
          status={user?.status || 'ONLINE'}
          isSpeaking={isSpeaking}
        />
        <div className="truncate min-w-0">
          <p className="text-sm font-semibold text-white leading-tight truncate group-hover:text-[#dbdee1]">
            {displayName}
          </p>
          <p className="text-[11px] text-[#949ba4] leading-tight truncate">
            {displayTag}
          </p>
        </div>
      </button>

      {/* Quick Controls */}
      <div className="flex items-center gap-0.5 shrink-0 text-[#b5bac1]">
        {/* Mute Button */}
        <button
          onClick={toggleMute}
          className={`p-1.5 rounded hover:bg-[#35373c] transition-colors cursor-pointer ${
            isMuted ? 'text-[#f23f43] hover:text-[#da373b]' : 'hover:text-[#dbdee1]'
          }`}
          title={isMuted ? 'Включить микрофон' : 'Отключить микрофон'}
        >
          {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        {/* Deafen Button */}
        <button
          onClick={toggleDeafen}
          className={`p-1.5 rounded hover:bg-[#35373c] transition-colors cursor-pointer ${
            isDeafened ? 'text-[#f23f43] hover:text-[#da373b]' : 'hover:text-[#dbdee1]'
          }`}
          title={isDeafened ? 'Включить звук' : 'Заглушить звук'}
        >
          {isDeafened ? (
            <div className="relative">
              <Headphones className="w-5 h-5 text-[#f23f43]" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-full h-0.5 bg-[#f23f43] rotate-45" />
              </div>
            </div>
          ) : (
            <Headphones className="w-5 h-5" />
          )}
        </button>

        {/* User Settings */}
        <button
          onClick={openSettings}
          className="p-1.5 rounded hover:bg-[#35373c] hover:text-[#dbdee1] transition-colors cursor-pointer"
          title="Настройки пользователя"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
