import { create } from 'zustand';
import { ServerMessage, DirectMessage, User, Attachment, Reaction } from '../types';
import { apiRequest } from '../api/client';
import { getSocket } from '../lib/socket';

interface ChatState {
  messages: Array<ServerMessage | DirectMessage>;
  isLoading: boolean;
  typingUsers: User[];
  replyingTo: { id: string; authorName: string; content: string } | null;

  // Actions
  fetchChannelMessages: (channelId: string) => Promise<void>;
  fetchDMMessages: (userId: string) => Promise<void>;
  sendChannelMessage: (channelId: string, content: string, attachments?: Attachment[]) => Promise<void>;
  sendDMMessage: (receiverId: string, content: string, attachments?: Attachment[]) => Promise<void>;
  deleteChannelMessage: (channelId: string, messageId: string) => Promise<void>;
  deleteDMMessage: (userId: string, messageId: string) => Promise<void>;
  toggleChannelReaction: (channelId: string, messageId: string, emoji: string) => Promise<void>;
  toggleDMReaction: (userId: string, messageId: string, emoji: string) => Promise<void>;
  setReplyingTo: (reply: { id: string; authorName: string; content: string } | null) => void;
  addMessage: (message: ServerMessage | DirectMessage) => void;
  removeMessage: (messageId: string) => void;
  updateMessageReactions: (messageId: string, reactions: Reaction[]) => void;
  setTypingUser: (user: User, isTyping: boolean) => void;
  clearTypingUsers: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  isLoading: false,
  typingUsers: [],
  replyingTo: null,

  fetchChannelMessages: async (channelId) => {
    set({ isLoading: true, messages: [] });
    try {
      const res = await apiRequest<{ messages: ServerMessage[] }>(`/channels/${channelId}/messages`);
      set({ messages: res.messages, isLoading: false });
    } catch (err) {
      console.error('Failed to fetch messages', err);
      set({ isLoading: false });
    }
  },

  fetchDMMessages: async (userId) => {
    set({ isLoading: true, messages: [] });
    try {
      const res = await apiRequest<{ messages: DirectMessage[] }>(`/dms/${userId}/messages`);
      set({ messages: res.messages, isLoading: false });
    } catch (err) {
      console.error('Failed to fetch DM messages', err);
      set({ isLoading: false });
    }
  },

  sendChannelMessage: async (channelId, content, attachments) => {
    const { replyingTo } = get();
    const res = await apiRequest<{ message: ServerMessage }>(`/channels/${channelId}/messages`, {
      method: 'POST',
      body: JSON.stringify({
        content,
        attachments,
        replyToId: replyingTo?.id || null,
      }),
    });

    set(state => ({
      replyingTo: null,
      messages: state.messages.some(m => m.id === res.message.id) ? state.messages : [...state.messages, res.message],
    }));

    // Broadcast over socket
    const socket = getSocket();
    socket.emit('message:send_channel', { channelId, message: res.message });
  },

  sendDMMessage: async (receiverId, content, attachments) => {
    const { replyingTo } = get();
    const res = await apiRequest<{ message: DirectMessage }>(`/dms/${receiverId}/messages`, {
      method: 'POST',
      body: JSON.stringify({
        content,
        attachments,
        replyToId: replyingTo?.id || null,
      }),
    });

    set(state => ({
      replyingTo: null,
      messages: state.messages.some(m => m.id === res.message.id) ? state.messages : [...state.messages, res.message],
    }));

    // Broadcast over socket
    const socket = getSocket();
    socket.emit('message:send_dm', { receiverId, message: res.message });
  },

  deleteChannelMessage: async (channelId, messageId) => {
    await apiRequest(`/channels/${channelId}/messages/${messageId}`, {
      method: 'DELETE',
    });
    set(state => ({
      messages: state.messages.filter(m => m.id !== messageId),
    }));
    const socket = getSocket();
    socket.emit('message:delete_channel', { channelId, messageId });
  },

  deleteDMMessage: async (userId, messageId) => {
    await apiRequest(`/dms/${userId}/messages/${messageId}`, {
      method: 'DELETE',
    });
    set(state => ({
      messages: state.messages.filter(m => m.id !== messageId),
    }));
    const socket = getSocket();
    socket.emit('message:delete_dm', { receiverId: userId, messageId });
  },

  toggleChannelReaction: async (channelId, messageId, emoji) => {
    const res = await apiRequest<{ reactions: Reaction[] }>(`/channels/${channelId}/messages/${messageId}/reactions`, {
      method: 'POST',
      body: JSON.stringify({ emoji }),
    });

    set(state => ({
      messages: state.messages.map(m => m.id === messageId ? { ...m, reactions: res.reactions } : m),
    }));

    const socket = getSocket();
    socket.emit('message:react_channel', { channelId, messageId, reactions: res.reactions });
  },

  toggleDMReaction: async (userId, messageId, emoji) => {
    const res = await apiRequest<{ reactions: Reaction[] }>(`/dms/${userId}/messages/${messageId}/reactions`, {
      method: 'POST',
      body: JSON.stringify({ emoji }),
    });

    set(state => ({
      messages: state.messages.map(m => m.id === messageId ? { ...m, reactions: res.reactions } : m),
    }));

    const socket = getSocket();
    socket.emit('message:react_dm', { receiverId: userId, messageId, reactions: res.reactions });
  },

  setReplyingTo: (reply) => set({ replyingTo: reply }),

  addMessage: (message) => {
    set(state => {
      if (state.messages.some(m => m.id === message.id)) return state;
      return { messages: [...state.messages, message] };
    });
  },

  removeMessage: (messageId) => {
    set(state => ({
      messages: state.messages.filter(m => m.id !== messageId),
    }));
  },

  updateMessageReactions: (messageId, reactions) => {
    set(state => ({
      messages: state.messages.map(m => m.id === messageId ? { ...m, reactions } : m),
    }));
  },

  setTypingUser: (user, isTyping) => {
    set(state => {
      if (isTyping) {
        if (state.typingUsers.some(u => u.id === user.id)) return state;
        return { typingUsers: [...state.typingUsers, user] };
      } else {
        return { typingUsers: state.typingUsers.filter(u => u.id !== user.id) };
      }
    });
  },

  clearTypingUsers: () => set({ typingUsers: [] }),
}));
