// server.ts
import http from "http";
import express2 from "express";
import cors from "cors";
import { Server as SocketIOServer } from "socket.io";

// server/routes.ts
import express from "express";

// server/db.ts
import bcrypt from "bcryptjs";
var InMemoryDatabase = class {
  // key = userId
  constructor() {
    this.users = /* @__PURE__ */ new Map();
    this.friendRequests = /* @__PURE__ */ new Map();
    this.friendships = /* @__PURE__ */ new Map();
    this.blockedUsers = /* @__PURE__ */ new Map();
    this.previousFriendships = /* @__PURE__ */ new Map();
    this.servers = /* @__PURE__ */ new Map();
    this.categories = /* @__PURE__ */ new Map();
    this.channels = /* @__PURE__ */ new Map();
    this.roles = /* @__PURE__ */ new Map();
    this.members = /* @__PURE__ */ new Map();
    this.serverMessages = /* @__PURE__ */ new Map();
    this.directMessages = /* @__PURE__ */ new Map();
    this.voiceParticipants = /* @__PURE__ */ new Map();
    this.seed();
  }
  async seed() {
    const passwordHash = bcrypt.hashSync("password123", 10);
    const u1 = {
      id: "usr_alex",
      username: "alex",
      tag: "1001",
      displayName: "Alex Rivera",
      email: "alex@accord.chat",
      passwordHash,
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      bannerUrl: null,
      bio: "Full-Stack Architect & Open Source enthusiast. Building WebRTC and real-time mesh systems.",
      status: "ONLINE",
      customStatus: "Coding Discord from scratch \u{1F680}",
      createdAt: new Date(Date.now() - 864e5 * 30).toISOString()
    };
    const u2 = {
      id: "usr_elena",
      username: "elena",
      tag: "2048",
      displayName: "Elena Rostova",
      email: "elena@accord.chat",
      passwordHash,
      avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
      bannerUrl: null,
      bio: "UI/UX Designer & sound enthusiast. Dark mode evangelist.",
      status: "IDLE",
      customStatus: "\u{1F3A7} Listening to Synthwave Chill",
      createdAt: new Date(Date.now() - 864e5 * 25).toISOString()
    };
    const u3 = {
      id: "usr_marcus",
      username: "marcus",
      tag: "9900",
      displayName: "Marcus Chen",
      email: "marcus@accord.chat",
      passwordHash,
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
      bannerUrl: null,
      bio: "Backend & Cloud Infra engineer. Rust, Go, Node.js.",
      status: "DND",
      customStatus: "Do Not Disturb // Compiling kernels",
      createdAt: new Date(Date.now() - 864e5 * 20).toISOString()
    };
    const u4 = {
      id: "usr_sophia",
      username: "sophia",
      tag: "4512",
      displayName: "Sophia Martin",
      email: "sophia@accord.chat",
      passwordHash,
      avatarUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
      bannerUrl: null,
      bio: "Pixel artist and gamer. Cozy vibes only!",
      status: "ONLINE",
      customStatus: "Playing Cyberpunk 2077",
      createdAt: new Date(Date.now() - 864e5 * 15).toISOString()
    };
    this.users.set(u1.id, u1);
    this.users.set(u2.id, u2);
    this.users.set(u3.id, u3);
    this.users.set(u4.id, u4);
    this.friendships.set("f1", { id: "f1", userId1: u1.id, userId2: u2.id, createdAt: (/* @__PURE__ */ new Date()).toISOString() });
    this.friendships.set("f2", { id: "f2", userId1: u1.id, userId2: u3.id, createdAt: (/* @__PURE__ */ new Date()).toISOString() });
    this.friendRequests.set("fr1", {
      id: "fr1",
      senderId: u4.id,
      receiverId: u1.id,
      status: "PENDING",
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    });
    const server1 = {
      id: "srv_accord_hq",
      name: "Accord Community HQ",
      iconUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128&auto=format&fit=crop&q=80",
      description: "Official community hub for Accord developers, gamers, and friends.",
      inviteCode: "accord-hq",
      ownerId: u1.id,
      createdAt: new Date(Date.now() - 864e5 * 10).toISOString()
    };
    this.servers.set(server1.id, server1);
    const rAdmin = {
      id: "role_admin_1",
      serverId: server1.id,
      name: "Founder / Admin",
      color: "#ED4245",
      hoist: true,
      position: 1,
      manageChannels: true,
      kickMembers: true,
      banMembers: true,
      sendMessages: true,
      connectVoice: true,
      administrator: true
    };
    const rMod = {
      id: "role_mod_1",
      serverId: server1.id,
      name: "Moderator",
      color: "#FEE75C",
      hoist: true,
      position: 2,
      manageChannels: true,
      kickMembers: true,
      banMembers: true,
      sendMessages: true,
      connectVoice: true,
      administrator: false
    };
    const rMember = {
      id: "role_member_1",
      serverId: server1.id,
      name: "Community Member",
      color: "#5865F2",
      hoist: true,
      position: 3,
      manageChannels: false,
      kickMembers: false,
      banMembers: false,
      sendMessages: true,
      connectVoice: true,
      administrator: false
    };
    this.roles.set(rAdmin.id, rAdmin);
    this.roles.set(rMod.id, rMod);
    this.roles.set(rMember.id, rMember);
    this.members.set("m1", {
      id: "m1",
      serverId: server1.id,
      userId: u1.id,
      nickname: "Alex (Lead)",
      roleIds: [rAdmin.id],
      joinedAt: new Date(Date.now() - 864e5 * 10).toISOString()
    });
    this.members.set("m2", {
      id: "m2",
      serverId: server1.id,
      userId: u2.id,
      nickname: "Elena Designer",
      roleIds: [rMod.id],
      joinedAt: new Date(Date.now() - 864e5 * 9).toISOString()
    });
    this.members.set("m3", {
      id: "m3",
      serverId: server1.id,
      userId: u3.id,
      nickname: "Marcus DevOps",
      roleIds: [rMember.id],
      joinedAt: new Date(Date.now() - 864e5 * 8).toISOString()
    });
    this.members.set("m4", {
      id: "m4",
      serverId: server1.id,
      userId: u4.id,
      nickname: "Sophia M.",
      roleIds: [rMember.id],
      joinedAt: new Date(Date.now() - 864e5 * 7).toISOString()
    });
    const catInfo = { id: "cat_info", serverId: server1.id, name: "WELCOME & RULES", order: 1 };
    const catText = { id: "cat_text", serverId: server1.id, name: "TEXT CHANNELS", order: 2 };
    const catVoice = { id: "cat_voice", serverId: server1.id, name: "VOICE CHANNELS", order: 3 };
    this.categories.set(catInfo.id, catInfo);
    this.categories.set(catText.id, catText);
    this.categories.set(catVoice.id, catVoice);
    const chRules = {
      id: "ch_rules",
      serverId: server1.id,
      categoryId: catInfo.id,
      name: "rules-and-info",
      type: "TEXT",
      topic: "Be respectful, no spam, and enjoy your time here.",
      order: 1,
      isPrivate: false,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    const chGeneral = {
      id: "ch_general",
      serverId: server1.id,
      categoryId: catText.id,
      name: "general",
      type: "TEXT",
      topic: "General hangout and chit-chat about anything tech or gaming.",
      order: 1,
      isPrivate: false,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    const chDev = {
      id: "ch_dev",
      serverId: server1.id,
      categoryId: catText.id,
      name: "dev-chat",
      type: "TEXT",
      topic: "Architecture discussions, code snippets, and WebRTC debugging.",
      order: 2,
      isPrivate: false,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    const chVoiceLounge = {
      id: "ch_v_lounge",
      serverId: server1.id,
      categoryId: catVoice.id,
      name: "Lounge Voice",
      type: "VOICE",
      topic: "General voice hangout",
      order: 1,
      isPrivate: false,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    const chVoiceGaming = {
      id: "ch_v_gaming",
      serverId: server1.id,
      categoryId: catVoice.id,
      name: "Gaming Room 1",
      type: "VOICE",
      topic: "Co-op gaming audio",
      order: 2,
      isPrivate: false,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.channels.set(chRules.id, chRules);
    this.channels.set(chGeneral.id, chGeneral);
    this.channels.set(chDev.id, chDev);
    this.channels.set(chVoiceLounge.id, chVoiceLounge);
    this.channels.set(chVoiceGaming.id, chVoiceGaming);
    const sm1 = {
      id: "msg_1",
      channelId: chGeneral.id,
      authorId: u1.id,
      content: "Welcome everyone to **Accord**! \u{1F389} This is a 100% custom full-stack Discord clone built from scratch with React, Tailwind, Express, Socket.io, and WebRTC.",
      reactions: [{ id: "r1", emoji: "\u{1F680}", userId: u2.id }, { id: "r2", emoji: "\u{1F525}", userId: u3.id }],
      isEdited: false,
      createdAt: new Date(Date.now() - 36e5 * 2).toISOString(),
      updatedAt: new Date(Date.now() - 36e5 * 2).toISOString()
    };
    const sm2 = {
      id: "msg_2",
      channelId: chGeneral.id,
      authorId: u2.id,
      content: "The dark theme UI and audio settings look slick! Testing reactions and markdown: *italics*, `code blocks`, and voice channels.",
      reactions: [{ id: "r3", emoji: "\u2764\uFE0F", userId: u1.id }],
      isEdited: false,
      createdAt: new Date(Date.now() - 36e5 * 1.5).toISOString(),
      updatedAt: new Date(Date.now() - 36e5 * 1.5).toISOString()
    };
    const sm3 = {
      id: "msg_3",
      channelId: chGeneral.id,
      authorId: u3.id,
      content: "WebRTC mesh voice signaling is active! You can jump into `Lounge Voice` or `Gaming Room 1` to test voice and speaking indicators right away.",
      reactions: [{ id: "r4", emoji: "\u{1F399}\uFE0F", userId: u1.id }],
      isEdited: false,
      createdAt: new Date(Date.now() - 36e5 * 1).toISOString(),
      updatedAt: new Date(Date.now() - 36e5 * 1).toISOString()
    };
    this.serverMessages.set(sm1.id, sm1);
    this.serverMessages.set(sm2.id, sm2);
    this.serverMessages.set(sm3.id, sm3);
    const dm1 = {
      id: "dm_1",
      senderId: u2.id,
      receiverId: u1.id,
      content: "Hey Alex! Did you check out the new sound test panel in User Settings?",
      reactions: [{ id: "r5", emoji: "\u{1F44D}", userId: u1.id }],
      isEdited: false,
      createdAt: new Date(Date.now() - 18e5).toISOString(),
      updatedAt: new Date(Date.now() - 18e5).toISOString()
    };
    const dm2 = {
      id: "dm_2",
      senderId: u1.id,
      receiverId: u2.id,
      content: "Yes! It has live Web Audio API decibel metering, echo cancellation, and noise suppression toggles. Works smoothly!",
      reactions: [{ id: "r6", emoji: "\u2728", userId: u2.id }],
      isEdited: false,
      createdAt: new Date(Date.now() - 9e5).toISOString(),
      updatedAt: new Date(Date.now() - 9e5).toISOString()
    };
    this.directMessages.set(dm1.id, dm1);
    this.directMessages.set(dm2.id, dm2);
  }
  // --- Helper methods ---
  getUserById(id) {
    return this.users.get(id);
  }
  getUserByEmail(email) {
    return Array.from(this.users.values()).find((u) => u.email.toLowerCase() === email.toLowerCase());
  }
  getUserByUsernameAndTag(username, tag) {
    return Array.from(this.users.values()).find((u) => {
      if (tag) {
        return u.username.toLowerCase() === username.toLowerCase() && u.tag === tag;
      }
      return u.username.toLowerCase() === username.toLowerCase();
    });
  }
  sanitizeUser(user) {
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }
  // Servers
  getUserServers(userId) {
    const userMemberServerIds = Array.from(this.members.values()).filter((m) => m.userId === userId).map((m) => m.serverId);
    return Array.from(this.servers.values()).filter((s) => userMemberServerIds.includes(s.id) || s.ownerId === userId).map((s) => this.getFullServer(s.id, userId));
  }
  getFullServer(serverId, currentUserId) {
    const server2 = this.servers.get(serverId);
    if (!server2) return null;
    const categories = Array.from(this.categories.values()).filter((c) => c.serverId === serverId).sort((a, b) => a.order - b.order);
    const channels = Array.from(this.channels.values()).filter((c) => c.serverId === serverId).sort((a, b) => a.order - b.order);
    const roles = Array.from(this.roles.values()).filter((r) => r.serverId === serverId).sort((a, b) => a.position - b.position);
    const members = Array.from(this.members.values()).filter((m) => m.serverId === serverId).map((m) => {
      const user = this.getUserById(m.userId);
      const memberRoles = m.roleIds.map((rid) => this.roles.get(rid)).filter(Boolean);
      return {
        id: m.id,
        serverId: m.serverId,
        userId: m.userId,
        nickname: m.nickname,
        joinedAt: m.joinedAt,
        user: user ? this.sanitizeUser(user) : null,
        roles: memberRoles
      };
    });
    return {
      ...server2,
      categories: categories.map((cat) => ({
        ...cat,
        channels: channels.filter((ch) => ch.categoryId === cat.id)
      })),
      channels,
      roles,
      members
    };
  }
};
var db = new InMemoryDatabase();

// server/auth.ts
import jwt from "jsonwebtoken";
import bcrypt2 from "bcryptjs";
var JWT_SECRET = process.env.JWT_SECRET || "accord-super-secret-jwt-key-2026";
function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}
async function hashPassword(password) {
  return bcrypt2.hash(password, 10);
}
async function comparePassword(password, hash) {
  return bcrypt2.compare(password, hash);
}
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: Missing token" });
  }
  const token = authHeader.split(" ")[1];
  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: "Unauthorized: Invalid token" });
  }
  req.user = payload;
  next();
}

// server/routes.ts
var router = express.Router();
function formatReactions(reactions) {
  const grouped = {};
  for (const r of reactions) {
    if (!grouped[r.emoji]) {
      grouped[r.emoji] = { id: r.id, emoji: r.emoji, count: 0, users: [] };
    }
    grouped[r.emoji].count += 1;
    grouped[r.emoji].users.push(r.userId);
  }
  return Object.values(grouped);
}
router.post("/auth/register", async (req, res) => {
  try {
    const { username, email, password, displayName } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: "Username, email and password are required" });
    }
    if (db.getUserByEmail(email)) {
      return res.status(409).json({ error: "Email is already registered" });
    }
    const tag = Math.floor(1e3 + Math.random() * 9e3).toString();
    const passwordHash = await hashPassword(password);
    const id = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newUser = {
      id,
      username: username.trim().toLowerCase(),
      tag,
      displayName: displayName?.trim() || username.trim(),
      email: email.trim().toLowerCase(),
      passwordHash,
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`,
      status: "ONLINE",
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    db.users.set(newUser.id, newUser);
    const defaultServer = db.servers.get("srv_accord_hq");
    if (defaultServer) {
      const memberRole = Array.from(db.roles.values()).find(
        (r) => r.serverId === defaultServer.id && r.name === "Community Member"
      );
      db.members.set(`m_${newUser.id}`, {
        id: `m_${newUser.id}`,
        serverId: defaultServer.id,
        userId: newUser.id,
        nickname: newUser.displayName,
        roleIds: memberRole ? [memberRole.id] : [],
        joinedAt: (/* @__PURE__ */ new Date()).toISOString()
      });
    }
    const token = generateToken({ userId: newUser.id, username: newUser.username });
    return res.status(201).json({
      token,
      user: db.sanitizeUser(newUser)
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Registration failed" });
  }
});
router.post("/auth/login", async (req, res) => {
  try {
    const { emailOrUsername, password } = req.body;
    if (!emailOrUsername || !password) {
      return res.status(400).json({ error: "Credentials required" });
    }
    let user;
    if (emailOrUsername.includes("@")) {
      user = db.getUserByEmail(emailOrUsername);
    } else {
      user = Array.from(db.users.values()).find(
        (u) => u.username.toLowerCase() === emailOrUsername.trim().toLowerCase()
      );
    }
    if (!user) {
      return res.status(401).json({ error: "Invalid username or password" });
    }
    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid username or password" });
    }
    user.status = "ONLINE";
    const token = generateToken({ userId: user.id, username: user.username });
    return res.json({
      token,
      user: db.sanitizeUser(user)
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Login failed" });
  }
});
router.get("/auth/me", requireAuth, (req, res) => {
  const user = db.getUserById(req.user.userId);
  if (!user) return res.status(404).json({ error: "User not found" });
  return res.json({ user: db.sanitizeUser(user) });
});
router.patch("/auth/profile", requireAuth, (req, res) => {
  const user = db.getUserById(req.user.userId);
  if (!user) return res.status(404).json({ error: "User not found" });
  const { displayName, avatarUrl, bannerUrl, bio, status, customStatus } = req.body;
  if (displayName !== void 0) user.displayName = displayName.trim();
  if (avatarUrl !== void 0) user.avatarUrl = avatarUrl;
  if (bannerUrl !== void 0) user.bannerUrl = bannerUrl;
  if (bio !== void 0) user.bio = bio;
  if (status !== void 0) user.status = status;
  if (customStatus !== void 0) user.customStatus = customStatus;
  return res.json({ user: db.sanitizeUser(user) });
});
router.post("/auth/password", requireAuth, async (req, res) => {
  const user = db.getUserById(req.user.userId);
  if (!user) return res.status(404).json({ error: "User not found" });
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: "Both current and new password are required" });
  }
  const isMatch = await comparePassword(currentPassword, user.passwordHash);
  if (!isMatch) {
    return res.status(400).json({ error: "Current password does not match" });
  }
  user.passwordHash = await hashPassword(newPassword);
  return res.json({ message: "Password updated successfully" });
});
router.get("/users/search", requireAuth, (req, res) => {
  const q = (req.query.q || "").trim().toLowerCase();
  const results = Array.from(db.users.values()).filter((u) => u.id !== req.user.userId && (u.username.includes(q) || u.displayName.toLowerCase().includes(q))).slice(0, 10).map((u) => db.sanitizeUser(u));
  return res.json({ users: results });
});
router.get("/friends", requireAuth, (req, res) => {
  const myId = req.user.userId;
  const friendUserIds = [];
  for (const f of db.friendships.values()) {
    if (f.userId1 === myId) friendUserIds.push(f.userId2);
    else if (f.userId2 === myId) friendUserIds.push(f.userId1);
  }
  const friends = friendUserIds.map((fid) => {
    const u = db.getUserById(fid);
    if (!u) return null;
    return {
      id: fid,
      user: db.sanitizeUser(u)
    };
  }).filter(Boolean);
  return res.json({ friends });
});
router.get("/friends/requests", requireAuth, (req, res) => {
  const myId = req.user.userId;
  const incoming = Array.from(db.friendRequests.values()).filter((r) => r.receiverId === myId && r.status === "PENDING").map((r) => {
    const sender = db.getUserById(r.senderId);
    return {
      ...r,
      sender: sender ? db.sanitizeUser(sender) : null
    };
  });
  const outgoing = Array.from(db.friendRequests.values()).filter((r) => r.senderId === myId && r.status === "PENDING").map((r) => {
    const receiver = db.getUserById(r.receiverId);
    return {
      ...r,
      receiver: receiver ? db.sanitizeUser(receiver) : null
    };
  });
  const blocked = Array.from(db.blockedUsers.values()).filter((b) => b.blockerId === myId).map((b) => {
    const blockedUser = db.getUserById(b.blockedId);
    return {
      id: b.id,
      blockedUser: blockedUser ? db.sanitizeUser(blockedUser) : null
    };
  });
  return res.json({ incoming, outgoing, blocked });
});
router.post("/friends/request", requireAuth, (req, res) => {
  const myId = req.user.userId;
  const { usernameTag } = req.body;
  if (!usernameTag || typeof usernameTag !== "string") {
    return res.status(400).json({ error: "Please provide Username#Tag (e.g. alex#1001)" });
  }
  const parts = usernameTag.trim().split("#");
  const uname = parts[0].trim();
  const tag = parts[1]?.trim();
  const targetUser = db.getUserByUsernameAndTag(uname, tag);
  if (!targetUser) {
    return res.status(404).json({ error: `User "${usernameTag}" not found.` });
  }
  if (targetUser.id === myId) {
    return res.status(400).json({ error: "You cannot add yourself as a friend." });
  }
  const isBlocked = Array.from(db.blockedUsers.values()).some(
    (b) => b.blockerId === targetUser.id && b.blockedId === myId || b.blockerId === myId && b.blockedId === targetUser.id
  );
  if (isBlocked) {
    return res.status(403).json({ error: "Unable to send friend request." });
  }
  const alreadyFriends = Array.from(db.friendships.values()).some(
    (f) => f.userId1 === myId && f.userId2 === targetUser.id || f.userId1 === targetUser.id && f.userId2 === myId
  );
  if (alreadyFriends) {
    return res.status(400).json({ error: "You are already friends with this user." });
  }
  const existingReq = Array.from(db.friendRequests.values()).find(
    (r) => r.senderId === myId && r.receiverId === targetUser.id && r.status === "PENDING" || r.senderId === targetUser.id && r.receiverId === myId && r.status === "PENDING"
  );
  if (existingReq) {
    if (existingReq.senderId === targetUser.id) {
      existingReq.status = "ACCEPTED";
      const fId = `f_${Date.now()}`;
      db.friendships.set(fId, { id: fId, userId1: myId, userId2: targetUser.id, createdAt: (/* @__PURE__ */ new Date()).toISOString() });
      const io3 = req.app.get("io");
      if (io3) {
        io3.to(`user:${myId}`).emit("friends:updated");
        io3.to(`user:${targetUser.id}`).emit("friends:updated");
      }
      return res.json({ message: `Friend request accepted! You and ${targetUser.displayName} are now friends.` });
    }
    return res.status(400).json({ error: "A friend request is already pending." });
  }
  const newReqId = `fr_${Date.now()}`;
  db.friendRequests.set(newReqId, {
    id: newReqId,
    senderId: myId,
    receiverId: targetUser.id,
    status: "PENDING",
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  });
  const io2 = req.app.get("io");
  if (io2) {
    io2.to(`user:${targetUser.id}`).emit("friends:updated");
  }
  return res.status(201).json({ message: `Friend request sent to ${targetUser.displayName}#${targetUser.tag}!` });
});
router.post("/friends/request/:id/accept", requireAuth, (req, res) => {
  const reqItem = db.friendRequests.get(req.params.id);
  if (!reqItem || reqItem.receiverId !== req.user.userId) {
    return res.status(404).json({ error: "Request not found" });
  }
  reqItem.status = "ACCEPTED";
  const fId = `f_${Date.now()}`;
  db.friendships.set(fId, {
    id: fId,
    userId1: reqItem.senderId,
    userId2: reqItem.receiverId,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  });
  const io2 = req.app.get("io");
  if (io2) {
    io2.to(`user:${reqItem.senderId}`).emit("friends:updated");
    io2.to(`user:${reqItem.receiverId}`).emit("friends:updated");
  }
  return res.json({ message: "Friend request accepted" });
});
router.post("/friends/request/:id/decline", requireAuth, (req, res) => {
  const reqItem = db.friendRequests.get(req.params.id);
  if (!reqItem || reqItem.receiverId !== req.user.userId && reqItem.senderId !== req.user.userId) {
    return res.status(404).json({ error: "Request not found" });
  }
  reqItem.status = "DECLINED";
  db.friendRequests.delete(req.params.id);
  const io2 = req.app.get("io");
  if (io2) {
    io2.to(`user:${reqItem.senderId}`).emit("friends:updated");
    io2.to(`user:${reqItem.receiverId}`).emit("friends:updated");
  }
  return res.json({ message: "Request removed" });
});
router.delete("/friends/:friendId", requireAuth, (req, res) => {
  const myId = req.user.userId;
  const targetId = req.params.friendId;
  let targetUserId = targetId;
  for (const [key, f] of db.friendships.entries()) {
    if (f.userId1 === myId && f.userId2 === targetId || f.userId1 === targetId && f.userId2 === myId || key === targetId || f.id === targetId) {
      targetUserId = f.userId1 === myId ? f.userId2 : f.userId1;
      db.previousFriendships.set(`${myId}_${targetUserId}`, {
        userId1: myId,
        userId2: targetUserId,
        removedAt: (/* @__PURE__ */ new Date()).toISOString()
      });
      db.previousFriendships.set(`${targetUserId}_${myId}`, {
        userId1: myId,
        userId2: targetUserId,
        removedAt: (/* @__PURE__ */ new Date()).toISOString()
      });
      db.friendships.delete(key);
    }
  }
  for (const [key, r] of db.friendRequests.entries()) {
    if (r.senderId === myId && r.receiverId === targetId || r.senderId === targetId && r.receiverId === myId || r.senderId === myId && r.receiverId === targetUserId || r.senderId === targetUserId && r.receiverId === myId) {
      db.friendRequests.delete(key);
    }
  }
  const io2 = req.app.get("io");
  if (io2) {
    io2.to(`user:${myId}`).emit("friends:updated");
    io2.to(`user:${targetUserId}`).emit("friends:updated");
  }
  return res.json({ message: "Friend removed", success: true });
});
router.post("/friends/:userId/block", requireAuth, (req, res) => {
  const myId = req.user.userId;
  const targetId = req.params.userId;
  if (targetId === myId) {
    return res.status(400).json({ error: "Cannot block yourself" });
  }
  let hadFriendship = false;
  for (const [key, f] of db.friendships.entries()) {
    if (f.userId1 === myId && f.userId2 === targetId || f.userId1 === targetId && f.userId2 === myId || key === targetId || f.id === targetId) {
      hadFriendship = true;
      db.friendships.delete(key);
    }
  }
  if (hadFriendship) {
    db.previousFriendships.set(`${myId}_${targetId}`, {
      userId1: myId,
      userId2: targetId,
      removedAt: (/* @__PURE__ */ new Date()).toISOString()
    });
    db.previousFriendships.set(`${targetId}_${myId}`, {
      userId1: myId,
      userId2: targetId,
      removedAt: (/* @__PURE__ */ new Date()).toISOString()
    });
  }
  for (const [key, r] of db.friendRequests.entries()) {
    if (r.senderId === myId && r.receiverId === targetId || r.senderId === targetId && r.receiverId === myId) {
      db.friendRequests.delete(key);
    }
  }
  const existingBlock = Array.from(db.blockedUsers.values()).find(
    (b) => b.blockerId === myId && (b.blockedId === targetId || b.id === targetId)
  );
  if (!existingBlock) {
    const bId = `blk_${Date.now()}`;
    db.blockedUsers.set(bId, {
      id: bId,
      blockerId: myId,
      blockedId: targetId,
      wasFriend: hadFriendship,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    });
  } else if (hadFriendship) {
    existingBlock.wasFriend = true;
  }
  const io2 = req.app.get("io");
  if (io2) {
    io2.to(`user:${myId}`).emit("friends:updated");
    io2.to(`user:${targetId}`).emit("friends:updated");
  }
  return res.json({ message: "User blocked", success: true });
});
router.delete("/friends/:userId/unblock", requireAuth, (req, res) => {
  const myId = req.user.userId;
  const targetId = req.params.userId;
  let targetUserId = targetId;
  let wasFriend = false;
  const blocksToDelete = [];
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
  const hasPreviousFriendship = wasFriend || db.previousFriendships.has(`${myId}_${targetUserId}`) || db.previousFriendships.has(`${targetUserId}_${myId}`);
  const hasDMs = Array.from(db.directMessages.values()).some(
    (dm) => dm.senderId === myId && dm.receiverId === targetUserId || dm.senderId === targetUserId && dm.receiverId === myId
  );
  const shouldRestore = hasPreviousFriendship || hasDMs;
  let restoredFriendship = false;
  if (shouldRestore) {
    const alreadyFriends = Array.from(db.friendships.values()).some(
      (f) => f.userId1 === myId && f.userId2 === targetUserId || f.userId1 === targetUserId && f.userId2 === myId
    );
    if (!alreadyFriends) {
      const fId = `f_${Date.now()}`;
      db.friendships.set(fId, {
        id: fId,
        userId1: myId,
        userId2: targetUserId,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      });
      restoredFriendship = true;
    }
  }
  const io2 = req.app.get("io");
  if (io2) {
    io2.to(`user:${myId}`).emit("friends:updated");
    io2.to(`user:${targetUserId}`).emit("friends:updated");
  }
  return res.json({
    message: restoredFriendship ? "User unblocked and restored to friends" : "User unblocked",
    restoredFriendship,
    success: true
  });
});
router.get("/servers", requireAuth, (req, res) => {
  const servers = db.getUserServers(req.user.userId);
  return res.json({ servers });
});
router.post("/servers", requireAuth, (req, res) => {
  const { name, iconUrl, description } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: "Server name is required" });
  const myId = req.user.userId;
  const serverId = `srv_${Date.now()}`;
  const inviteCode = Math.random().toString(36).substring(2, 9);
  const newServer = {
    id: serverId,
    name: name.trim(),
    iconUrl: iconUrl || null,
    description: description || null,
    inviteCode,
    ownerId: myId,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  db.servers.set(serverId, newServer);
  const rAdmin = {
    id: `role_admin_${serverId}`,
    serverId,
    name: "Server Owner",
    color: "#ED4245",
    hoist: true,
    position: 1,
    manageChannels: true,
    kickMembers: true,
    banMembers: true,
    sendMessages: true,
    connectVoice: true,
    administrator: true
  };
  const rMember = {
    id: `role_member_${serverId}`,
    serverId,
    name: "Member",
    color: "#99AAB5",
    hoist: false,
    position: 2,
    manageChannels: false,
    kickMembers: false,
    banMembers: false,
    sendMessages: true,
    connectVoice: true,
    administrator: false
  };
  db.roles.set(rAdmin.id, rAdmin);
  db.roles.set(rMember.id, rMember);
  const memberId = `m_${serverId}_${myId}`;
  db.members.set(memberId, {
    id: memberId,
    serverId,
    userId: myId,
    nickname: null,
    roleIds: [rAdmin.id],
    joinedAt: (/* @__PURE__ */ new Date()).toISOString()
  });
  const catText = { id: `cat_txt_${serverId}`, serverId, name: "TEXT CHANNELS", order: 1 };
  const catVoice = { id: `cat_voc_${serverId}`, serverId, name: "VOICE CHANNELS", order: 2 };
  db.categories.set(catText.id, catText);
  db.categories.set(catVoice.id, catVoice);
  const chGeneral = {
    id: `ch_${Date.now()}_gen`,
    serverId,
    categoryId: catText.id,
    name: "general",
    type: "TEXT",
    topic: "Welcome to your new server!",
    order: 1,
    isPrivate: false,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  const chVoice = {
    id: `ch_${Date.now()}_voc`,
    serverId,
    categoryId: catVoice.id,
    name: "General Voice",
    type: "VOICE",
    topic: null,
    order: 1,
    isPrivate: false,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  db.channels.set(chGeneral.id, chGeneral);
  db.channels.set(chVoice.id, chVoice);
  const fullServer = db.getFullServer(serverId, myId);
  return res.status(201).json({ server: fullServer });
});
router.post("/servers/join/:code", requireAuth, (req, res) => {
  const myId = req.user.userId;
  const code = req.params.code.trim();
  const server2 = Array.from(db.servers.values()).find(
    (s) => s.inviteCode.toLowerCase() === code.toLowerCase()
  );
  if (!server2) {
    return res.status(404).json({ error: "Invalid invite code or server expired" });
  }
  const existingMember = Array.from(db.members.values()).find(
    (m) => m.serverId === server2.id && m.userId === myId
  );
  if (existingMember) {
    return res.json({ server: db.getFullServer(server2.id, myId), alreadyMember: true });
  }
  const memberRole = Array.from(db.roles.values()).find(
    (r) => r.serverId === server2.id && !r.administrator
  );
  const memberId = `m_${server2.id}_${myId}`;
  db.members.set(memberId, {
    id: memberId,
    serverId: server2.id,
    userId: myId,
    nickname: null,
    roleIds: memberRole ? [memberRole.id] : [],
    joinedAt: (/* @__PURE__ */ new Date()).toISOString()
  });
  return res.json({ server: db.getFullServer(server2.id, myId) });
});
router.get("/servers/:id", requireAuth, (req, res) => {
  const server2 = db.getFullServer(req.params.id, req.user.userId);
  if (!server2) return res.status(404).json({ error: "Server not found" });
  return res.json({ server: server2 });
});
router.post("/servers/:id/channels", requireAuth, (req, res) => {
  const { name, type, categoryId, topic } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: "Channel name required" });
  const server2 = db.servers.get(req.params.id);
  if (!server2) return res.status(404).json({ error: "Server not found" });
  const chId = `ch_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const channel = {
    id: chId,
    serverId: server2.id,
    categoryId: categoryId || null,
    name: name.trim().toLowerCase().replace(/\s+/g, "-"),
    type: type === "VOICE" ? "VOICE" : "TEXT",
    topic: topic || null,
    order: db.channels.size + 1,
    isPrivate: false,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  db.channels.set(chId, channel);
  return res.status(201).json({ channel });
});
router.delete("/servers/:id/channels/:channelId", requireAuth, (req, res) => {
  const channel = db.channels.get(req.params.channelId);
  if (!channel || channel.serverId !== req.params.id) {
    return res.status(404).json({ error: "Channel not found" });
  }
  db.channels.delete(req.params.channelId);
  return res.json({ message: "Channel deleted" });
});
router.post("/servers/:id/roles", requireAuth, (req, res) => {
  const { name, color, hoist, manageChannels, kickMembers, banMembers, sendMessages, connectVoice } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: "Role name required" });
  const roleId = `role_${Date.now()}`;
  const newRole = {
    id: roleId,
    serverId: req.params.id,
    name: name.trim(),
    color: color || "#99AAB5",
    hoist: Boolean(hoist),
    position: db.roles.size + 1,
    manageChannels: Boolean(manageChannels),
    kickMembers: Boolean(kickMembers),
    banMembers: Boolean(banMembers),
    sendMessages: sendMessages !== void 0 ? Boolean(sendMessages) : true,
    connectVoice: connectVoice !== void 0 ? Boolean(connectVoice) : true,
    administrator: false
  };
  db.roles.set(roleId, newRole);
  return res.status(201).json({ role: newRole });
});
router.patch("/servers/:id/roles/:roleId", requireAuth, (req, res) => {
  const role = db.roles.get(req.params.roleId);
  if (!role || role.serverId !== req.params.id) {
    return res.status(404).json({ error: "Role not found" });
  }
  const { name, color, hoist, manageChannels, kickMembers, banMembers, sendMessages, connectVoice } = req.body;
  if (name !== void 0) role.name = name.trim();
  if (color !== void 0) role.color = color;
  if (hoist !== void 0) role.hoist = Boolean(hoist);
  if (manageChannels !== void 0) role.manageChannels = Boolean(manageChannels);
  if (kickMembers !== void 0) role.kickMembers = Boolean(kickMembers);
  if (banMembers !== void 0) role.banMembers = Boolean(banMembers);
  if (sendMessages !== void 0) role.sendMessages = Boolean(sendMessages);
  if (connectVoice !== void 0) role.connectVoice = Boolean(connectVoice);
  return res.json({ role });
});
router.post("/servers/:id/leave", requireAuth, (req, res) => {
  const myId = req.user.userId;
  const server2 = db.servers.get(req.params.id);
  if (!server2) return res.status(404).json({ error: "Server not found" });
  if (server2.ownerId === myId) {
    return res.status(400).json({ error: "Server owners cannot leave their own server without transferring ownership." });
  }
  for (const [key, m] of db.members.entries()) {
    if (m.serverId === req.params.id && m.userId === myId) {
      db.members.delete(key);
      return res.json({ message: "Left server successfully" });
    }
  }
  return res.status(404).json({ error: "Member not found" });
});
router.get("/channels/:channelId/messages", requireAuth, (req, res) => {
  const channelMessages = Array.from(db.serverMessages.values()).filter((m) => m.channelId === req.params.channelId).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  const messages = channelMessages.map((msg) => {
    const author = db.getUserById(msg.authorId);
    let replyTo = null;
    if (msg.replyToId) {
      const parent = db.serverMessages.get(msg.replyToId);
      if (parent) {
        const parentAuthor = db.getUserById(parent.authorId);
        replyTo = {
          id: parent.id,
          authorName: parentAuthor?.displayName || "Unknown",
          content: parent.content
        };
      }
    }
    return {
      ...msg,
      author: author ? db.sanitizeUser(author) : null,
      reactions: formatReactions(msg.reactions),
      replyTo
    };
  });
  return res.json({ messages });
});
router.post("/channels/:channelId/messages", requireAuth, (req, res) => {
  const { content, attachments, replyToId } = req.body;
  if (!content?.trim() && (!attachments || attachments.length === 0)) {
    return res.status(400).json({ error: "Content or attachment is required" });
  }
  const msgId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const authorId = req.user.userId;
  const newMsg = {
    id: msgId,
    channelId: req.params.channelId,
    authorId,
    content: (content || "").trim(),
    attachments: attachments || [],
    replyToId: replyToId || null,
    reactions: [],
    isEdited: false,
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
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
        authorName: parentAuthor?.displayName || "Unknown",
        content: parent.content
      };
    }
  }
  return res.status(201).json({
    message: {
      ...newMsg,
      author: author ? db.sanitizeUser(author) : null,
      reactions: [],
      replyTo
    }
  });
});
router.delete("/channels/:channelId/messages/:messageId", requireAuth, (req, res) => {
  const msg = db.serverMessages.get(req.params.messageId);
  if (!msg) return res.status(404).json({ error: "Message not found" });
  if (msg.authorId !== req.user.userId) {
    return res.status(403).json({ error: "Not allowed to delete this message" });
  }
  db.serverMessages.delete(req.params.messageId);
  return res.json({ message: "Message deleted" });
});
router.post("/channels/:channelId/messages/:messageId/reactions", requireAuth, (req, res) => {
  const { emoji } = req.body;
  if (!emoji) return res.status(400).json({ error: "Emoji is required" });
  const msg = db.serverMessages.get(req.params.messageId);
  if (!msg) return res.status(404).json({ error: "Message not found" });
  const userId = req.user.userId;
  const existingIndex = msg.reactions.findIndex((r) => r.userId === userId && r.emoji === emoji);
  if (existingIndex >= 0) {
    msg.reactions.splice(existingIndex, 1);
  } else {
    msg.reactions.push({
      id: `r_${Date.now()}`,
      emoji,
      userId
    });
  }
  return res.json({ reactions: formatReactions(msg.reactions) });
});
router.get("/dms/conversations", requireAuth, (req, res) => {
  const myId = req.user.userId;
  const dmPartners = /* @__PURE__ */ new Set();
  for (const dm of db.directMessages.values()) {
    if (dm.senderId === myId) dmPartners.add(dm.receiverId);
    else if (dm.receiverId === myId) dmPartners.add(dm.senderId);
  }
  const conversations = Array.from(dmPartners).map((partnerId) => {
    const user = db.getUserById(partnerId);
    if (!user) return null;
    const thread = Array.from(db.directMessages.values()).filter((dm) => dm.senderId === myId && dm.receiverId === partnerId || dm.senderId === partnerId && dm.receiverId === myId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return {
      user: db.sanitizeUser(user),
      lastMessage: thread[0] || null
    };
  }).filter(Boolean);
  return res.json({ conversations });
});
router.get("/dms/:userId/messages", requireAuth, (req, res) => {
  const myId = req.user.userId;
  const targetId = req.params.userId;
  const thread = Array.from(db.directMessages.values()).filter((m) => m.senderId === myId && m.receiverId === targetId || m.senderId === targetId && m.receiverId === myId).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  const messages = thread.map((msg) => {
    const author = db.getUserById(msg.senderId);
    let replyTo = null;
    if (msg.replyToId) {
      const parent = db.directMessages.get(msg.replyToId);
      if (parent) {
        const parentAuthor = db.getUserById(parent.senderId);
        replyTo = {
          id: parent.id,
          authorName: parentAuthor?.displayName || "Unknown",
          content: parent.content
        };
      }
    }
    return {
      ...msg,
      author: author ? db.sanitizeUser(author) : null,
      reactions: formatReactions(msg.reactions),
      replyTo
    };
  });
  return res.json({ messages });
});
router.post("/dms/:userId/messages", requireAuth, (req, res) => {
  const { content, attachments, replyToId } = req.body;
  if (!content?.trim() && (!attachments || attachments.length === 0)) {
    return res.status(400).json({ error: "Content or attachment is required" });
  }
  const myId = req.user.userId;
  const targetId = req.params.userId;
  const targetUser = db.getUserById(targetId);
  if (!targetUser) return res.status(404).json({ error: "Recipient not found" });
  const msgId = `dm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const newDm = {
    id: msgId,
    senderId: myId,
    receiverId: targetId,
    content: (content || "").trim(),
    attachments: attachments || [],
    replyToId: replyToId || null,
    reactions: [],
    isEdited: false,
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
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
        authorName: parentAuthor?.displayName || "Unknown",
        content: parent.content
      };
    }
  }
  return res.status(201).json({
    message: {
      ...newDm,
      author: author ? db.sanitizeUser(author) : null,
      reactions: [],
      replyTo
    }
  });
});
router.post("/dms/:userId/messages/:messageId/reactions", requireAuth, (req, res) => {
  const { emoji } = req.body;
  if (!emoji) return res.status(400).json({ error: "Emoji is required" });
  const msg = db.directMessages.get(req.params.messageId);
  if (!msg) return res.status(404).json({ error: "Message not found" });
  const userId = req.user.userId;
  const existingIndex = msg.reactions.findIndex((r) => r.userId === userId && r.emoji === emoji);
  if (existingIndex >= 0) {
    msg.reactions.splice(existingIndex, 1);
  } else {
    msg.reactions.push({
      id: `r_${Date.now()}`,
      emoji,
      userId
    });
  }
  return res.json({ reactions: formatReactions(msg.reactions) });
});
router.delete("/dms/:userId/messages/:messageId", requireAuth, (req, res) => {
  const msg = db.directMessages.get(req.params.messageId);
  if (!msg) return res.status(404).json({ error: "Message not found" });
  if (msg.senderId !== req.user.userId) {
    return res.status(403).json({ error: "Not allowed to delete this message" });
  }
  db.directMessages.delete(req.params.messageId);
  const io2 = req.app.get("io");
  if (io2) {
    const room = [msg.senderId, msg.receiverId].sort().join(":");
    io2.to(`dm:${room}`).emit("message:deleted_dm", { messageId: req.params.messageId });
  }
  return res.json({ message: "Message deleted", success: true });
});
var routes_default = router;

// server/socket.ts
function setupSocketServer(io2) {
  const userSockets = /* @__PURE__ */ new Map();
  io2.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(" ")[1];
    if (token) {
      const payload = verifyToken(token);
      if (payload) {
        socket.userId = payload.userId;
        socket.username = payload.username;
      }
    }
    next();
  });
  io2.on("connection", (socket) => {
    const registerUserSocket = (userId) => {
      socket.userId = userId;
      if (!userSockets.has(userId)) {
        userSockets.set(userId, /* @__PURE__ */ new Set());
      }
      userSockets.get(userId).add(socket.id);
      socket.join(`user:${userId}`);
      const user = db.getUserById(userId);
      if (user) {
        user.status = "ONLINE";
        io2.emit("user:presence", { userId, status: "ONLINE", customStatus: user.customStatus });
      }
    };
    if (socket.userId) {
      registerUserSocket(socket.userId);
    }
    socket.on("auth:authenticate", ({ token }) => {
      const payload = verifyToken(token);
      if (payload) {
        registerUserSocket(payload.userId);
        socket.emit("auth:success", { userId: payload.userId });
      }
    });
    socket.on("channel:join", ({ channelId }) => {
      socket.join(`channel:${channelId}`);
    });
    socket.on("channel:leave", ({ channelId }) => {
      socket.leave(`channel:${channelId}`);
    });
    socket.on("message:send_channel", ({ channelId, message }) => {
      io2.to(`channel:${channelId}`).emit("message:new_channel", { channelId, message });
    });
    socket.on("message:delete_channel", ({ channelId, messageId }) => {
      io2.to(`channel:${channelId}`).emit("message:deleted_channel", { channelId, messageId });
    });
    socket.on("message:react_channel", ({ channelId, messageId, reactions }) => {
      io2.to(`channel:${channelId}`).emit("message:reactions_updated_channel", { channelId, messageId, reactions });
    });
    socket.on("dm:join", ({ targetUserId }) => {
      if (!socket.userId) return;
      const room = [socket.userId, targetUserId].sort().join(":");
      socket.join(`dm:${room}`);
    });
    socket.on("dm:leave", ({ targetUserId }) => {
      if (!socket.userId) return;
      const room = [socket.userId, targetUserId].sort().join(":");
      socket.leave(`dm:${room}`);
    });
    socket.on("message:send_dm", ({ receiverId, message }) => {
      if (!socket.userId) return;
      const room = [socket.userId, receiverId].sort().join(":");
      io2.to(`dm:${room}`).emit("message:new_dm", { message });
      io2.to(`user:${receiverId}`).emit("notification:dm", {
        senderId: socket.userId,
        message
      });
    });
    socket.on("message:react_dm", ({ receiverId, messageId, reactions }) => {
      if (!socket.userId) return;
      const room = [socket.userId, receiverId].sort().join(":");
      io2.to(`dm:${room}`).emit("message:reactions_updated_dm", { messageId, reactions });
    });
    socket.on("message:delete_dm", ({ receiverId, messageId }) => {
      if (!socket.userId) return;
      const room = [socket.userId, receiverId].sort().join(":");
      io2.to(`dm:${room}`).emit("message:deleted_dm", { messageId });
    });
    socket.on("typing:channel", ({ channelId, isTyping }) => {
      if (!socket.userId) return;
      const user = db.getUserById(socket.userId);
      if (!user) return;
      socket.to(`channel:${channelId}`).emit("user:typing_channel", {
        channelId,
        user: db.sanitizeUser(user),
        isTyping
      });
    });
    socket.on("typing:dm", ({ receiverId, isTyping }) => {
      if (!socket.userId) return;
      const user = db.getUserById(socket.userId);
      if (!user) return;
      const room = [socket.userId, receiverId].sort().join(":");
      socket.to(`dm:${room}`).emit("user:typing_dm", {
        senderId: socket.userId,
        user: db.sanitizeUser(user),
        isTyping
      });
    });
    socket.on("voice:join", ({ channelId, isMuted = false, isDeafened = false }) => {
      if (!socket.userId) return;
      const userId = socket.userId;
      const user = db.getUserById(userId);
      if (!user) return;
      if (socket.currentVoiceChannelId && socket.currentVoiceChannelId !== channelId) {
        const oldChannelId = socket.currentVoiceChannelId;
        socket.leave(`voice:${oldChannelId}`);
        db.voiceParticipants.delete(userId);
        io2.to(`voice:${oldChannelId}`).emit("voice:user_left", { userId, channelId: oldChannelId });
      }
      socket.currentVoiceChannelId = channelId;
      socket.join(`voice:${channelId}`);
      db.voiceParticipants.set(userId, {
        userId,
        channelId,
        isMuted,
        isDeafened,
        isSpeaking: false,
        joinedAt: (/* @__PURE__ */ new Date()).toISOString()
      });
      const existingParticipants = Array.from(db.voiceParticipants.values()).filter((p) => p.channelId === channelId && p.userId !== userId).map((p) => {
        const u = db.getUserById(p.userId);
        return {
          ...p,
          user: u ? db.sanitizeUser(u) : null
        };
      });
      socket.emit("voice:existing_participants", {
        channelId,
        participants: existingParticipants
      });
      socket.to(`voice:${channelId}`).emit("voice:user_joined", {
        participant: {
          userId,
          channelId,
          isMuted,
          isDeafened,
          isSpeaking: false,
          joinedAt: (/* @__PURE__ */ new Date()).toISOString(),
          user: db.sanitizeUser(user)
        }
      });
    });
    socket.on("voice:leave", () => {
      if (!socket.userId || !socket.currentVoiceChannelId) return;
      const channelId = socket.currentVoiceChannelId;
      const userId = socket.userId;
      socket.leave(`voice:${channelId}`);
      db.voiceParticipants.delete(userId);
      socket.currentVoiceChannelId = void 0;
      io2.to(`voice:${channelId}`).emit("voice:user_left", { userId, channelId });
    });
    socket.on("voice:signal", ({ toUserId, signalData }) => {
      if (!socket.userId) return;
      io2.to(`user:${toUserId}`).emit("voice:signal", {
        fromUserId: socket.userId,
        signalData
      });
    });
    socket.on("voice:state_change", ({ isMuted, isDeafened, isSpeaking }) => {
      if (!socket.userId || !socket.currentVoiceChannelId) return;
      const userId = socket.userId;
      const channelId = socket.currentVoiceChannelId;
      const participant = db.voiceParticipants.get(userId);
      if (participant) {
        if (isMuted !== void 0) participant.isMuted = isMuted;
        if (isDeafened !== void 0) participant.isDeafened = isDeafened;
        if (isSpeaking !== void 0) participant.isSpeaking = isSpeaking;
        io2.to(`voice:${channelId}`).emit("voice:user_state_updated", {
          userId,
          channelId,
          isMuted: participant.isMuted,
          isDeafened: participant.isDeafened,
          isSpeaking: participant.isSpeaking
        });
      }
    });
    socket.on("call:initiate", ({ toUserId, channelId, isVideo = false }) => {
      if (!socket.userId) return;
      const caller = db.getUserById(socket.userId);
      if (!caller) return;
      io2.to(`user:${toUserId}`).emit("call:incoming", {
        caller: db.sanitizeUser(caller),
        channelId,
        isVideo
      });
    });
    socket.on("call:accept", ({ toUserId, channelId }) => {
      io2.to(`user:${toUserId}`).emit("call:accepted", {
        fromUserId: socket.userId,
        channelId
      });
    });
    socket.on("call:decline", ({ toUserId, channelId }) => {
      io2.to(`user:${toUserId}`).emit("call:declined", {
        fromUserId: socket.userId,
        channelId
      });
    });
    socket.on("call:end", ({ toUserId, channelId }) => {
      io2.to(`user:${toUserId}`).emit("call:ended", {
        fromUserId: socket.userId,
        channelId
      });
    });
    socket.on("disconnect", () => {
      if (socket.userId) {
        const userId = socket.userId;
        const set = userSockets.get(userId);
        if (set) {
          set.delete(socket.id);
          if (set.size === 0) {
            userSockets.delete(userId);
            const user = db.getUserById(userId);
            if (user) {
              user.status = "OFFLINE";
              io2.emit("user:presence", { userId, status: "OFFLINE" });
            }
          }
        }
        if (socket.currentVoiceChannelId) {
          const channelId = socket.currentVoiceChannelId;
          db.voiceParticipants.delete(userId);
          io2.to(`voice:${channelId}`).emit("voice:user_left", { userId, channelId });
        }
      }
    });
  });
}

// server.ts
import path from "path";
import { fileURLToPath } from "url";
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var app = express2();
var server = http.createServer(app);
var io = new SocketIOServer(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PATCH", "DELETE"]
  },
  maxHttpBufferSize: 1e7
  // 10MB limit for attachments
});
app.use(cors());
app.use(express2.json({ limit: "10mb" }));
app.use(express2.urlencoded({ extended: true, limit: "10mb" }));
app.set("io", io);
app.use("/api", routes_default);
app.get("/accord-source.zip", (_req, res) => {
  const zipPath = path.resolve(__dirname, "public/accord-source.zip");
  res.download(zipPath, "accord-project.zip");
});
setupSocketServer(io);
var isProduction = process.env.NODE_ENV === "production";
var PORT = Number(process.env.PORT) || 3e3;
if (!isProduction) {
  const { createServer: createViteServer } = await import("vite");
  const vite = await createViteServer({
    server: {
      middlewareMode: true,
      hmr: false
    },
    appType: "spa"
  });
  app.use((req, res, next) => {
    if (req.url && req.url.startsWith("/@vite/client")) {
      const origWrite = res.write.bind(res);
      const origEnd = res.end.bind(res);
      const chunks = [];
      res.write = function(chunk, ...args) {
        if (chunk) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        return true;
      };
      res.end = function(chunk, ...args) {
        if (chunk) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        let body = Buffer.concat(chunks).toString("utf8");
        body = body.replace(
          "const createWebSocketModuleRunnerTransport =",
          'const createWebSocketModuleRunnerTransport = () => ({ connect: async (handlers) => { try { if (handlers && typeof handlers.onMessage === "function") { handlers.onMessage({ type: "connected" }); } } catch (_) {} }, disconnect: () => {}, send: () => {} }); const _origTransport ='
        );
        body = body.replaceAll(
          'throw new SendBeforeConnectError("send was called before connect");',
          "return;"
        );
        body = body.replaceAll(
          'throw new SendBeforeConnectError("invoke was called before connect");',
          "return;"
        );
        body = body.replaceAll(
          "async function ping() {",
          "async function ping() { return true; } async function _origPing() {"
        );
        res.setHeader("Content-Length", Buffer.byteLength(body, "utf8"));
        res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
        return origEnd(body, "utf8");
      };
    }
    next();
  });
  app.use(vite.middlewares);
} else {
  const distPath = path.resolve(__dirname, "dist");
  app.use(express2.static(distPath));
  app.get("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
server.listen(PORT, "0.0.0.0", () => {
  console.log(`[Accord Engine] Server running on http://0.0.0.0:${PORT}`);
});
