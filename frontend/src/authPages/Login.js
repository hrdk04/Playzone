// src/auth/Login.js
import React, { useState } from "react";
import theme from "../theme";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast"; // ✅ ADDED

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
      // ✅ Admin login
      if (formData.emailOrUsername.endsWith("_admin")) {
        const response = await axios.post("http://localhost:5000/adminLogin", formData);

        setTimeout(() => {
          console.log("Admin Login Success:", response.data);
          
          // Clean the username by removing "_admin" suffix
          const cleanUsername = formData.emailOrUsername.replace(/_admin$/, "");

          // ✅ Store ONLY the clean username string
          localStorage.setItem("adminName", cleanUsername);
          
          // ✅ Store admin object with clean username
          const adminData = {
            username: cleanUsername,
            // Add other admin data from response if available
            ...(response.data.admin || {})
          };
          localStorage.setItem("admin", JSON.stringify(adminData));

          console.log("✅ Stored admin data:", adminData); // Debug log

          window.dispatchEvent(new Event("storage"));
          toast.success(`Logged in as Admin: ${cleanUsername}`); // ✅ CHANGED

          navigate("/admin");
        }, 1000);
      }
      // ✅ Regular user login
      else {
        const response = await axios.post("http://localhost:5000/login", formData);

        setTimeout(() => {
          console.log("User Login Success:", response.data);

          // ✅ Store the actual user object (includes _id)
          localStorage.setItem("user", JSON.stringify(response.data.user));
          localStorage.setItem("userName", response.data.user.username);
          
          // Store JWT token for chat authentication
          if (response.data.token) {
            localStorage.setItem("token", response.data.token);
          }

          window.dispatchEvent(new Event("storage"));
          toast.success(`Logged in as ${response.data.user.username}`); // ✅ CHANGED
          navigate("/DashBoard");
        }, 1000);
      }
    } catch (error) {
      console.error("Login Error:", error);
      toast.error(error.response?.data?.message || "Login failed. Please check your credentials."); // ✅ CHANGED
    } finally {
      setLoading(false);
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
        backgroundPosition:'center',
        backgroundAttachment:'fixed',
        color: theme.colors.white,
        fontFamily: theme.fonts.primary,
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        padding: "50px 20px",
      }}
    >
      {/* ✅ ADDED: Toaster component */}
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
          Login
        </h1>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="emailOrUsername"
            placeholder="Email or Username"
            value={formData.emailOrUsername}
            onChange={handleChange}
            required
            style={inputStyle}
          />

          <input
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
            style={inputStyle}
          />

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "20px",
              marginTop: "10px",
            }}
          >
            <input
              type="checkbox"
              checked={showPassword}
              onChange={() => setShowPassword(!showPassword)}
              style={{
                width: "16px",
                height: "16px",
                cursor: "pointer",
              }}
            />
            <span
              style={{
                color: theme.colors.white,
                fontSize: "0.9rem",
                cursor: "pointer",
                userSelect: "none",
              }}
              onClick={() => setShowPassword(!showPassword)}
            >
              Show Password?
            </span>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: theme.spacing.buttonPadding,
              background: theme.gradients.primaryButton,
              color: theme.colors.white,
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              boxShadow: theme.shadows.buttonShadow,
              transition: theme.animations.transition,
              fontFamily: theme.fonts.primary,
            }}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p
          style={{
            marginTop: "15px",
            fontSize: "0.9rem",
            textAlign: "center",
            color: theme.colors.lightGray,
          }}
        >
          Don't have an account?{" "}
          <a href="/signup" style={{ color: theme.colors.secondary }}>
            Sign up here
          </a>
        </p>
          <br/>
        <p
          style={{
            fontSize: "0.9rem",
            textAlign: "center",
            color: theme.colors.lightGray,
          }}
        >
          <a href="/forget-password" style={{ color: theme.colors.secondary }}>
            Forgot your password?
          </a>
        </p>
      </div>
    </div>
  );
}