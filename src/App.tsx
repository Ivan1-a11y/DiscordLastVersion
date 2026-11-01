/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { useAuthStore } from './store/useAuthStore';
import { useServerStore } from './store/useServerStore';
import { useFriendStore } from './store/useFriendStore';
import { useVoiceStore } from './store/useVoiceStore';
import { DiscordLayout } from './components/layout/DiscordLayout';
import { AuthModal } from './components/auth/AuthModal';
import { getSocket } from './lib/socket';
import { voiceManager } from './lib/webrtc';
import { MessageSquare } from 'lucide-react';

export default function App() {
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const { fetchServers } = useServerStore();
  const { fetchFriends, fetchRequests, fetchConversations, updateUserPresence } = useFriendStore();
  const {
    setParticipants,
    addParticipant,
    removeParticipant,
    updateParticipantState,
    setIncomingCall,
    leaveVoiceChannel,
  } = useVoiceStore();

  // 1. Initial auth check
  useEffect(() => {
    checkAuth();
  }, []);

  // 2. Fetch user servers, friends, requests when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchServers();
      fetchFriends();
      fetchRequests();
      fetchConversations();
    }
  }, [isAuthenticated]);

  // 3. Setup global WebRTC voice signaling & presence listeners
  useEffect(() => {
    const socket = getSocket();

    const handleExistingParticipants = ({ channelId, participants }: any) => {
      setParticipants(participants);
    };

    const handleUserJoinedVoice = ({ participant }: any) => {
      addParticipant(participant);
      // The joining user initiates peer connection via setParticipants(existing_participants).
      // We only initiate if we are the polite peer and no offer arrives after a brief delay.
    };

    const handleUserLeftVoice = ({ userId }: any) => {
      removeParticipant(userId);
    };

    const handleVoiceSignal = ({ fromUserId, signalData }: any) => {
      voiceManager.handleSignal(fromUserId, signalData);
    };

    const handleVoiceStateUpdated = ({ userId, isMuted, isDeafened, isSpeaking }: any) => {
      updateParticipantState(userId, { isMuted, isDeafened, isSpeaking });
    };

    const handleUserPresence = ({ userId, status, customStatus }: any) => {
      updateUserPresence(userId, status, customStatus);
    };

    const handleCallIncoming = ({ caller, channelId, isVideo }: any) => {
      setIncomingCall({ caller, channelId, isVideo });
    };

    const handleCallDeclined = () => {
      leaveVoiceChannel();
    };

    const handleCallEnded = () => {
      leaveVoiceChannel();
    };

    const handleFriendsUpdated = () => {
      if (!useAuthStore.getState().isAuthenticated) return;
      fetchFriends();
      fetchRequests();
      fetchConversations();
    };

    socket.on('voice:existing_participants', handleExistingParticipants);
    socket.on('voice:user_joined', handleUserJoinedVoice);
    socket.on('voice:user_left', handleUserLeftVoice);
    socket.on('voice:signal', handleVoiceSignal);
    socket.on('voice:user_state_updated', handleVoiceStateUpdated);
    socket.on('user:presence', handleUserPresence);
    socket.on('call:incoming', handleCallIncoming);
    socket.on('call:declined', handleCallDeclined);
    socket.on('call:ended', handleCallEnded);
    socket.on('friends:updated', handleFriendsUpdated);

    return () => {
      socket.off('voice:existing_participants', handleExistingParticipants);
      socket.off('voice:user_joined', handleUserJoinedVoice);
      socket.off('voice:user_left', handleUserLeftVoice);
      socket.off('voice:signal', handleVoiceSignal);
      socket.off('voice:user_state_updated', handleVoiceStateUpdated);
      socket.off('user:presence', handleUserPresence);
      socket.off('call:incoming', handleCallIncoming);
      socket.off('call:declined', handleCallDeclined);
      socket.off('call:ended', handleCallEnded);
      socket.off('friends:updated', handleFriendsUpdated);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="w-screen h-screen flex flex-col items-center justify-center bg-[#1e1f22] text-white">
        <div className="w-16 h-16 rounded-3xl bg-[#5865F2] flex items-center justify-center animate-bounce shadow-xl shadow-[#5865F2]/30 mb-4">
          <MessageSquare className="w-9 h-9 text-white" />
        </div>
        <p className="text-sm text-[#949ba4] font-medium tracking-wide">
          Connecting to Accord...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthModal />;
  }

  return <DiscordLayout />;
}
