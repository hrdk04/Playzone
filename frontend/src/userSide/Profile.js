"use client";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import UserSideNav from "./UserSideNav";
import "./Profile.css"; // ✅ INJECTING THE NEW CSS

export default function Profile() {
  const navigate = useNavigate();
  const handleBack = () => navigate(-1);

  const [user, setUser] = useState({
    fullName: "",
    username: "",
    dob: "",
    email: "",
    contact: "",
    amount: 0,
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  // New: gaming stats
  const [joinedCount, setJoinedCount] = useState(0);
  const [winCount, setWinCount] = useState(0);
  const [rankTitle, setRankTitle] = useState("Rookie");

  // get logged-in user info
  const storedUser = JSON.parse(localStorage.getItem("user"));
  const userId = storedUser?._id;
  const emailOrUsername = localStorage.getItem("userName");

  // Fetch user + stats
  useEffect(() => {
    const fetchData = async () => {
      if (!emailOrUsername || !userId) return;
      try {
        setLoading(true);
        const fullData = await axios.get(`http://localhost:5000/user/${emailOrUsername}`);
        setUser(fullData.data);

        // Fetch tournaments joined by user
        const tournamentsRes = await axios.get(`http://localhost:5000/tournaments/joined/${userId}`);
        const tournaments = tournamentsRes.data || [];

        setJoinedCount(tournaments.length);

        // count only those with rank 1, 2, or 3
        const wins = tournaments.filter((t) => t.rank > 0 && t.rank <= 3).length;
        setWinCount(wins);

        // dynamic rank title
        let title = "Rookie";
        if (wins >= 10) title = "Pro Player";
        else if (wins >= 5) title = "Champion";
        else if (wins >= 2) title = "Intermediate";
        else if (wins >= 1) title = "Beginner";
        setRankTitle(title);
      } catch (error) {
        console.error("Error fetching profile data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [emailOrUsername, userId]);

  // Update user info
  const handleChange = (e) => setUser({ ...user, [e.target.name]: e.target.value });

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await axios.put("http://localhost:5000/updateUser", user);
      setMessage(response.data.message);
      setIsEditing(false);
    } catch (error) {
      console.error(error);
      setMessage("Update failed!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-page-wrapper">
      <div className="profile-header-top">
        <UserSideNav />
        <button onClick={handleBack} className="floating-back-btn">
          ← Back
        </button>
      </div>

      <h1 className="profile-main-title">👤 Gamer Profile</h1>

      {loading && <div className="profile-loading-text">Synchronizing Data...</div>}

      <div className="profile-layout-grid">
        {/* ---------- PROFILE SIDEBAR CARD ---------- */}
        <div className="profile-sidebar-card">
          <div className="avatar-section">
            <div className="avatar-circle">
              {user.fullName ? user.fullName[0].toUpperCase() : "U"}
            </div>
            <div className="avatar-name">{user.fullName || "Player"}</div>

            <div className="wallet-balance-box">
              <h3 className="balance-title">Available Balance</h3>
              <p className="balance-amount">₹{user.amount}</p>
            </div>
          </div>

          {/* ---------- GAMING STATS ---------- */}
          <div className="gaming-stats-section">
            <h3 className="stats-header-title">Career Stats</h3>
            <div className="stats-grid-layout">
              <div className="stat-item-box">
                <h4>Matches</h4>
                <p className="text-cyan">{joinedCount} Joined</p>
              </div>
              <div className="stat-item-box">
                <h4>Victories</h4>
                <p className="text-pink">{winCount} Wins</p>
              </div>
              <div className="stat-item-box">
                <h4>Rank</h4>
                <p className="text-gold">{rankTitle}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ---------- FORM SECTION ---------- */}
        <div className="profile-form-card">
          <div className="form-header-row">
            <h2 className="form-main-heading">Personal Information</h2>
            <button onClick={() => setIsEditing(!isEditing)} className="edit-toggle-btn">
              {isEditing ? "✕ Cancel Edit" : "✏️ Edit Profile"}
            </button>
          </div>

          <form className="profile-edit-form" onSubmit={handleUpdate}>
            <div className="profile-form-group">
              <label className="profile-label">Full Name</label>
              <input
                type="text"
                name="fullName"
                value={user.fullName}
                onChange={handleChange}
                className={`profile-input ${isEditing ? "editable" : "disabled"}`}
                readOnly={!isEditing}
              />
            </div>

            <div className="profile-form-group">
              <label className="profile-label">Username</label>
              <input
                type="text"
                name="username"
                value={user.username}
                className="profile-input strictly-disabled"
                readOnly
                disabled
              />
            </div>

            <div className="profile-form-group">
              <label className="profile-label">Email Address</label>
              <input
                type="email"
                name="email"
                value={user.email}
                className="profile-input strictly-disabled"
                readOnly
                disabled
              />
            </div>

            <div className="profile-form-group">
              <label className="profile-label">Contact Number</label>
              <input
                type="text"
                name="contact"
                value={user.contact}
                onChange={handleChange}
                className={`profile-input ${isEditing ? "editable" : "disabled"}`}
                readOnly={!isEditing}
              />
            </div>

            <div className="profile-form-group">
              <label className="profile-label">Date of Birth</label>
              <input
                type="date"
                name="dob"
                value={user.dob}
                className="profile-input strictly-disabled"
                readOnly
                disabled
              />
            </div>

            {isEditing && (
              <button
                type="submit"
                className={`submit-update-btn ${loading ? "loading-pulse" : ""}`}
                disabled={loading}
              >
                {loading ? "Updating System..." : "Save Changes"}
              </button>
            )}
            
            {message && (
              <div className={`form-status-message ${message.includes("failed") ? "error" : "success"}`}>
                {message}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}