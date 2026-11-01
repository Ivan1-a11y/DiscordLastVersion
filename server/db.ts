import bcrypt from 'bcryptjs';

export interface DBUser {
  id: string;
  username: string;
  tag: string;
  displayName: string;
  email: string;
  passwordHash: string;
  avatarUrl?: string | null;
  bannerUrl?: string | null;
  bio?: string | null;
  status: 'ONLINE' | 'IDLE' | 'DND' | 'OFFLINE';
  customStatus?: string | null;
  createdAt: string;
}

export interface DBFriendRequest {
  id: string;
  senderId: string;
  receiverId: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED';
  createdAt: string;
}

export interface DBFriendship {
  id: string;
  userId1: string;
  userId2: string;
  createdAt: string;
}

export interface DBBlockedUser {
  id: string;
  blockerId: string;
  blockedId: string;
  wasFriend?: boolean;
  createdAt: string;
}

export interface DBRole {
  id: string;
  serverId: string;
  name: string;
  color: string;
  hoist: boolean;
  position: number;
  manageChannels: boolean;
  kickMembers: boolean;
  banMembers: boolean;
  sendMessages: boolean;
  connectVoice: boolean;
  administrator: boolean;
}

export interface DBMember {
  id: string;
  serverId: string;
  userId: string;
  nickname?: string | null;
  roleIds: string[];
  joinedAt: string;
}

export interface DBChannel {
  id: string;
  serverId: string;
  categoryId?: string | null;
  name: string;
  type: 'TEXT' | 'VOICE';
  topic?: string | null;
  order: number;
  isPrivate: boolean;
  createdAt: string;
}

export interface DBCategory {
  id: string;
  serverId: string;
  name: string;
  order: number;
}

export interface DBServer {
  id: string;
  name: string;
  iconUrl?: string | null;
  description?: string | null;
  inviteCode: string;
  ownerId: string;
  createdAt: string;
}

export interface DBReaction {
  id: string;
  emoji: string;
  userId: string;
}

export interface DBServerMessage {
  id: string;
  channelId: string;
  authorId: string;
  content: string;
  attachments?: Array<{ id: string; name: string; url: string; size: number; type: string }>;
  replyToId?: string | null;
  reactions: DBReaction[];
  isEdited: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DBDirectMessage {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  attachments?: Array<{ id: string; name: string; url: string; size: number; type: string }>;
  replyToId?: string | null;
  reactions: DBReaction[];
  isEdited: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DBVoiceParticipant {
  userId: string;
  channelId: string;
  isMuted: boolean;
  isDeafened: boolean;
  isSpeaking: boolean;
  joinedAt: string;
}

// In-Memory Database Store
class InMemoryDatabase {
  users: Map<string, DBUser> = new Map();
  friendRequests: Map<string, DBFriendRequest> = new Map();
  friendships: Map<string, DBFriendship> = new Map();
  blockedUsers: Map<string, DBBlockedUser> = new Map();
  previousFriendships: Map<string, { userId1: string; userId2: string; removedAt: string }> = new Map();
  servers: Map<string, DBServer> = new Map();
  categories: Map<string, DBCategory> = new Map();
  channels: Map<string, DBChannel> = new Map();
  roles: Map<string, DBRole> = new Map();
  members: Map<string, DBMember> = new Map();
  serverMessages: Map<string, DBServerMessage> = new Map();
  directMessages: Map<string, DBDirectMessage> = new Map();
  voiceParticipants: Map<string, DBVoiceParticipant> = new Map(); // key = userId

  constructor() {
    this.seed();
  }

  private async seed() {
    const passwordHash = bcrypt.hashSync('password123', 10);

    // 1. Seed Users
    const u1: DBUser = {
      id: 'usr_alex',
      username: 'alex',
      tag: '1001',
      displayName: 'Alex Rivera',
      email: 'alex@accord.chat',
      passwordHash,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      bannerUrl: null,
      bio: 'Full-Stack Architect & Open Source enthusiast. Building WebRTC and real-time mesh systems.',
      status: 'ONLINE',
      customStatus: 'Coding Discord from scratch 🚀',
      createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
    };

    const u2: DBUser = {
      id: 'usr_elena',
      username: 'elena',
      tag: '2048',
      displayName: 'Elena Rostova',
      email: 'elena@accord.chat',
      passwordHash,
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      bannerUrl: null,
      bio: 'UI/UX Designer & sound enthusiast. Dark mode evangelist.',
      status: 'IDLE',
      customStatus: '🎧 Listening to Synthwave Chill',
      createdAt: new Date(Date.now() - 86400000 * 25).toISOString(),
    };

    const u3: DBUser = {
      id: 'usr_marcus',
      username: 'marcus',
      tag: '9900',
      displayName: 'Marcus Chen',
      email: 'marcus@accord.chat',
      passwordHash,
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      bannerUrl: null,
      bio: 'Backend & Cloud Infra engineer. Rust, Go, Node.js.',
      status: 'DND',
      customStatus: 'Do Not Disturb // Compiling kernels',
      createdAt: new Date(Date.now() - 86400000 * 20).toISOString(),
    };

    const u4: DBUser = {
      id: 'usr_sophia',
      username: 'sophia',
      tag: '4512',
      displayName: 'Sophia Martin',
      email: 'sophia@accord.chat',
      passwordHash,
      avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
      bannerUrl: null,
      bio: 'Pixel artist and gamer. Cozy vibes only!',
      status: 'ONLINE',
      customStatus: 'Playing Cyberpunk 2077',
      createdAt: new Date(Date.now() - 86400000 * 15).toISOString(),
    };

    this.users.set(u1.id, u1);
    this.users.set(u2.id, u2);
    this.users.set(u3.id, u3);
    this.users.set(u4.id, u4);

    // 2. Seed Friendships between Alex and others
    this.friendships.set('f1', { id: 'f1', userId1: u1.id, userId2: u2.id, createdAt: new Date().toISOString() });
    this.friendships.set('f2', { id: 'f2', userId1: u1.id, userId2: u3.id, createdAt: new Date().toISOString() });

    // Seed pending friend request from Sophia to Alex
    this.friendRequests.set('fr1', {
      id: 'fr1',
      senderId: u4.id,
      receiverId: u1.id,
      status: 'PENDING',
      createdAt: new Date().toISOString()
    });

    // 3. Seed Server: Accord Lounge
    const server1: DBServer = {
      id: 'srv_accord_hq',
      name: 'Accord Community HQ',
      iconUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128&auto=format&fit=crop&q=80',
      description: 'Official community hub for Accord developers, gamers, and friends.',
      inviteCode: 'accord-hq',
      ownerId: u1.id,
      createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    };
    this.servers.set(server1.id, server1);

    // Roles for Server 1
    const rAdmin: DBRole = {
      id: 'role_admin_1',
      serverId: server1.id,
      name: 'Founder / Admin',
      color: '#ED4245',
      hoist: true,
      position: 1,
      manageChannels: true,
      kickMembers: true,
      banMembers: true,
      sendMessages: true,
      connectVoice: true,
      administrator: true,
    };
    const rMod: DBRole = {
      id: 'role_mod_1',
      serverId: server1.id,
      name: 'Moderator',
      color: '#FEE75C',
      hoist: true,
      position: 2,
      manageChannels: true,
      kickMembers: true,
      banMembers: true,
      sendMessages: true,
      connectVoice: true,
      administrator: false,
    };
    const rMember: DBRole = {
      id: 'role_member_1',
      serverId: server1.id,
      name: 'Community Member',
      color: '#5865F2',
      hoist: true,
      position: 3,
      manageChannels: false,
      kickMembers: false,
      banMembers: false,
      sendMessages: true,
      connectVoice: true,
      administrator: false,
    };
    this.roles.set(rAdmin.id, rAdmin);
    this.roles.set(rMod.id, rMod);
    this.roles.set(rMember.id, rMember);

    // Members for Server 1
    this.members.set('m1', {
      id: 'm1',
      serverId: server1.id,
      userId: u1.id,
      nickname: 'Alex (Lead)',
      roleIds: [rAdmin.id],
      joinedAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    });
    this.members.set('m2', {
      id: 'm2',
      serverId: server1.id,
      userId: u2.id,
      nickname: 'Elena Designer',
      roleIds: [rMod.id],
      joinedAt: new Date(Date.now() - 86400000 * 9).toISOString(),
    });
    this.members.set('m3', {
      id: 'm3',
      serverId: server1.id,
      userId: u3.id,
      nickname: 'Marcus DevOps',
      roleIds: [rMember.id],
      joinedAt: new Date(Date.now() - 86400000 * 8).toISOString(),
    });
    this.members.set('m4', {
      id: 'm4',
      serverId: server1.id,
      userId: u4.id,
      nickname: 'Sophia M.',
      roleIds: [rMember.id],
      joinedAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    });

    // Categories for Server 1
    const catInfo: DBCategory = { id: 'cat_info', serverId: server1.id, name: 'WELCOME & RULES', order: 1 };
    const catText: DBCategory = { id: 'cat_text', serverId: server1.id, name: 'TEXT CHANNELS', order: 2 };
    const catVoice: DBCategory = { id: 'cat_voice', serverId: server1.id, name: 'VOICE CHANNELS', order: 3 };
    this.categories.set(catInfo.id, catInfo);
    this.categories.set(catText.id, catText);
    this.categories.set(catVoice.id, catVoice);

    // Channels for Server 1
    const chRules: DBChannel = {
      id: 'ch_rules',
      serverId: server1.id,
      categoryId: catInfo.id,
      name: 'rules-and-info',
      type: 'TEXT',
      topic: 'Be respectful, no spam, and enjoy your time here.',
      order: 1,
      isPrivate: false,
      createdAt: new Date().toISOString(),
    };
    const chGeneral: DBChannel = {
      id: 'ch_general',
      serverId: server1.id,
      categoryId: catText.id,
      name: 'general',
      type: 'TEXT',
      topic: 'General hangout and chit-chat about anything tech or gaming.',
      order: 1,
      isPrivate: false,
      createdAt: new Date().toISOString(),
    };
    const chDev: DBChannel = {
      id: 'ch_dev',
      serverId: server1.id,
      categoryId: catText.id,
      name: 'dev-chat',
      type: 'TEXT',
      topic: 'Architecture discussions, code snippets, and WebRTC debugging.',
      order: 2,
      isPrivate: false,
      createdAt: new Date().toISOString(),
    };
    const chVoiceLounge: DBChannel = {
      id: 'ch_v_lounge',
      serverId: server1.id,
      categoryId: catVoice.id,
      name: 'Lounge Voice',
      type: 'VOICE',
      topic: 'General voice hangout',
      order: 1,
      isPrivate: false,
      createdAt: new Date().toISOString(),
    };
    const chVoiceGaming: DBChannel = {
      id: 'ch_v_gaming',
      serverId: server1.id,
      categoryId: catVoice.id,
      name: 'Gaming Room 1',
      type: 'VOICE',
      topic: 'Co-op gaming audio',
      order: 2,
      isPrivate: false,
      createdAt: new Date().toISOString(),
    };

    this.channels.set(chRules.id, chRules);
    this.channels.set(chGeneral.id, chGeneral);
    this.channels.set(chDev.id, chDev);
    this.channels.set(chVoiceLounge.id, chVoiceLounge);
    this.channels.set(chVoiceGaming.id, chVoiceGaming);

    // Server Messages
    const sm1: DBServerMessage = {
      id: 'msg_1',
      channelId: chGeneral.id,
      authorId: u1.id,
      content: 'Welcome everyone to **Accord**! 🎉 This is a 100% custom full-stack Discord clone built from scratch with React, Tailwind, Express, Socket.io, and WebRTC.',
      reactions: [{ id: 'r1', emoji: '🚀', userId: u2.id }, { id: 'r2', emoji: '🔥', userId: u3.id }],
      isEdited: false,
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    };
    const sm2: DBServerMessage = {
      id: 'msg_2',
      channelId: chGeneral.id,
      authorId: u2.id,
      content: 'The dark theme UI and audio settings look slick! Testing reactions and markdown: *italics*, `code blocks`, and voice channels.',
      reactions: [{ id: 'r3', emoji: '❤️', userId: u1.id }],
      isEdited: false,
      createdAt: new Date(Date.now() - 3600000 * 1.5).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 1.5).toISOString(),
    };
    const sm3: DBServerMessage = {
      id: 'msg_3',
      channelId: chGeneral.id,
      authorId: u3.id,
      content: 'WebRTC mesh voice signaling is active! You can jump into `Lounge Voice` or `Gaming Room 1` to test voice and speaking indicators right away.',
      reactions: [{ id: 'r4', emoji: '🎙️', userId: u1.id }],
      isEdited: false,
      createdAt: new Date(Date.now() - 3600000 * 1).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 1).toISOString(),
    };

    this.serverMessages.set(sm1.id, sm1);
    this.serverMessages.set(sm2.id, sm2);
    this.serverMessages.set(sm3.id, sm3);

    // Direct Messages between Alex and Elena
    const dm1: DBDirectMessage = {
      id: 'dm_1',
      senderId: u2.id,
      receiverId: u1.id,
      content: 'Hey Alex! Did you check out the new sound test panel in User Settings?',
      reactions: [{ id: 'r5', emoji: '👍', userId: u1.id }],
      isEdited: false,
      createdAt: new Date(Date.now() - 1800000).toISOString(),
      updatedAt: new Date(Date.now() - 1800000).toISOString(),
    };
    const dm2: DBDirectMessage = {
      id: 'dm_2',
      senderId: u1.id,
      receiverId: u2.id,
      content: 'Yes! It has live Web Audio API decibel metering, echo cancellation, and noise suppression toggles. Works smoothly!',
      reactions: [{ id: 'r6', emoji: '✨', userId: u2.id }],
      isEdited: false,
      createdAt: new Date(Date.now() - 900000).toISOString(),
      updatedAt: new Date(Date.now() - 900000).toISOString(),
    };
    this.directMessages.set(dm1.id, dm1);
    this.directMessages.set(dm2.id, dm2);
  }

  // --- Helper methods ---
  getUserById(id: string): DBUser | undefined {
    return this.users.get(id);
  }

  getUserByEmail(email: string): DBUser | undefined {
    return Array.from(this.users.values()).find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  getUserByUsernameAndTag(username: string, tag?: string): DBUser | undefined {
    return Array.from(this.users.values()).find(u => {
      if (tag) {
        return u.username.toLowerCase() === username.toLowerCase() && u.tag === tag;
      }
      return u.username.toLowerCase() === username.toLowerCase();
    });
  }

  sanitizeUser(user: DBUser) {
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }

  // Servers
  getUserServers(userId: string) {
    const userMemberServerIds = Array.from(this.members.values())
      .filter(m => m.userId === userId)
      .map(m => m.serverId);

    return Array.from(this.servers.values())
      .filter(s => userMemberServerIds.includes(s.id) || s.ownerId === userId)
      .map(s => this.getFullServer(s.id, userId));
  }

  getFullServer(serverId: string, currentUserId?: string) {
    const server = this.servers.get(serverId);
    if (!server) return null;

    const categories = Array.from(this.categories.values())
      .filter(c => c.serverId === serverId)
      .sort((a, b) => a.order - b.order);

    const channels = Array.from(this.channels.values())
      .filter(c => c.serverId === serverId)
      .sort((a, b) => a.order - b.order);

    const roles = Array.from(this.roles.values())
      .filter(r => r.serverId === serverId)
      .sort((a, b) => a.position - b.position);

    const members = Array.from(this.members.values())
      .filter(m => m.serverId === serverId)
      .map(m => {
        const user = this.getUserById(m.userId);
        const memberRoles = m.roleIds.map(rid => this.roles.get(rid)).filter(Boolean) as DBRole[];
        return {
          id: m.id,
          serverId: m.serverId,
          userId: m.userId,
          nickname: m.nickname,
          joinedAt: m.joinedAt,
          user: user ? this.sanitizeUser(user) : null,
          roles: memberRoles,
        };
      });

    return {
      ...server,
      categories: categories.map(cat => ({
        ...cat,
        channels: channels.filter(ch => ch.categoryId === cat.id),
      })),
      channels,
      roles,
      members,
    };
  }
}

export const db = new InMemoryDatabase();
