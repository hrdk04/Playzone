import React, { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import toast from 'react-hot-toast';
import "./Auth.css";

export default function ForgetPassword() {
  const [step, setStep] = useState(1);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    otp: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:5000/auth/send-otp", { email: formData.email });
      toast.success("OTP sent to your email!");
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.msg || "Failed to send OTP");
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:5000/auth/verify-otp", {
        email: formData.email,
        otp: formData.otp,
      });
      toast.success("OTP verified successfully!");
      setStep(3);
    } catch (err) {
      toast.error(err.response?.data?.msg || "Invalid OTP");
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      return toast.error("Passwords do not match");
    }

    try {
      const res = await axios.put("http://localhost:5000/forgetPass", {
        email: formData.email,
        newPassword: formData.newPassword,
      });
      toast.success(res.data.msg || "Password reset successful!");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      toast.error(err.response?.data?.msg || "Error resetting password");
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <h1 className="auth-title">Reset Password</h1>
        <p className="auth-subtitle">Recover access to your account</p>

        {/* Step 1: Email */}
        {step === 1 && (
          <form onSubmit={handleSendOtp}>
            <div className="auth-form-group">
              <input
                type="email"
                name="email"
                placeholder="Enter your registered email"
                value={formData.email}
                onChange={handleChange}
                required
                className="auth-input"
              />
            </div>
            
            <button type="submit" className="auth-btn">
              Send OTP
            </button>
            
            <p className="auth-footer-text">
              Remember your password?{" "}
              <Link to="/login" className="auth-link">Login here</Link>
            </p>
          </form>
        )}

        {/* Step 2: OTP Verification */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp}>
            <p className="auth-info-text">
              We sent a 6-digit OTP to <strong>{formData.email}</strong>
            </p>
            
            <div className="auth-form-group">
              <input
                type="text"
                name="otp"
                placeholder="000000"
                value={formData.otp}
                onChange={handleChange}
                required
                maxLength="6"
                className="auth-input auth-input-otp"
              />
            </div>
            
            <button type="submit" className="auth-btn">
              Verify OTP
            </button>
          </form>
        )}

        {/* Step 3: Reset Password */}
        {step === 3 && (
          <form onSubmit={handleResetPassword}>
            <div className="auth-form-group">
              <input
                type="password"
                name="newPassword"
                placeholder="Enter New Password"
                value={formData.newPassword}
                onChange={handleChange}
                required
                className="auth-input"
              />
            </div>
            
            <div className="auth-form-group">
              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirm New Password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="auth-input"
              />
            </div>
            
            <button type="submit" className="auth-btn">
              Reset Password
            </button>

            <p className="auth-footer-text">
              <Link to="/login" className="auth-link">Back to Login</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}