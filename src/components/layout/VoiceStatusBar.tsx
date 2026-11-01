import React from 'react';
import { PhoneOff, Wifi, Volume2 } from 'lucide-react';
import { useVoiceStore } from '../../store/useVoiceStore';
import { useServerStore } from '../../store/useServerStore';

export const VoiceStatusBar: React.FC = () => {
  const {
    activeVoiceChannelId,
    activeVoiceServerId,
    activeChannelName,
    leaveVoiceChannel,
    isSpeaking,
  } = useVoiceStore();
  const { servers, selectServer, selectChannel } = useServerStore();

  if (!activeVoiceChannelId) return null;

  const server = servers.find(s => s.id === activeVoiceServerId);

  const handleClickChannel = () => {
    if (activeVoiceServerId) {
      selectServer(activeVoiceServerId);
      selectChannel(activeVoiceChannelId);
    }
  };

  return (
    <div className="bg-[#232428] px-3 py-2 border-b border-[#1f2023] flex items-center justify-between text-xs">
      <div
        onClick={handleClickChannel}
        className="flex items-center gap-2 cursor-pointer group truncate mr-2"
        title="Click to view voice room"
      >
        <div className="text-[#23a55a] flex items-center">
          <Wifi className="w-4 h-4 animate-pulse" />
        </div>
        <div className="truncate">
          <p className="text-[#23a55a] font-semibold flex items-center gap-1 leading-none">
            Voice Connected
            {isSpeaking && <span className="w-1.5 h-1.5 rounded-full bg-[#23a55a]" />}
          </p>
          <p className="text-[#949ba4] group-hover:underline text-[11px] truncate leading-tight mt-0.5">
            {activeChannelName || 'Voice Room'} / {server?.name || 'Server'}
          </p>
        </div>
      </div>

      <button
        onClick={leaveVoiceChannel}
        className="p-1.5 rounded text-[#f23f43] hover:bg-[#f23f43]/10 transition-colors shrink-0"
        title="Disconnect from Voice"
      >
        <PhoneOff className="w-4 h-4" />
      </button>
    </div>
  );
};
