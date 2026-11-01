import React from 'react';
import { Volume2, PhoneOff, Mic, MicOff, Headphones, Shield, Radio } from 'lucide-react';
import { useVoiceStore } from '../../store/useVoiceStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useServerStore } from '../../store/useServerStore';
import { Avatar } from '../common/Avatar';

export const VoiceRoom: React.FC = () => {
  const { user: currentUser } = useAuthStore();
  const {
    activeVoiceChannelId,
    activeChannelName,
    isMuted,
    isDeafened,
    isSpeaking,
    participants,
    toggleMute,
    toggleDeafen,
    leaveVoiceChannel,
    joinVoiceChannel,
  } = useVoiceStore();

  const { servers, currentServerId, currentChannelId } = useServerStore();
  const currentServer = servers.find((s) => s.id === currentServerId);
  const currentChannel = currentServer?.channels.find((c) => c.id === currentChannelId);

  const isCurrentChannelVoice = currentChannel?.type === 'VOICE';
  const isConnectedToThisChannel = activeVoiceChannelId === currentChannelId;

  // Build grid of participants:
  // include current user if connected + other participants in room
  const displayParticipants = [];
  if (isConnectedToThisChannel && currentUser) {
    displayParticipants.push({
      userId: currentUser.id,
      user: currentUser,
      channelId: currentChannelId!,
      isMuted,
      isDeafened,
      isSpeaking,
      joinedAt: new Date().toISOString(),
    });
  }

  participants.forEach((p) => {
    if (p.userId !== currentUser?.id) {
      displayParticipants.push(p);
    }
  });

  return (
    <div className="flex-1 flex flex-col h-screen bg-[#1e1f22] select-none overflow-hidden">
      {/* Top Header */}
      <div className="h-12 px-4 border-b border-[#151618] flex items-center justify-between shadow-xs bg-[#2b2d31]">
        <div className="flex items-center gap-2">
          <Volume2 className="w-6 h-6 text-[#23a55a]" />
          <h3 className="font-bold text-white text-base truncate">
            {currentChannel?.name || activeChannelName || 'Voice Room'}
          </h3>
          <span className="text-xs text-[#23a55a] font-medium bg-[#23a55a]/10 px-2 py-0.5 rounded-full border border-[#23a55a]/20">
            {isConnectedToThisChannel ? 'RTC Connected' : 'Voice Channel'}
          </span>
        </div>

        {isConnectedToThisChannel && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#949ba4] font-mono hidden sm:inline">
              Mesh RTC • Latency &lt; 20ms
            </span>
          </div>
        )}
      </div>

      {/* Main Participants Grid */}
      <div className="flex-1 p-6 flex flex-col justify-center items-center overflow-y-auto">
        {!isConnectedToThisChannel ? (
          <div className="text-center max-w-sm space-y-4">
            <div className="w-20 h-20 rounded-full bg-[#2b2d31] text-[#23a55a] flex items-center justify-center mx-auto shadow-xl">
              <Volume2 className="w-10 h-10" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">
                {currentChannel?.name}
              </h2>
              <p className="text-sm text-[#949ba4] mt-1">
                Click below to connect your audio stream to this voice room.
              </p>
            </div>
            <button
              onClick={() => {
                if (currentServer && currentChannel) {
                  joinVoiceChannel(currentChannel.id, currentServer.id, currentChannel.name);
                }
              }}
              className="px-6 py-2.5 rounded-lg bg-[#23a55a] hover:bg-[#1f9250] text-white font-semibold transition-colors shadow-lg shadow-[#23a55a]/20"
            >
              Join Voice Room
            </button>
          </div>
        ) : (
          <div className="w-full max-w-5xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {displayParticipants.map((p) => {
              const isMe = p.userId === currentUser?.id;
              return (
                <div
                  key={p.userId}
                  className={`relative aspect-video rounded-xl bg-[#2b2d31] border flex flex-col items-center justify-center shadow-lg transition-all ${
                    p.isSpeaking
                      ? 'border-[#23a55a] ring-2 ring-[#23a55a]/50'
                      : 'border-[#1f2023]'
                  }`}
                >
                  {/* Avatar */}
                  <Avatar
                    src={p.user?.avatarUrl}
                    name={p.user?.displayName || p.user?.username || 'User'}
                    size="xl"
                    isSpeaking={p.isSpeaking}
                  />

                  {/* Name and State Pill */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between bg-[#111214]/80 backdrop-blur-xs px-3 py-1.5 rounded-lg">
                    <span className="text-xs font-semibold text-white truncate">
                      {p.user?.displayName || p.user?.username}{' '}
                      {isMe && <span className="text-[#949ba4] font-normal">(You)</span>}
                    </span>

                    <div className="flex items-center gap-1.5 text-[#949ba4]">
                      {p.isMuted && (
                        <span title="Muted">
                          <MicOff className="w-3.5 h-3.5 text-[#f23f43]" />
                        </span>
                      )}
                      {p.isDeafened && (
                        <span title="Deafened">
                          <Headphones className="w-3.5 h-3.5 text-[#f23f43]" />
                        </span>
                      )}
                      {p.isSpeaking && (
                        <span title="Speaking">
                          <Radio className="w-3.5 h-3.5 text-[#23a55a] animate-pulse" />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Center Voice Controls Bar */}
      {isConnectedToThisChannel && (
        <div className="p-4 bg-[#2b2d31] border-t border-[#1f2023] flex items-center justify-center gap-4">
          {/* Mute Button */}
          <button
            onClick={toggleMute}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
              isMuted
                ? 'bg-[#f23f43] text-white hover:bg-[#da373b]'
                : 'bg-[#383a40] text-white hover:bg-[#474a52]'
            }`}
            title={isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Deafen Button */}
          <button
            onClick={toggleDeafen}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
              isDeafened
                ? 'bg-[#f23f43] text-white hover:bg-[#da373b]'
                : 'bg-[#383a40] text-white hover:bg-[#474a52]'
            }`}
            title={isDeafened ? 'Undeafen' : 'Deafen'}
          >
            <Headphones className="w-5 h-5" />
          </button>

          {/* Disconnect Phone */}
          <button
            onClick={leaveVoiceChannel}
            className="w-12 h-12 rounded-full bg-[#f23f43] hover:bg-[#da373b] text-white flex items-center justify-center transition-colors shadow-lg"
            title="Disconnect from Voice"
          >
            <PhoneOff className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
};
