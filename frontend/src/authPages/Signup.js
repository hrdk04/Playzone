import React, { useState } from "react";
import { Link } from "react-router-dom";
import theme from "../theme";
import axios from 'axios';
import toast, { Toaster } from "react-hot-toast";

export default function Signup() {
  const [step, setStep] = useState(1);
  const [ageError, setAgeError] = useState("");
  const [errors, setErrors] = useState({});

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

  const [serverOtp, setServerOtp] = useState("");

  // Validation Functions
  const validateFullName = (name) => {
    if (!name.trim()) return "Full name is required";
    if (name.length < 3) return "Full name must be at least 3 characters";
    if (!/^[a-zA-Z\s]+$/.test(name)) return "Full name should contain only letters";
    return "";
  };

  const validateUsername = (username) => {
    if (!username.trim()) return "Username is required";
    if (username.length < 3) return "Username must be at least 3 characters";
    if (username.length > 20) return "Username must not exceed 20 characters";
    if (!/^[a-zA-Z0-9_]+$/.test(username)) return "Username can only contain letters, numbers, and underscores";
    return "";
  };

  const validateEmail = (email) => {
    if (!email.trim()) return "Email is required";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return "Please enter a valid email address";
    return "";
  };

  const validateContact = (contact) => {
    if (!contact.trim()) return "Contact number is required";
    // Allow formats: 1234567890 or +91-1234567890 or (123) 456-7890
    const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/;
    if (!phoneRegex.test(contact)) return "Please enter a valid contact number";
    if (contact.replace(/\D/g, '').length < 10) return "Contact number must be at least 10 digits";
    return "";
  };

  const validatePassword = (password) => {
    if (!password) return "Password is required";
    if (password.length < 8) return "Password must be at least 8 characters";
    if (!/[A-Z]/.test(password)) return "Password must contain at least one uppercase letter";
    if (!/[a-z]/.test(password)) return "Password must contain at least one lowercase letter";
    if (!/[0-9]/.test(password)) return "Password must contain at least one number";
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return "Password must contain at least one special character";
    return "";
  };

  const validateConfirmPassword = (confirmPassword, password) => {
    if (!confirmPassword) return "Please confirm your password";
    if (confirmPassword !== password) return "Passwords do not match";
    return "";
  };

  const validateOTP = (otp) => {
    if (!otp.trim()) return "OTP is required";
    if (!/^\d{6}$/.test(otp)) return "OTP must be 6 digits";
    return "";
  };

  // Calculate age from DOB
  const calculateAge = (dob) => {
    if (!dob) return 0;
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    setFormData({ ...formData, [name]: newValue });

    // Real-time validation
    let error = "";
    switch (name) {
      case 'fullName':
        error = validateFullName(newValue);
        break;
      case 'username':
        error = validateUsername(newValue);
        break;
      case 'dob':
        const age = calculateAge(newValue);
        if (age < 18 && newValue) {
          error = `You must be at least 18 years old. Your current age: ${age} years`;
          setAgeError(error);
        } else {
          setAgeError("");
        }
        break;
      case 'email':
        error = validateEmail(newValue);
        break;
      case 'contact':
        error = validateContact(newValue);
        break;
      case 'password':
        error = validatePassword(newValue);
        // Also re-validate confirm password if it exists
        if (formData.confirmPassword) {
          const confirmError = validateConfirmPassword(formData.confirmPassword, newValue);
          setErrors(prev => ({ ...prev, confirmPassword: confirmError }));
        }
        break;
      case 'confirmPassword':
        error = validateConfirmPassword(newValue, formData.password);
        break;
      case 'otp':
        error = validateOTP(newValue);
        break;
      default:
        break;
    }

    setErrors({ ...errors, [name]: error });
  };

  const handleNextStep1 = (e) => {
    e.preventDefault();
    
    // Validate all Step 1 fields
    const fullNameError = validateFullName(formData.fullName);
    const usernameError = validateUsername(formData.username);
    const dobAge = calculateAge(formData.dob);
    const dobError = !formData.dob ? "Date of birth is required" : 
                     (dobAge < 18 ? `You must be at least 18 years old. Your current age: ${dobAge} years` : "");
    
    const newErrors = {
      fullName: fullNameError,
      username: usernameError,
      dob: dobError,
    };

    setErrors(newErrors);

    // Check if terms are accepted
    if (!formData.termsAccepted) {
      toast.error("Please accept the Terms and Conditions");
      return;
    }

    // Check if there are any errors
    if (fullNameError || usernameError || dobError) {
      toast.error("Please fix all errors before proceeding");
      return;
    }
    
    setStep(2);
    toast.success("Step 1 completed!");
  };

  const handleNextStep2 = (e) => {
    e.preventDefault();
    
    // Validate all Step 2 fields
    const emailError = validateEmail(formData.email);
    const contactError = validateContact(formData.contact);
    const passwordError = validatePassword(formData.password);
    const confirmPasswordError = validateConfirmPassword(formData.confirmPassword, formData.password);

    const newErrors = {
      email: emailError,
      contact: contactError,
      password: passwordError,
      confirmPassword: confirmPasswordError,
    };

    setErrors(newErrors);

    // Check if there are any errors
    if (emailError || contactError || passwordError || confirmPasswordError) {
      toast.error("Please fix all errors before proceeding");
      return;
    }

    // Generate and send OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    setServerOtp(otp);
    console.log("Sending OTP to email:", formData.email, "OTP:", otp);
    toast.success("OTP sent to your email!");
    setStep(3);
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    
    // Validate OTP
    const otpError = validateOTP(formData.otp);
    if (otpError) {
      setErrors({ ...errors, otp: otpError });
      toast.error(otpError);
      return;
    }

    if (formData.otp === serverOtp) {
      try {
        const res = await axios.post("http://localhost:5000/signup", formData);
        console.log("Signup Success:", formData);
        toast.success("Signup successful! Redirecting to login...");
        setTimeout(() => {
          window.location.href = "/login";
        }, 2000);
      } catch (error) {
        console.error(error);
        toast.error(error.response?.data?.message || "Error saving user data.");
      }
    } else {
      setErrors({ ...errors, otp: "Invalid OTP" });
      toast.error("Invalid OTP. Please try again.");
    }
  };

  const inputStyle = {
    width: "95%",
    padding: "10px",
    borderRadius: "6px",
    border: theme.borders.activeLink,
    backgroundColor: theme.colors.backgroundColor,
    color: theme.colors.white,
    marginBottom: "5px",
  };

  const errorStyle = {
    color: "#ff4c4c",
    fontSize: "12px",
    marginBottom: "10px",
    marginTop: "-5px",
    marginLeft: "5px",
  };

  const getPasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;
    
    if (strength <= 2) return { text: "Weak", color: "#ff4c4c" };
    if (strength <= 4) return { text: "Medium", color: "#ffa500" };
    return { text: "Strong", color: "#4caf50" };
  };

  return (
    <div
      style={{
        position: "relative",
        minHeight: "80vh",
        backgroundImage: "url('https://st4.depositphotos.com/24297044/27344/v/450/depositphotos_273440920-stock-illustration-blue-background-gradient-abstract-texture.jpg')",
        backgroundRepeat: 'no-repeat',
        backgroundSize: "cover",
        backgroundPosition: 'fixed',
        backgroundAttachment: 'fixed',
        color: theme.colors.white,
        fontFamily: theme.fonts.primary,
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        padding: "50px 20px",
      }}
    >
      <Toaster position="top-right" reverseOrder={false} />

      <div
        style={{
          width: "100%",
          maxWidth: "400px",
          margin: "6% auto",
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

        {/* Progress Indicator */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px", gap: "10px" }}>
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              style={{
                width: "30px",
                height: "30px",
                borderRadius: "50%",
                background: step >= s ? theme.gradients.primaryButton : "#555",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "bold",
                transition: "all 0.3s",
              }}
            >
              {s}
            </div>
          ))}
        </div>

        {/* Step 1: Basic Info */}
        {step === 1 && (
          <form onSubmit={handleNextStep1}>
            <input
              type="text"
              name="fullName"
              placeholder="Full Name"
              value={formData.fullName}
              onChange={handleChange}
              style={{
                ...inputStyle,
                border: errors.fullName ? "2px solid #ff4c4c" : theme.borders.activeLink
              }}
            />
            {errors.fullName && <div style={errorStyle}>⚠️ {errors.fullName}</div>}

            <input
              type="text"
              name="username"
              placeholder="Username"
              value={formData.username}
              onChange={handleChange}
              style={{
                ...inputStyle,
                border: errors.username ? "2px solid #ff4c4c" : theme.borders.activeLink
              }}
            />
            {errors.username && <div style={errorStyle}>⚠️ {errors.username}</div>}
            
            <input
              type="date"
              name="dob"
              value={formData.dob}
              onChange={handleChange}
              max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
              style={{
                ...inputStyle,
                border: errors.dob || ageError ? "2px solid #ff4c4c" : theme.borders.activeLink
              }}
            />
            {(errors.dob || ageError) && <div style={errorStyle}>⚠️ {errors.dob || ageError}</div>}

            <div style={{ margin: "20px 1px", display: "flex", alignItems: "center", gap: "10px" }}>
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
              style={{
                ...inputStyle,
                border: errors.email ? "2px solid #ff4c4c" : theme.borders.activeLink
              }}
            />
            {errors.email && <div style={errorStyle}>⚠️ {errors.email}</div>}

            <input
              type="text"
              name="contact"
              placeholder="Contact Number"
              value={formData.contact}
              onChange={handleChange}
              style={{
                ...inputStyle,
                border: errors.contact ? "2px solid #ff4c4c" : theme.borders.activeLink
              }}
            />
            {errors.contact && <div style={errorStyle}>⚠️ {errors.contact}</div>}

            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              style={{
                ...inputStyle,
                border: errors.password ? "2px solid #ff4c4c" : theme.borders.activeLink
              }}
            />
            {errors.password && <div style={errorStyle}>⚠️ {errors.password}</div>}
            
            {/* Password Strength Indicator */}
            {formData.password && !errors.password && (
              <div style={{ marginBottom: "10px", marginLeft: "5px" }}>
                <span style={{ fontSize: "12px", color: getPasswordStrength(formData.password).color }}>
                  Password Strength: {getPasswordStrength(formData.password).text}
                </span>
              </div>
            )}

            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={handleChange}
              style={{
                ...inputStyle,
                border: errors.confirmPassword ? "2px solid #ff4c4c" : theme.borders.activeLink
              }}
            />
            {errors.confirmPassword && <div style={errorStyle}>⚠️ {errors.confirmPassword}</div>}

            <div style={{ display: "flex", gap: "10px" }}>
              <button
                type="button"
                onClick={() => setStep(1)}
                style={{
                  width: "30%",
                  padding: theme.spacing.buttonPadding,
                  background: "#555",
                  color: theme.colors.white,
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontFamily: theme.fonts.primary,
                }}
              >
                Back
              </button>
              <button
                type="submit"
                style={{
                  width: "70%",
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
            </div>
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
              placeholder="Enter 6-digit OTP"
              value={formData.otp}
              onChange={handleChange}
              maxLength="6"
              style={{
                ...inputStyle,
                border: errors.otp ? "2px solid #ff4c4c" : theme.borders.activeLink,
                letterSpacing: "5px",
                textAlign: "center",
                fontSize: "18px",
              }}
            />
            {errors.otp && <div style={errorStyle}>⚠️ {errors.otp}</div>}

            <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
              <button
                type="button"
                onClick={() => setStep(2)}
                style={{
                  width: "30%",
                  padding: theme.spacing.buttonPadding,
                  background: "#555",
                  color: theme.colors.white,
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontFamily: theme.fonts.primary,
                }}
              >
                Back
              </button>
              <button
                type="submit"
                style={{
                  width: "70%",
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
            </div>
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
