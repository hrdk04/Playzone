
import React, { useState } from "react";
import { Link } from "react-router-dom";
import theme from "../theme";
import axios from 'axios';

export default function Signup() {
  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    dob: "",
    email: "",
    contact: "",
    password: "",
    confirmPassword: "",
    otp: "",
    termsAccepted: false,
  });

  const [serverOtp, setServerOtp] = useState(""); // pretend server OTP

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleNextStep1 = (e) => {
    e.preventDefault();
    setStep(2);
  };

  const handleNextStep2 = (e) => {
    e.preventDefault();
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    setServerOtp(otp);
    setFormData({ ...formData, otp });
    console.log("Sending OTP to email:", formData.email, "OTP:", otp);
    setStep(3);
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (formData.otp === serverOtp) {

      try {
        const res= await axios.post("http://localhost:5000/signup",formData);
        console.log("Signup Success:", formData);
        setTimeout(()=>{
          alert("Signup successful!");
          window.location.href = "/login";
        },2000)

      } catch (error) {
        console.error(error);
        alert("Error Saving User Data.")
      }
    } else {
      alert("Invalid OTP. Please try again.");
    }
  };

  const inputStyle = {
    width: "95%",
    padding: "10px",
    borderRadius: "6px",
    border: theme.borders.activeLink,
    backgroundColor: theme.colors.backgroundColor,
    color: theme.colors.white,
    marginBottom: "20px",
  };

  return (
    <div
      style={{
        position: "relative",
        minHeight: "80vh",        
        backgroundImage:" url('https://st4.depositphotos.com/24297044/27344/v/450/depositphotos_273440920-stock-illustration-blue-background-gradient-abstract-texture.jpg')",
        backgroundRepeat:'no-repeat',
        backgroundSize:"cover",
        backgroundPosition:'fixed',
        backgroundAttachment:'fixed',
        color: theme.colors.white,
        fontFamily: theme.fonts.primary,
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        padding: "50px 20px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "400px",
          margin:"6% auto",
          padding: "30px",
          borderRadius: "12px",
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
          Sign Up
        </h1>

        {/* Step 1: Basic Info */}
        {step === 1 && (
          <form onSubmit={handleNextStep1}>
            <input
              type="text"
              name="fullName"
              placeholder="Full Name"
              value={formData.fullName}
              onChange={handleChange}
              // required
              style={inputStyle}
            />
            <input
              type="text"
              name="username"
              placeholder="Username"
              value={formData.username}
              onChange={handleChange}
              // required
              style={inputStyle}
            />
            <input
              type="date"
              name="dob"
              value={formData.dob}
              onChange={handleChange}
              // required
              style={inputStyle}
            />
            <button
              type="submit"
              style={{
                width: "100%",
                padding: theme.spacing.buttonPadding,
                background: theme.gradients.primaryButton,
                color: theme.colors.white,
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                boxShadow: theme.shadows.buttonShadow,
                fontFamily: theme.fonts.primary,
              }}
            >
              Next
            </button>

            <div style={{ marginTop: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
              <input
                type="checkbox"
                name="termsAccepted"
                checked={formData.termsAccepted}
                onChange={handleChange}
                style={{ width: "auto", accentColor: theme.colors.primaryGreen }}
                required
              />
              <label style={{ fontSize: "14px", color: theme.colors.white }}>
                I agree to the <Link to="/terms" style={{ color: theme.colors.primaryGreen, textDecoration: "none", textShadow: theme.shadows.textGlow }}>Terms and Conditions</Link>
              </label>
            </div>
          </form>
        )}

        {/* Step 2: Contact & Password */}
        {step === 2 && (
          <form onSubmit={handleNextStep2}>
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              // required
              style={inputStyle}
            />
            <input
              type="text"
              name="contact"
              placeholder="Contact Number"
              value={formData.contact}
              onChange={handleChange}
              // required
              style={inputStyle}
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              // required
              style={inputStyle}
            />
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={handleChange}
              // required
              style={inputStyle}
            />
            <button
              type="submit"
              style={{
                width: "100%",
                padding: theme.spacing.buttonPadding,
                background: theme.gradients.primaryButton,
                color: theme.colors.white,
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                boxShadow: theme.shadows.buttonShadow,
                fontFamily: theme.fonts.primary,
              }}
            >
              Send OTP
            </button>
          </form>
        )}

        {/* Step 3: OTP Verification */}
        {step === 3 && (
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
              // required
              style={inputStyle}
            />
            <button
              type="submit"
              style={{
                width: "100%",
                padding: theme.spacing.buttonPadding,
                background: theme.gradients.primaryButton,
                color: theme.colors.white,
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                boxShadow: theme.shadows.buttonShadow,
                fontFamily: theme.fonts.primary,
              }}
            >
              Verify & Register
            </button>
          </form>
        )}

        <p
          style={{
            marginTop: "15px",
            fontSize: "0.9rem",
            textAlign: "center",
            color: theme.colors.lightGray,
          }}
        >
          Already have an account?{" "}
          <a href="/login" style={{ color: theme.colors.secondary }}>
            Login here
          </a>
        </p>
      </div>
    </div>
  );
}
