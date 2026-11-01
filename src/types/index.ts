export type UserStatus = 'ONLINE' | 'IDLE' | 'DND' | 'OFFLINE';

export type FriendRequestStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED';

export type ChannelType = 'TEXT' | 'VOICE';

export interface User {
  id: string;
  username: string;
  tag: string;
  displayName: string;
  email: string;
  avatarUrl?: string | null;
  bannerUrl?: string | null;
  bio?: string | null;
  status: UserStatus;
  customStatus?: string | null;
  createdAt: string;
}

export interface FriendRequest {
  id: string;
  senderId: string;
  receiverId: string;
  status: FriendRequestStatus;
  createdAt: string;
  sender?: User;
  receiver?: User;
}

export interface Friend {
  id: string;
  user: User;
  createdAt: string;
}

export interface Role {
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

export interface Member {
  id: string;
  serverId: string;
  userId: string;
  nickname?: string | null;
  joinedAt: string;
  user: User;
  roles: Role[];
}

export interface Channel {
  id: string;
  serverId: string;
  categoryId?: string | null;
  name: string;
  type: ChannelType;
  topic?: string | null;
  order: number;
  isPrivate: boolean;
  createdAt: string;
}

export interface Category {
  id: string;
  serverId: string;
  name: string;
  order: number;
  channels: Channel[];
}

export interface Server {
  id: string;
  name: string;
  iconUrl?: string | null;
  description?: string | null;
  inviteCode: string;
  ownerId: string;
  createdAt: string;
  categories: Category[];
  channels: Channel[];
  roles: Role[];
  members: Member[];
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
}

export interface Reaction {
  id: string;
  emoji: string;
  userId: string;
  count: number;
  users: string[]; // usernames or userIds
}

export interface ServerMessage {
  id: string;
  channelId: string;
  authorId: string;
  author: User;
  content: string;
  attachments?: Attachment[];
  replyToId?: string | null;
  replyTo?: {
    id: string;
    authorName: string;
    content: string;
  } | null;
  reactions: Reaction[];
  isEdited: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DirectMessage {
  id: string;
  senderId: string;
  receiverId: string;
  author: User;
  content: string;
  attachments?: Attachment[];
  replyToId?: string | null;
  replyTo?: {
    id: string;
    authorName: string;
    content: string;
  } | null;
  reactions: Reaction[];
  isEdited: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface VoiceParticipant {
  userId: string;
  user: User;
  channelId: string;
  isMuted: boolean;
  isDeafened: boolean;
  isSpeaking: boolean;
  joinedAt: string;
}
