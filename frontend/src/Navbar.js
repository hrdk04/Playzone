import { NavLink } from "react-router-dom"
import theme from "./theme"
import { useNavigate } from "react-router-dom"; 
import { useState, useEffect } from "react";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkLogin = () => {
      const user = JSON.parse(localStorage.getItem("user"));
      setIsLoggedIn(!!user);
      
      setUsername(user?.fullName || "");
      setIsAdmin(user?.role === "admin");
      const admin = JSON.parse(localStorage.getItem("admin"));
      if (admin) {
        setIsLoggedIn(true);
        setUsername(admin?.name || "");
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
    closeMenu();
    navigate("/");
  };

  return (
    <>
      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          padding-top: 70px;
        }
        
        .navbar {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          z-index: 9999;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px 40px;
          background: ${theme.gradients.navbar};
          animation: gamerGlow 4s ease-in-out infinite;
          font-family: ${theme.fonts.primary};
          min-height: 70px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
        }

        @keyframes gamerGlow {
          0% {
            background: ${theme.gradients.navbar};
            box-shadow: 0 2px 10px rgba(0, 255, 204, 0.1);
          }
          50% {
            background: ${theme.gradients.navbarAlt1};
            box-shadow: 0 2px 15px rgba(0, 255, 204, 0.2);
          }
          100% {
            background: ${theme.gradients.navbarAlt2};
            box-shadow: 0 2px 10px rgba(0, 255, 204, 0.1);
          }
        }

        .navbar-left {
          display: flex;
          align-items: center;
          gap: 20px;
          flex: 1;
        }

        .navbar-logo {
          color: ${theme.colors.white};
          font-size: 28px;
          text-decoration: none;
          font-weight: bold;
          letter-spacing: 1.5px;
          text-shadow: 0 0 10px rgba(0, 255, 204, 0.5);
          transition: all 0.3s ease;
        }

        .navbar-logo:hover {
          text-shadow: 0 0 20px rgba(0, 255, 204, 0.8);
          transform: scale(1.05);
        }

        .welcome-text {
          font-size: 15px;
          color: ${theme.colors.white};
          font-weight: 500;
          background: rgba(255, 255, 255, 0.1);
          padding: 8px 16px;
          border-radius: 20px;
          white-space: nowrap;
        }

        .navbar-links {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .navbar-links a {
          color: ${theme.colors.white};
          text-decoration: none;
          padding: 10px 20px;
          border-radius: 8px;
          transition: all 0.3s ease;
          font-weight: 500;
          font-size: 16px;
        }

        .navbar-links a:hover {
          background: rgba(0, 255, 204, 0.2);
          transform: translateY(-2px);
        }

        .navbar-links a.active-link {
          background: rgba(0, 255, 204, 0.3);
          color: #00ffcc;
        }

        .logout-btn {
          padding: 10px 24px;
          background: ${theme.gradients.primaryButton};
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
          font-weight: 600;
          font-size: 15px;
          box-shadow: 0 4px 15px rgba(255, 0, 100, 0.3);
        }

        .logout-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(255, 0, 100, 0.5);
        }

        .menu-icon {
          display: none;
          cursor: pointer;
          font-size: 30px;
          color: ${theme.colors.white};
          transition: all 0.3s ease;
        }

        .menu-icon:hover {
          color: #00ffcc;
          transform: rotate(90deg);
        }

        .menu-overlay {
          display: none;
        }

        /* Tablet & Mobile */
        @media screen and (max-width: 968px) {
          .navbar {
            padding: 12px 25px;
          }

          .navbar-logo {
            font-size: 24px;
          }

          .welcome-text {
            font-size: 13px;
            padding: 6px 12px;
          }
        }

        @media screen and (max-width: 768px) {
          body {
            padding-top: 60px;
          }

          .navbar {
            padding: 10px 20px;
            min-height: 60px;
          }

          .navbar-logo {
            font-size: 22px;
          }

          .welcome-text {
            display: none;
          }

          .menu-icon {
            display: block;
          }

          .menu-overlay {
            position: fixed;
            top: 60px;
            left: 0;
            width: 100%;
            height: calc(100vh - 60px);
            background: rgba(0, 0, 0, 0.7);
            z-index: 9998;
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s ease;
          }

          .menu-overlay.active {
            display: block;
            opacity: 1;
            visibility: visible;
          }

          .navbar-links {
            position: fixed;
            top: 60px;
            right: -100%;
            width: 300px;
            max-width: 85vw;
            height: calc(100vh - 60px);
            background: linear-gradient(180deg, #0a0a1a 0%, #1a1a3a 100%);
            flex-direction: column;
            padding: 30px 0;
            gap: 0;
            overflow-y: auto;
            transition: right 0.3s ease;
            z-index: 9999;
          }

          .navbar-links.active {
            right: 0;
          }

          .mobile-header {
            padding: 0 20px 20px;
            margin-bottom: 10px;
          }

          .mobile-header .welcome-text {
            display: block;
            width: 100%;
            text-align: center;
            margin-bottom: 15px;
            background: rgba(0, 255, 204, 0.15);
            font-size: 15px;
            padding: 12px;
          }

          .close-btn {
            position: absolute;
            top: 15px;
            right: 20px;
            background: none;
            border: none;
            color: white;
            font-size: 30px;
            cursor: pointer;
            padding: 0;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease;
          }

          .close-btn:hover {
            color: #00ffcc;
            transform: rotate(90deg);
          }

          .navbar-links a {
            width: 100%;
            padding: 18px 25px;
            text-align: left;
            border-radius: 0;
            font-size: 17px;
          }

          .navbar-links a:hover {
            background: rgba(0, 255, 204, 0.15);
            transform: translateX(5px);
          }

          .navbar-links a.active-link {
            background: rgba(0, 255, 204, 0.25);
          }

          .logout-btn {
            width: calc(100% - 40px);
            margin: 20px 20px 0;
            padding: 15px;
            font-size: 16px;
          }
        }

        @media screen and (max-width: 480px) {
          .navbar-logo {
            font-size: 20px;
          }

          .navbar-links {
            width: 100%;
            max-width: 100vw;
          }
        }
      `}</style>

      {/* Mobile overlay */}
      <div 
        className={`menu-overlay ${isMenuOpen ? 'active' : ''}`}
        onClick={closeMenu}
      />

      <nav className="navbar">
        <div className="navbar-left">
          <NavLink 
            to={isLoggedIn ? (isAdmin ? "/admin-dashboard" : "/dashboard") : "/"} 
            className="navbar-logo"
            onClick={closeMenu}
          >
            🎮 Playzone
          </NavLink>
          
          {isLoggedIn && (
            <span className="welcome-text" style={{border:'1px solid transparent', margin: '0 auto'}}>
              Welcome, {username}
            </span>
          )}
        </div>

        <div className={`navbar-links ${isMenuOpen ? 'active' : ''}`}>
          {/* Mobile close button */}
          {/* {isMenuOpen && (
            <button className="close-btn" onClick={closeMenu}>
              ✕
            </button>
          )} */}

          {/* Mobile header with welcome text */}
          {isLoggedIn && isMenuOpen && (
            <div className="mobile-header">
              <span className="welcome-text">
                👋 Welcome, {username}
              </span>
            </div>
          )}

          {!isLoggedIn ? (
            <>
              <NavLink 
                to="/" 
                className={({ isActive }) => isActive ? "active-link" : ""}
                onClick={closeMenu}
              >
                Home
              </NavLink>
              <NavLink 
                to="/about" 
                className={({ isActive }) => isActive ? "active-link" : ""}
                onClick={closeMenu}
              >
                About
              </NavLink>
              <NavLink 
                to="/tournaments" 
                className={({ isActive }) => isActive ? "active-link" : ""}
                onClick={closeMenu}
              >
                Tournaments
              </NavLink>
              <NavLink 
                to="/login" 
                className={({ isActive }) => isActive ? "active-link" : ""}
                onClick={closeMenu}
              >
                Login
              </NavLink>
              <NavLink 
                to="/signup" 
                className={({ isActive }) => isActive ? "active-link" : ""}
                onClick={closeMenu}
              >
                Signup
              </NavLink>
            </>
          ) : (
            <button 
              onClick={handleLogout}
              className="logout-btn"
            >
              Logout
            </button>
          )}
        </div>

        <div className="menu-icon" onClick={toggleMenu}>
          {isMenuOpen ? '✕' : '☰'}
        </div>
      </nav>
    </>
  )
}