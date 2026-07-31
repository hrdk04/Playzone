import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from 'axios';
import toast, { Toaster } from "react-hot-toast";
import "./Auth.css";

export default function Signup() {
  const [step, setStep] = useState(1);
  const [ageError, setAgeError] = useState("");
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

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
    const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/;
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

    let error = "";
    switch (name) {
      case 'fullName': error = validateFullName(newValue); break;
      case 'username': error = validateUsername(newValue); break;
      case 'dob':
        const age = calculateAge(newValue);
        if (age < 18 && newValue) {
          error = `You must be at least 18 years old. Your current age: ${age} years`;
          setAgeError(error);
        } else {
          setAgeError("");
        }
        break;
      case 'email': error = validateEmail(newValue); break;
      case 'contact': error = validateContact(newValue); break;
      case 'password':
        error = validatePassword(newValue);
        if (formData.confirmPassword) {
          const confirmError = validateConfirmPassword(formData.confirmPassword, newValue);
          setErrors(prev => ({ ...prev, confirmPassword: confirmError }));
        }
        break;
      case 'confirmPassword': error = validateConfirmPassword(newValue, formData.password); break;
      case 'otp': error = validateOTP(newValue); break;
      default: break;
    }

    setErrors({ ...errors, [name]: error });
  };

  const handleNextStep1 = (e) => {
    e.preventDefault();
    const fullNameError = validateFullName(formData.fullName);
    const usernameError = validateUsername(formData.username);
    const dobAge = calculateAge(formData.dob);
    const dobError = !formData.dob ? "Date of birth is required" : 
                     (dobAge < 18 ? `You must be at least 18 years old. Your current age: ${dobAge} years` : "");
    
    setErrors({ fullName: fullNameError, username: usernameError, dob: dobError });

    if (!formData.termsAccepted) return toast.error("Please accept the Terms and Conditions");
    if (fullNameError || usernameError || dobError) return toast.error("Please fix all errors before proceeding");
    
    setStep(2);
    toast.success("Step 1 completed!");
  };

  const handleNextStep2 = (e) => {
    e.preventDefault();
    const emailError = validateEmail(formData.email);
    const contactError = validateContact(formData.contact);
    const passwordError = validatePassword(formData.password);
    const confirmPasswordError = validateConfirmPassword(formData.confirmPassword, formData.password);

    setErrors({ email: emailError, contact: contactError, password: passwordError, confirmPassword: confirmPasswordError });

    if (emailError || contactError || passwordError || confirmPasswordError) {
      return toast.error("Please fix all errors before proceeding");
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    setServerOtp(otp);
    toast.success("OTP sent to your email!");
    setStep(3);
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const otpError = validateOTP(formData.otp);
    if (otpError) {
      setErrors({ ...errors, otp: otpError });
      return toast.error(otpError);
    }

    if (formData.otp === serverOtp) {
      try {
        await axios.post("http://localhost:5000/signup", formData);
        toast.success("Signup successful! Redirecting to login...");
        setTimeout(() => navigate("/login"), 2000);
      } catch (error) {
        toast.error(error.response?.data?.message || "Error saving user data.");
      }
    } else {
      setErrors({ ...errors, otp: "Invalid OTP" });
      toast.error("Invalid OTP. Please try again.");
    }
  };

  const getPasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;
    
    if (strength <= 2) return { text: "Weak", class: "weak" };
    if (strength <= 4) return { text: "Medium", class: "medium" };
    return { text: "Strong", class: "strong" };
  };

  return (
    <div className="auth-wrapper">
      <Toaster position="top-right" reverseOrder={false} />

      <div className="auth-card">
        <h1 className="auth-title">Create Account</h1>
        <p className="auth-subtitle">Register to compete in tournaments</p>

        {/* Progress Indicator */}
        <div className="auth-steps">
          <div className={`auth-step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>1</div>
          <div className={`auth-step-line ${step > 1 ? 'completed' : ''}`}></div>
          <div className={`auth-step ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>2</div>
          <div className={`auth-step-line ${step > 2 ? 'completed' : ''}`}></div>
          <div className={`auth-step ${step >= 3 ? 'active' : ''}`}>3</div>
        </div>

        {/* Step 1: Basic Info */}
        {step === 1 && (
          <form onSubmit={handleNextStep1}>
            <div className="auth-form-group">
              <input
                type="text"
                name="fullName"
                placeholder="Full Name"
                value={formData.fullName}
                onChange={handleChange}
                className="auth-input"
              />
            </div>
            {errors.fullName && <span className="auth-error">{errors.fullName}</span>}

            <div className="auth-form-group">
              <input
                type="text"
                name="username"
                placeholder="Username"
                value={formData.username}
                onChange={handleChange}
                className="auth-input"
              />
            </div>
            {errors.username && <span className="auth-error">{errors.username}</span>}
            
            <div className="auth-form-group">
              <input
                type="date"
                name="dob"
                value={formData.dob}
                onChange={handleChange}
                max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                className="auth-input"
              />
            </div>
            {(errors.dob || ageError) && <span className="auth-error">{errors.dob || ageError}</span>}

            <div className="auth-checkbox-group">
              <input
                type="checkbox"
                id="termsAccepted"
                name="termsAccepted"
                checked={formData.termsAccepted}
                onChange={handleChange}
                required
              />
              <label htmlFor="termsAccepted">
                I agree to the <Link to="/terms" className="auth-link">Terms and Conditions</Link>
              </label>
            </div>

            <button type="submit" className="auth-btn">Next Step</button>
          </form>
        )}

        {/* Step 2: Contact & Password */}
        {step === 2 && (
          <form onSubmit={handleNextStep2}>
            <div className="auth-form-group">
              <input
                type="email"
                name="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={handleChange}
                className="auth-input"
              />
            </div>
            {errors.email && <span className="auth-error">{errors.email}</span>}

            <div className="auth-form-group">
              <input
                type="text"
                name="contact"
                placeholder="Contact Number"
                value={formData.contact}
                onChange={handleChange}
                className="auth-input"
              />
            </div>
            {errors.contact && <span className="auth-error">{errors.contact}</span>}

            <div className="auth-form-group">
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                className="auth-input"
              />
            </div>
            {formData.password && !errors.password && (
              <div className={`password-strength ${getPasswordStrength(formData.password).class}`}>
                <span>{getPasswordStrength(formData.password).text}</span>
                <div className="password-strength-bar">
                  <div className="password-strength-fill"></div>
                </div>
              </div>
            )}
            {errors.password && <span className="auth-error">{errors.password}</span>}

            <div className="auth-form-group">
              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="auth-input"
              />
            </div>
            {errors.confirmPassword && <span className="auth-error">{errors.confirmPassword}</span>}

            <div className="auth-btn-row">
              <button type="button" onClick={() => setStep(1)} className="auth-btn auth-btn-secondary">
                Back
              </button>
              <button type="submit" className="auth-btn auth-btn-primary">
                Send OTP
              </button>
            </div>
          </form>
        )}

        {/* Step 3: OTP Verification */}
        {step === 3 && (
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
                maxLength="6"
                className="auth-input auth-input-otp"
              />
            </div>
            {errors.otp && <span className="auth-error">{errors.otp}</span>}

            <div className="auth-btn-row">
              <button type="button" onClick={() => setStep(2)} className="auth-btn auth-btn-secondary">
                Back
              </button>
              <button type="submit" className="auth-btn auth-btn-primary">
                Verify & Register
              </button>
            </div>
          </form>
        )}

        <p className="auth-footer-text">
          Already have an account?{" "}
          <Link to="/login" className="auth-link">Login here</Link>
        </p>
      </div>
    </div>
  );
}