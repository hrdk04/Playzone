"use client";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import theme from "../theme";
import UserSideNav from "./UserSideNav";

const pulseKeyframes = `
  @keyframes pulse {
    0% { opacity: 0.8; }
    50% { opacity: 0.5; }
    100% { opacity: 0.8; }
  }
`;
const styleSheet = document.createElement("style");
styleSheet.type = "text/css";
styleSheet.innerText = pulseKeyframes;
document.head.appendChild(styleSheet);

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
    social: {
      followers: [],
      following: [],
      requests: {
        received: [],
        sent: []
      }
    }
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const [joinedCount, setJoinedCount] = useState(0);
  const [winCount, setWinCount] = useState(0);
  const [rankTitle, setRankTitle] = useState("Rookie");

  const storedUser = JSON.parse(localStorage.getItem("user"));
  const userId = storedUser?._id;
  const emailOrUsername = localStorage.getItem("userName");

  // Responsive handler
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!emailOrUsername || !userId) return;
      try {
        setLoading(true);
        const fullData = await axios.get(`http://localhost:5000/user/${emailOrUsername}`);
        setUser(fullData.data);

        const tournamentsRes = await axios.get(`http://localhost:5000/tournaments/joined/${userId}`);
        const tournaments = tournamentsRes.data || [];

        setJoinedCount(tournaments.length);

        const wins = tournaments.filter((t) => t.rank > 0 && t.rank <= 3).length;
        setWinCount(wins);

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

  // Social stats from new schema
  const followersCount = user.social?.followers?.length || 0;
  const followingCount = user.social?.following?.length || 0;
  const pendingRequestsCount = user.social?.requests?.received?.length || 0;

  return (
    <div style={styles.page}>
      {<UserSideNav />}
      
      <div style={{
        ...styles.mainContent,
        padding: isMobile ? '20px 15px' : '20px',
      }}>
        <div style={styles.header}>
          <button onClick={handleBack} style={{
            ...styles.backButton,
            right: isMobile ? '10px' : '15px',
          }}>
            ← Back
          </button>
          <h1 style={{
            ...styles.title,
            fontSize: isMobile ? '24px' : theme.sizes.sectionTitleFontSize,
          }}>
            👤 Profile
          </h1>
        </div>

        {loading && <p style={{ textAlign: "center" }}>Loading...</p>}

        <div style={{
          ...styles.container,
          gridTemplateColumns: isMobile ? '1fr' : '300px 1fr',
          gap: isMobile ? '20px' : '40px',
        }}>
          {/* Profile Card */}
          <div style={styles.profileCard}>
            <div style={styles.avatarSection}>
              <div style={styles.avatar}>
                {user.fullName ? user.fullName[0].toUpperCase() : "U"}
              </div>
              <div style={{ fontSize: "19px", fontWeight: "bold" }}>{user.fullName}</div>
              <div style={{ fontSize: "14px", color: theme.colors.lightGray }}>@{user.username}</div>

              <div style={styles.balanceCard}>
                <h3 style={styles.balanceTitle}>Account Balance</h3>
                <p style={styles.balance}>₹{user.amount}</p>
              </div>
            </div>

            {/* Social Stats (NEW) */}
            <div style={styles.statsSection}>
              <h3 style={styles.statsTitle}>Social Stats</h3>
              <div style={{
                ...styles.statsGrid,
                gridTemplateColumns: isMobile ? 'repeat(3, 1fr)' : 'repeat(3, 1fr)',
              }}>
                <div style={styles.statCard}>
                  <h4>{followersCount}</h4>
                  <p>Followers</p>
                </div>
                <div style={styles.statCard}>
                  <h4>{followingCount}</h4>
                  <p>Following</p>
                </div>
                <div style={styles.statCard}>
                  <h4>{pendingRequestsCount}</h4>
                  <p>Requests</p>
                </div>
              </div>
            </div>

            {/* Gaming Stats */}
            <div style={styles.statsSection}>
              <h3 style={styles.statsTitle}>Gaming Stats</h3>
              <div style={{
                ...styles.statsGrid,
                gridTemplateColumns: isMobile ? 'repeat(3, 1fr)' : 'repeat(3, 1fr)',
              }}>
                <div style={styles.statCard}>
                  <h4>{joinedCount}</h4>
                  <p>Tournaments</p>
                </div>
                <div>

                </div>
                <div style={styles.statCard}>
                  <h4>{winCount}</h4>
                  <p>Wins</p>
                </div>
               </div>
            </div>
          </div>

          {/* Form Section */}
          <div style={styles.formSection}>
            <div style={{
              ...styles.formHeader,
              flexDirection: isMobile ? 'column' : 'row',
              gap: isMobile ? '10px' : 0,
            }}>
              <h2 style={{
                ...styles.formTitle,
                fontSize: isMobile ? '20px' : '24px',
              }}>
                Personal Information
              </h2>
              <button 
                onClick={() => setIsEditing(!isEditing)} 
                style={{
                  ...styles.editButton,
                  width: isMobile ? '100%' : 'auto',
                }}
              >
                {isEditing ? "Cancel" : "Edit Profile"}
              </button>
            </div>

            <form style={styles.form} onSubmit={handleUpdate}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Full Name</label>
                <input
                  type="text"
                  name="fullName"
                  value={user.fullName}
                  onChange={handleChange}
                  style={{ ...styles.input, ...(isEditing && styles.editableInput) }}
                  readOnly={!isEditing}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Username</label>
                <input
                  type="text"
                  name="username"
                  value={user.username}
                  style={{ ...styles.input, ...styles.disabledInput }}
                  readOnly
                  disabled
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Email</label>
                <input
                  type="email"
                  name="email"
                  value={user.email}
                  style={{ ...styles.input, ...styles.disabledInput }}
                  readOnly
                  disabled
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Contact Number</label>
                <input
                  type="text"
                  name="contact"
                  value={user.contact}
                  onChange={handleChange}
                  style={{ ...styles.input, ...(isEditing && styles.editableInput) }}
                  readOnly={!isEditing}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Date of Birth</label>
                <input
                  type="date"
                  name="dob"
                  value={user.dob}
                  style={{ ...styles.input, ...styles.disabledInput }}
                  readOnly
                  disabled
                />
              </div>

              {isEditing && (
                <button
                  type="submit"
                  style={{ 
                    ...styles.submitButton, 
                    ...(loading ? styles.submitButtonLoading : {}) 
                  }}
                  disabled={loading}
                >
                  {loading ? "Updating..." : "Save Changes"}
                </button>
              )}
              {message && <p style={styles.message}>{message}</p>}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: theme.gradients.homeBackground,
    fontFamily: theme.fonts.primary,
    color: theme.colors.white,
  },
  mainContent: {
    transition: "margin-left 0.3s ease",
  },
  header: {
    display: "flex",
    alignItems: "center",
    marginBottom: "40px",
    position: "relative",
  },
  backButton: {
    padding: "10px 20px",
    borderRadius: "6px",
    background: theme.gradients.secondaryButton,
    color: theme.colors.white,
    cursor: "pointer",
    fontFamily: theme.fonts.primary,
    fontSize: "1rem",
    boxShadow: theme.shadows.buttonShadow,
    transition: theme.animations.transition,
    border: "none",
    position: "absolute",
  },
  title: {
    textAlign: "center",
    margin: "0 auto",
    textShadow: theme.shadows.titleGlow,
  },
  container: {
    maxWidth: "1200px",
    margin: "0 auto",
    display: "grid",
  },
  profileCard: {
    background: `linear-gradient(135deg, ${theme.colors.backgroundColor}80, ${theme.colors.backgroundColor})`,
    borderRadius: "12px",
    padding: "20px",
    border: theme.borders.activeLink,
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  avatarSection: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "15px",
  },
  avatar: {
    width: "120px",
    height: "120px",
    borderRadius: "60px",
    background: theme.gradients.primaryButton,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "48px",
    fontWeight: "bold",
    color: theme.colors.white,
    boxShadow: theme.shadows.buttonShadow,
  },
  balanceCard: {
    background: theme.gradients.secondaryButton,
    padding: "15px",
    borderRadius: "8px",
    textAlign: "center",
    width: "100%",
  },
  balanceTitle: {
    margin: "0 0 10px 0",
    fontSize: "16px",
  },
  balance: {
    margin: 0,
    fontSize: "24px",
    fontWeight: "bold",
  },
  statsSection: {
    marginTop: "15px",
  },
  statsTitle: {
    marginBottom: "15px",
    fontSize: "18px",
    textAlign:'center',
  },
  statsGrid: {
    display: "grid",
    gap: "10px",
  },
  statCard: {
    background: `${theme.colors.backgroundColor}80`,
    padding: "12px 8px",
    borderRadius: "8px",
    textAlign: "center",
  },
  formSection: {
    background: `linear-gradient(135deg, ${theme.colors.backgroundColor}80, ${theme.colors.backgroundColor})`,
    borderRadius: "12px",
    padding: "30px",
    border: theme.borders.activeLink,
  },
  formHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "30px",
  },
  formTitle: {
    margin: 0,
  },
  editButton: {
    padding: "8px 16px",
    borderRadius: "6px",
    border: "none",
    background: theme.gradients.secondaryButton,
    color: theme.colors.white,
    cursor: "pointer",
    fontFamily: theme.fonts.primary,
    fontSize: "1rem",
    boxShadow: theme.shadows.buttonShadow,
    transition: theme.animations.transition,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  formGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  label: {
    fontSize: "14px",
    color: theme.colors.white,
    opacity: 0.9,
  },
  input: {
    padding: "12px",
    borderRadius: "6px",
    border: theme.borders.activeLink,
    background: theme.colors.backgroundColor,
    color: theme.colors.white,
    fontSize: "1rem",
    transition: "all 0.3s ease",
  },
  editableInput: {
    border: "2px solid #6ffd65ff",
    boxShadow: "0 0 5px rgba(76, 175, 80, 0.3)",
  },
  disabledInput: {
    opacity: 0.7,
    cursor: "not-allowed",
    backgroundColor: `${theme.colors.backgroundColor}80`,
  },
  submitButton: {
    padding: "14px",
    width: "100%",
    borderRadius: "8px",
    border: "none",
    background: "linear-gradient(45deg, #2196F3, #00BCD4)",
    color: theme.colors.white,
    cursor: "pointer",
    fontFamily: theme.fonts.primary,
    fontSize: "1.1rem",
    fontWeight: "600",
    boxShadow: "0 4px 6px rgba(50, 50, 93, 0.11), 0 1px 3px rgba(0, 0, 0, 0.08)",
    transition: "all 0.3s ease",
    marginTop: "10px",
    textTransform: "uppercase",
    letterSpacing: "1px",
  },
  submitButtonLoading: {
    opacity: 0.8,
    cursor: "not-allowed",
    animation: "pulse 1.5s ease-in-out infinite",
  },
  message: {
    textAlign: "center",
    fontSize: "14px",
    color: "#4CAF50",
  }
};