// ==========================
//  IMPORTS & SETUP
// ==========================
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import cron from 'node-cron';
import fs from 'fs';
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { createServer } from "http";
import { Server } from "socket.io";

dotenv.config();

// Temporary OTP store: { email: { otp, expires } }
const otpStore = {}

const app = express()
const httpServer = createServer(app);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "http:", "https:", "ws:", "wss:"],
      styleSrc: ["'self'", "'unsafe-inline'", "https:"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      imgSrc: ["'self'", "data:", "https:", "http:"],
      connectSrc: ["'self'", "http:", "https:", "ws:", "wss:"]
    },
  },
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 1 * 60 * 1000, // 1 minute
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 500, // limit each IP to 500 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// CORS configuration - origins loaded from environment variable
// Set FRONTEND_ORIGIN in .env as a comma-separated list of allowed origins,
// e.g. FRONTEND_ORIGIN=http://localhost:3000,http://localhost:3001
const allowedOrigins = process.env.FRONTEND_ORIGIN
  ? process.env.FRONTEND_ORIGIN.split(',').map(origin => origin.trim())
  : ["http://localhost:3000", "http://localhost:3001"];

const corsOptions = {
  origin: allowedOrigins,
  credentials: true,
  optionsSuccessStatus: 200
};

// Frontend URL for email template links
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

app.use(cors(corsOptions))
app.use(bodyParser.json({ limit: '50mb' }))
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }))


// Serve static files
app.use('/uploads', express.static('uploads'))


import { startTournamentAutomation } from "./tournament-status-automation.js";
import User from "./models/User.js";

startTournamentAutomation(60000)

// Socket.io configuration for chat integration
const io = new Server(httpServer, {
  cors: corsOptions,
  transports: ['websocket', 'polling'],
});

// Socket.io Authentication Middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error("Authentication required"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key");
    const user = await User.findById(decoded.userId);

    if (!user) {
      return next(new Error("User not found"));
    }

    socket.userId = user._id.toString();
    socket.user = user;
    next();
  } catch (error) {
    next(new Error("Invalid token"));
  }
});

// Socket.io Connection Handler for chat
const userSockets = new Map(); // userId -> socketId

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.userId}`);
  userSockets.set(socket.userId, socket.id);

  // Send online users list
  io.emit("onlineUsers", Array.from(userSockets.keys()));

  // Join user's personal room
  socket.join(`user:${socket.userId}`);

  // Send message - persisted to DB with sender info
  socket.on("sendMessage", async (data, ack) => {
    try {
      const { receiverId, content } = data;

      // Validate message content
      if (!content || content.trim().length === 0) {
        if (ack) ack({ ok: false, error: "Message content cannot be empty" });
        return socket.emit("error", { message: "Message content cannot be empty" });
      }

      if (content.length > 1000) {
        if (ack) ack({ ok: false, error: "Message too long" });
        return socket.emit("error", { message: "Message too long" });
      }

      // Validate receiver exists
      const receiver = await User.findById(receiverId);
      if (!receiver) {
        if (ack) ack({ ok: false, error: "Receiver not found" });
        return socket.emit("error", { message: "Receiver not found" });
      }

      // Persist message to database
      const newMessage = new Message({
        sender: socket.userId,
        receiver: receiverId,
        content: content.trim(),
        read: false,
      });
      await newMessage.save();

      // Build payload with populated sender info
      const messagePayload = {
        _id: newMessage._id,
        sender: {
          _id: socket.userId,
          username: socket.user.username,
          fullName: socket.user.fullName,
        },
        receiver: {
          _id: receiverId,
          username: receiver.username,
          fullName: receiver.fullName,
        },
        content: newMessage.content,
        read: false,
        createdAt: newMessage.createdAt,
      };

      // Send to sender
      socket.emit("receiveMessage", messagePayload);

      // Send to receiver if online
      const receiverSocketId = userSockets.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("receiveMessage", messagePayload);
      }

      // Emit to both users' personal rooms
      io.to(`user:${socket.userId}`).emit("messageSent", { ok: true, message: messagePayload });
      io.to(`user:${receiverId}`).emit("messageReceived", { ok: true, message: messagePayload });

      // Fire ack callback so frontend knows it succeeded
      if (ack) ack({ ok: true, message: messagePayload });
    } catch (error) {
      console.error("Error sending message:", error);
      if (ack) ack({ ok: false, error: "Failed to send message" });
      socket.emit("error", { message: "Failed to send message" });
    }
  });

  // Handle follow request events
  socket.on("followRequestSent", (data) => {
    const { receiverId } = data;
    const receiverSocketId = userSockets.get(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newFollowRequest", {
        from: socket.user.username,
        userId: socket.userId,
      });
    }
    // Update sender's UI
    socket.emit("userFollowed", { message: "Request sent successfully" });
  });

  // Disconnect handler
  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.userId}`);
    userSockets.delete(socket.userId);
    io.emit("onlineUsers", Array.from(userSockets.keys()));
    io.emit("userOffline", socket.userId);
  });
});
// ==========================
//  HELPER FUNCTION
// ==========================
function generateTournamentId() {
  return "T" + Math.floor(1000 + Math.random() * 9000) // e.g. T1234
}

// ==========================
//  MODEL DEFINITIONS
// ==========================

// User model is now imported from models/User.js

// ADMIN MODEL
const adminSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    amount: { type: Number, default: 0 },
    notificationEmail: { type: String, default: null }, // new field
    isEmailVerified: { type: Boolean, default: false },

  },
  { timestamps: true },
)

const Admin = mongoose.model("admin", adminSchema)

// PARTICIPANT SUBDOCUMENT
const participantSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "user_master", required: true },
    team_name: { type: String, required: true },
    rank: { type: Number, default: 0 },
    payment_status: { type: String, enum: ["paid", "pending"], default: "pending" },
  },
  { timestamps: true },
)

// TOURNAMENT MODEL
const tournamentSchema = new mongoose.Schema(
  {
    t_id: { type: String, required: true, unique: true },
    game: { type: String, required: true },
    map: { type: String, required: true },
    mode_type: { type: String, enum: ["solo", "duo", "squad"], default: "solo" },
    slots: { type: Number, default: 16, min: 1, max: 16 },
    entry_fee: { type: Number, required: true, min: 0 },
    t_date: { type: Date, required: true },
    t_time: { type: String, required: true },
    rewards: {
      first: { type: Number, default: 0 },
      second: { type: Number, default: 0 },
      third: { type: Number, default: 0 },
    },
    t_status: { type: String, enum: ["pending", "running", "completed"], default: "pending" },
    result_published: { type: Boolean, default: false },
    result_image_path: { type: String }, // Path to stored result image
    participants: [participantSchema],
    thumbnail: { type: String },
  },
  { timestamps: true },
)

const Tournament = mongoose.model("tournament", tournamentSchema)

// PAYMENT MODEL
const paymentSchema = new mongoose.Schema(
  {
    p_id: { type: String, required: true, unique: true },
    amount: { type: Number, required: true },
    p_type: { type: String, enum: ["deposit", "withdraw", "tournament", "refund", "prize"], required: true },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "user_master", required: true },
    tournament_id: { type: String }, // optional, only for tournament payments
    p_date: { type: Date, default: Date.now },
    p_time: { type: String, default: new Date().toLocaleTimeString() },
  },
  { timestamps: true },
)

const Payment = mongoose.model("payment", paymentSchema)

// MESSAGE MODEL
const messageSchema = new mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "user_master", required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: "user_master", required: true },
    content: { type: String, required: true, trim: true, maxlength: 1000 },
    read: { type: Boolean, default: false },
  },
  { timestamps: true },
)

const Message = mongoose.model("message", messageSchema)

// ==========================
//  DATABASE CONNECTION
// ==========================
mongoose
  .connect(
     process.env.MONGO_URL,
  )
  .then(async () => {
    console.log("MongoDB connected successfully")

    // Default admin creation
    try {
      const adminExists = await Admin.findOne({ username: "admin@123" })
      if (!adminExists) {
        const defaultAdmin = new Admin({ username: "admin@123", password: "123" })
        await defaultAdmin.save()
        console.log("Default admin account created")
      }
    } catch (error) {
      console.error("Error creating default admin:", error)
    }

    httpServer.listen(5000, () => {
      console.log("Server started at http://localhost:5000")
      console.log("Socket.io server is running")
    })
  })
  .catch((err) => console.log("MongoDB connection error:", err))

// Create a transporter using environment variables
const transporter = nodemailer.createTransport({
  service: "gmail", // ✅ built-in Gmail config (no host/port issues)
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

// Verify transporter on boot (non-fatal)
transporter.verify().then(
  () => console.log("SMTP transporter ready"),
  (err) => console.warn("SMTP transporter not ready:", err?.message),
)

// ==========================
//  CHAT INTEGRATION ROUTES
// ==========================

// Middleware to verify JWT token
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key");
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ message: 'Token is not valid' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

app.get("/health", async (req, res) => {
  try {
    // optional: check DB (mongoose)
    const dbOk = (mongoose && mongoose.connection && mongoose.connection.readyState === 1);
    if (!dbOk) return res.status(500).json({ status: "fail", db: "disconnected" });
    res.json({ status: "ok" });
  } catch (err) {
    res.status(500).json({ status: "fail" });
  }
});

// Get current user for chat
app.get("/api/auth/me", auth, async (req, res) => {
  try {
    res.json(req.user.getChatData());
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Enhanced search users for chat
app.get("/api/users/search", auth, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.json([]);
    }

    // Search in multiple fields including tournament participation
    const users = await User.find({
      $or: [
        { username: { $regex: q, $options: 'i' } },
        { fullName: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { teamName: { $regex: q, $options: 'i' } }
      ],
      _id: { $ne: req.user._id } // Exclude current user
    }).limit(10);

    // Also search for users by tournament participation
    const tournamentSearch = await Tournament.find({
      $or: [
        { t_id: { $regex: q, $options: 'i' } },
        { "participants.team_name": { $regex: q, $options: 'i' } }
      ]
    }).populate('participants.user_id', 'username fullName email teamName');

    // Extract users from tournament search
    const tournamentUsers = [];
    tournamentSearch.forEach(tournament => {
      tournament.participants.forEach(participant => {
        if (participant.user_id && participant.user_id._id.toString() !== req.user._id.toString()) {
          tournamentUsers.push({
            ...participant.user_id.toObject(),
            foundVia: tournament.t_id,
            teamName: participant.team_name
          });
        }
      });
    });

    // Combine and deduplicate results
    const allUsers = [...users, ...tournamentUsers];
    const uniqueUsers = allUsers.reduce((acc, user) => {
      const existing = acc.find(u => u._id.toString() === user._id.toString());
      if (!existing) {
        acc.push(user);
      }
      return acc;
    }, []);

    const searchResults = uniqueUsers.map(user => ({
      id: user._id,
      username: user.username,
      firstName: user.firstName || user.fullName.split(' ')[0],
      lastName: user.lastName || user.fullName.split(' ').slice(1).join(' '),
      email: user.email,
      teamName: user.teamName || user.foundVia,
      foundVia: user.foundVia,
      isFollowing: req.user.following.includes(user._id),
      hasRequested: req.user.sentFollowRequests.includes(user._id),
      followers: user.followers?.length || 0
    }));

    res.json(searchResults);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get suggested users based on tournaments
app.get("/api/users/suggested", auth, async (req, res) => {
  try {
    // Find users who joined the same tournaments
    const userTournaments = await Tournament.find({
      "participants.user_id": req.user._id
    });

    const tournamentIds = userTournaments.map(t => t._id);
    
    // Find other users who joined the same tournaments
    const suggestedUsers = await User.find({
      tournamentsJoined: { $in: tournamentIds },
      _id: { 
        $nin: [
          req.user._id,
          ...req.user.following,
          ...req.user.sentFollowRequests
        ]
      }
    }).limit(10);

    const suggestions = suggestedUsers.map(user => ({
      id: user._id,
      username: user.username,
      firstName: user.firstName || user.fullName.split(' ')[0],
      lastName: user.lastName || user.fullName.split(' ').slice(1).join(' '),
      email: user.email,
      followers: user.followers.length,
      isFollowing: false,
      hasRequested: false
    }));

    res.json(suggestions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Send follow request
app.post("/api/follow/request", auth, async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (userId === req.user._id.toString()) {
      return res.status(400).json({ message: "Cannot follow yourself" });
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    if (req.user.following.includes(userId)) {
      return res.status(400).json({ message: "Already following this user" });
    }

    if (req.user.sentFollowRequests.includes(userId)) {
      return res.status(400).json({ message: "Follow request already sent" });
    }

    // Add to sent requests
    req.user.sentFollowRequests.push(userId);
    await req.user.save();

    // Add to target user's pending requests
    targetUser.pendingFollowRequests.push(req.user._id);
    await targetUser.save();

    res.json({ message: "Follow request sent successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Cancel follow request
app.post("/api/follow/cancel", auth, async (req, res) => {
  try {
    const { userId } = req.body;
    
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Remove from sent requests
    req.user.sentFollowRequests = req.user.sentFollowRequests.filter(
      id => id.toString() !== userId
    );
    await req.user.save();

    // Remove from target user's pending requests
    targetUser.pendingFollowRequests = targetUser.pendingFollowRequests.filter(
      id => id.toString() !== req.user._id.toString()
    );
    await targetUser.save();

    res.json({ message: "Follow request cancelled successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get pending follow requests
app.get("/api/follow/pending", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('pendingFollowRequests', 'username fullName email');
    
    res.json(user.pendingFollowRequests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Accept follow request
app.post("/api/follow/accept", auth, async (req, res) => {
  try {
    const { userId } = req.body;
    
    const requester = await User.findById(userId);
    if (!requester) {
      return res.status(404).json({ message: "User not found" });
    }

    // Remove from pending requests
    req.user.pendingFollowRequests = req.user.pendingFollowRequests.filter(
      id => id.toString() !== userId
    );
    
    // Add to followers
    req.user.followers.push(userId);
    await req.user.save();

    // Remove from requester's sent requests
    requester.sentFollowRequests = requester.sentFollowRequests.filter(
      id => id.toString() !== req.user._id.toString()
    );
    
    // Add to requester's following
    requester.following.push(req.user._id);
    await requester.save();

    res.json({ message: "Follow request accepted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Reject follow request
app.post("/api/follow/reject", auth, async (req, res) => {
  try {
    const { userId } = req.body;
    
    const requester = await User.findById(userId);
    if (!requester) {
      return res.status(404).json({ message: "User not found" });
    }

    // Remove from pending requests
    req.user.pendingFollowRequests = req.user.pendingFollowRequests.filter(
      id => id.toString() !== userId
    );
    await req.user.save();

    // Remove from requester's sent requests
    requester.sentFollowRequests = requester.sentFollowRequests.filter(
      id => id.toString() !== req.user._id.toString()
    );
    await requester.save();

    res.json({ message: "Follow request rejected" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Unfollow user
app.post("/api/follow/unfollow", auth, async (req, res) => {
  try {
    const { userId } = req.body;
    
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Remove from following
    req.user.following = req.user.following.filter(
      id => id.toString() !== userId
    );
    await req.user.save();

    // Remove from target user's followers
    targetUser.followers = targetUser.followers.filter(
      id => id.toString() !== req.user._id.toString()
    );
    await targetUser.save();

    res.json({ message: "Unfollowed successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get conversations (users you have chatted with + last message)
app.get("/api/conversations", auth, async (req, res) => {
  try {
    const userId = req.user._id;

    // Find all messages involving this user
    const messages = await Message.find({
      $or: [{ sender: userId }, { receiver: userId }]
    }).sort({ createdAt: -1 }).limit(200);

    // Group by other user
    const convMap = new Map();
    messages.forEach(msg => {
      const otherId = msg.sender.toString() === userId.toString() ? msg.receiver.toString() : msg.sender.toString();
      if (!convMap.has(otherId)) {
        convMap.set(otherId, { lastMessage: msg, unread: 0 });
      }
    });

    // Populate other user info
    const conversations = [];
    for (const [otherId, data] of convMap.entries()) {
      const otherUser = await User.findById(otherId, 'username fullName email');
      if (!otherUser) continue;
      conversations.push({
        user: {
          id: otherUser._id,
          username: otherUser.username,
          firstName: otherUser.firstName || otherUser.fullName?.split(' ')[0] || otherUser.username,
          lastName: otherUser.lastName || otherUser.fullName?.split(' ').slice(1).join(' ') || '',
        },
        lastMessage: {
          content: data.lastMessage.content,
          isSender: data.lastMessage.sender.toString() === userId.toString(),
          time: data.lastMessage.createdAt,
        },
        unread: 0,
      });
    }

    res.json(conversations);
  } catch (error) {
    console.error("Error fetching conversations:", error);
    res.status(500).json({ message: error.message });
  }
});

// Get message history with a specific user
app.get("/api/messages/:userId", auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    const messages = await Message.find({
      $or: [
        { sender: currentUserId, receiver: userId },
        { sender: userId, receiver: currentUserId },
      ]
    })
    .sort({ createdAt: 1 })
    .limit(200)
    .populate('sender', 'username fullName')
    .populate('receiver', 'username fullName');

    // Mark messages as read
    await Message.updateMany(
      { sender: userId, receiver: currentUserId, read: false },
      { $set: { read: true } }
    );

    const payload = messages.map(m => ({
      _id: m._id,
      sender: {
        _id: m.sender._id,
        username: m.sender.username,
        fullName: m.sender.fullName,
      },
      receiver: {
        _id: m.receiver._id,
        username: m.receiver.username,
        fullName: m.receiver.fullName,
      },
      content: m.content,
      read: m.read,
      createdAt: m.createdAt,
    }));

    res.json(payload);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ message: error.message });
  }
});

// ==========================
//  USER AUTH & PROFILE ROUTES
// ==========================

// Signup
app.post("/signup", async (req, res) => {
  try {
    const { fullName, username, email, password } = req.body
    if (!fullName || !username || !email || !password)
      return res.status(400).json({ msg: "All required fields must be filled." })

    const exists = await User.findOne({ $or: [{ username }, { email }] })
    if (exists) return res.status(400).json({ msg: "User already exists!" })

    // Set firstName and lastName for chat compatibility
    const nameParts = fullName.split(' ')
    const firstName = nameParts[0]
    const lastName = nameParts.slice(1).join(' ')

    const userData = {
      ...req.body,
      firstName,
      lastName,
    }

    const user = new User(userData)
    await user.save()

    // Generate JWT token for chat integration
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "7d" }
    )

    res.status(201).json({ 
      msg: "Signup successful!",
      user: user.getTournamentData(),
      token, // Include token for chat authentication
    })
  } catch (error) {
    res.status(500).json({ msg: "Signup failed", error: error.message })
  }
})

// Login
app.post("/login", async (req, res) => {
  try {
    const { emailOrUsername, password } = req.body
    const user = await User.findOne({
      $or: [{ email: emailOrUsername }, { username: emailOrUsername }],
    })

    if (!user) return res.status(400).json({ msg: "User not found!" })
    
    // Use bcrypt comparison for password
    const isPasswordValid = await user.comparePassword(password)
    if (!isPasswordValid) return res.status(400).json({ msg: "Incorrect password!" })

    // Generate JWT token for chat integration
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "7d" }
    )

    res.status(200).json({
      msg: "Login successful!",
      user: user.getTournamentData(),
      token, // Include token for chat authentication
    })
  } catch (error) {
    res.status(500).json({ msg: "Server error" })
  }
})

// 1️⃣ Send OTP Email
app.post("/auth/send-otp", async (req, res) => {
  try {
    const { email } = req.body
    if (!email) return res.status(400).json({ msg: "Email required" })

    const user = await User.findOne({ email })
    if (!user) return res.status(404).json({ msg: "User not found" })

    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    otpStore[email] = { otp, expires: Date.now() + 10 * 60 * 1000 } // 10 min

    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: email,
      subject: "🎮 Tournament Portal - Secure OTP Verification",
      html: `
  <div style="
    background: linear-gradient(135deg, #0f0c29, #302b63, #24243e);
    color: #fff;
    font-family: 'Segoe UI', Roboto, sans-serif;
    padding: 30px;
    border-radius: 12px;
    text-align: center;
    box-shadow: 0 0 25px rgba(0,0,0,0.5);
    max-width: 500px;
    margin: auto;
  ">
    <h1 style="font-size: 24px; margin-bottom: 15px; letter-spacing: 1px;">⚔️ PLAYZONE VERIFICATION PORTAL ⚔️</h1>
    <p style="font-size: 16px; color: #c9c9c9;">Hey, <b>Warrior</b> 👾</p>
    <p style="font-size: 15px; line-height: 1.6; color: #ddd;">
      We've received a request to reset your password for your Tournament account.<br/>
      Enter the following OTP in the app to verify your identity:
    </p>

    <div style="
      background: #1a1a40;
      color: #00ffcc;
      font-size: 32px;
      font-weight: bold;
      letter-spacing: 5px;
      padding: 20px;
      border-radius: 8px;
      display: inline-block;
      margin: 20px 0;
      box-shadow: 0 0 15px #00ffcc;
    ">
      ${otp}
    </div>

    <p style="font-size: 14px; color: #bbb;">
      ⚠️ This OTP will expire in <b>10 minutes</b>.<br/>
      If you didn't request this, please ignore this message.
    </p>

    <hr style="border: none; border-top: 1px solid #333; margin: 25px 0;">
    <p style="font-size: 12px; color: #888;">
      Powered by <b>PLAYZONE</b> 🎯<br/>
      <span style="color:#555;">"Where every gamer becomes a legend."</span>
    </p>
  </div>
  `,
    })

    res.json({ msg: "OTP sent successfully" })
  } catch (err) {
    console.error(err)
    res.status(500).json({ msg: "Server error" })
  }
})

// 2️⃣ Verify OTP
app.post("/auth/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body
    const record = otpStore[email]
    if (!record) return res.status(400).json({ msg: "OTP not found or expired" })

    if (record.otp !== otp || Date.now() > record.expires)
      return res.status(400).json({ msg: "Invalid or expired OTP" })

    delete otpStore[email] // ✅ Remove after success
    res.json({ msg: "OTP verified" })
  } catch (err) {
    console.error(err)
    res.status(500).json({ msg: "Server error" })
  }
})

// Forget Password
app.put("/forgetPass", async (req, res) => {
  try {
    const { email, newPassword } = req.body
    if (!email || !newPassword) return res.status(400).json({ msg: "Email and new password are required." })

    const user = await User.findOne({ email })
    if (!user) return res.status(404).json({ msg: "User not found!" })

    user.password = newPassword
    await user.save()
    res.json({ msg: "Password updated successfully." })
  } catch (error) {
    res.status(500).json({ msg: "Server error" })
  }
})

// Get user by username/email
app.get("/user/:identifier", async (req, res) => {
  try {
    const identifier = req.params.identifier
    const user = await User.findOne({ $or: [{ username: identifier }, { email: identifier }] })
    if (!user) return res.status(404).json({ message: "User not found" })
    res.json(user)
  } catch (error) {
    res.status(500).json({ message: "Server error" })
  }
})
// ✅ Fetch user by MongoDB _id (for dashboard, payment page, etc.)
app.get("/user/id/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
    if (!user) {
      return res.status(404).json({ msg: "User not found" })
    }
    res.json(user)
  } catch (error) {
    console.error(error)
    res.status(500).json({ msg: "Server error" })
  }
})

// GET upcoming tournaments (for dashboard reminders)
app.get("/admin/upcoming-tournaments", async (req, res) => {
  try {
    const now = new Date()
    const upcomingTournaments = await Tournament.find({ t_date: { $gte: now } })
      .sort({ t_date: 1, t_time: 1 })
      .limit(10) // limit to next 10 tournaments

    res.json(upcomingTournaments)
  } catch (err) {
    console.error("Error fetching upcoming tournaments:", err)
    res.status(500).json({ msg: "Server error" })
  }
})

// Contact Form Submit
app.post("/contact/submit", async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    // Basic validation
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Send contact email to support
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: process.env.SMTP_USER,
      replyTo: email,
      subject: `🎮 Contact Form: ${subject}`,
      html: `
        <div style="padding: 30px; max-width: 600px; margin: auto;">
          <h2 style="color: #00f5d4;">New Contact Form Submission</h2>
          <hr>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <br>
          <h3 style="color: #00f5d4;">Message:</h3>
          <p style="white-space: pre-wrap; line-height: 1.6;">${message}</p>
          <hr>
          <p style="color: #888; font-size: 12px;">Sent from Playzone Contact Form</p>
        </div>
      `
    });

    res.status(200).json({ message: "Message sent successfully! We will get back to you soon." });
  } catch (error) {
    console.error("Contact form error:", error);
    res.status(500).json({ message: "Failed to send message. Please try again." });
  }
});

// Update user info
app.put("/updateUser", async (req, res) => {
  try {
    const { username } = req.body
    const user = await User.findOne({ username })
    if (!user) return res.status(404).json({ message: "User not found" })

    user.fullName = req.body.fullName || user.fullName
    user.email = req.body.email || user.email
    user.contact = req.body.contact || user.contact
    user.dob = req.body.dob || user.dob

    await user.save()
    res.json({ message: "Profile updated successfully" })
  } catch (error) {
    res.status(500).json({ message: "Server error" })
  }
})

// ==========================
//  ADMIN BROADCASTING SYSTEM
// ==========================

// Send broadcast notification to all users
app.post("/admin/broadcast", async (req, res) => {
  try {
    const { message, type, tournamentId } = req.body;
    
    if (!message) {
      return res.status(400).json({ message: "Message is required" });
    }

    let recipients = [];
    
    if (tournamentId) {
      // Send to specific tournament participants
      const tournament = await Tournament.findOne({ t_id: tournamentId })
        .populate('participants.user_id', 'email fullName username');
      
      if (!tournament) {
        return res.status(404).json({ message: "Tournament not found" });
      }
      
      recipients = tournament.participants.map(p => ({
        email: p.user_id.email,
        name: p.user_id.fullName || p.user_id.username
      }));
    } else {
      // Send to all users
      const users = await User.find({}, 'email fullName username');
      recipients = users.map(user => ({
        email: user.email,
        name: user.fullName || user.username
      }));
    }

    const subject = `🎮 PLAYZONE Notification - ${type || 'General Update'}`;
    
    const htmlBody = `
      <div style="
        background: linear-gradient(135deg, #0f0c29, #302b63, #24243e);
        color: #fff;
        font-family: 'Segoe UI', Roboto, sans-serif;
        padding: 35px;
        border-radius: 15px;
        text-align: center;
        box-shadow: 0 0 30px rgba(0,0,0,0.6);
        max-width: 600px;
        margin: auto;
      ">
        <h1 style="font-size: 28px; margin-bottom: 20px; color: #00ffcc;">
          🎮 PLAYZONE NOTIFICATION
        </h1>
        
        <div style="
          background: rgba(0, 255, 200, 0.1);
          border: 1px solid #00ffcc;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
        ">
          <p style="font-size: 16px; line-height: 1.6; color: #ddd;">
            ${message}
          </p>
        </div>
        
        <div style="margin: 25px 0;">
          <a href="${FRONTEND_URL}/DashBoard" target="_blank" style="
            background: linear-gradient(90deg, #00ffcc, #0077ff);
            padding: 12px 25px;
            color: #fff;
            font-weight: bold;
            border-radius: 8px;
            text-decoration: none;
            text-transform: uppercase;
            box-shadow: 0 0 15px #00ffcc;
            display: inline-block;
          ">Visit Dashboard</a>
        </div>
        
        <hr style="border: none; border-top: 1px solid #333; margin: 25px 0;">
        <p style="font-size: 12px; color: #888;">
          Powered by <b>PLAYZONE</b> 🎯<br/>
          <span style="color:#555;">"Where every gamer becomes a legend."</span>
        </p>
      </div>
    `;

    // Send emails
    const emailPromises = recipients.map(recipient => 
      transporter.sendMail({
        from: process.env.SMTP_USER,
        to: recipient.email,
        subject,
        html: htmlBody,
      }).catch(err => {
        console.error(`Failed to send email to ${recipient.email}:`, err);
        return { email: recipient.email, success: false, error: err.message };
      })
    );

    const results = await Promise.allSettled(emailPromises);
    const successCount = results.filter(r => r.status === 'fulfilled').length;
    const failureCount = results.length - successCount;

    // Also emit socket event for real-time notifications
    io.emit('adminBroadcast', {
      message,
      type: type || 'general',
      tournamentId,
      timestamp: new Date(),
    });

    res.json({
      message: `Broadcast sent successfully`,
      recipients: recipients.length,
      successCount,
      failureCount,
    });

  } catch (error) {
    console.error("Broadcast error:", error);
    res.status(500).json({ message: "Failed to send broadcast" });
  }
});

// Get predefined notification templates
app.get("/admin/broadcast/templates", async (req, res) => {
  try {
    const templates = [
      {
        id: "new_tournament",
        title: "New Tournament Created",
        message: "A new tournament has been created! Check out the latest competitions and register now.",
        type: "tournament"
      },
      {
        id: "results_published",
        title: "Tournament Results Published",
        message: "Tournament results have been published! Check your dashboard to see if you won any prizes.",
        type: "results"
      },
      {
        id: "maintenance",
        title: "Scheduled Maintenance",
        message: "We will be performing scheduled maintenance. The platform may be temporarily unavailable.",
        type: "maintenance"
      },
      {
        id: "prize_distribution",
        title: "Prize Distribution",
        message: "Prize money has been distributed to winners! Check your wallet balance.",
        type: "prize"
      },
      {
        id: "special_event",
        title: "Special Event",
        message: "Join our special gaming event with exclusive rewards and prizes!",
        type: "event"
      }
    ];

    res.json(templates);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch templates" });
  }
});

// ==========================
//  ADMIN AUTH & DASHBOARD
// ==========================
app.post("/adminLogin", async (req, res) => {
  try {
    const { emailOrUsername, password } = req.body
    const username = emailOrUsername.replace(/_admin$/, "")
    const admin = await Admin.findOne({ username })
    if (!admin) return res.status(400).json({ msg: "Admin not found!" })
    if (admin.password !== password) return res.status(400).json({ msg: "Incorrect password!" })

    res.status(200).json({ msg: "Login successful!", username: admin.username })
  } catch (error) {
    res.status(500).json({ msg: "Server error" })
  }
})


// ---------------- Admin email update + OTP ----------------

app.post("/admin/email/send-otp", async (req, res) => {
  try {
    const { username, email } = req.body;
    if (!username || !email) return res.status(400).json({ message: "Username and email are required" });
    
    const admin = await Admin.findOne({ username });
    if (!admin) return res.status(404).json({ message: "Admin not found" });

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Send OTP to email
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: email,
      subject: "🎮 PLAYZONE Admin Email Verification OTP",
      html: `
        <div style="
          background: linear-gradient(135deg, #0f0c29, #302b63, #24243e);
          color: #fff;
          font-family: 'Segoe UI', Roboto, sans-serif;
          padding: 30px;
          border-radius: 12px;
          text-align: center;
          box-shadow: 0 0 25px rgba(0,0,0,0.5);
          max-width: 500px;
          margin: auto;
        ">
          <h1 style="font-size: 24px; margin-bottom: 15px; letter-spacing: 1px;">🔐 ADMIN EMAIL VERIFICATION</h1>
          <p style="font-size: 16px; color: #c9c9c9;">Hello Admin,</p>
          <p style="font-size: 15px; line-height: 1.6; color: #ddd;">
            You're setting up email notifications for tournament reminders.<br/>
            Enter the following OTP to verify your email:
          </p>

          <div style="
            background: #1a1a40;
            color: #00ffcc;
            font-size: 32px;
            font-weight: bold;
            letter-spacing: 5px;
            padding: 20px;
            border-radius: 8px;
            display: inline-block;
            margin: 20px 0;
            box-shadow: 0 0 15px #00ffcc;
          ">
            ${otp}
          </div>

          <p style="font-size: 14px; color: #bbb;">
            ⚠️ This OTP will expire in <b>10 minutes</b>.<br/>
            You'll receive tournament notifications at 24h, 2h, and 30min before tournaments start.
          </p>

          <hr style="border: none; border-top: 1px solid #333; margin: 25px 0;">
          <p style="font-size: 12px; color: #888;">
            © 2025 <b>PLAYZONE eSports</b> — "Where every gamer becomes a legend."
          </p>
        </div>
      `,
    });

    // Save OTP in-memory
    otpStore[username] = { otp, email, expires: Date.now() + 10 * 60 * 1000 }; // 10 mins
    console.log("OTP stored for:", username)
    res.json({ message: "OTP sent to your email" });
  } catch (err) {
    console.error("Send OTP error:", err);
    res.status(500).json({ message: "Failed to send OTP" });
  }
});

// ---------------- Verify OTP ----------------

app.post("/admin/email/verify-otp", async (req, res) => {
  try {
    let { username, otp } = req.body;
    if (!username || !otp)
      return res.status(400).json({ message: "Username and OTP required" });

    const stored = otpStore[username];
    console.log("Verifying for:", username, "Stored keys:", Object.keys(otpStore));

    if (!stored) return res.status(400).json({ message: "No OTP found, send again" });
    if (Date.now() > stored.expires) {
      delete otpStore[username];
      return res.status(400).json({ message: "OTP expired" });
    }
    if (stored.otp !== otp) return res.status(400).json({ message: "Invalid OTP" });

    const admin = await Admin.findOne({ username });
    if (!admin) return res.status(404).json({ message: "Admin not found" });

    admin.notificationEmail = stored.email;
    admin.isEmailVerified = true;
    await admin.save();
    delete otpStore[username];

    res.json({ message: "Email verified successfully!" });
  } catch (err) {
    console.error("Verify OTP error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ---------------- Get Admin Status ----------------

app.get("/admin/status", async (req, res) => {
  try {
    const { username } = req.query;
    if (!username) return res.status(400).json({ message: "Username required" });

    const admin = await Admin.findOne({ username });
    if (!admin) return res.status(404).json({ message: "Admin not found" });

    res.json({
      notificationEmail: admin.notificationEmail,
      isEmailVerified: admin.isEmailVerified
    });
  } catch (err) {
    console.error("Get admin status error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ---------------- Admin Profile Management ----------------

app.get("/admin/profile", async (req, res) => {
  try {
    const { username } = req.query;
    if (!username) return res.status(400).json({ message: "Username required" });

    const admin = await Admin.findOne({ username }).select('-password');
    if (!admin) return res.status(404).json({ message: "Admin not found" });

    res.json({
      username: admin.username,
      notificationEmail: admin.notificationEmail,
      isEmailVerified: admin.isEmailVerified,
      amount: admin.amount,
      createdAt: admin.createdAt,
      updatedAt: admin.updatedAt
    });
  } catch (err) {
    console.error("Get admin profile error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.put("/admin/profile", async (req, res) => {
  try {
    const { username, notificationEmail } = req.body;
    if (!username) return res.status(400).json({ message: "Username required" });

    const admin = await Admin.findOne({ username });
    if (!admin) return res.status(404).json({ message: "Admin not found" });

    // Update notification email if provided
    if (notificationEmail !== undefined) {
      admin.notificationEmail = notificationEmail;
      // Reset verification status when email changes
      if (notificationEmail !== admin.notificationEmail) {
        admin.isEmailVerified = false;
      }
    }

    await admin.save();

    res.json({
      message: "Profile updated successfully",
      admin: {
        username: admin.username,
        notificationEmail: admin.notificationEmail,
        isEmailVerified: admin.isEmailVerified,
        amount: admin.amount,
        updatedAt: admin.updatedAt
      }
    });
  } catch (err) {
    console.error("Update admin profile error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.put("/admin/change-password", async (req, res) => {
  try {
    const { username, currentPassword, newPassword } = req.body;
    if (!username || !currentPassword || !newPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const admin = await Admin.findOne({ username });
    if (!admin) return res.status(404).json({ message: "Admin not found" });

    // Verify current password
    if (admin.password !== currentPassword) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    // Update password
    admin.password = newPassword;
    await admin.save();

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("Change password error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ---------------- AI Insights API ----------------
// ==========================
// 💰 PAYMENT TRENDS (FOR ADMIN DASHBOARD)
// ==========================



app.get("/admin/ai-insights", async (req, res) => {
  try {
    const now = new Date()
    const todayStart = new Date(now.setHours(0, 0, 0, 0))
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const tournaments = await Tournament.find()
    const payments = await Payment.find()
    const users = await User.find()

    // Stats
    const liveTournaments = tournaments.filter(t => t.t_status === "running").length
    const upcomingTournaments = tournaments.filter(t => new Date(t.t_date) > now).length
    const completedTournaments = tournaments.filter(t => t.t_status === "completed").length

    // Daily revenue
    const todayRevenue = payments
      .filter(p => new Date(p.date) >= todayStart && p.p_type === "tournament")
      .reduce((sum, p) => sum + p.amount, 0)

    // Weekly revenue
    const weekRevenue = payments
      .filter(p => new Date(p.date) >= oneWeekAgo && p.p_type === "tournament")
      .reduce((sum, p) => sum + p.amount, 0)

    const totalPlayers = users.length
    const activePlayers = users.filter(u => u.amount > 0).length
    const engagementRate = totalPlayers > 0 ? (activePlayers / totalPlayers * 100).toFixed(1) : 0

    // Most popular game
    const gameStats = tournaments.reduce((acc, t) => {
      acc[t.game] = (acc[t.game] || 0) + 1
      return acc
    }, {})
    const mostPopularGame = Object.keys(gameStats).reduce(
      (a, b) => gameStats[a] > gameStats[b] ? a : b,
      "BGMI"
    )

    // 💡 Real-time “live alert” suggestions
    const suggestions = []

    if (liveTournaments > 0) {
      suggestions.push({
        type: "success",
        title: "Live Tournaments Running",
        message: `${liveTournaments} tournament${liveTournaments > 1 ? "s" : ""} are live right now.`,
        action: "Monitor Progress",
        category: "live_alert"
      })
    } else {
      suggestions.push({
        type: "warning",
        title: "No Live Tournaments",
        message: "No tournaments are currently active. Consider scheduling one for peak hours.",
        action: "Create Tournament",
        category: "scheduling"
      })
    }

    if (todayRevenue > 0) {
      suggestions.push({
        type: "info",
        title: "Today’s Earnings",
        message: `You earned ₹${todayRevenue.toLocaleString()} today from tournaments.`,
        action: "View Transactions",
        category: "revenue"
      })
    } else {
      suggestions.push({
        type: "warning",
        title: "No Revenue Yet Today",
        message: "No tournament entries or payments today — check player engagement.",
        action: "Review Activity",
        category: "revenue"
      })
    }

    if (engagementRate < 30) {
      suggestions.push({
        type: "danger",
        title: "Low Player Engagement",
        message: `Only ${engagementRate}% of players are active this week.`,
        action: "Boost Engagement",
        category: "players"
      })
    } else {
      suggestions.push({
        type: "success",
        title: "Strong Player Activity",
        message: `${engagementRate}% of players are active — great retention!`,
        action: "Analyze Players",
        category: "players"
      })
    }

    suggestions.push({
      type: "info",
      title: "Top Game",
      message: `🎮 ${mostPopularGame} leads with ${gameStats[mostPopularGame]} tournaments.`,
      action: "View Game Stats",
      category: "game"
    })

    suggestions.push({
      type: "info",
      title: "Weekly Summary",
      message: `This week’s total revenue: ₹${weekRevenue.toLocaleString()}. ${completedTournaments} tournaments completed.`,
      action: "Open Reports",
      category: "summary"
    })

    // Return data
    res.json({
      suggestions,
      stats: {
        liveTournaments,
        upcomingTournaments,
        completedTournaments,
        totalPlayers,
        activePlayers,
        engagementRate,
        todayRevenue,
        weekRevenue,
        mostPopularGame
      }
    })
  } catch (err) {
    console.error("AI insights error:", err)
    res.status(500).json({ message: "Failed to generate AI insights" })
  }
})


// ---------------------------- 
// LIVE NOTIFICATIONS & SUGGESTION ACTIONS
// ----------------------------

// Get live notifications for admin dashboard
app.get("/admin/live-notifications", async (req, res) => {
  try {
    const now = new Date();
    const notifications = [];

    // ------------------------------
    // Upcoming Tournaments Starting Soon
    // ------------------------------
    const upcomingTournaments = await Tournament.find({
      t_date: { $gte: now },
      t_status: "pending"
    }).sort({ t_date: 1 }).limit(5);

    upcomingTournaments.forEach(tournament => {
      const timeDiff = new Date(tournament.t_date) - now;
      const hoursUntil = timeDiff / (1000 * 60 * 60);

      if (hoursUntil <= 2 && hoursUntil > 0) {
        notifications.push({
          id: `tournament_${tournament.t_id}`,
          type: "warning",
          title: "Tournament Starting Soon",
          message: `${tournament.game} tournament (${tournament.t_id}) starts in ${Math.round(hoursUntil * 60)} minutes`,
          timestamp: now,
          action: "view_tournament",
          data: { tournamentId: tournament.t_id }
        });
      }
    });

    // ------------------------------
    // Completed Tournaments Without Results
    // ------------------------------
    const completedWithoutResults = await Tournament.find({
      t_status: "completed",
      result_published: false
    }).sort({ t_date: -1 }).limit(3);

    completedWithoutResults.forEach(tournament => {
      notifications.push({
        id: `results_${tournament.t_id}`,
        type: "info",
        title: "Results Pending",
        message: `${tournament.game} tournament (${tournament.t_id}) completed but results not published`,
        timestamp: now,
        action: "publish_results",
        data: { tournamentId: tournament.t_id }
      });
    });

    // ------------------------------
    // Low Participation Tournaments
    // ------------------------------
    const lowParticipationTournaments = await Tournament.find({
      t_date: { $gte: now },
      t_status: "pending"
    }).limit(5);

    lowParticipationTournaments.forEach(tournament => {
      if (tournament.participants.length < 5) {
        notifications.push({
          id: `participation_${tournament.t_id}`,
          type: "warning",
          title: "Low Participation",
          message: `${tournament.game} tournament (${tournament.t_id}) has only ${tournament.participants.length} participants`,
          timestamp: now,
          action: "boost_participation",
          data: { tournamentId: tournament.t_id }
        });
      }
    });

    // ------------------------------
    // Currently Running Tournaments
    // ------------------------------
    const runningTournaments = await Tournament.find({
      t_status: "running"
    }).sort({ t_date: 1 });

    runningTournaments.forEach(tournament => {
      notifications.push({
        id: `running_${tournament.t_id}`,
        type: "info",
        title: "Tournament Running",
        message: `${tournament.game} tournament (${tournament.t_id}) is currently live with ${tournament.participants.length} participant`,
        timestamp: now,
        action: "view_tournament",
        data: { tournamentId: tournament.t_id }
      });
    });

    res.json({ notifications });

  } catch (err) {
    console.error("Live notifications error:", err);
    res.status(500).json({ message: "Failed to fetch live notifications" });
  }
});


// ==========================
//  HANDLE SUGGESTION ACTIONS
// ==========================
app.post("/admin/suggestion-action", async (req, res) => {
  try {
    const { action, options, adminUsername } = req.body;

    // -------------------------
    // Validate request
    // -------------------------
    if (!action || typeof action !== "string") {
      return res.status(400).json({ message: "Missing or invalid action" });
    }

    if (!options || !Array.isArray(options) || !options.length) {
      return res.status(400).json({ message: "Options must be a non-empty array" });
    }

    if (!adminUsername || typeof adminUsername !== "string") {
      return res.status(400).json({ message: "Missing adminUsername" });
    }

    const results = [];

    for (const option of options) {
      // Only process checked options
      if (!option.checked) continue;

      let result = { option: option.value, status: "pending", message: "" };
      console.log("Processing option:", option);

      try {
        switch (option.value) {
          // ----------------- TOURNAMENT CREATION -----------------
          case "create_bgmi":
          case "create_pubg":
          case "create_ff":
          case "create_cod": {
            const gameName = option.value.split("_")[1].toUpperCase();
            const tId = `T-${Date.now()}`;
            const newTournament = await Tournament.create({
              t_id: tId,
              game: gameName,
              map: "Default Map",
              mode_type: "solo",
              entry_fee: 10,
              t_date: new Date(),
              t_time: new Date().toLocaleTimeString(),
              t_status: "pending",
              participants: [],
            });
            result.message = `${gameName} tournament template created (ID: ${newTournament.t_id})`;
            result.status = "success";
            break;
          }

          // ----------------- SCHEDULING -----------------
          case "daily_schedule":
            const updatedDaily = await Tournament.updateMany(
              { t_status: "pending" },
              { $set: { scheduledDaily: true } }
            );
            result.message = `Daily scheduling enabled for ${updatedDaily.modifiedCount} tournaments`;
            result.status = "success";
            break;

          case "weekend_specials": {
            const now = new Date();
            const nextSaturday = new Date(
              now.setDate(now.getDate() + ((6 - now.getDay() + 7) % 7))
            );
            const tId = `T-${Date.now()}`;
            await Tournament.create({
              t_id: tId,
              game: "Weekend Special",
              map: "Special Map",
              mode_type: "solo",
              entry_fee: 20,
              t_date: nextSaturday,
              t_time: "18:00",
              t_status: "scheduled",
              participants: [],
              special: true,
            });
            result.message = "Weekend special tournament scheduled";
            result.status = "success";
            break;
          }

          // ----------------- FEES & TIERS -----------------
          case "increase_fees": {
            const updated = await Tournament.updateMany(
              { t_status: "pending" },
              [{ $set: { entry_fee: { $multiply: ["$entry_fee", 1.2] } } }]
            );
            result.message = `${updated.modifiedCount} pending tournaments had their fees increased by 20%`;
            result.status = "success";
            break;
          }

          case "premium_tier":
            await Tournament.updateMany(
              { t_status: "pending" },
              { $set: { tier: "premium" } }
            );
            result.message = "Premium tier applied to all pending tournaments";
            result.status = "success";
            break;

          // ----------------- USER CAMPAIGNS -----------------
          case "welcome_bonus": {
            const updatedUsers = await User.updateMany({}, { $set: { amount: 100 } });
            result.message = `Welcome bonus added to ${updatedUsers.modifiedCount} users`;
            result.status = "success";
            break;
          }

          case "referral_program":
            await Campaign.updateOne(
              { name: "referral_program" },
              { $set: { active: true, lastUpdatedBy: adminUsername } },
              { upsert: true }
            );
            result.message = "Referral program activated";
            result.status = "success";
            break;

          case "engagement_emails": {
            const totalUsers = await User.countDocuments();
            result.message = `Engagement emails scheduled for ${totalUsers} users`;
            result.status = "success";
            break;
          }

          // ----------------- TOURNAMENT AUTOMATION -----------------
          case "auto_prizes":
            await Tournament.updateMany(
              { t_status: "completed" },
              { $set: { autoPrize: true } }
            );
            result.message = "Auto prize distribution enabled for completed tournaments";
            result.status = "success";
            break;

          case "refund_automation":
            await Payment.updateMany(
              { p_type: "refund", status: "pending" },
              { $set: { autoRefund: true } }
            );
            result.message = "Automatic refunds enabled for pending refund payments";
            result.status = "success";
            break;

          // ----------------- ANALYTICS & RANKING -----------------
          case "advanced_analytics": {
            const totalPlayers = await User.countDocuments();
            const totalTournaments = await Tournament.countDocuments();
            result.message = `Analytics ready: ${totalPlayers} players, ${totalTournaments} tournaments`;
            result.status = "success";
            break;
          }

          case "ranking_system": {
            await User.find({}).sort({ amount: -1 }).limit(10); // just fetch
            result.message = `Top 10 players ranking computed dynamically`;
            result.status = "success";
            break;
          }

          default:
            result.message = `Action '${option.value}' executed dynamically`;
            result.status = "success";
        }
      } catch (err) {
        result.status = "error";
        result.message = `Failed to process ${option.value}: ${err.message}`;
      }

      results.push(result);
    }

    res.json({
      message: "Suggestion actions processed dynamically",
      results,
      timestamp: new Date(),
    });
  } catch (err) {
    console.error("Suggestion action error:", err);
    res.status(500).json({ message: "Failed to process suggestion actions" });
  }
});



// ---------------- Cron Job for Tournament Email Notifications ----------------
// Runs every 5 minutes
cron.schedule("*/5 * * * *", async () => {
  try {
    const now = new Date()
    const admin = await Admin.findOne({ isEmailVerified: true, notificationEmail: { $ne: null } })
    if (!admin) return

    const tournaments = await Tournament.find({
      t_date: { $gte: now }, // upcoming tournaments
    })

    tournaments.forEach(async (tour) => {
      const diffMinutes = (new Date(tour.t_date) - now) / 1000 / 60

      let subject = ""
      let message = ""

      if (diffMinutes <= 1440 && diffMinutes > 1435) { // ~24h
        subject = `Tournament "${tour.game}" starts in 24 hours`
        message = `Tournament "${tour.name}" starts in 24 hours. Room ID: ${tour.roomId}, Password: ${tour.roomPass}`
      } else if (diffMinutes <= 120 && diffMinutes > 115) { // ~2h
        subject = `Tournament "${tour.game}" starts in 2 hours`
        message = `Tournament "${tour.name}" starts in 2 hours. Room ID: ${tour.roomId}, Password: ${tour.roomPass}`
      } else if (diffMinutes <= 30 && diffMinutes > 25) { // ~30min
        subject = `Tournament "${tour.game}" starts in 30 minutes`
        message = `Tournament "${tour.name}" starts in 30 minutes. Room ID: ${tour.roomId}, Password: ${tour.roomPass}`
      } else {
        return
      }

      await transporter.sendMail({
        from: process.env.SMTP_USER,
        to: admin.notificationEmail,
        subject,
        text: message,
      })
      console.log(`Email sent to admin for tournament: ${tour.name}`)
    })
  } catch (err) {
    console.error("Error in tournament email cron:", err)
  }
})


app.get("/admin/dashboard", async (req, res) => {
  try {
    const [totalPlayers, totalTournaments, totalTransactions] = await Promise.all([
      User.countDocuments(),
      Tournament.countDocuments(),
      Payment.countDocuments(),
    ])

    // Tournament Growth: last 6 months based on t_date
    const growthAgg = await Tournament.aggregate([
      {
        $group: {
          _id: { y: { $year: "$t_date" }, m: { $month: "$t_date" } },
          count: { $sum: 1 },
        },
      },
    ])

    const now = new Date()
    const months = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`
      months.push({
        key,
        label: d.toLocaleString("en-US", { month: "short" }),
        year: d.getFullYear(),
        month: d.getMonth() + 1,
      })
    }
    const growthMap = new Map(growthAgg.map((g) => [`${g._id.y}-${g._id.m}`, g.count]))
    const tournamentGrowth = months.map((m) => ({
      month: m.label,
      tournaments: growthMap.get(m.key) || 0,
    }))

    // Top Games Played: participants per game (fallback to tournaments per game)
    let topGamesAgg = await Tournament.aggregate([
      { $unwind: "$participants" },
      { $group: { _id: "$game", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 },
    ])
    if (!topGamesAgg.length) {
      topGamesAgg = await Tournament.aggregate([
        { $group: { _id: "$game", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 8 },
      ])
    }
    const topGames = topGamesAgg.map((g) => ({ game: g._id || "Unknown", count: g.count }))

    // Recent Transactions: last 10 with user info
    const recent = await Payment.find().sort({ createdAt: -1 }).limit(10).populate("user_id", "fullName username email")
    const recentTransactions = recent.map((p) => ({
      user: p.user_id?.fullName || p.user_id?.username || p.user_id?.email || "Unknown",
      amount: p.amount,
      type: p.p_type,
      date: p.createdAt,
    }))

    // Admin profit (30%) and pool (70%) from tournament payments
    const tourPays = await Payment.find({ p_type: "tournament" }).select("amount")
    const totalTournamentRevenue = tourPays.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
    const adminProfit = Number((totalTournamentRevenue * 0.3).toFixed(2))
    const poolPrizeTotal = Number((totalTournamentRevenue * 0.7).toFixed(2))

    // Persist admin amount to computed profit (idempotent)
    let adminDoc = await Admin.findOne().sort({ createdAt: 1 })
    if (!adminDoc) {
      adminDoc = new Admin({ username: "admin@123", password: "123", amount: adminProfit })
    } else {
      adminDoc.amount = adminProfit
    }
    await adminDoc.save()

    res.json({
      stats: {
        players: totalPlayers,
        tournaments: totalTournaments,
        transactions: totalTransactions,
        tournamentGrowth,
      },
      topGames,
      recentTransactions,
      adminProfit,
      poolPrize: poolPrizeTotal,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ msg: "Server error" })
  }
})

// ==========================
//  TOURNAMENT ROUTES
// ==========================
app.post("/admin/tournaments", async (req, res) => {
  try {
    const data = req.body
    if (!data.game || !data.map || !data.entry_fee || !data.t_date || !data.t_time)
      return res.status(400).json({ msg: "Missing required fields." })

    if (data.rewards && Object.values(data.rewards).some((r) => r < 0))
      return res.status(400).json({ msg: "Reward values cannot be negative." })

    const newTournament = new Tournament({
      t_id: data.t_id || generateTournamentId(),
      game: data.game,
      map: data.map,
      entry_fee: data.entry_fee,
      t_date: data.t_date,
      t_time: data.t_time,
      rewards: data.rewards,
      mode_type: data.mode_type || "solo",
      slots: 16,
      t_status: "pending",
      result_published: false,
      thumbnail: data.thumbnail || "",
    })

    await newTournament.save()
    res.status(201).json({ msg: "Tournament created successfully", tournament: newTournament })
  } catch (error) {
    res.status(500).json({ msg: "Error creating tournament", error: error.message })
  }
})

app.get("/admin/tournaments", async (req, res) => {
  try {
    const tournaments = await Tournament.find().sort({ createdAt: -1 })
    res.json(tournaments)
  } catch (error) {
    res.status(500).json({ msg: "Server error" })
  }
})

app.get("/admin/tournaments/active", async (req, res) => {
  try {
    const tournaments = await Tournament.find({
      t_status: { $in: ["pending", "running"] },
    }).sort({ t_date: 1, t_time: 1 })
    res.json(tournaments)
  } catch (error) {
    res.status(500).json({ msg: "Server error" })
  }
})

app.get("/admin/tournaments/completed", async (req, res) => {
  try {
    const tournaments = await Tournament.find({
      t_status: "completed",
      result_published: false,
    }).sort({ t_date: -1 })
    res.json(tournaments)
  } catch (error) {
    res.status(500).json({ msg: "Server error" })
  }
})

// GET /admin/tournaments/withParticipants - MOVED BEFORE /:id route to avoid conflict
app.get("/admin/tournaments/withParticipants", async (req, res) => {
  try {
    const tournaments = await Tournament.find()
      .populate("participants.user_id", "username fullName email")
      .sort({ t_date: -1 })

    res.json(tournaments)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Server error" })
  }
})

app.get("/admin/tournaments/:id", async (req, res) => {
  try {
    const { id } = req.params
    let tournament

    // Check if id is a MongoDB ObjectId (24 hex chars)
    if (/^[0-9a-fA-F]{24}$/.test(id)) {
      tournament = await Tournament.findById(id).populate(
        "participants.user_id",
        "username fullName email",
      )
    } else {
      // Fallback to t_id lookup (e.g. T1234)
      tournament = await Tournament.findOne({ t_id: id }).populate(
        "participants.user_id",
        "username fullName email",
      )
    }

    if (!tournament) return res.status(404).json({ msg: "Tournament not found" })
    res.json(tournament)
  } catch (error) {
    res.status(500).json({ msg: "Server error" })
  }
})

app.put("/admin/tournaments/:id", async (req, res) => {
  try {
    const updated = await Tournament.findOneAndUpdate(
      { t_id: req.params.id },
      { $set: req.body },
      { new: true, runValidators: true },
    )
    if (!updated) return res.status(404).json({ msg: "Tournament not found" })
    res.json({ msg: "Tournament updated successfully", updated })
  } catch (error) {
    res.status(500).json({ msg: "Server error" })
  }
})

app.delete("/admin/tournaments/:id", async (req, res) => {
  try {
    const deleted = await Tournament.findOneAndDelete({ t_id: req.params.id })
    if (!deleted) return res.status(404).json({ msg: "Tournament not found" })
    res.json({ msg: "Tournament deleted successfully" })
  } catch (error) {
    res.status(500).json({ msg: "Server error" })
  }
})

app.put("/admin/tournaments/:id/publish-result", async (req, res) => {
  try {
    const { rankings } = req.body
    if (!rankings || !Array.isArray(rankings) || rankings.length !== 3) {
      return res.status(400).json({ msg: "Rankings array with exactly 3 positions is required" })
    }

    const tournament = await Tournament.findOne({ t_id: req.params.id })
    if (!tournament) return res.status(404).json({ msg: "Tournament not found" })

    // Prevent re-publishing
    if (tournament.result_published) {
      return res.status(400).json({ msg: "Results already published for this tournament" })
    }

    // Validate tournament is completed
    if (tournament.t_status !== "completed") {
      return res.status(400).json({ msg: "Tournament must be completed before publishing results" })
    }

    // Validate all three positions are filled and unique
    const participantIds = rankings.map((r) => r.participantId)
    if (new Set(participantIds).size !== 3) {
      return res.status(400).json({ msg: "All three positions must have different participants" })
    }

    // Update participant ranks and distribute prizes
    const prizeDistribution = []
    
    rankings.forEach(async (ranking) => {
      const participant = tournament.participants.find(
        (p) => p.user_id.toString() === ranking.participantId || p._id.toString() === ranking.participantId,
      )
      if (participant) {
        participant.rank = ranking.position // 1, 2, or 3
        
        // Calculate prize amount based on position
        let prizeAmount = 0
        if (ranking.position === 1) {
          prizeAmount = tournament.rewards.first || 0
        } else if (ranking.position === 2) {
          prizeAmount = tournament.rewards.second || 0
        } else if (ranking.position === 3) {
          prizeAmount = tournament.rewards.third || 0
        }
        
        if (prizeAmount > 0) {
          // Credit prize to user's account
          const user = await User.findById(participant.user_id)
          if (user) {
            user.amount += prizeAmount
            await user.save()
            
            // Record prize payment
            const prizePayment = new Payment({
              p_id: "PRIZE_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9),
              amount: prizeAmount,
              p_type: "prize",
              user_id: user._id,
              tournament_id: tournament.t_id,
              p_time: new Date().toLocaleTimeString(),
            })
            await prizePayment.save()
            
            // Send prize notification email to user
            try {
              const positionText = ranking.position === 1 ? '1st Place 🥇' : ranking.position === 2 ? '2nd Place 🥈' : '3rd Place 🥉'
              const positionEmoji = ranking.position === 1 ? '🥇' : ranking.position === 2 ? '🥈' : '🥉'
              
              await transporter.sendMail({
                from: process.env.SMTP_USER,
                to: user.email,
                subject: `🏆 ${positionText} - You won ₹${prizeAmount} in ${tournament.game} Tournament!`,
                html: `
                  <div style="
                    background: linear-gradient(135deg, #0f0c29, #302b63, #24243e);
                    color: #fff;
                    font-family: 'Segoe UI', Roboto, sans-serif;
                    padding: 35px;
                    border-radius: 15px;
                    text-align: center;
                    box-shadow: 0 0 30px rgba(0,0,0,0.6);
                    max-width: 550px;
                    margin: auto;
                  ">
                    <div style="font-size: 48px; margin-bottom: 15px;">${positionEmoji}</div>
                    <h1 style="font-size: 28px; margin-bottom: 20px; letter-spacing: 1px; color: #00ffcc;">
                      CONGRATULATIONS!
                    </h1>
                    <p style="font-size: 18px; color: #c9c9c9; margin-bottom: 10px;">
                      Hey <b>${user.fullName || user.username}</b> 👾
                    </p>
                    <p style="font-size: 16px; line-height: 1.6; color: #ddd; margin-bottom: 25px;">
                      You secured <b style="color: #00ffcc;">${positionText}</b> in the <b>${tournament.game}</b> tournament!<br/>
                      Your prize money has been automatically credited to your account.
                    </p>

                    <div style="
                      background: linear-gradient(45deg, #1a1a40, #2a2a60);
                      color: #00ffcc;
                      font-size: 32px;
                      font-weight: bold;
                      padding: 25px;
                      border-radius: 12px;
                      display: inline-block;
                      margin: 25px 0;
                      box-shadow: 0 0 20px #00ffcc;
                      border: 2px solid #00ffcc;
                    ">
                      ₹${prizeAmount} CREDITED!
                    </div>

                    <div style="
                      background: rgba(0, 255, 204, 0.1);
                      border: 1px solid #00ffcc;
                      border-radius: 8px;
                      padding: 20px;
                      margin: 20px 0;
                      text-align: left;
                    ">
                      <h3 style="color: #00ffcc; margin-top: 0; font-size: 18px;">Tournament Details:</h3>
                      <p style="margin: 8px 0; color: #bbb;"><b>Tournament ID:</b> ${tournament.t_id}</p>
                      <p style="margin: 8px 0; color: #bbb;"><b>Game:</b> ${tournament.game}</p>
                      <p style="margin: 8px 0; color: #bbb;"><b>Map:</b> ${tournament.map}</p>
                      <p style="margin: 8px 0; color: #bbb;"><b>Position:</b> ${positionText}</p>
                      <p style="margin: 8px 0; color: #bbb;"><b>Prize Amount:</b> ₹${prizeAmount}</p>
                      <p style="margin: 8px 0; color: #bbb;"><b>Date:</b> ${new Date(tournament.t_date).toLocaleDateString()}</p>
                    </div>

                    <div style="
                      background: rgba(255, 215, 0, 0.1);
                      border: 1px solid #FFD700;
                      border-radius: 8px;
                      padding: 15px;
                      margin: 20px 0;
                    ">
                      <p style="color: #FFD700; font-weight: bold; margin: 0;">
                        💰 Your new account balance will be updated in your dashboard!
                      </p>
                    </div>

                    <div style="margin: 25px 0;">
                      <a href="${FRONTEND_URL}/DashBoard" target="_blank" style="
                        background: linear-gradient(90deg, #00ffcc, #0077ff);
                        padding: 12px 25px;
                        color: #fff;
                        font-weight: bold;
                        border-radius: 8px;
                        text-decoration: none;
                        text-transform: uppercase;
                        box-shadow: 0 0 15px #00ffcc;
                        display: inline-block;
                      ">View Dashboard</a>
                    </div>

                    <hr style="border: none; border-top: 1px solid #333; margin: 25px 0;">
                    <p style="font-size: 12px; color: #888;">
                      Powered by <b>PLAYZONE</b> 🎯<br/>
                      <span style="color:#555;">"Where every gamer becomes a legend."</span>
                    </p>
                  </div>
                `,
              })
              console.log(`Prize notification email sent to ${user.email} for ${prizeAmount}`)
            } catch (emailErr) {
              console.error("Failed to send prize notification email:", emailErr)
            }
            
            prizeDistribution.push({
              position: ranking.position,
              user: user.username,
              amount: prizeAmount
            })
          }
        }
      }
    })

    // Mark results as published
    tournament.result_published = true
    await tournament.save()

    // Note: Image sharing is now handled separately via the share-result-image endpoint

    res.json({ 
      msg: "Results published successfully and prizes distributed", 
      tournament,
      prizeDistribution 
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ msg: "Server error" })
  }
})

// Share result image with participants
app.post("/admin/tournaments/:id/share-result-image", async (req, res) => {
  try {
    const { resultImage } = req.body
    if (!resultImage) {
      return res.status(400).json({ msg: "Result image is required" })
    }

    const tournament = await Tournament.findOne({ t_id: req.params.id })
    if (!tournament) return res.status(404).json({ msg: "Tournament not found" })

    // Save the result image to server
    const imageBuffer = Buffer.from(resultImage.split(',')[1], 'base64')
    const imagePath = `uploads/result-images/tournament-${tournament.t_id}-${Date.now()}.png`
    
    // Ensure directory exists
    const uploadDir = 'uploads/result-images'
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }
    
    // Save image file
    fs.writeFileSync(imagePath, imageBuffer)
    
    // Update tournament with result image path
    tournament.result_image_path = imagePath
    await tournament.save()
    
    // Send result image to all participants
    const participants = tournament.participants || []
    const participantEmails = participants
      .map(p => p.user_id?.email)
      .filter(email => email)

    if (participantEmails.length > 0) {
      await transporter.sendMail({
        from: process.env.SMTP_USER,
        to: participantEmails.join(', '),
        subject: `🏆 Tournament Results Published - ${tournament.game} Tournament`,
        html: `
          <div style="
            background: linear-gradient(135deg, #0f0c29, #302b63, #24243e);
            color: #fff;
            font-family: 'Segoe UI', Roboto, sans-serif;
            padding: 35px;
            border-radius: 15px;
            text-align: center;
            box-shadow: 0 0 30px rgba(0,0,0,0.6);
            max-width: 600px;
            margin: auto;
          ">
            <h1 style="font-size: 28px; margin-bottom: 20px; color: #00ffcc;">
              🏆 TOURNAMENT RESULTS PUBLISHED 🏆
            </h1>
            
            <p style="font-size: 18px; color: #c9c9c9; margin-bottom: 20px;">
              The results for <strong>${tournament.game}</strong> tournament have been published!
            </p>
            
            <div style="
              background: rgba(0, 255, 200, 0.1);
              border: 1px solid #00ffcc;
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
            ">
              <h3 style="color: #00ffcc; margin-top: 0;">Tournament Details:</h3>
              <p style="margin: 8px 0; color: #bbb;"><b>Tournament ID:</b> ${tournament.t_id}</p>
              <p style="margin: 8px 0; color: #bbb;"><b>Game:</b> ${tournament.game}</p>
              <p style="margin: 8px 0; color: #bbb;"><b>Map:</b> ${tournament.map}</p>
              <p style="margin: 8px 0; color: #bbb;"><b>Date:</b> ${new Date(tournament.t_date).toLocaleDateString()}</p>
            </div>
            
            <p style="font-size: 16px; color: #ddd; margin: 20px 0;">
              Check the attached result image to see the winners and their prizes!
            </p>
            
            <div style="margin: 25px 0;">
              <a href="${FRONTEND_URL}/tournaments" target="_blank" style="
                background: linear-gradient(90deg, #00ffcc, #0077ff);
                padding: 12px 25px;
                color: #fff;
                font-weight: bold;
                border-radius: 8px;
                text-decoration: none;
                text-transform: uppercase;
                box-shadow: 0 0 15px #00ffcc;
                display: inline-block;
              ">View All Tournaments</a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #333; margin: 25px 0;">
            <p style="font-size: 12px; color: #888;">
              Powered by <b>PLAYZONE</b> 🎯<br/>
              <span style="color:#555;">"Where every gamer becomes a legend."</span>
            </p>
          </div>
        `,
        attachments: [{
          filename: `tournament-results-${tournament.t_id}.png`,
          content: resultImage.split(',')[1], // Remove data:image/png;base64, prefix
          encoding: 'base64'
        }]
      })
      console.log(`Result notification with image sent to ${participantEmails.length} participants`)
    }

    res.json({ 
      msg: "Result image shared successfully with all participants", 
      imagePath 
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ msg: "Server error" })
  }
})

app.put("/admin/tournaments/:id/update-status", async (req, res) => {
  try {
    const tournament = await Tournament.findOne({ t_id: req.params.id })
    if (!tournament) return res.status(404).json({ msg: "Tournament not found" })

    const now = new Date()
    const tournamentDate = new Date(tournament.t_date)
    const [hours, minutes] = tournament.t_time.split(":").map(Number)
    const startTime = new Date(
      tournamentDate.getFullYear(),
      tournamentDate.getMonth(),
      tournamentDate.getDate(),
      hours,
      minutes,
    )
    const endTime = new Date(startTime.getTime() + 40 * 60 * 1000) // 40 minutes after start

    let newStatus = tournament.t_status

    // Determine status based on current time
    if (now >= startTime && now < endTime) {
      newStatus = "running"
    } else if (now >= endTime) {
      newStatus = "completed"
    } else if (now < startTime) {
      newStatus = "pending"
    }

    // Only update if status changed
    if (newStatus !== tournament.t_status) {
      tournament.t_status = newStatus
      await tournament.save()
    }

    res.json({ msg: "Status updated", tournament })
  } catch (error) {
    console.error(error)
    res.status(500).json({ msg: "Server error" })
  }
})

// New route: send room credentials (Room ID/Password) to all or one participant
app.post("/admin/tournaments/:id/send-credentials", async (req, res) => {
  try {
    const { roomId, roomPass, email, tournamentName, date, time } = req.body
    if (!roomId || !roomPass) {
      return res.status(400).json({ msg: "roomId and roomPass are required" })
    }

    const tournament = await Tournament.findOne({ t_id: req.params.id }).populate(
      "participants.user_id",
      "username fullName email",
    )
    if (!tournament) return res.status(404).json({ msg: "Tournament not found" })

    const subject = `🎮 PLAYZONE Room Details - ${tournamentName || tournament?.name || tournament.t_id}`
    const dateText = date
      ? new Date(date).toLocaleDateString("en-IN")
      : new Date(tournament.t_date).toLocaleDateString("en-IN")

    const htmlBody = `
  <div style="
    background: linear-gradient(135deg, #0a0a1a, #14142b, #1f1f3d);
    color: #fff;
    font-family: 'Segoe UI', Roboto, sans-serif;
    padding: 35px;
    border-radius: 14px;
    text-align: center;
    box-shadow: 0 0 25px rgba(0,0,0,0.6);
    max-width: 550px;
    margin: auto;
  ">
    <h1 style="
      font-size: 26px;
      letter-spacing: 1px;
      color: #00ffe0;
      text-shadow: 0 0 15px #00ffe0;
      margin-bottom: 10px;
    ">🏆 PLAYZONE TOURNAMENT ROOM DETAILS 🏆</h1>

    <p style="font-size: 16px; color: #ccc; margin: 10px 0;">
      Hello <strong>Player</strong>,<br>
      The battle is about to begin! Here are your credentials for:
    </p>

    <div style="
      background: #111133;
      border-radius: 8px;
      padding: 20px;
      margin: 15px 0;
      box-shadow: 0 0 10px #00ffe0;
      text-align: left;
      display: inline-block;
    ">
      <p style="font-size: 15px; color: #aaa; margin: 6px 0;"><b>Tournament:</b> ${tournamentName || tournament?.name || tournament.t_id}</p>
      <p style="font-size: 15px; color: #aaa; margin: 6px 0;"><b>Room ID:</b> <span style="color:#00ffcc; font-weight:bold;">${roomId}</span></p>
      <p style="font-size: 15px; color: #aaa; margin: 6px 0;"><b>Password:</b> <span style="color:#00ffcc; font-weight:bold;">${roomPass}</span></p>
      <p style="font-size: 15px; color: #aaa; margin: 6px 0;"><b>Date:</b> ${dateText}</p>
      <p style="font-size: 15px; color: #aaa; margin: 6px 0;"><b>Time:</b> ${time || tournament.t_time}</p>
    </div>

    <p style="font-size: 15px; color: #ccc; margin-top: 20px;">
      Be ready 10 minutes before match time.<br>
      Late entries will not be accepted.
    </p>

    <div style="margin: 20px 0;">
      <a href="https://playzone.gg" target="_blank" style="
        background: linear-gradient(90deg, #00ffe0, #0077ff);
        padding: 10px 20px;
        color: #fff;
        font-weight: bold;
        border-radius: 6px;
        text-decoration: none;
        text-transform: uppercase;
        box-shadow: 0 0 15px #00ffe0;
      ">Join via PLAYZONE</a>
    </div>

    <p style="font-size: 13px; color: #888;">
      ⚠️ Do not share these credentials with anyone.<br>
      Good luck, warrior! May the best squad win. 💥
    </p>

    <hr style="border: none; border-top: 1px solid #333; margin: 25px 0;">
    <p style="font-size: 12px; color: #666;">
      © 2025 <strong>PLAYZONE eSports</strong> — "Where every gamer becomes a legend."
    </p>
  </div>
`

    // Determine recipients
    let recipients = []
    if (email) {
      recipients = [{ email, name: email }]
    } else {
      recipients = (tournament.participants || [])
        .map((p) => ({
          email: p?.user_id?.email,
          name: p?.user_id?.fullName || p?.user_id?.username || p?.user_id?._id?.toString() || "Player",
        }))
        .filter((x) => !!x.email)
    }

    if (!recipients.length) {
      return res.status(400).json({ msg: "No recipients found" })
    }

    // If only one email provided, respond with a simple ok to support per-row sending
    if (email) {
      try {
        await transporter.sendMail({
          from: process.env.SMTP_FROM || process.env.SMTP_USER,
          to: email,
          subject,
          html: htmlBody,
        })
        return res.json({ ok: true })
      } catch (err) {
        console.error("send-credentials single error:", err?.message)
        return res.json({ ok: false, error: err?.message })
      }
    }

    // Otherwise, send to all and return statuses
    const statuses = []
    for (const r of recipients) {
      try {
        // eslint-disable-next-line no-await-in-loop
        await transporter.sendMail({
          from: process.env.SMTP_FROM || process.env.SMTP_USER,
          to: r.email,
          subject,
          html: htmlBody,
        })
        statuses.push({ email: r.email, ok: true })
      } catch (err) {
        console.error("send-credentials error:", r.email, err?.message)
        statuses.push({ email: r.email, ok: false, error: err?.message })
      }
    }

    res.json({ ok: true, statuses })
  } catch (error) {
    console.error(error)
    res.status(500).json({ msg: "Server error" })
  }
})

// ==========================
//  PAYMENT ROUTES
// ==========================
app.post("/payment", async (req, res) => {
  try {
    const { p_id, amount, p_type, user_id, p_time } = req.body
    if (!p_id || !amount || !p_type || !user_id || !p_time)
      return res.status(400).json({ msg: "All payment fields are required." })

    const user = await User.findById(user_id)
    if (!user) return res.status(404).json({ msg: "User not found" })

    if ((p_type === "withdraw" || p_type === "tournament") && user.amount < amount)
      return res.status(400).json({ msg: "Insufficient balance" })

    const newPayment = new Payment({ p_id, amount, p_type, user_id, p_time })
    await newPayment.save()

    if (p_type === "deposit" || p_type === "refund") user.amount += amount
    else if (p_type === "withdraw" || p_type === "tournament") user.amount -= amount

    await user.save()

    res.json({ msg: "Transaction successful", balance: user.amount })
  } catch (error) {
    console.error(error)
    res.status(500).json({ msg: "Server error" })
  }
})

app.get("/admin/payments", async (req, res) => {
  try {
    const payments = await Payment.find().populate("user_id", "username email")
    res.json(payments)
  } catch (error) {
    res.status(500).json({ msg: "Server error" })
  }
})

app.get("/payments/:userId", async (req, res) => {
  try {
    const payments = await Payment.find({ user_id: req.params.userId })
    res.json(payments)
  } catch (error) {
    res.status(500).json({ msg: "Server error" })
  }
})

// ==========================
//  PLAYERS ROUTES
// ==========================
app.get("/admin/players", async (req, res) => {
  try {
    let { search = "", page = 1, limit = 10 } = req.query
    page = Number(page)
    limit = limit === "all" ? 0 : Number(limit)

    const query = {
      $or: [
        { fullName: { $regex: search, $options: "i" } },
        { username: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ],
    }

    const totalPlayers = await User.countDocuments(query)

    let playersQuery = User.find(query).sort({ createdAt: -1 })
    if (limit) playersQuery = playersQuery.skip((page - 1) * limit).limit(limit)

    const users = await playersQuery
    res.json({ users, totalPlayers })
  } catch (error) {
    res.status(500).json({ msg: "Server error" })
  }
})

app.delete("/admin/players/:id", async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id)
    if (!user) return res.status(404).json({ msg: "User not found" })
    res.json({ msg: "User deleted successfully" })
  } catch (error) {
    res.status(500).json({ msg: "Server error" })
  }
})

app.put("/admin/players/:id", async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true })
    if (!user) return res.status(404).json({ msg: "User not found" })
    res.json({ msg: "User updated successfully", user })
  } catch (error) {
    res.status(500).json({ msg: "Server error" })
  }
})

// ----------------------------
//      PAYMENT DEPOSITE AND WITHDRAW
// ----------------------------

// -------------------- DEPOSIT --------------------
app.post("/payment/deposit", async (req, res) => {
  try {
    const { user_id, amount, time } = req.body

    const user = await User.findById(user_id)
    if (!user) return res.status(404).json({ message: "User not found" })

    user.amount += amount
    await user.save()

    const payment = new Payment({
      p_id: "P" + Date.now(),
      amount,
      p_type: "deposit",
      user_id,
      p_time: time,
    })
    await payment.save()

    res.status(200).json({ message: "Deposit successful", balance: user.amount })
  } catch (err) {
    res.status(500).json({ message: "Server Error" })
  }
})

// -------------------- WITHDRAW --------------------
app.post("/payment/withdraw", async (req, res) => {
  try {
    const { user_id, amount, time } = req.body

    const user = await User.findById(user_id)
    if (!user) return res.status(404).json({ message: "User not found" })
    if (user.amount < amount) return res.status(400).json({ message: "Insufficient balance" })

    user.amount -= amount
    await user.save()

    const payment = new Payment({
      p_id: "P" + Date.now(),
      amount,
      p_type: "withdraw",
      user_id,
      p_time: time,
    })
    await payment.save()

    res.status(200).json({ message: "Withdrawal successful", balance: user.amount })
  } catch (err) {
    res.status(500).json({ message: "Server Error" })
  }
})

// -------------------- PAYMENT HISTORY --------------------
app.get("/payment/history/:user_id", async (req, res) => {
  try {
    const payments = await Payment.find({ user_id: req.params.user_id }).sort({ createdAt: -1 })
    res.status(200).json(payments)
  } catch (err) {
    res.status(500).json({ message: "Server Error" })
  }
})

// ----------------------------
//      TOURNAMENT REGISTRATION MANAGEMENT
// ----------------------------
// -------------------- TOURNAMENT REGISTRATION --------------------
app.post("/tournament/register", async (req, res) => {
  try {
    const { user_id, team_name, tournament_id, payment_method } = req.body

    const user = await User.findById(user_id)
    const tournament = await Tournament.findOne({ t_id: tournament_id })
    if (!user || !tournament) return res.status(404).json({ message: "User or Tournament not found" })

    // Already registered check
    const existing = tournament.participants.find((p) => p.user_id.toString() === user_id)
    if (existing) return res.status(400).json({ message: "Already registered" })

    // Wallet check
    if (payment_method === "wallet" && user.amount < tournament.entry_fee)
      return res.status(400).json({ message: "Insufficient wallet balance" })

    // Deduct if wallet
    if (payment_method === "wallet") {
      user.amount -= tournament.entry_fee
      await user.save()
    }

    // Add participant
    tournament.participants.push({
      user_id: user._id,
      team_name,
      payment_status: payment_method === "wallet" ? "paid" : "pending",
    })
    await tournament.save()

    // Add tournament to user's joined tournaments
    if (!user.tournamentsJoined.includes(tournament._id)) {
      user.tournamentsJoined.push(tournament._id);
      user.gamingStats.totalTournaments += 1;
      await user.save();
    }

    // Emit socket event for real-time updates
    io.emit('tournamentJoined', {
      userId: user._id,
      tournamentId: tournament.t_id,
      tournamentName: tournament.game,
      teamName: team_name,
      participantsCount: tournament.participants.length
    });

    // Payment record
    const payment = new Payment({
      p_id: "P" + Date.now(),
      amount: tournament.entry_fee,
      p_type: "tournament",
      user_id: user._id,
      tournament_id: tournament.t_id,
      p_time: new Date().toLocaleTimeString(),
    })
    await payment.save()

    res.status(200).json({
      message: `Registered successfully via ${payment_method}`,
      balance: user.amount,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Server error" })
  }
})

// ----------------------Tournament History ----------------
// Get tournaments joined by a user
app.get("/tournaments/joined/:userId", async (req, res) => {
  try {
    const userId = req.params.userId
    const tournaments = await Tournament.find({ "participants.user_id": userId })

    // Extract only the logged-in user's participant info
    const userTournaments = tournaments.map((t) => {
      const participant = t.participants.find((p) => p.user_id.toString() === userId)
      return {
        _id: t._id,
        t_id: t.t_id,
        game: t.game,
        map: t.map,
        entry_fee: t.entry_fee,
        t_date: t.t_date,
        t_time: t.t_time,
        t_status: t.t_status,
        result_published: t.result_published,
        team_name: participant?.team_name || "N/A",
        payment_status: participant?.payment_status || "pending",
        rank: participant?.rank || 0,
        rewards: t.rewards,
        // Calculate prize won based on rank
        prize_won: participant?.rank === 1 ? t.rewards?.first || 0 :
                   participant?.rank === 2 ? t.rewards?.second || 0 :
                   participant?.rank === 3 ? t.rewards?.third || 0 : 0
      }
    })
    res.status(200).json(userTournaments)
  } catch (err) {
    console.error("Error fetching joined tournaments:", err)
    res.status(500).json({ message: "Server error" })
  }
})


// ---------------------------- 
// TOURNAMENT CANCELLATION & REFUND
// ----------------------------
app.post("/tournament/cancel", async (req, res) => {
  try {
    const { user_id, tournament_id } = req.body
    const user = await User.findById(user_id)
    const tournament = await Tournament.findOne({ t_id: tournament_id })
    if (!user || !tournament) return res.status(404).json({ message: "Not found" })

    const index = tournament.participants.findIndex((p) => p.user_id.toString() === user_id)
    if (index === -1) return res.status(400).json({ message: "Not registered" })

    const participant = tournament.participants[index]

    // Calculate refund: full if >24h, else 95%
    const tournamentDate = new Date(tournament.t_date + " " + tournament.t_time)
    const now = new Date()
    const hoursUntilTournament = (tournamentDate - now) / (1000 * 60 * 60)
    
    let refundAmount = participant.payment_status === "paid" ? tournament.entry_fee : 0
    let deductionAmount = 0
    
    if (hoursUntilTournament <= 24 && hoursUntilTournament > 0) {
      // Within 24 hours - deduct 5%
      deductionAmount = Math.round(tournament.entry_fee * 0.05)
      refundAmount = tournament.entry_fee - deductionAmount
    } else if (hoursUntilTournament <= 0) {
      // Tournament has already started or passed
      return res.status(400).json({ 
        message: "Cannot cancel tournament that has already started or passed" 
      })
    }
    // If more than 24 hours, full refund (no deduction)

    // Remove participant
    tournament.participants.splice(index, 1)
    await tournament.save()

    // Refund
    user.amount += refundAmount
    await user.save()

    // Record refund
    const payment = new Payment({
      p_id: "REFUND_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9),
      amount: refundAmount,
      p_type: "refund",
      user_id: user._id,
      tournament_id: tournament.t_id,
      p_time: new Date().toLocaleTimeString(),
    })
    await payment.save()

    res.status(200).json({
      message: `Canceled. Refund: ₹${refundAmount}${deductionAmount > 0 ? ` (5% deduction: ₹${deductionAmount})` : ''}`,
      balance: user.amount,
      refundAmount,
      deductionAmount,
      hoursUntilTournament: Math.round(hoursUntilTournament * 100) / 100
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Server error" })
  }
})
