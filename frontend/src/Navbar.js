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

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkLogin = () => {
      const user = JSON.parse(localStorage.getItem("user"));
      // console.log("Navigation: USer: ",user)
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

    checkLogin(); // Initial check
    window.addEventListener("storage", checkLogin);
    return () => window.removeEventListener("storage", checkLogin);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("admin");
    localStorage.removeItem("userName");
    localStorage.removeItem("adminName");
    window.dispatchEvent(new Event("storage")); // Notify other tabs
    setIsLoggedIn(false);
    setUsername("");
    navigate("/"); // redirect home
  };


  return (
    <>
      <style>{`
        /* Add spacing for the fixed navbar */
        body {
          padding-top: 60px; /* Adjust this value based on your navbar height */
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
          padding: ${theme.spacing.navbarPadding};
          background: ${theme.gradients.navbar};
          animation: ${theme.animations.gamerGlow};
          border-bottom: ${theme.borders.navbarBottom};
          font-family: ${theme.fonts.primary};
          height: 60px; /* Set a fixed height */
          box-sizing: border-box;
        }


        @keyframes gamerGlow {
          0% {
            background: ${theme.gradients.navbar};
            box-shadow: ${theme.shadows.navbarGlow1};
          }
          50% {
            background: ${theme.gradients.navbarAlt1};
            box-shadow: ${theme.shadows.navbarGlow2};
          }
          100% {
            background: ${theme.gradients.navbarAlt2};
            box-shadow: ${theme.shadows.navbarGlow3};
          }
        }

        .navbar-logo {
          color: ${theme.colors.white};
          font-size: ${theme.sizes.logoFontSize};
          text-decoration: none;
          font-weight: bold;
        }

        .navbar-links {
          display: flex;
          gap: 15px;
        }

        .navbar-links a {
          color: ${theme.colors.white};
          text-decoration: none;
          padding: ${theme.spacing.linkPadding};
          border-radius: 4px;
          transition: ${theme.animations.transition};
        }

        .navbar-links a:hover {
          background-color: ${theme.colors.hoverGreen};
          animation: ${theme.animations.textGlow};
          border-bottom: ${theme.borders.activeLink};
        }

        .menu-icon {
          display: none;
          cursor: pointer;
          font-size: 24px;
          color: ${theme.colors.white};
        }

        /* Mobile responsiveness */
        @media screen and (max-width: 768px) {
          .menu-icon {
            display: block;
          }

          .navbar-links {
            display: none;
            position: absolute;
            top: 60px;
            right: 0;
            width: 50%;
            background: ${theme.gradients.navbar};
            flex-direction: column;
            padding: 20px 0;
            text-align: center;
            gap: 20px;
          }

          .navbar-links.active {
            display: flex;
            background: ${theme.gradients.navbar};
            flex-direction: column;
          }

          .navbar-links a {
            padding: 10px 20px;
            width: 100%;
            box-sizing: border-box;
          }
        }
          
          
        .active-link {
            background-color: ${theme.colors.activeBg};
            color: ${theme.colors.white} !important;
            text-shadow: ${theme.shadows.activeTextGlow};
            border-bottom: ${theme.borders.activeLink};
            animation: ${theme.animations.textGlow};
        }
        @keyframes TextGlow {
          0% {
            background: ${theme.gradients.navbar};
            
          }
          50% {
            background: ${theme.gradients.navbarAlt1};
            
          }
          100% {
            background: ${theme.gradients.navbarAlt2};
            
          }
        }
            
      `}</style>

      <nav className="navbar">
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <NavLink to={isLoggedIn ? (isAdmin ? "/admin-dashboard" : "/dashboard") : "/"} className="navbar-logo">
            Playzone
          </NavLink>
          
        </div>
        {isLoggedIn && (
            <span style={{
              marginLeft: "15px",
              fontSize: "18px",
              color: theme.colors.white,
              fontWeight: "500",
              textShadow: theme.shadows.activeTextGlow,
              background: 'rgba(255,255,255,0.1)',
              padding: '4px 12px',
              borderRadius: '15px'
              
            }}>
              Welcome, {username}
            </span>
          )}
        <div className={`navbar-links ${isMenuOpen ? 'active' : ''}`}>
          {!isLoggedIn ? (
            <>
              <NavLink to="/" className={({ isActive }) => isActive ? "active-link" : ""}>
                Home
              </NavLink>
              <NavLink to="/about" className={({ isActive }) => (isActive ? "active-link" : "")}>
                About
              </NavLink>
              <NavLink to="/tournaments" className={({ isActive }) => (isActive ? "active-link" : "")}>
                Tournaments
              </NavLink>
              <NavLink to="/login" className={({ isActive }) => (isActive ? "active-link" : "")}>
                Login
              </NavLink>
              <NavLink to="/signup" className={({ isActive }) => (isActive ? "active-link" : "")}>
                Signup
              </NavLink>
            </>
          ) : (
            <button 
              onClick={handleLogout}
              style={{
                padding: '8px 16px',
                background: theme.gradients.primaryButton,
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                marginLeft: 'auto',
                boxShadow: theme.shadows.buttonShadow
              }}
            >
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
    </>
  )
}
