import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    // ============================
    // 📌 BASIC INFO
    // ============================
    fullName: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    dob: { type: String },
    email: { type: String, required: true, unique: true },
    contact: { type: String },
    password: { type: String, required: true },
    amount: { type: Number, default: 0 },

    // ============================
    // 🌐 SOCIAL (Simple & Clean)
    // ============================
    social: {
      type: {
        followers: [{
          type: mongoose.Schema.Types.ObjectId,
          ref: "user_master",
        }],
        following: [{
          type: mongoose.Schema.Types.ObjectId,
          ref: "user_master",
        }],
        requests: {
          received: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "user_master",
          }],
          sent: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "user_master",
          }],
        },
      },
      default: () => ({
        followers: [],
        following: [],
        requests: {
          received: [],
          sent: [],
        },
      }),
    },
  },
  { timestamps: true }
);

// ============================
// 🔒 PRE-SAVE MIDDLEWARE
// ============================

// Initialize social structure for new AND existing users
userSchema.pre("save", function (next) {
  if (!this.social) {
    this.social = {
      followers: [],
      following: [],
      requests: {
        received: [],
        sent: [],
      },
    };
  }
  if (!this.social.requests) {
    this.social.requests = {
      received: [],
      sent: [],
    };
  }
  if (!this.social.followers) this.social.followers = [];
  if (!this.social.following) this.social.following = [];
  if (!this.social.requests.received) this.social.requests.received = [];
  if (!this.social.requests.sent) this.social.requests.sent = [];
  
  next();
});

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// ============================
// 🔐 METHODS
// ============================

// Compare password
userSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

// Get chat-compatible user data
userSchema.methods.getChatData = function () {
  return {
    id: this._id,
    username: this.username,
    email: this.email,
    fullName: this.fullName,
    firstName: this.fullName.split(" ")[0],
    lastName: this.fullName.split(" ").slice(1).join(" "),
    followers: this.social?.followers?.length || 0,
    following: this.social?.following?.length || 0,
    pendingRequests: this.social?.requests?.received?.length || 0,
    sentRequests: this.social?.requests?.sent?.length || 0,
  };
};

// Get tournament-compatible user data
userSchema.methods.getTournamentData = function () {
  return {
    _id: this._id,
    fullName: this.fullName,
    username: this.username,
    email: this.email,
    contact: this.contact,
    dob: this.dob,
    amount: this.amount,
  };
};

const User = mongoose.model("user_master", userSchema);

export default User;