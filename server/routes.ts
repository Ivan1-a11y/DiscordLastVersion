import express, { Response } from 'express';
import { db, DBUser, DBRole, DBChannel, DBCategory, DBServer } from './db.js';
import {
  generateToken,
  hashPassword,
  comparePassword,
  requireAuth,
  AuthenticatedRequest,
} from './auth.js';

const router = express.Router();

// Helper to format reactions
function formatReactions(reactions: Array<{ id: string; emoji: string; userId: string }>) {
  const grouped: Record<string, { id: string; emoji: string; count: number; users: string[] }> = {};
  for (const r of reactions) {
    if (!grouped[r.emoji]) {
      grouped[r.emoji] = { id: r.id, emoji: r.emoji, count: 0, users: [] };
    }
    grouped[r.emoji].count += 1;
    grouped[r.emoji].users.push(r.userId);
  }
  return Object.values(grouped);
}

// ==========================================
// AUTHENTICATION
// ==========================================

// Register
router.post('/auth/register', async (req, res) => {
  try {
    const { username, email, password, displayName } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email and password are required' });
    }

    if (db.getUserByEmail(email)) {
      return res.status(409).json({ error: 'Email is already registered' });
    }

    // Generate random 4-digit tag e.g. "4920"
    const tag = Math.floor(1000 + Math.random() * 9000).toString();
    const passwordHash = await hashPassword(password);
    const id = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const newUser: DBUser = {
      id,
      username: username.trim().toLowerCase(),
      tag,
      displayName: displayName?.trim() || username.trim(),
      email: email.trim().toLowerCase(),
      passwordHash,
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`,
      status: 'ONLINE',
      createdAt: new Date().toISOString(),
    };

    db.users.set(newUser.id, newUser);

    // Auto-join the default community server so the user isn't stranded
    const defaultServer = db.servers.get('srv_accord_hq');
    if (defaultServer) {
      const memberRole = Array.from(db.roles.values()).find(
        r => r.serverId === defaultServer.id && r.name === 'Community Member'
      );
      db.members.set(`m_${newUser.id}`, {
        id: `m_${newUser.id}`,
        serverId: defaultServer.id,
        userId: newUser.id,
        nickname: newUser.displayName,
        roleIds: memberRole ? [memberRole.id] : [],
        joinedAt: new Date().toISOString(),
      });
    }

    const token = generateToken({ userId: newUser.id, username: newUser.username });
    return res.status(201).json({
      token,
      user: db.sanitizeUser(newUser),
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Registration failed' });
  }
});

// Login
router.post('/auth/login', async (req, res) => {
  try {
    const { emailOrUsername, password } = req.body;
    if (!emailOrUsername || !password) {
      return res.status(400).json({ error: 'Credentials required' });
    }

    let user: DBUser | undefined;
    if (emailOrUsername.includes('@')) {
      user = db.getUserByEmail(emailOrUsername);
    } else {
      user = Array.from(db.users.values()).find(
        u => u.username.toLowerCase() === emailOrUsername.trim().toLowerCase()
      );
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    user.status = 'ONLINE';
    const token = generateToken({ userId: user.id, username: user.username });
    return res.json({
      token,
      user: db.sanitizeUser(user),
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Login failed' });
  }
});

// Current User Profile
router.get('/auth/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = db.getUserById(req.user!.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  return res.json({ user: db.sanitizeUser(user) });
});

// Update Profile
router.patch('/auth/profile', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = db.getUserById(req.user!.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const { displayName, avatarUrl, bannerUrl, bio, status, customStatus } = req.body;
  if (displayName !== undefined) user.displayName = displayName.trim();
  if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;
  if (bannerUrl !== undefined) user.bannerUrl = bannerUrl;
  if (bio !== undefined) user.bio = bio;
  if (status !== undefined) user.status = status;
  if (customStatus !== undefined) user.customStatus = customStatus;

  return res.json({ user: db.sanitizeUser(user) });
});

// Change Password
router.post('/auth/password', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const user = db.getUserById(req.user!.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Both current and new password are required' });
  }

  const isMatch = await comparePassword(currentPassword, user.passwordHash);
  if (!isMatch) {
    return res.status(400).json({ error: 'Current password does not match' });
  }

  user.passwordHash = await hashPassword(newPassword);
  return res.json({ message: 'Password updated successfully' });
});

// ==========================================
// USERS & SEARCH
// ==========================================
router.get('/users/search', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const q = ((req.query.q as string) || '').trim().toLowerCase();
  const results = Array.from(db.users.values())
    .filter(u => u.id !== req.user!.userId && (u.username.includes(q) || u.displayName.toLowerCase().includes(q)))
    .slice(0, 10)
    .map(u => db.sanitizeUser(u));

  return res.json({ users: results });
});

// ==========================================
// FRIENDS & DIRECT MESSAGES
// ==========================================

// Get Friends List
router.get('/friends', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const myId = req.user!.userId;
  const friendUserIds: string[] = [];

  for (const f of db.friendships.values()) {
    if (f.userId1 === myId) friendUserIds.push(f.userId2);
    else if (f.userId2 === myId) friendUserIds.push(f.userId1);
  }

  const friends = friendUserIds
    .map(fid => {
      const u = db.getUserById(fid);
      if (!u) return null;
      return {
        id: fid,
        user: db.sanitizeUser(u),
      };
    })
    .filter(Boolean);

  return res.json({ friends });
});

// Get Pending Requests & Blocked Users
router.get('/friends/requests', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const myId = req.user!.userId;

  const incoming = Array.from(db.friendRequests.values())
    .filter(r => r.receiverId === myId && r.status === 'PENDING')
    .map(r => {
      const sender = db.getUserById(r.senderId);
      return {
        ...r,
        sender: sender ? db.sanitizeUser(sender) : null,
      };
    });

  const outgoing = Array.from(db.friendRequests.values())
    .filter(r => r.senderId === myId && r.status === 'PENDING')
    .map(r => {
      const receiver = db.getUserById(r.receiverId);
      return {
        ...r,
        receiver: receiver ? db.sanitizeUser(receiver) : null,
      };
    });

  const blocked = Array.from(db.blockedUsers.values())
    .filter(b => b.blockerId === myId)
    .map(b => {
      const blockedUser = db.getUserById(b.blockedId);
      return {
        id: b.id,
        blockedUser: blockedUser ? db.sanitizeUser(blockedUser) : null,
      };
    });

  return res.json({ incoming, outgoing, blocked });
});

// Send Friend Request by username#tag
router.post('/friends/request', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const myId = req.user!.userId;
  const { usernameTag } = req.body;

  if (!usernameTag || typeof usernameTag !== 'string') {
    return res.status(400).json({ error: 'Please provide Username#Tag (e.g. alex#1001)' });
  }

  const parts = usernameTag.trim().split('#');
  const uname = parts[0].trim();
  const tag = parts[1]?.trim();

  const targetUser = db.getUserByUsernameAndTag(uname, tag);
  if (!targetUser) {
    return res.status(404).json({ error: `User "${usernameTag}" not found.` });
  }

  if (targetUser.id === myId) {
    return res.status(400).json({ error: 'You cannot add yourself as a friend.' });
  }

  // Check if blocked
  const isBlocked = Array.from(db.blockedUsers.values()).some(
    b => (b.blockerId === targetUser.id && b.blockedId === myId) ||
         (b.blockerId === myId && b.blockedId === targetUser.id)
  );
  if (isBlocked) {
    return res.status(403).json({ error: 'Unable to send friend request.' });
  }

  // Check if already friends
  const alreadyFriends = Array.from(db.friendships.values()).some(
    f => (f.userId1 === myId && f.userId2 === targetUser.id) ||
         (f.userId1 === targetUser.id && f.userId2 === myId)
  );
  if (alreadyFriends) {
    return res.status(400).json({ error: 'You are already friends with this user.' });
  }

  // Check existing pending request
  const existingReq = Array.from(db.friendRequests.values()).find(
    r => (r.senderId === myId && r.receiverId === targetUser.id && r.status === 'PENDING') ||
         (r.senderId === targetUser.id && r.receiverId === myId && r.status === 'PENDING')
  );

  if (existingReq) {
    if (existingReq.senderId === targetUser.id) {
      // Auto accept!
      existingReq.status = 'ACCEPTED';
      const fId = `f_${Date.now()}`;
      db.friendships.set(fId, { id: fId, userId1: myId, userId2: targetUser.id, createdAt: new Date().toISOString() });
      const io = req.app.get('io');
      if (io) {
        io.to(`user:${myId}`).emit('friends:updated');
        io.to(`user:${targetUser.id}`).emit('friends:updated');
      }
      return res.json({ message: `Friend request accepted! You and ${targetUser.displayName} are now friends.` });
    }
    return res.status(400).json({ error: 'A friend request is already pending.' });
  }

  const newReqId = `fr_${Date.now()}`;
  db.friendRequests.set(newReqId, {
    id: newReqId,
    senderId: myId,
    receiverId: targetUser.id,
    status: 'PENDING',
    createdAt: new Date().toISOString(),
  });

  const io = req.app.get('io');
  if (io) {
    io.to(`user:${targetUser.id}`).emit('friends:updated');
  }

  return res.status(201).json({ message: `Friend request sent to ${targetUser.displayName}#${targetUser.tag}!` });
});

// Accept Request
router.post('/friends/request/:id/accept', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const reqItem = db.friendRequests.get(req.params.id);
  if (!reqItem || reqItem.receiverId !== req.user!.userId) {
    return res.status(404).json({ error: 'Request not found' });
  }

  reqItem.status = 'ACCEPTED';
  const fId = `f_${Date.now()}`;
  db.friendships.set(fId, {
    id: fId,
    userId1: reqItem.senderId,
    userId2: reqItem.receiverId,
    createdAt: new Date().toISOString(),
  });

  const io = req.app.get('io');
  if (io) {
    io.to(`user:${reqItem.senderId}`).emit('friends:updated');
    io.to(`user:${reqItem.receiverId}`).emit('friends:updated');
  }

  return res.json({ message: 'Friend request accepted' });
});

// Decline Request
router.post('/friends/request/:id/decline', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const reqItem = db.friendRequests.get(req.params.id);
  if (!reqItem || (reqItem.receiverId !== req.user!.userId && reqItem.senderId !== req.user!.userId)) {
    return res.status(404).json({ error: 'Request not found' });
  }

  reqItem.status = 'DECLINED';
  db.friendRequests.delete(req.params.id);

  const io = req.app.get('io');
  if (io) {
    io.to(`user:${reqItem.senderId}`).emit('friends:updated');
    io.to(`user:${reqItem.receiverId}`).emit('friends:updated');
  }

  return res.json({ message: 'Request removed' });
});

// Remove Friend (supports user ID or friendship ID)
router.delete('/friends/:friendId', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const myId = req.user!.userId;
  const targetId = req.params.friendId;
  let targetUserId = targetId;

  for (const [key, f] of db.friendships.entries()) {
    if (
      (f.userId1 === myId && f.userId2 === targetId) ||
      (f.userId1 === targetId && f.userId2 === myId) ||
      key === targetId ||
      f.id === targetId
    ) {
      targetUserId = f.userId1 === myId ? f.userId2 : f.userId1;
      db.previousFriendships.set(`${myId}_${targetUserId}`, {
        userId1: myId,
        userId2: targetUserId,
        removedAt: new Date().toISOString(),
      });
      db.previousFriendships.set(`${targetUserId}_${myId}`, {
        userId1: myId,
        userId2: targetUserId,
        removedAt: new Date().toISOString(),
      });
      db.friendships.delete(key);
    }
  }

  // Also remove any pending friend requests between them
  for (const [key, r] of db.friendRequests.entries()) {
    if (
      (r.senderId === myId && r.receiverId === targetId) ||
      (r.senderId === targetId && r.receiverId === myId) ||
      (r.senderId === myId && r.receiverId === targetUserId) ||
      (r.senderId === targetUserId && r.receiverId === myId)
    ) {
      db.friendRequests.delete(key);
    }
  }

  const io = req.app.get('io');
  if (io) {
    io.to(`user:${myId}`).emit('friends:updated');
    io.to(`user:${targetUserId}`).emit('friends:updated');
  }

  return res.json({ message: 'Friend removed', success: true });
});

// Block User
router.post('/friends/:userId/block', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const myId = req.user!.userId;
  const targetId = req.params.userId;

  if (targetId === myId) {
    return res.status(400).json({ error: 'Cannot block yourself' });
  }

  let hadFriendship = false;
  // Remove existing friendship if any and remember it
  for (const [key, f] of db.friendships.entries()) {
    if (
      (f.userId1 === myId && f.userId2 === targetId) ||
      (f.userId1 === targetId && f.userId2 === myId) ||
      key === targetId ||
      f.id === targetId
    ) {
      hadFriendship = true;
      db.friendships.delete(key);
    }
  }

  if (hadFriendship) {
    db.previousFriendships.set(`${myId}_${targetId}`, {
      userId1: myId,
      userId2: targetId,
      removedAt: new Date().toISOString(),
    });
    db.previousFriendships.set(`${targetId}_${myId}`, {
      userId1: myId,
      userId2: targetId,
      removedAt: new Date().toISOString(),
    });
  }

  // Also remove any pending friend requests
  for (const [key, r] of db.friendRequests.entries()) {
    if (
      (r.senderId === myId && r.receiverId === targetId) ||
      (r.senderId === targetId && r.receiverId === myId)
    ) {
      db.friendRequests.delete(key);
    }
  }

  // Avoid duplicate block records
  const existingBlock = Array.from(db.blockedUsers.values()).find(
    b => b.blockerId === myId && (b.blockedId === targetId || b.id === targetId)
  );

  if (!existingBlock) {
    const bId = `blk_${Date.now()}`;
    db.blockedUsers.set(bId, {
      id: bId,
      blockerId: myId,
      blockedId: targetId,
      wasFriend: hadFriendship,
      createdAt: new Date().toISOString(),
    });
  } else if (hadFriendship) {
    existingBlock.wasFriend = true;
  }

  const io = req.app.get('io');
  if (io) {
    io.to(`user:${myId}`).emit('friends:updated');
    io.to(`user:${targetId}`).emit('friends:updated');
  }

  return res.json({ message: 'User blocked', success: true });
});

// Unblock User (supports target user ID or block record ID)
router.delete('/friends/:userId/unblock', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const myId = req.user!.userId;
  const targetId = req.params.userId;

  let targetUserId = targetId;
  let wasFriend = false;
  const blocksToDelete: string[] = [];

  for (const [key, b] of db.blockedUsers.entries()) {
    if (b.blockerId === myId && (b.blockedId === targetId || b.id === targetId || key === targetId)) {
      targetUserId = b.blockedId;
      if (b.wasFriend) {
        wasFriend = true;
      }
      blocksToDelete.push(key);
    }
  }

  for (const key of blocksToDelete) {
    db.blockedUsers.delete(key);
  }

  // Check if they had a previous friendship recorded
  const hasPreviousFriendship =
    wasFriend ||
    db.previousFriendships.has(`${myId}_${targetUserId}`) ||
    db.previousFriendships.has(`${targetUserId}_${myId}`);

  // Also check if they shared direct messages
  const hasDMs = Array.from(db.directMessages.values()).some(
    dm => (dm.senderId === myId && dm.receiverId === targetUserId) ||
          (dm.senderId === targetUserId && dm.receiverId === myId)
  );

  // If was friend, previously recorded, or has DMs, restore friendship!
  const shouldRestore = hasPreviousFriendship || hasDMs;

  let restoredFriendship = false;
  if (shouldRestore) {
    // Check if not already friends
    const alreadyFriends = Array.from(db.friendships.values()).some(
      f => (f.userId1 === myId && f.userId2 === targetUserId) ||
           (f.userId1 === targetUserId && f.userId2 === myId)
    );

    if (!alreadyFriends) {
      const fId = `f_${Date.now()}`;
      db.friendships.set(fId, {
        id: fId,
        userId1: myId,
        userId2: targetUserId,
        createdAt: new Date().toISOString(),
      });
      restoredFriendship = true;
    }
  }

  const io = req.app.get('io');
  if (io) {
    io.to(`user:${myId}`).emit('friends:updated');
    io.to(`user:${targetUserId}`).emit('friends:updated');
  }

  return res.json({
    message: restoredFriendship
      ? 'User unblocked and restored to friends'
      : 'User unblocked',
    restoredFriendship,
    success: true,
  });
});

// ==========================================
// SERVERS & CHANNELS
// ==========================================

// Get user servers
router.get('/servers', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const servers = db.getUserServers(req.user!.userId);
  return res.json({ servers });
});

// Create server
router.post('/servers', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { name, iconUrl, description } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Server name is required' });

  const myId = req.user!.userId;
  const serverId = `srv_${Date.now()}`;
  const inviteCode = Math.random().toString(36).substring(2, 9);

  const newServer: DBServer = {
    id: serverId,
    name: name.trim(),
    iconUrl: iconUrl || null,
    description: description || null,
    inviteCode,
    ownerId: myId,
    createdAt: new Date().toISOString(),
  };
  db.servers.set(serverId, newServer);

  // Admin role
  const rAdmin: DBRole = {
    id: `role_admin_${serverId}`,
    serverId,
    name: 'Server Owner',
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
  // Default member role
  const rMember: DBRole = {
    id: `role_member_${serverId}`,
    serverId,
    name: 'Member',
    color: '#99AAB5',
    hoist: false,
    position: 2,
    manageChannels: false,
    kickMembers: false,
    banMembers: false,
    sendMessages: true,
    connectVoice: true,
    administrator: false,
  };
  db.roles.set(rAdmin.id, rAdmin);
  db.roles.set(rMember.id, rMember);

  // Add owner as member
  const memberId = `m_${serverId}_${myId}`;
  db.members.set(memberId, {
    id: memberId,
    serverId,
    userId: myId,
    nickname: null,
    roleIds: [rAdmin.id],
    joinedAt: new Date().toISOString(),
  });

  // Default categories and channels
  const catText: DBCategory = { id: `cat_txt_${serverId}`, serverId, name: 'TEXT CHANNELS', order: 1 };
  const catVoice: DBCategory = { id: `cat_voc_${serverId}`, serverId, name: 'VOICE CHANNELS', order: 2 };
  db.categories.set(catText.id, catText);
  db.categories.set(catVoice.id, catVoice);

  const chGeneral: DBChannel = {
    id: `ch_${Date.now()}_gen`,
    serverId,
    categoryId: catText.id,
    name: 'general',
    type: 'TEXT',
    topic: 'Welcome to your new server!',
    order: 1,
    isPrivate: false,
    createdAt: new Date().toISOString(),
  };
  const chVoice: DBChannel = {
    id: `ch_${Date.now()}_voc`,
    serverId,
    categoryId: catVoice.id,
    name: 'General Voice',
    type: 'VOICE',
    topic: null,
    order: 1,
    isPrivate: false,
    createdAt: new Date().toISOString(),
  };
  db.channels.set(chGeneral.id, chGeneral);
  db.channels.set(chVoice.id, chVoice);

  const fullServer = db.getFullServer(serverId, myId);
  return res.status(201).json({ server: fullServer });
});

// Join server with invite code
router.post('/servers/join/:code', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const myId = req.user!.userId;
  const code = req.params.code.trim();

  const server = Array.from(db.servers.values()).find(
    s => s.inviteCode.toLowerCase() === code.toLowerCase()
  );

  if (!server) {
    return res.status(404).json({ error: 'Invalid invite code or server expired' });
  }

  // Check if already a member
  const existingMember = Array.from(db.members.values()).find(
    m => m.serverId === server.id && m.userId === myId
  );

  if (existingMember) {
    return res.json({ server: db.getFullServer(server.id, myId), alreadyMember: true });
  }

  const memberRole = Array.from(db.roles.values()).find(
    r => r.serverId === server.id && !r.administrator
  );

  const memberId = `m_${server.id}_${myId}`;
  db.members.set(memberId, {
    id: memberId,
    serverId: server.id,
    userId: myId,
    nickname: null,
    roleIds: memberRole ? [memberRole.id] : [],
    joinedAt: new Date().toISOString(),
  });

  return res.json({ server: db.getFullServer(server.id, myId) });
});

// Get Server details
router.get('/servers/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const server = db.getFullServer(req.params.id, req.user!.userId);
  if (!server) return res.status(404).json({ error: 'Server not found' });
  return res.json({ server });
});

// Create Channel
router.post('/servers/:id/channels', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { name, type, categoryId, topic } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Channel name required' });

  const server = db.servers.get(req.params.id);
  if (!server) return res.status(404).json({ error: 'Server not found' });

  const chId = `ch_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const channel: DBChannel = {
    id: chId,
    serverId: server.id,
    categoryId: categoryId || null,
    name: name.trim().toLowerCase().replace(/\s+/g, '-'),
    type: type === 'VOICE' ? 'VOICE' : 'TEXT',
    topic: topic || null,
    order: db.channels.size + 1,
    isPrivate: false,
    createdAt: new Date().toISOString(),
  };

  db.channels.set(chId, channel);
  return res.status(201).json({ channel });
});

// Delete Channel
router.delete('/servers/:id/channels/:channelId', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const channel = db.channels.get(req.params.channelId);
  if (!channel || channel.serverId !== req.params.id) {
    return res.status(404).json({ error: 'Channel not found' });
  }
  db.channels.delete(req.params.channelId);
  return res.json({ message: 'Channel deleted' });
});

// Create Role
router.post('/servers/:id/roles', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { name, color, hoist, manageChannels, kickMembers, banMembers, sendMessages, connectVoice } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Role name required' });

  const roleId = `role_${Date.now()}`;
  const newRole: DBRole = {
    id: roleId,
    serverId: req.params.id,
    name: name.trim(),
    color: color || '#99AAB5',
    hoist: Boolean(hoist),
    position: db.roles.size + 1,
    manageChannels: Boolean(manageChannels),
    kickMembers: Boolean(kickMembers),
    banMembers: Boolean(banMembers),
    sendMessages: sendMessages !== undefined ? Boolean(sendMessages) : true,
    connectVoice: connectVoice !== undefined ? Boolean(connectVoice) : true,
    administrator: false,
  };

  db.roles.set(roleId, newRole);
  return res.status(201).json({ role: newRole });
});

// Update Role
router.patch('/servers/:id/roles/:roleId', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const role = db.roles.get(req.params.roleId);
  if (!role || role.serverId !== req.params.id) {
    return res.status(404).json({ error: 'Role not found' });
  }

  const { name, color, hoist, manageChannels, kickMembers, banMembers, sendMessages, connectVoice } = req.body;
  if (name !== undefined) role.name = name.trim();
  if (color !== undefined) role.color = color;
  if (hoist !== undefined) role.hoist = Boolean(hoist);
  if (manageChannels !== undefined) role.manageChannels = Boolean(manageChannels);
  if (kickMembers !== undefined) role.kickMembers = Boolean(kickMembers);
  if (banMembers !== undefined) role.banMembers = Boolean(banMembers);
  if (sendMessages !== undefined) role.sendMessages = Boolean(sendMessages);
  if (connectVoice !== undefined) role.connectVoice = Boolean(connectVoice);

  return res.json({ role });
});

// Leave Server
router.post('/servers/:id/leave', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const myId = req.user!.userId;
  const server = db.servers.get(req.params.id);
  if (!server) return res.status(404).json({ error: 'Server not found' });

  if (server.ownerId === myId) {
    return res.status(400).json({ error: 'Server owners cannot leave their own server without transferring ownership.' });
  }

  for (const [key, m] of db.members.entries()) {
    if (m.serverId === req.params.id && m.userId === myId) {
      db.members.delete(key);
      return res.json({ message: 'Left server successfully' });
    }
  }

  return res.status(404).json({ error: 'Member not found' });
});

// ==========================================
// CHANNEL MESSAGES
// ==========================================

router.get('/channels/:channelId/messages', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const channelMessages = Array.from(db.serverMessages.values())
    .filter(m => m.channelId === req.params.channelId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const messages = channelMessages.map(msg => {
    const author = db.getUserById(msg.authorId);
    let replyTo = null;
    if (msg.replyToId) {
      const parent = db.serverMessages.get(msg.replyToId);
      if (parent) {
        const parentAuthor = db.getUserById(parent.authorId);
        replyTo = {
          id: parent.id,
          authorName: parentAuthor?.displayName || 'Unknown',
          content: parent.content,
        };
      }
    }

    return {
      ...msg,
      author: author ? db.sanitizeUser(author) : null,
      reactions: formatReactions(msg.reactions),
      replyTo,
    };
  });

  return res.json({ messages });
});

// Post channel message
router.post('/channels/:channelId/messages', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { content, attachments, replyToId } = req.body;
  if (!content?.trim() && (!attachments || attachments.length === 0)) {
    return res.status(400).json({ error: 'Content or attachment is required' });
  }

  const msgId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const authorId = req.user!.userId;

  const newMsg = {
    id: msgId,
    channelId: req.params.channelId,
    authorId,
    content: (content || '').trim(),
    attachments: attachments || [],
    replyToId: replyToId || null,
    reactions: [],
    isEdited: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.serverMessages.set(msgId, newMsg);

  const author = db.getUserById(authorId);
  let replyTo = null;
  if (replyToId) {
    const parent = db.serverMessages.get(replyToId);
    if (parent) {
      const parentAuthor = db.getUserById(parent.authorId);
      replyTo = {
        id: parent.id,
        authorName: parentAuthor?.displayName || 'Unknown',
        content: parent.content,
      };
    }
  }

  return res.status(201).json({
    message: {
      ...newMsg,
      author: author ? db.sanitizeUser(author) : null,
      reactions: [],
      replyTo,
    },
  });
});

// Delete message
router.delete('/channels/:channelId/messages/:messageId', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const msg = db.serverMessages.get(req.params.messageId);
  if (!msg) return res.status(404).json({ error: 'Message not found' });
  if (msg.authorId !== req.user!.userId) {
    return res.status(403).json({ error: 'Not allowed to delete this message' });
  }

  db.serverMessages.delete(req.params.messageId);
  return res.json({ message: 'Message deleted' });
});

// React to channel message
router.post('/channels/:channelId/messages/:messageId/reactions', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { emoji } = req.body;
  if (!emoji) return res.status(400).json({ error: 'Emoji is required' });

  const msg = db.serverMessages.get(req.params.messageId);
  if (!msg) return res.status(404).json({ error: 'Message not found' });

  const userId = req.user!.userId;
  const existingIndex = msg.reactions.findIndex(r => r.userId === userId && r.emoji === emoji);

  if (existingIndex >= 0) {
    msg.reactions.splice(existingIndex, 1);
  } else {
    msg.reactions.push({
      id: `r_${Date.now()}`,
      emoji,
      userId,
    });
  }

  return res.json({ reactions: formatReactions(msg.reactions) });
});

// ==========================================
// DIRECT MESSAGES (DMs)
// ==========================================

// Get DM Conversations list
router.get('/dms/conversations', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const myId = req.user!.userId;
  const dmPartners = new Set<string>();

  for (const dm of db.directMessages.values()) {
    if (dm.senderId === myId) dmPartners.add(dm.receiverId);
    else if (dm.receiverId === myId) dmPartners.add(dm.senderId);
  }

  const conversations = Array.from(dmPartners)
    .map(partnerId => {
      const user = db.getUserById(partnerId);
      if (!user) return null;
      // Get last message
      const thread = Array.from(db.directMessages.values())
        .filter(dm => (dm.senderId === myId && dm.receiverId === partnerId) || (dm.senderId === partnerId && dm.receiverId === myId))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      return {
        user: db.sanitizeUser(user),
        lastMessage: thread[0] || null,
      };
    })
    .filter(Boolean);

  return res.json({ conversations });
});

// Get Messages between current user and target user
router.get('/dms/:userId/messages', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const myId = req.user!.userId;
  const targetId = req.params.userId;

  const thread = Array.from(db.directMessages.values())
    .filter(m => (m.senderId === myId && m.receiverId === targetId) || (m.senderId === targetId && m.receiverId === myId))
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const messages = thread.map(msg => {
    const author = db.getUserById(msg.senderId);
    let replyTo = null;
    if (msg.replyToId) {
      const parent = db.directMessages.get(msg.replyToId);
      if (parent) {
        const parentAuthor = db.getUserById(parent.senderId);
        replyTo = {
          id: parent.id,
          authorName: parentAuthor?.displayName || 'Unknown',
          content: parent.content,
        };
      }
    }
    return {
      ...msg,
      author: author ? db.sanitizeUser(author) : null,
      reactions: formatReactions(msg.reactions),
      replyTo,
    };
  });

  return res.json({ messages });
});

// Send Direct Message
router.post('/dms/:userId/messages', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { content, attachments, replyToId } = req.body;
  if (!content?.trim() && (!attachments || attachments.length === 0)) {
    return res.status(400).json({ error: 'Content or attachment is required' });
  }

  const myId = req.user!.userId;
  const targetId = req.params.userId;
  const targetUser = db.getUserById(targetId);
  if (!targetUser) return res.status(404).json({ error: 'Recipient not found' });

  const msgId = `dm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const newDm = {
    id: msgId,
    senderId: myId,
    receiverId: targetId,
    content: (content || '').trim(),
    attachments: attachments || [],
    replyToId: replyToId || null,
    reactions: [],
    isEdited: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.directMessages.set(msgId, newDm);

  const author = db.getUserById(myId);
  let replyTo = null;
  if (replyToId) {
    const parent = db.directMessages.get(replyToId);
    if (parent) {
      const parentAuthor = db.getUserById(parent.senderId);
      replyTo = {
        id: parent.id,
        authorName: parentAuthor?.displayName || 'Unknown',
        content: parent.content,
      };
    }
  }

  return res.status(201).json({
    message: {
      ...newDm,
      author: author ? db.sanitizeUser(author) : null,
      reactions: [],
      replyTo,
    },
  });
});

// React to Direct Message
router.post('/dms/:userId/messages/:messageId/reactions', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { emoji } = req.body;
  if (!emoji) return res.status(400).json({ error: 'Emoji is required' });

  const msg = db.directMessages.get(req.params.messageId);
  if (!msg) return res.status(404).json({ error: 'Message not found' });

  const userId = req.user!.userId;
  const existingIndex = msg.reactions.findIndex(r => r.userId === userId && r.emoji === emoji);

  if (existingIndex >= 0) {
    msg.reactions.splice(existingIndex, 1);
  } else {
    msg.reactions.push({
      id: `r_${Date.now()}`,
      emoji,
      userId,
    });
  }

  return res.json({ reactions: formatReactions(msg.reactions) });
});

// Delete Direct Message
router.delete('/dms/:userId/messages/:messageId', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const msg = db.directMessages.get(req.params.messageId);
  if (!msg) return res.status(404).json({ error: 'Message not found' });
  if (msg.senderId !== req.user!.userId) {
    return res.status(403).json({ error: 'Not allowed to delete this message' });
  }

  db.directMessages.delete(req.params.messageId);

  const io = req.app.get('io');
  if (io) {
    const room = [msg.senderId, msg.receiverId].sort().join(':');
    io.to(`dm:${room}`).emit('message:deleted_dm', { messageId: req.params.messageId });
  }

  return res.json({ message: 'Message deleted', success: true });
});

export default router;
