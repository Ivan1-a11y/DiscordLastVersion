import { create } from 'zustand';
import { Server, Channel, Role } from '../types';
import { apiRequest, getAuthToken } from '../api/client';

interface ServerState {
  servers: Server[];
  currentServerId: string | null;
  currentChannelId: string | null;
  isLoading: boolean;
  isCreateServerOpen: boolean;
  isJoinServerOpen: boolean;
  isCreateChannelOpen: boolean;
  isServerSettingsOpen: boolean;
  isInstallModalOpen: boolean;

  // Actions
  fetchServers: () => Promise<void>;
  selectServer: (serverId: string | null) => void;
  selectChannel: (channelId: string | null) => void;
  createServer: (name: string, iconUrl?: string, description?: string) => Promise<Server>;
  joinServer: (inviteCode: string) => Promise<Server>;
  createChannel: (serverId: string, name: string, type: 'TEXT' | 'VOICE', categoryId?: string, topic?: string) => Promise<Channel>;
  deleteChannel: (serverId: string, channelId: string) => Promise<void>;
  createRole: (serverId: string, roleData: Partial<Role>) => Promise<Role>;
  updateRole: (serverId: string, roleId: string, roleData: Partial<Role>) => Promise<Role>;
  leaveServer: (serverId: string) => Promise<void>;
  openCreateServer: () => void;
  closeCreateServer: () => void;
  openJoinServer: () => void;
  closeJoinServer: () => void;
  openCreateChannel: () => void;
  closeCreateChannel: () => void;
  openServerSettings: () => void;
  closeServerSettings: () => void;
  openInstallModal: () => void;
  closeInstallModal: () => void;
}

export const useServerStore = create<ServerState>((set, get) => ({
  servers: [],
  currentServerId: null, // null means Home/DMs view
  currentChannelId: null,
  isLoading: false,
  isCreateServerOpen: false,
  isJoinServerOpen: false,
  isCreateChannelOpen: false,
  isServerSettingsOpen: false,
  isInstallModalOpen: false,

  fetchServers: async () => {
    if (!getAuthToken()) {
      set({ servers: [], isLoading: false });
      return;
    }
    set({ isLoading: true });
    try {
      const res = await apiRequest<{ servers: Server[] }>('/servers');
      set({ servers: res.servers, isLoading: false });

      // If user has servers and none selected, or selected server was removed
      const current = get().currentServerId;
      if (current && !res.servers.some(s => s.id === current)) {
        set({ currentServerId: null, currentChannelId: null });
      }
    } catch (err: any) {
      set({ isLoading: false });
      if (!err?.message?.includes('Unauthorized')) {
        console.error('Failed to fetch servers', err);
      }
    }
  },

  selectServer: (serverId) => {
    set({ currentServerId: serverId });
    if (serverId) {
      const server = get().servers.find(s => s.id === serverId);
      if (server && server.channels.length > 0) {
        // Find first text channel or first channel
        const firstText = server.channels.find(c => c.type === 'TEXT') || server.channels[0];
        set({ currentChannelId: firstText.id });
      } else {
        set({ currentChannelId: null });
      }
    } else {
      set({ currentChannelId: null });
    }
  },

  selectChannel: (channelId) => {
    set({ currentChannelId: channelId });
  },

  createServer: async (name, iconUrl, description) => {
    const res = await apiRequest<{ server: Server }>('/servers', {
      method: 'POST',
      body: JSON.stringify({ name, iconUrl, description }),
    });
    set(state => ({
      servers: [...state.servers, res.server],
      currentServerId: res.server.id,
      currentChannelId: res.server.channels[0]?.id || null,
      isCreateServerOpen: false,
    }));
    return res.server;
  },

  joinServer: async (inviteCode) => {
    const res = await apiRequest<{ server: Server }>('/servers/join/' + encodeURIComponent(inviteCode), {
      method: 'POST',
    });
    set(state => {
      const exists = state.servers.some(s => s.id === res.server.id);
      return {
        servers: exists ? state.servers.map(s => s.id === res.server.id ? res.server : s) : [...state.servers, res.server],
        currentServerId: res.server.id,
        currentChannelId: res.server.channels[0]?.id || null,
        isJoinServerOpen: false,
      };
    });
    return res.server;
  },

  createChannel: async (serverId, name, type, categoryId, topic) => {
    const res = await apiRequest<{ channel: Channel }>(`/servers/${serverId}/channels`, {
      method: 'POST',
      body: JSON.stringify({ name, type, categoryId, topic }),
    });

    set(state => ({
      servers: state.servers.map(s => {
        if (s.id !== serverId) return s;
        return {
          ...s,
          channels: [...s.channels, res.channel],
        };
      }),
      currentChannelId: res.channel.id,
      isCreateChannelOpen: false,
    }));
    return res.channel;
  },

  deleteChannel: async (serverId, channelId) => {
    await apiRequest(`/servers/${serverId}/channels/${channelId}`, {
      method: 'DELETE',
    });

    set(state => {
      const updatedServers = state.servers.map(s => {
        if (s.id !== serverId) return s;
        return {
          ...s,
          channels: s.channels.filter(c => c.id !== channelId),
        };
      });
      const activeServer = updatedServers.find(s => s.id === serverId);
      const nextChannel = activeServer?.channels[0]?.id || null;

      return {
        servers: updatedServers,
        currentChannelId: state.currentChannelId === channelId ? nextChannel : state.currentChannelId,
      };
    });
  },

  createRole: async (serverId, roleData) => {
    const res = await apiRequest<{ role: Role }>(`/servers/${serverId}/roles`, {
      method: 'POST',
      body: JSON.stringify(roleData),
    });

    set(state => ({
      servers: state.servers.map(s => {
        if (s.id !== serverId) return s;
        return {
          ...s,
          roles: [...s.roles, res.role],
        };
      }),
    }));
    return res.role;
  },

  updateRole: async (serverId, roleId, roleData) => {
    const res = await apiRequest<{ role: Role }>(`/servers/${serverId}/roles/${roleId}`, {
      method: 'PATCH',
      body: JSON.stringify(roleData),
    });

    set(state => ({
      servers: state.servers.map(s => {
        if (s.id !== serverId) return s;
        return {
          ...s,
          roles: s.roles.map(r => r.id === roleId ? res.role : r),
        };
      }),
    }));
    return res.role;
  },

  leaveServer: async (serverId) => {
    await apiRequest(`/servers/${serverId}/leave`, {
      method: 'POST',
    });

    set(state => ({
      servers: state.servers.filter(s => s.id !== serverId),
      currentServerId: state.currentServerId === serverId ? null : state.currentServerId,
      currentChannelId: state.currentServerId === serverId ? null : state.currentChannelId,
      isServerSettingsOpen: false,
    }));
  },

  openCreateServer: () => set({ isCreateServerOpen: true }),
  closeCreateServer: () => set({ isCreateServerOpen: false }),
  openJoinServer: () => set({ isJoinServerOpen: true }),
  closeJoinServer: () => set({ isJoinServerOpen: false }),
  openCreateChannel: () => set({ isCreateChannelOpen: true }),
  closeCreateChannel: () => set({ isCreateChannelOpen: false }),
  openServerSettings: () => set({ isServerSettingsOpen: true }),
  closeServerSettings: () => set({ isServerSettingsOpen: false }),
  openInstallModal: () => set({ isInstallModalOpen: true }),
  closeInstallModal: () => set({ isInstallModalOpen: false }),
}));
