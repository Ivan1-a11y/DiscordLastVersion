import { Server as SocketIOServer, Socket } from 'socket.io';
import { verifyToken } from './auth.js';
import { db } from './db.js';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  username?: string;
  currentVoiceChannelId?: string;
}

export function setupSocketServer(io: SocketIOServer) {
  // Map of userId -> Set of socket IDs
  const userSockets = new Map<string, Set<string>>();

  io.use((socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
    if (token) {
      const payload = verifyToken(token);
      if (payload) {
        socket.userId = payload.userId;
        socket.username = payload.username;
      }
    }
    // Allow connection even without token initially, client can authenticate afterwards
    next();
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    const registerUserSocket = (userId: string) => {
      socket.userId = userId;
      if (!userSockets.has(userId)) {
        userSockets.set(userId, new Set());
      }
      userSockets.get(userId)!.add(socket.id);
      socket.join(`user:${userId}`);

      // Broadcast user online
      const user = db.getUserById(userId);
      if (user) {
        user.status = 'ONLINE';
        io.emit('user:presence', { userId, status: 'ONLINE', customStatus: user.customStatus });
      }
    };

    if (socket.userId) {
      registerUserSocket(socket.userId);
    }

    // Explicit client authentication event
    socket.on('auth:authenticate', ({ token }: { token: string }) => {
      const payload = verifyToken(token);
      if (payload) {
        registerUserSocket(payload.userId);
        socket.emit('auth:success', { userId: payload.userId });
      }
    });

    // ==========================================
    // TEXT CHANNELS & ROOMS
    // ==========================================
    socket.on('channel:join', ({ channelId }: { channelId: string }) => {
      socket.join(`channel:${channelId}`);
    });

    socket.on('channel:leave', ({ channelId }: { channelId: string }) => {
      socket.leave(`channel:${channelId}`);
    });

    socket.on('message:send_channel', ({ channelId, message }: { channelId: string; message: any }) => {
      io.to(`channel:${channelId}`).emit('message:new_channel', { channelId, message });
    });

    socket.on('message:delete_channel', ({ channelId, messageId }: { channelId: string; messageId: string }) => {
      io.to(`channel:${channelId}`).emit('message:deleted_channel', { channelId, messageId });
    });

    socket.on('message:react_channel', ({ channelId, messageId, reactions }: { channelId: string; messageId: string; reactions: any[] }) => {
      io.to(`channel:${channelId}`).emit('message:reactions_updated_channel', { channelId, messageId, reactions });
    });

    // ==========================================
    // DIRECT MESSAGES (DMs)
    // ==========================================
    socket.on('dm:join', ({ targetUserId }: { targetUserId: string }) => {
      if (!socket.userId) return;
      const room = [socket.userId, targetUserId].sort().join(':');
      socket.join(`dm:${room}`);
    });

    socket.on('dm:leave', ({ targetUserId }: { targetUserId: string }) => {
      if (!socket.userId) return;
      const room = [socket.userId, targetUserId].sort().join(':');
      socket.leave(`dm:${room}`);
    });

    socket.on('message:send_dm', ({ receiverId, message }: { receiverId: string; message: any }) => {
      if (!socket.userId) return;
      const room = [socket.userId, receiverId].sort().join(':');
      io.to(`dm:${room}`).emit('message:new_dm', { message });

      // Notify the receiver's personal user room if not in chat
      io.to(`user:${receiverId}`).emit('notification:dm', {
        senderId: socket.userId,
        message,
      });
    });

    socket.on('message:react_dm', ({ receiverId, messageId, reactions }: { receiverId: string; messageId: string; reactions: any[] }) => {
      if (!socket.userId) return;
      const room = [socket.userId, receiverId].sort().join(':');
      io.to(`dm:${room}`).emit('message:reactions_updated_dm', { messageId, reactions });
    });

    socket.on('message:delete_dm', ({ receiverId, messageId }: { receiverId: string; messageId: string }) => {
      if (!socket.userId) return;
      const room = [socket.userId, receiverId].sort().join(':');
      io.to(`dm:${room}`).emit('message:deleted_dm', { messageId });
    });

    // ==========================================
    // TYPING INDICATORS
    // ==========================================
    socket.on('typing:channel', ({ channelId, isTyping }: { channelId: string; isTyping: boolean }) => {
      if (!socket.userId) return;
      const user = db.getUserById(socket.userId);
      if (!user) return;
      socket.to(`channel:${channelId}`).emit('user:typing_channel', {
        channelId,
        user: db.sanitizeUser(user),
        isTyping,
      });
    });

    socket.on('typing:dm', ({ receiverId, isTyping }: { receiverId: string; isTyping: boolean }) => {
      if (!socket.userId) return;
      const user = db.getUserById(socket.userId);
      if (!user) return;
      const room = [socket.userId, receiverId].sort().join(':');
      socket.to(`dm:${room}`).emit('user:typing_dm', {
        senderId: socket.userId,
        user: db.sanitizeUser(user),
        isTyping,
      });
    });

    // ==========================================
    // WEBRTC VOICE CHANNELS & SIGNALING
    // ==========================================
    socket.on('voice:join', ({ channelId, isMuted = false, isDeafened = false }: { channelId: string; isMuted?: boolean; isDeafened?: boolean }) => {
      if (!socket.userId) return;
      const userId = socket.userId;
      const user = db.getUserById(userId);
      if (!user) return;

      // If user was previously in another channel, leave it first
      if (socket.currentVoiceChannelId && socket.currentVoiceChannelId !== channelId) {
        const oldChannelId = socket.currentVoiceChannelId;
        socket.leave(`voice:${oldChannelId}`);
        db.voiceParticipants.delete(userId);
        io.to(`voice:${oldChannelId}`).emit('voice:user_left', { userId, channelId: oldChannelId });
      }

      socket.currentVoiceChannelId = channelId;
      socket.join(`voice:${channelId}`);

      // Add to database participants
      db.voiceParticipants.set(userId, {
        userId,
        channelId,
        isMuted,
        isDeafened,
        isSpeaking: false,
        joinedAt: new Date().toISOString(),
      });

      // Get existing participants in this voice channel
      const existingParticipants = Array.from(db.voiceParticipants.values())
        .filter(p => p.channelId === channelId && p.userId !== userId)
        .map(p => {
          const u = db.getUserById(p.userId);
          return {
            ...p,
            user: u ? db.sanitizeUser(u) : null,
          };
        });

      // Send the current list of participants to the joining user
      socket.emit('voice:existing_participants', {
        channelId,
        participants: existingParticipants,
      });

      // Broadcast to others in the voice channel that new user joined
      socket.to(`voice:${channelId}`).emit('voice:user_joined', {
        participant: {
          userId,
          channelId,
          isMuted,
          isDeafened,
          isSpeaking: false,
          joinedAt: new Date().toISOString(),
          user: db.sanitizeUser(user),
        },
      });
    });

    socket.on('voice:leave', () => {
      if (!socket.userId || !socket.currentVoiceChannelId) return;
      const channelId = socket.currentVoiceChannelId;
      const userId = socket.userId;

      socket.leave(`voice:${channelId}`);
      db.voiceParticipants.delete(userId);
      socket.currentVoiceChannelId = undefined;

      io.to(`voice:${channelId}`).emit('voice:user_left', { userId, channelId });
    });

    // WebRTC Peer-to-Peer signaling relay
    socket.on('voice:signal', ({ toUserId, signalData }: { toUserId: string; signalData: any }) => {
      if (!socket.userId) return;
      // Send directly to the target user's personal room
      io.to(`user:${toUserId}`).emit('voice:signal', {
        fromUserId: socket.userId,
        signalData,
      });
    });

    // Voice State Updates (Speaking indicator, Mute, Deafen)
    socket.on('voice:state_change', ({ isMuted, isDeafened, isSpeaking }: { isMuted?: boolean; isDeafened?: boolean; isSpeaking?: boolean }) => {
      if (!socket.userId || !socket.currentVoiceChannelId) return;
      const userId = socket.userId;
      const channelId = socket.currentVoiceChannelId;

      const participant = db.voiceParticipants.get(userId);
      if (participant) {
        if (isMuted !== undefined) participant.isMuted = isMuted;
        if (isDeafened !== undefined) participant.isDeafened = isDeafened;
        if (isSpeaking !== undefined) participant.isSpeaking = isSpeaking;

        io.to(`voice:${channelId}`).emit('voice:user_state_updated', {
          userId,
          channelId,
          isMuted: participant.isMuted,
          isDeafened: participant.isDeafened,
          isSpeaking: participant.isSpeaking,
        });
      }
    });

    // ==========================================
    // 1-ON-1 DIRECT CALLS
    // ==========================================
    socket.on('call:initiate', ({ toUserId, channelId, isVideo = false }: { toUserId: string; channelId: string; isVideo?: boolean }) => {
      if (!socket.userId) return;
      const caller = db.getUserById(socket.userId);
      if (!caller) return;

      io.to(`user:${toUserId}`).emit('call:incoming', {
        caller: db.sanitizeUser(caller),
        channelId,
        isVideo,
      });
    });

    socket.on('call:accept', ({ toUserId, channelId }: { toUserId: string; channelId: string }) => {
      io.to(`user:${toUserId}`).emit('call:accepted', {
        fromUserId: socket.userId,
        channelId,
      });
    });

    socket.on('call:decline', ({ toUserId, channelId }: { toUserId: string; channelId: string }) => {
      io.to(`user:${toUserId}`).emit('call:declined', {
        fromUserId: socket.userId,
        channelId,
      });
    });

    socket.on('call:end', ({ toUserId, channelId }: { toUserId: string; channelId: string }) => {
      io.to(`user:${toUserId}`).emit('call:ended', {
        fromUserId: socket.userId,
        channelId,
      });
    });

    // ==========================================
    // DISCONNECT
    // ==========================================
    socket.on('disconnect', () => {
      if (socket.userId) {
        const userId = socket.userId;
        const set = userSockets.get(userId);
        if (set) {
          set.delete(socket.id);
          if (set.size === 0) {
            userSockets.delete(userId);
            // Mark user offline
            const user = db.getUserById(userId);
            if (user) {
              user.status = 'OFFLINE';
              io.emit('user:presence', { userId, status: 'OFFLINE' });
            }
          }
        }

        // Clean up voice channel if in one
        if (socket.currentVoiceChannelId) {
          const channelId = socket.currentVoiceChannelId;
          db.voiceParticipants.delete(userId);
          io.to(`voice:${channelId}`).emit('voice:user_left', { userId, channelId });
        }
      }
    });
  });
}
