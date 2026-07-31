import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import toast from 'react-hot-toast';
import "./Auth.css";

export default function Login() {
  const [formData, setFormData] = useState({
    emailOrUsername: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (formData.emailOrUsername.endsWith("_admin")) {
        const response = await axios.post("http://localhost:5000/adminLogin", formData);
        const cleanUsername = formData.emailOrUsername.replace(/_admin$/, "");
        localStorage.setItem(
          "admin",
          JSON.stringify(response.data.admin || { username: cleanUsername })
        );
        localStorage.setItem("adminName", cleanUsername);
        window.dispatchEvent(new Event("storage"));
        toast.success('Welcome back, Admin');
        setTimeout(() => navigate("/admin"), 1000);
      } else {
        const response = await axios.post("http://localhost:5000/login", formData);
        localStorage.setItem("user", JSON.stringify(response.data.user));
        localStorage.setItem("userName", response.data.user.username);
        if (response.data.token) {
          localStorage.setItem("token", response.data.token);
        }
        window.dispatchEvent(new Event("storage"));
        toast.success('Login successful');
        setTimeout(() => navigate("/dashboard"), 1000);
      }
    } catch (error) {
      console.error("Login Error:", error);
      toast.error(error.response?.data?.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <h1 className="auth-title">Sign In</h1>
        <p className="auth-subtitle">Access your Playzone account</p>

        <form onSubmit={handleSubmit}>
          <div className="auth-form-group">
            <input
              type="text"
              name="emailOrUsername"
              placeholder="Email or Username"
              value={formData.emailOrUsername}
              onChange={handleChange}
              required
              className="auth-input"
              autoComplete="username"
            />
          </div>

          <div className="auth-form-group">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
              className="auth-input"
              autoComplete="current-password"
            />
          </div>

          <div className="auth-checkbox-group">
            <input
              type="checkbox"
              id="showPassword"
              checked={showPassword}
              onChange={() => setShowPassword(!showPassword)}
            />
            <label htmlFor="showPassword">Show password</label>
          </div>

          <button type="submit" disabled={loading} className="auth-btn">
            {loading ? (
              <>
                <span className="auth-loading"></span>
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <p className="auth-footer-text">
          New to Playzone?{" "}
          <Link to="/signup" className="auth-link">Create account</Link>
        </p>

        <p className="auth-footer-text">
          <Link to="/forget-password" className="auth-link">Forgot password?</Link>
        </p>
      </div>
    </div>
  );
}
