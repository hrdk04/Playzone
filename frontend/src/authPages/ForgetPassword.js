// src/auth/ForgetPassword.js
import React, { useState } from "react";
import theme from "../theme";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast"; // ✅ ADDED

export default function ForgetPassword() {
  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState({
    email: "",
    otp: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Step 1: Send OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:5000/auth/send-otp", { email: formData.email });
      toast.success("OTP sent to your email."); // ✅ CHANGED
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.msg || "Failed to send OTP"); // ✅ CHANGED
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:5000/auth/verify-otp", {
        email: formData.email,
        otp: formData.otp,
      });
      toast.success("OTP verified successfully!"); // ✅ CHANGED
      setStep(3);
    } catch (err) {
      toast.error(err.response?.data?.msg || "Invalid OTP"); // ✅ CHANGED
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      return toast.error("Passwords do not match"); // ✅ CHANGED
    }

    try {
      const res = await axios.put("http://localhost:5000/forgetPass", {
        email: formData.email,
        newPassword: formData.newPassword,
      });
      toast.success(res.data.msg || "Password reset successful!"); // ✅ CHANGED
      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
    } catch (err) {
      toast.error(err.response?.data?.msg || "Error resetting password"); // ✅ CHANGED
    }
  };

  const inputStyle = {
    width: "94%",
    padding: "10px",
    borderRadius: "6px",
    border: theme.borders.activeLink,
    backgroundColor: theme.colors.backgroundColor,
    color: theme.colors.white,
    marginBottom: "15px",
  };

  const buttonStyle = {
    width: "100%",
    padding: theme.spacing.buttonPadding,
    background: theme.gradients.primaryButton,
    color: theme.colors.white,
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    boxShadow: theme.shadows.buttonShadow,
    fontFamily: theme.fonts.primary,
  };

  return (
    <div
      style={{
        position: "relative",
        minHeight: "80vh",
        backgroundImage: " url('https://st4.depositphotos.com/24297044/27344/v/450/depositphotos_273440920-stock-illustration-blue-background-gradient-abstract-texture.jpg')",
        backgroundRepeat: 'no-repeat',
        backgroundSize: "cover",
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        color: theme.colors.white,
        fontFamily: theme.fonts.primary,
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        padding: "50px 20px",
      }}
    >
      {/* ✅ ADDED: Toaster component */}
      <Toaster  reverseOrder={false} />

      <div
        style={{
          width: "100%",
          maxWidth: "400px",
          padding: "30px",
          borderRadius: "12px",
          margin: '6.5% auto',
          background: theme.gradients.navbarAlt1,
          boxShadow: theme.shadows.sectionTitleGlow,
        }}
      >
        <h1
          style={{
            fontSize: theme.sizes.sectionTitleFontSize,
            textAlign: "center",
            textShadow: theme.shadows.titleGlow,
            marginBottom: "20px",
          }}
        >
          Forgot Password
        </h1>

        {/* Step 1: Email */}
        {step === 1 && (
          <form onSubmit={handleSendOtp}>
            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              required
              style={inputStyle}
            />
            <br/>
            <button
              type="submit"
              style={buttonStyle}
              onMouseOver={(e) =>
                (e.target.style.boxShadow = theme.shadows.activeTextGlow)
              }
              onMouseOut={(e) =>
                (e.target.style.boxShadow = theme.shadows.buttonShadow)
              }
            >
              Send OTP
            </button>
            <p
              style={{
                marginTop: "15px",
                fontSize: "0.9rem",
                textAlign: "center",
                color: theme.colors.lightGray,
              }}
            >
              Back to Login?{" "}
              <a href="/login" style={{ color: theme.colors.secondary }}>
                Login here
              </a>
            </p>
          </form>
        )}

        {/* Step 2: OTP Verification */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp}>
            <p style={{ textAlign: "center", marginBottom: "10px" }}>
              We sent a 6-digit OTP to <strong>{formData.email}</strong>
            </p>
            <input
              type="text"
              name="otp"
              placeholder="Enter OTP"
              value={formData.otp}
              onChange={handleChange}
              required
              style={inputStyle}
            />
            <button
              type="submit"
              style={buttonStyle}
              onMouseOver={(e) =>
                (e.target.style.boxShadow = theme.shadows.activeTextGlow)
              }
              onMouseOut={(e) =>
                (e.target.style.boxShadow = theme.shadows.buttonShadow)
              }
            >
              Verify OTP
            </button>
          </form>
        )}

        {/* Step 3: Reset Password */}
        {step === 3 && (
          <form onSubmit={handleResetPassword}>
            <input
              type="password"
              name="newPassword"
              placeholder="New Password"
              value={formData.newPassword}
              onChange={handleChange}
              required
              style={inputStyle}
            />
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm New Password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              style={inputStyle}
            />
            <button
              type="submit"
              style={buttonStyle}
              onMouseOver={(e) =>
                (e.target.style.boxShadow = theme.shadows.activeTextGlow)
              }
              onMouseOut={(e) =>
                (e.target.style.boxShadow = theme.shadows.buttonShadow)
              }
            >
              Reset Password
            </button>
          </form>
        )}
      </div>
    </div>
  );
}