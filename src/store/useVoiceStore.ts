import { create } from 'zustand';
import { VoiceParticipant, User } from '../types';
import { voiceManager } from '../lib/webrtc';
import { getSocket } from '../lib/socket';
import { useAuthStore } from './useAuthStore';

interface IncomingCallInfo {
  caller: User;
  channelId: string;
  isVideo?: boolean;
}

interface VoiceState {
  activeVoiceChannelId: string | null;
  activeVoiceServerId: string | null;
  activeChannelName: string | null;
  isMuted: boolean;
  isDeafened: boolean;
  isSpeaking: boolean;
  participants: VoiceParticipant[];
  incomingCall: IncomingCallInfo | null;
  isDirectCall: boolean;
  directCallUser: User | null;

  // Actions
  joinVoiceChannel: (channelId: string, serverId: string, channelName: string) => Promise<void>;
  leaveVoiceChannel: () => void;
  startDirectCall: (targetUser: User, isVideo?: boolean) => Promise<void>;
  setIncomingCall: (call: IncomingCallInfo | null) => void;
  acceptDirectCall: () => Promise<void>;
  declineDirectCall: () => void;
  toggleMute: () => void;
  toggleDeafen: () => void;
  setSpeaking: (isSpeaking: boolean) => void;
  setParticipants: (participants: VoiceParticipant[]) => void;
  addParticipant: (participant: VoiceParticipant) => void;
  removeParticipant: (userId: string) => void;
  updateParticipantState: (userId: string, data: Partial<VoiceParticipant>) => void;
}

export const useVoiceStore = create<VoiceState>((set, get) => ({
  activeVoiceChannelId: null,
  activeVoiceServerId: null,
  activeChannelName: null,
  isMuted: false,
  isDeafened: false,
  isSpeaking: false,
  participants: [],
  incomingCall: null,
  isDirectCall: false,
  directCallUser: null,

  joinVoiceChannel: async (channelId, serverId, channelName) => {
    const { isMuted, isDeafened } = get();
    const { audioSettings } = useAuthStore.getState();

    // Hook speaking activity callback
    voiceManager.onSpeakingChange = (speaking) => {
      set({ isSpeaking: speaking });
    };

    const currentUser = useAuthStore.getState().user;
    voiceManager.setMyUserId(currentUser?.id || null);

    set({
      activeVoiceChannelId: channelId,
      activeVoiceServerId: serverId,
      activeChannelName: channelName,
      isDirectCall: serverId === 'dm',
      participants: [],
    });

    await voiceManager.joinChannel(
      channelId,
      isMuted,
      isDeafened,
      audioSettings.inputDeviceId,
      audioSettings.outputDeviceId,
      audioSettings.echoCancellation,
      audioSettings.noiseSuppression
    );
  },

  startDirectCall: async (targetUser, isVideo = false) => {
    const currentUser = useAuthStore.getState().user;
    if (!currentUser) return;

    // Deterministic direct call room ID
    const sorted = [currentUser.id, targetUser.id].sort();
    const callRoomId = `call_${sorted.join('_')}`;

    set({
      isDirectCall: true,
      directCallUser: targetUser,
    });

    // Join room
    await get().joinVoiceChannel(callRoomId, 'dm', targetUser.displayName || targetUser.username);

    // Ring other user
    const socket = getSocket();
    socket.emit('call:initiate', {
      toUserId: targetUser.id,
      channelId: callRoomId,
      isVideo,
    });
  },

  setIncomingCall: (incomingCall) => set({ incomingCall }),

  acceptDirectCall: async () => {
    const call = get().incomingCall;
    if (!call) return;

    const socket = getSocket();
    socket.emit('call:accept', {
      toUserId: call.caller.id,
      channelId: call.channelId,
    });

    set({
      incomingCall: null,
      isDirectCall: true,
      directCallUser: call.caller,
    });

    await get().joinVoiceChannel(call.channelId, 'dm', call.caller.displayName || call.caller.username);
  },

  declineDirectCall: () => {
    const call = get().incomingCall;
    if (call) {
      const socket = getSocket();
      socket.emit('call:decline', {
        toUserId: call.caller.id,
        channelId: call.channelId,
      });
      set({ incomingCall: null });
    }
  },

  leaveVoiceChannel: () => {
    const { activeVoiceChannelId, isDirectCall, directCallUser } = get();

    if (isDirectCall && directCallUser && activeVoiceChannelId) {
      const socket = getSocket();
      socket.emit('call:end', {
        toUserId: directCallUser.id,
        channelId: activeVoiceChannelId,
      });
    }

    voiceManager.leaveChannel();
    set({
      activeVoiceChannelId: null,
      activeVoiceServerId: null,
      activeChannelName: null,
      isSpeaking: false,
      participants: [],
      isDirectCall: false,
      directCallUser: null,
    });
  },

  toggleMute: () => {
    const nextMuted = !get().isMuted;
    set({ isMuted: nextMuted });
    voiceManager.setMuted(nextMuted);
  },

  toggleDeafen: () => {
    const nextDeafened = !get().isDeafened;
    set({
      isDeafened: nextDeafened,
      isMuted: nextDeafened ? true : get().isMuted,
    });
    voiceManager.setDeafened(nextDeafened);
  },

  setSpeaking: (isSpeaking) => set({ isSpeaking }),

  setParticipants: (participants) => {
    set({ participants });
    participants.forEach((p) => {
      voiceManager.initiatePeerConnection(p.userId);
    });
  },

  addParticipant: (participant) => {
    set((state) => {
      if (state.participants.some((p) => p.userId === participant.userId)) {
        return state;
      }
      return { participants: [...state.participants, participant] };
    });
  },

  removeParticipant: (userId) => {
    voiceManager.removePeer(userId);
    set((state) => ({
      participants: state.participants.filter((p) => p.userId !== userId),
    }));
  },

  updateParticipantState: (userId, data) => {
    set((state) => ({
      participants: state.participants.map((p) => {
        if (p.userId !== userId) return p;
        return { ...p, ...data };
      }),
    }));
  },
}));
