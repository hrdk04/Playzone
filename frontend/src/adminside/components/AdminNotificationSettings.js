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
  // Forgot-password via email OTP states
  const [forgotOtp, setForgotOtp] = useState("")
  const [forgotOtpSent, setForgotOtpSent] = useState(false)
  const [forgotResendCooldown, setForgotResendCooldown] = useState(0)
  const [forgotNewPassword, setForgotNewPassword] = useState("")
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState("")

  // Fetch admin profile
  // Normalize username prop (it may be a JSON string or object)
  const resolveUsername = () => {
    if (!username) return null
    try {
      if (typeof username === "string") {
        const trimmed = username.trim()
        if (trimmed.startsWith("{")) {
          const parsed = JSON.parse(trimmed)
          return parsed?.username || null
        }
        return trimmed
      }
      if (typeof username === "object") return username.username || null
      return String(username)
    } catch (e) {
      return null
    }
  }

  const resolvedUsername = resolveUsername()

  useEffect(() => {
    const fetchProfile = async () => {
      if (!resolvedUsername) return
      try {
        const { data } = await axios.get(
          `${API_BASE_URL}/admin/profile?username=${encodeURIComponent(resolvedUsername)}`
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
  }, [resolvedUsername])

  // OTP cooldown timer
  useEffect(() => {
    let timer
    if (resendCooldown > 0) {
      timer = setInterval(() => setResendCooldown((prev) => prev - 1), 1000)
    }
    return () => clearInterval(timer)
  }, [resendCooldown])

  // Forgot-password OTP cooldown timer
  useEffect(() => {
    let timer
    if (forgotResendCooldown > 0) {
      timer = setInterval(() => setForgotResendCooldown((prev) => prev - 1), 1000)
    }
    return () => clearInterval(timer)
  }, [forgotResendCooldown])

  // Notification handlers
  const handleSendOtp = async () => {
    if (!email) return toast.error("Enter email first")

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) return toast.error("Invalid email")

    try {
      await axios.post(
        `${API_BASE_URL}/admin/email/send-otp`,
        { username: resolvedUsername, email },
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
        { username: resolvedUsername, otp },
        { headers: { "Content-Type": "application/json" } }
      )
      setNotificationStatus("verified")
      setOtpSent(false)
      toast.success("Email verified! You will now receive tournament notifications.")
      // Refresh profile data
      const { data } = await axios.get(
        `${API_BASE_URL}/admin/profile?username=${encodeURIComponent(resolvedUsername)}`
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
        { username: resolvedUsername, currentPassword, newPassword },
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

  // Forgot password via email OTP
  const handleSendPasswordOtp = async () => {
    try {
      if (!resolvedUsername) return toast.error("Admin username missing")
      const res = await axios.post(`${API_BASE_URL}/admin/password/send-otp`, { username: resolvedUsername })
      setForgotOtpSent(true)
      setForgotResendCooldown(30)
      toast.success(res.data?.message || "OTP sent to admin email")
    } catch (err) {
      console.error("Send password OTP error:", err)
      toast.error(err?.response?.data?.message || "Failed to send password OTP")
    }
  }

  const handleResetPasswordWithOtp = async () => {
    if (!forgotOtp || !forgotNewPassword || !forgotConfirmPassword) return toast.error("All fields are required")
    if (forgotNewPassword !== forgotConfirmPassword) return toast.error("Passwords do not match")
    if (forgotNewPassword.length < 6) return toast.error("Password must be at least 6 characters")
    try {
      await axios.post(`${API_BASE_URL}/admin/password/reset`, { username: resolvedUsername, otp: forgotOtp, newPassword: forgotNewPassword })
      toast.success("Password reset successfully. You can now login with the new password.")
      setForgotOtp("")
      setForgotNewPassword("")
      setForgotConfirmPassword("")
      setForgotOtpSent(false)
    } catch (err) {
      console.error("Reset password error:", err)
      toast.error(err?.response?.data?.message || "Failed to reset password")
    }
  }

  if (loading) {
    return (
      <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-primary)" }}>
        <p>Loading profile...</p>
      </div>
    )
  }

  return (
    <div style={{ 
      padding: isMobile ? "1rem" : "2rem", 
      color: "var(--text-primary)", 
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
                  border: "1px solid var(--border-color)",
                  background: "var(--bg-tertiary)",
                  color: "var(--text-primary)",
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
                  border: "1px solid var(--border-color)",
                  background: "var(--bg-tertiary)",
                  color: "var(--text-primary)",
                  cursor: "not-allowed"
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", color: theme.colors.lightGray }}>
                Account Created
              </label>
              {
                (() => {
                  const created = profile?.createdAt ? new Date(profile.createdAt) : null
                  const createdVal = created && !isNaN(created.getTime()) ? created.toLocaleString() : ""
                  return (
                    <input
                      type="text"
                      value={createdVal}
                      disabled
                      style={{
                        width: "100%",
                        padding: "0.75rem",
                        borderRadius: "6px",
                        border: "1px solid var(--border-color)",
                        background: "var(--bg-tertiary)",
                        color: "var(--text-primary)",
                        cursor: "not-allowed"
                      }}
                    />
                  )
                })()
              }
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", color: theme.colors.lightGray }}>
                Last Updated
              </label>
              {
                (() => {
                  const updated = profile?.updatedAt ? new Date(profile.updatedAt) : null
                  const updatedVal = updated && !isNaN(updated.getTime()) ? updated.toLocaleString() : ""
                  return (
                    <input
                      type="text"
                      value={updatedVal}
                      disabled
                      style={{
                        width: "100%",
                        padding: "0.75rem",
                        borderRadius: "6px",
                        border: "1px solid var(--border-color)",
                        background: "var(--bg-tertiary)",
                        color: "var(--text-primary)",
                        cursor: "not-allowed"
                      }}
                    />
                  )
                })()
              }
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
                    border: "1px solid var(--border-color)",
                    background: "var(--bg-secondary)",
                    color: "var(--text-primary)"
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
                Email: <strong style={{ color: "var(--text-primary)" }}>{email}</strong>
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
                    border: "1px solid var(--border-color)",
                    background: "var(--bg-secondary)",
                    color: "var(--text-primary)"
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
                    border: "1px solid var(--border-color)",
                    background: "var(--bg-secondary)",
                    color: "var(--text-primary)"
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
                    border: "1px solid var(--border-color)",
                    background: "var(--bg-secondary)",
                    color: "var(--text-primary)"
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
                    border: "1px solid var(--border-color)",
                    background: "var(--bg-secondary)",
                    color: "var(--text-primary)"
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
          {/* Forgot password via email OTP */}
          <div style={{ marginTop: "1.5rem", borderTop: `1px dashed ${theme.colors.primary}`, paddingTop: "1rem" }}>
            <h3 style={{ color: theme.colors.secondary }}>Forgot Password (Email OTP)</h3>
            <p style={{ color: theme.colors.lightGray }}>Sends an OTP to your verified notification email to reset the admin password.</p>
            <p style={{ color: theme.colors.lightGray }}>Email: <strong>{profile?.notificationEmail || "Not set"}</strong></p>
            {!forgotOtpSent && (
              <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem" }}>
                <button onClick={handleSendPasswordOtp} style={{ padding: "0.5rem 1rem", background: theme.colors.primary, color: "#fff", border: "none", borderRadius: "6px" }}>
                  Send OTP to Email
                </button>
              </div>
            )}

            {forgotOtpSent && (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "0.75rem" }}>
                <input type="text" placeholder="Enter OTP" value={forgotOtp} onChange={(e) => setForgotOtp(e.target.value)} style={{ padding: "0.5rem", borderRadius: "6px" }} />
                <input type="password" placeholder="New password" value={forgotNewPassword} onChange={(e) => setForgotNewPassword(e.target.value)} style={{ padding: "0.5rem", borderRadius: "6px" }} />
                <input type="password" placeholder="Confirm new password" value={forgotConfirmPassword} onChange={(e) => setForgotConfirmPassword(e.target.value)} style={{ padding: "0.5rem", borderRadius: "6px" }} />
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button onClick={handleResetPasswordWithOtp} style={{ padding: "0.5rem 1rem", background: theme.colors.secondary, color: "#fff", border: "none", borderRadius: "6px" }}>Reset Password</button>
                  <button onClick={() => { if (forgotResendCooldown === 0) { handleSendPasswordOtp() } }} disabled={forgotResendCooldown > 0} style={{ padding: "0.5rem 1rem", background: theme.colors.primary, color: "#fff", border: "none", borderRadius: "6px" }}>{forgotResendCooldown > 0 ? `Resend in ${forgotResendCooldown}s` : "Resend OTP"}</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminProfile
