import { NavLink, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import "./Navbar.css";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  // Handle home logo click - scroll to top if already on home page
  const handleHomeClick = (e) => {
    e.preventDefault();
    const targetPath = isLoggedIn ? (isAdmin ? "/admin" : "/DashBoard") : "/";
    
    if (window.location.pathname === targetPath) {
      // Already on target page, scroll to top smoothly
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'smooth'
      });
    } else {
      // Navigate normally to target page
      navigate(targetPath);
    }
    
    setIsMenuOpen(false);
  };

  // Handle Home navigation link click
  const handleHomeNavClick = (e) => {
    if (window.location.pathname === "/") {
      e.preventDefault();
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'smooth'
      });
    }
    setIsMenuOpen(false);
  };

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  useEffect(() => {
    const checkLogin = () => {
      const user = JSON.parse(localStorage.getItem("user"));
      setIsLoggedIn(!!user);
      setUsername(user?.fullName || "");
      setIsAdmin(user?.role === "admin");

      const admin = JSON.parse(localStorage.getItem("admin"));
      if (admin) {
        setIsLoggedIn(true);
        setUsername(admin?.name || localStorage.getItem("adminName") || "Admin");
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    };

    checkLogin();
    window.addEventListener("storage", checkLogin);
    return () => window.removeEventListener("storage", checkLogin);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("admin");
    localStorage.removeItem("userName");
    localStorage.removeItem("adminName");
    localStorage.removeItem("token");
    localStorage.removeItem("chatToken");
    window.dispatchEvent(new Event("storage"));
    setIsLoggedIn(false);
    setUsername("");
    navigate("/");
  };

  return (
    <nav className="navbar">
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <a href="/" className="navbar-logo" onClick={handleHomeClick}>
          Playzone
        </a>
        
        {isLoggedIn && (
          <span className="navbar-user-welcome">
            Welcome, {username}
          </span>
        )}
      </div>

      <div className={`navbar-links ${isMenuOpen ? 'active' : ''}`}>
        {!isLoggedIn ? (
          <>
            <NavLink to="/" className={({ isActive }) => isActive ? "active-link" : ""} onClick={handleHomeNavClick}>Home</NavLink>
            <NavLink to="/about" className={({ isActive }) => isActive ? "active-link" : ""} onClick={() => setIsMenuOpen(false)}>About</NavLink>
            <NavLink to="/tournaments" className={({ isActive }) => isActive ? "active-link" : ""} onClick={() => setIsMenuOpen(false)}>Tournaments</NavLink>
            <NavLink to="/login" className={({ isActive }) => isActive ? "active-link" : ""} onClick={() => setIsMenuOpen(false)}>Login</NavLink>
            <NavLink to="/signup" className={({ isActive }) => isActive ? "active-link" : ""} onClick={() => setIsMenuOpen(false)}>Signup</NavLink>
          </>
        ) : (
          <button onClick={() => { handleLogout(); setIsMenuOpen(false); }} className="navbar-logout-btn">
            Logout
          </button>
        )}
      </div>

      {!isLoggedIn && (
        <div className="menu-icon" onClick={toggleMenu}>
          ☰
        </div>
      )}
    </nav>
  );
}