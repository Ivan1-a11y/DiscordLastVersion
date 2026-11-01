import React, { useEffect } from 'react';
import { Phone, PhoneOff, Video } from 'lucide-react';
import { useVoiceStore } from '../../store/useVoiceStore';
import { Avatar } from '../common/Avatar';
import { playTestSound } from '../../lib/audioUtils';

export const IncomingCallDialog: React.FC = () => {
  const { incomingCall, acceptDirectCall, declineDirectCall } = useVoiceStore();

  useEffect(() => {
    if (incomingCall) {
      // Play ringing sound
      playTestSound();
      const interval = setInterval(() => {
        playTestSound();
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [incomingCall]);

  if (!incomingCall) return null;

  return (
    <div className="fixed top-6 right-6 z-50 flex items-center gap-4 bg-[#111214] border-2 border-[#5865F2] p-4 rounded-xl shadow-2xl animate-in slide-in-from-top-4 duration-300">
      <div className="relative">
        <Avatar
          src={incomingCall.caller.avatarUrl}
          name={incomingCall.caller.displayName || incomingCall.caller.username}
          size="lg"
          className="animate-pulse"
        />
        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#23a55a] flex items-center justify-center text-white">
          <Phone className="w-3 h-3" />
        </div>
      </div>

      <div className="space-y-1">
        <p className="text-xs uppercase font-bold text-[#5865F2] tracking-wider">
          Incoming {incomingCall.isVideo ? 'Video' : 'Voice'} Call
        </p>
        <h4 className="text-sm font-bold text-white">
          {incomingCall.caller.displayName || incomingCall.caller.username}
        </h4>
        <p className="text-xs text-[#949ba4]">is calling you...</p>
      </div>

      <div className="flex items-center gap-2 pl-2">
        <button
          onClick={acceptDirectCall}
          className="w-10 h-10 rounded-full bg-[#23a55a] hover:bg-[#1f9250] text-white flex items-center justify-center shadow-lg transition-transform hover:scale-105"
          title="Accept Call"
        >
          <Phone className="w-5 h-5" />
        </button>

        <button
          onClick={declineDirectCall}
          className="w-10 h-10 rounded-full bg-[#f23f43] hover:bg-[#da373b] text-white flex items-center justify-center shadow-lg transition-transform hover:scale-105"
          title="Decline Call"
        >
          <PhoneOff className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
