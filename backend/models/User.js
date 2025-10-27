import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    dob: { type: String },
    email: { type: String, required: true, unique: true },
    contact: { type: String },
    password: { type: String, required: true },
    amount: { type: Number, default: 0 },
    // Chat-related fields
    firstName: { type: String },
    lastName: { type: String },
    bio: { type: String, default: "" },
    profilePicture: { type: String, default: "" },
    followers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "user_master",
    }],
    following: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "user_master",
    }],
    pendingFollowRequests: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "user_master",
    }],
    sentFollowRequests: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "user_master",
    }],
    // Tournament-related fields
    tournamentsJoined: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "tournament",
    }],
    teamName: { type: String, default: "" },
    gamingStats: {
      totalTournaments: { type: Number, default: 0 },
      tournamentsWon: { type: Number, default: 0 },
      totalPrizeMoney: { type: Number, default: 0 },
      favoriteGame: { type: String, default: "" },
      rank: { type: String, default: "Bronze" },
    },
  },
  { timestamps: true },
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

// Method to get chat-compatible user data
userSchema.methods.getChatData = function() {
  return {
    id: this._id,
    username: this.username,
    email: this.email,
    firstName: this.firstName || this.fullName.split(' ')[0],
    lastName: this.lastName || this.fullName.split(' ').slice(1).join(' '),
    bio: this.bio,
    followers: this.followers.length,
    following: this.following.length,
    pendingRequests: this.pendingFollowRequests.length,
    sentRequests: this.sentFollowRequests.length,
    profilePicture: this.profilePicture,
  };
};

// Method to get tournament-compatible user data
userSchema.methods.getTournamentData = function() {
  return {
    _id: this._id,
    fullName: this.fullName,
    username: this.username,
    email: this.email,
    contact: this.contact,
    dob: this.dob,
    amount: this.amount,
    gamingStats: this.gamingStats,
  };
};

const User = mongoose.model("user_master", userSchema);

export default User;
