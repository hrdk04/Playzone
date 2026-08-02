"use client"
import React, { useState, useEffect } from "react"
import axios from "axios"
import toast, { Toaster } from "react-hot-toast"
import theme from "../../theme"
import API_BASE_URL from "../../config/apiConfig";

const AdminProfile = ({ username, isMobile = false }) => {
  // Profile states
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("profile") // profile | notifications | security

  // Notification states
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [notificationStatus, setNotificationStatus] = useState("checking")
  const [otpSent, setOtpSent] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)

  // Security states
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [changingPassword, setChangingPassword] = useState(false)

  // Fetch admin profile
  useEffect(() => {
    const fetchProfile = async () => {
      if (!username) return
      try {
        const { data } = await axios.get(
          `${API_BASE_URL}/admin/profile?username=${encodeURIComponent(username)}`
        )
        setProfile(data)
        setEmail(data.notificationEmail || "")
        setNotificationStatus(data.isEmailVerified ? "verified" : "not-set")
        setLoading(false)
      } catch (err) {
        console.error("Fetch profile error:", err)
        toast.error("Failed to load profile")
        setLoading(false)
      }
    }
    fetchProfile()
  }, [username])

  // OTP cooldown timer
  useEffect(() => {
    let timer
    if (resendCooldown > 0) {
      timer = setInterval(() => setResendCooldown((prev) => prev - 1), 1000)
    }
    return () => clearInterval(timer)
  }, [resendCooldown])

  // Notification handlers
  const handleSendOtp = async () => {
    if (!email) return toast.error("Enter email first")

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) return toast.error("Invalid email")

    try {
      await axios.post(
        `${API_BASE_URL}/admin/email/send-otp`,
        { username, email },
        { headers: { "Content-Type": "application/json" } }
      )
      setOtpSent(true)
      setNotificationStatus("pending")
      setResendCooldown(30)
      toast.success("OTP sent to your email")
    } catch (err) {
      console.error("Send OTP error:", err)
      toast.error(err?.response?.data?.message || "Failed to send OTP")
    }
  }

  const handleVerifyOtp = async () => {
    if (!otp) return toast.error("Enter OTP")
    try {
      await axios.post(
        `${API_BASE_URL}/admin/email/verify-otp`,
        { username, otp },
        { headers: { "Content-Type": "application/json" } }
      )
      setNotificationStatus("verified")
      setOtpSent(false)
      toast.success("Email verified! You will now receive tournament notifications.")
      // Refresh profile data
      const { data } = await axios.get(
        `${API_BASE_URL}/admin/profile?username=${encodeURIComponent(username)}`
      )
      setProfile(data)
    } catch (err) {
      console.error("Verify OTP error:", err)
      toast.error(err?.response?.data?.message || "Invalid OTP")
    }
  }

  const handleResendOtp = () => {
    if (resendCooldown > 0) return
    handleSendOtp()
  }

  // Security handlers
  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      return toast.error("All fields are required")
    }

    if (newPassword !== confirmPassword) {
      return toast.error("New passwords don't match")
    }

    if (newPassword.length < 6) {
      return toast.error("Password must be at least 6 characters")
    }

    setChangingPassword(true)
    try {
      await axios.put(
        `${API_BASE_URL}/admin/change-password`,
        { username, currentPassword, newPassword },
        { headers: { "Content-Type": "application/json" } }
      )
      toast.success("Password updated successfully")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (err) {
      console.error("Change password error:", err)
      toast.error(err?.response?.data?.message || "Failed to change password")
    } finally {
      setChangingPassword(false)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: "2rem", textAlign: "center", color: theme.colors.white }}>
        <p>Loading profile...</p>
      </div>
    )
  }

  return (
    <div style={{ 
      padding: isMobile ? "1rem" : "2rem", 
      color: theme.colors.white, 
      fontFamily: theme.fonts.primary 
    }}>
      <Toaster position="top-right" reverseOrder={false} />
      
      {/* Header */}
      <div style={{ marginBottom: isMobile ? "1rem" : "2rem" }}>
        <h1 style={{ 
          color: theme.colors.primary, 
          marginBottom: "0.5rem",
          fontSize: isMobile ? "1.5rem" : "2rem"
        }}>
          Admin Profile
        </h1>
        <p style={{ 
          color: theme.colors.lightGray,
          fontSize: isMobile ? "0.9rem" : "1rem"
        }}>
          Manage your profile information, notifications, and security settings
        </p>
      </div>

      {/* Tabs */}
      <div style={{ 
        display: "flex", 
        gap: isMobile ? "0.5rem" : "1rem", 
        marginBottom: isMobile ? "1rem" : "2rem",
        borderBottom: `1px solid ${theme.colors.primary}`,
        paddingBottom: "1rem",
        flexWrap: isMobile ? "wrap" : "nowrap",
        overflowX: isMobile ? "auto" : "visible"
      }}>
        {[
          { id: "profile", label: "Profile Info", icon: "👤", shortLabel: "Profile" },
          { id: "notifications", label: "Notifications", icon: "🔔", shortLabel: "Notify" },
          { id: "security", label: "Security", icon: "🔒", shortLabel: "Security" }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: isMobile ? "0.5rem 0.75rem" : "0.75rem 1.5rem",
              background: activeTab === tab.id ? theme.colors.primary : "transparent",
              color: activeTab === tab.id ? "#fff" : theme.colors.lightGray,
              border: `1px solid ${activeTab === tab.id ? theme.colors.primary : theme.colors.primary}`,
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: isMobile ? "12px" : "14px",
              fontWeight: "500",
              transition: "all 0.3s ease",
              whiteSpace: "nowrap",
              minWidth: isMobile ? "auto" : "120px"
            }}
          >
            {tab.icon} {isMobile ? tab.shortLabel : tab.label}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === "profile" && (
        <div style={{
          background: theme.gradients.navbarAlt1,
          borderRadius: "12px",
          padding: "2rem",
          border: `1px solid ${theme.colors.primary}`
        }}>
          <h2 style={{ color: theme.colors.secondary, marginBottom: "1.5rem" }}>
            Profile Information
          </h2>
          
          <div style={{ display: "grid", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", color: theme.colors.lightGray }}>
                Username
              </label>
              <input
                type="text"
                value={profile?.username || ""}
                disabled
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  borderRadius: "6px",
                  border: "1px solid #333",
                  background: "#1a1a1a",
                  color: theme.colors.white,
                  cursor: "not-allowed"
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", color: theme.colors.lightGray }}>
                Admin Balance
              </label>
              <input
                type="text"
                value={`₹${profile?.amount?.toLocaleString() || 0}`}
                disabled
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  borderRadius: "6px",
                  border: "1px solid #333",
                  background: "#1a1a1a",
                  color: theme.colors.white,
                  cursor: "not-allowed"
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", color: theme.colors.lightGray }}>
                Account Created
              </label>
              <input
                type="text"
                value={profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : ""}
                disabled
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  borderRadius: "6px",
                  border: "1px solid #333",
                  background: "#1a1a1a",
                  color: theme.colors.white,
                  cursor: "not-allowed"
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", color: theme.colors.lightGray }}>
                Last Updated
              </label>
              <input
                type="text"
                value={profile?.updatedAt ? new Date(profile.updatedAt).toLocaleDateString() : ""}
                disabled
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  borderRadius: "6px",
                  border: "1px solid #333",
                  background: "#1a1a1a",
                  color: theme.colors.white,
                  cursor: "not-allowed"
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === "notifications" && (
        <div style={{
          background: theme.gradients.navbarAlt1,
          borderRadius: "12px",
          padding: "2rem",
          border: `1px solid ${theme.colors.primary}`
        }}>
          <h2 style={{ color: theme.colors.secondary, marginBottom: "1.5rem" }}>
            Email Notifications
          </h2>
          
          <p style={{ color: theme.colors.lightGray, marginBottom: "1.5rem" }}>
            Set up email notifications to receive alerts about tournament schedules, 
            participant updates, and important platform events.
          </p>

          {notificationStatus === "checking" && <p>Loading...</p>}

          {notificationStatus === "not-set" && !otpSent && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", color: theme.colors.lightGray }}>
                  Email for notifications
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    borderRadius: "6px",
                    border: "1px solid #333",
                    background: "#1a1a1a",
                    color: theme.colors.white
                  }}
                  placeholder="Enter your email"
                />
              </div>
              <button
                onClick={handleSendOtp}
                style={{
                  padding: "0.75rem 1.5rem",
                  background: theme.colors.primary,
                  border: "none",
                  borderRadius: "6px",
                  color: "#fff",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "500"
                }}
              >
                Send Verification OTP
              </button>
            </div>
          )}

          {notificationStatus === "pending" && otpSent && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <p style={{ color: theme.colors.lightGray }}>
                Email: <strong style={{ color: theme.colors.white }}>{email}</strong>
              </p>
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", color: theme.colors.lightGray }}>
                  Enter OTP
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    borderRadius: "6px",
                    border: "1px solid #333",
                    background: "#1a1a1a",
                    color: theme.colors.white
                  }}
                  placeholder="Enter OTP"
                />
              </div>
              <div style={{ display: "flex", gap: "1rem" }}>
                <button
                  onClick={handleVerifyOtp}
                  style={{
                    flex: 1,
                    padding: "0.75rem 1.5rem",
                    background: theme.colors.secondary,
                    border: "none",
                    borderRadius: "6px",
                    color: "#fff",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "500"
                  }}
                >
                  Verify OTP
                </button>
                <button
                  onClick={handleResendOtp}
                  disabled={resendCooldown > 0}
                  style={{
                    flex: 1,
                    padding: "0.75rem 1.5rem",
                    background: theme.colors.primary,
                    border: "none",
                    borderRadius: "6px",
                    color: "#fff",
                    cursor: resendCooldown > 0 ? "not-allowed" : "pointer",
                    fontSize: "14px",
                    fontWeight: "500",
                    opacity: resendCooldown > 0 ? 0.6 : 1
                  }}
                >
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend OTP"}
                </button>
              </div>
            </div>
          )}

          {notificationStatus === "verified" && (
            <div style={{
              padding: "1rem",
              background: "rgba(40, 167, 69, 0.1)",
              border: "1px solid #28a745",
              borderRadius: "6px",
              color: "#28a745"
            }}>
              ✅ Email <strong>{email}</strong> verified! You will now receive tournament notifications automatically.
            </div>
          )}
        </div>
      )}

      {/* Security Tab */}
      {activeTab === "security" && (
        <div style={{
          background: theme.gradients.navbarAlt1,
          borderRadius: "12px",
          padding: "2rem",
          border: `1px solid ${theme.colors.primary}`
        }}>
          <h2 style={{ color: theme.colors.secondary, marginBottom: "1.5rem" }}>
            Change Password
          </h2>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", color: theme.colors.lightGray }}>
                Current Password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  borderRadius: "6px",
                  border: "1px solid #333",
                  background: "#1a1a1a",
                  color: theme.colors.white
                }}
                placeholder="Enter current password"
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", color: theme.colors.lightGray }}>
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  borderRadius: "6px",
                  border: "1px solid #333",
                  background: "#1a1a1a",
                  color: theme.colors.white
                }}
                placeholder="Enter new password"
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", color: theme.colors.lightGray }}>
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  borderRadius: "6px",
                  border: "1px solid #333",
                  background: "#1a1a1a",
                  color: theme.colors.white
                }}
                placeholder="Confirm new password"
              />
            </div>

            <button
              onClick={handleChangePassword}
              disabled={changingPassword}
              style={{
                padding: "0.75rem 1.5rem",
                background: changingPassword ? "#666" : theme.colors.primary,
                border: "none",
                borderRadius: "6px",
                color: "#fff",
                cursor: changingPassword ? "not-allowed" : "pointer",
                fontSize: "14px",
                fontWeight: "500",
                opacity: changingPassword ? 0.6 : 1
              }}
            >
              {changingPassword ? "Updating..." : "Update Password"}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminProfile
