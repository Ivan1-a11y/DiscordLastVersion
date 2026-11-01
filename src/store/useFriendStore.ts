import { create } from 'zustand';
import { Friend, FriendRequest, User } from '../types';
import { apiRequest, getAuthToken } from '../api/client';

export type FriendTab = 'online' | 'all' | 'pending' | 'blocked' | 'add';

interface Conversation {
  user: User;
  lastMessage: any;
}

interface FriendState {
  friends: Friend[];
  incomingRequests: FriendRequest[];
  outgoingRequests: FriendRequest[];
  blockedUsers: Array<{ id: string; blockedUser: User }>;
  conversations: Conversation[];
  activeTab: FriendTab;
  activeDMUser: User | null;
  isLoading: boolean;

  // Actions
  fetchFriends: () => Promise<void>;
  fetchRequests: () => Promise<void>;
  fetchConversations: () => Promise<void>;
  setActiveTab: (tab: FriendTab) => void;
  setActiveDMUser: (user: User | null) => void;
  sendFriendRequest: (usernameTag: string) => Promise<string>;
  acceptRequest: (requestId: string) => Promise<void>;
  declineRequest: (requestId: string) => Promise<void>;
  removeFriend: (friendId: string) => Promise<void>;
  blockUser: (userId: string) => Promise<void>;
  unblockUser: (userId: string) => Promise<{ message: string; restoredFriendship?: boolean; success?: boolean } | void>;
  updateUserPresence: (userId: string, status: any, customStatus?: string) => void;
}

export const useFriendStore = create<FriendState>((set, get) => ({
  friends: [],
  incomingRequests: [],
  outgoingRequests: [],
  blockedUsers: [],
  conversations: [],
  activeTab: 'online',
  activeDMUser: null,
  isLoading: false,

  fetchFriends: async () => {
    if (!getAuthToken()) {
      set({ friends: [] });
      return;
    }
    try {
      const res = await apiRequest<{ friends: Friend[] }>('/friends');
      set({ friends: res.friends });
    } catch (err: any) {
      if (!err?.message?.includes('Unauthorized')) {
        console.error('Failed to fetch friends', err);
      }
    }
  },

  fetchRequests: async () => {
    if (!getAuthToken()) {
      set({ incomingRequests: [], outgoingRequests: [], blockedUsers: [] });
      return;
    }
    try {
      const res = await apiRequest<{
        incoming: FriendRequest[];
        outgoing: FriendRequest[];
        blocked: Array<{ id: string; blockedUser: User }>;
      }>('/friends/requests');

      set({
        incomingRequests: res.incoming,
        outgoingRequests: res.outgoing,
        blockedUsers: res.blocked,
      });
    } catch (err: any) {
      if (!err?.message?.includes('Unauthorized')) {
        console.error('Failed to fetch requests', err);
      }
    }
  },

  fetchConversations: async () => {
    if (!getAuthToken()) {
      set({ conversations: [] });
      return;
    }
    try {
      const res = await apiRequest<{ conversations: Conversation[] }>('/dms/conversations');
      set({ conversations: res.conversations });
    } catch (err: any) {
      if (!err?.message?.includes('Unauthorized')) {
        console.error('Failed to fetch conversations', err);
      }
    }
  },

  setActiveTab: (tab) => set({ activeTab: tab, activeDMUser: null }),

  setActiveDMUser: (user) => set({ activeDMUser: user }),

  sendFriendRequest: async (usernameTag) => {
    const res = await apiRequest<{ message: string }>('/friends/request', {
      method: 'POST',
      body: JSON.stringify({ usernameTag }),
    });
    get().fetchRequests();
    get().fetchFriends();
    return res.message;
  },

  acceptRequest: async (requestId) => {
    await apiRequest(`/friends/request/${requestId}/accept`, {
      method: 'POST',
    });
    get().fetchRequests();
    get().fetchFriends();
  },

  declineRequest: async (requestId) => {
    await apiRequest(`/friends/request/${requestId}/decline`, {
      method: 'POST',
    });
    get().fetchRequests();
  },

  removeFriend: async (friendId) => {
    try {
      // Optimistic update
      set(state => ({
        friends: state.friends.filter(f => f.user.id !== friendId && f.id !== friendId),
        activeDMUser: state.activeDMUser?.id === friendId ? null : state.activeDMUser,
      }));
      await apiRequest(`/friends/${friendId}`, {
        method: 'DELETE',
      });
      await Promise.all([
        get().fetchFriends(),
        get().fetchRequests(),
        get().fetchConversations(),
      ]);
    } catch (err) {
      console.error('Failed to remove friend', err);
      // Re-fetch friends to restore state on failure
      get().fetchFriends();
      throw err;
    }
  },

  blockUser: async (userId) => {
    try {
      // Optimistic update: remove from friends immediately
      set(state => ({
        friends: state.friends.filter(f => f.user.id !== userId && f.id !== userId),
        activeDMUser: state.activeDMUser?.id === userId ? null : state.activeDMUser,
      }));
      await apiRequest(`/friends/${userId}/block`, {
        method: 'POST',
      });
      await Promise.all([
        get().fetchFriends(),
        get().fetchRequests(),
        get().fetchConversations(),
      ]);
    } catch (err) {
      console.error('Failed to block user', err);
      get().fetchFriends();
      get().fetchRequests();
      throw err;
    }
  },

  unblockUser: async (userId) => {
    try {
      set(state => ({
        blockedUsers: state.blockedUsers.filter(
          b => b.blockedUser?.id !== userId && b.id !== userId
        ),
      }));
      const res = await apiRequest<{ message: string; restoredFriendship?: boolean; success?: boolean }>(
        `/friends/${userId}/unblock`,
        { method: 'DELETE' }
      );
      await Promise.all([
        get().fetchRequests(),
        get().fetchFriends(),
        get().fetchConversations(),
      ]);
      return res;
    } catch (err) {
      console.error('Failed to unblock user', err);
      get().fetchRequests();
      get().fetchFriends();
      throw err;
    }
  },

  updateUserPresence: (userId, status, customStatus) => {
    set(state => ({
      friends: state.friends.map(f => {
        if (f.user.id !== userId) return f;
        return {
          ...f,
          user: {
            ...f.user,
            status,
            customStatus: customStatus !== undefined ? customStatus : f.user.customStatus,
          },
        };
      }),
      activeDMUser: state.activeDMUser?.id === userId ? {
        ...state.activeDMUser,
        status,
        customStatus: customStatus !== undefined ? customStatus : state.activeDMUser.customStatus,
      } : state.activeDMUser,
    }));
  },
}));
