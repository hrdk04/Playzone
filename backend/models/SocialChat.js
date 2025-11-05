import mongoose from "mongoose";

// ============================
// 💬 MESSAGE SCHEMA (Simple)
// ============================
const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user_master",
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user_master",
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Index for faster queries
messageSchema.index({ sender: 1, receiver: 1, createdAt: -1 });

const Message = mongoose.model("social_message", messageSchema);

// ============================
// 🗨️ CONVERSATION SCHEMA (Simple)
// ============================
const conversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user_master",
        required: true,
      },
    ],
    lastMessage: {
      type: String,
      default: "",
    },
    lastMessageTime: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Index for faster participant lookups
conversationSchema.index({ participants: 1 });

const Conversation = mongoose.model("social_conversation", conversationSchema);

// ============================
// 📤 EXPORTS
// ============================
export { Message, Conversation };