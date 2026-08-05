import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "./UserSideNav.css";

const UserSideNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('playzone-theme') || 'dark';
  });

  // Get logged in user from localStorage
  const getUserName = () => {
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        return user.name || user.username || 'Player';
      }
    } catch (e) {
      console.error('Error parsing user data');
    }
    return 'Player';
  };

  const userName = getUserName();

  // Theme toggle handler
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('playzone-theme', newTheme);
  };

   const links = [
     { path: "/dashboard", label: "Dashboard" },
     { path: "/tournaments", label: "Tournaments" },
     { path: "/history", label: "History" },
     { path: "/payments", label: "Payments" },
     { path: "/chat", label: "💬 Chat" },
     { path: "/profile", label: "Profile" },
   ];

  const toggleMenu = () => setIsOpen(!isOpen);

  // Secure logout handler for mobile
  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('admin');
    localStorage.removeItem('userName');
    localStorage.removeItem('adminName');
    localStorage.removeItem('token');
    localStorage.removeItem('chatToken');
    // Dispatch storage event so Navbar and other components update their login state
    window.dispatchEvent(new Event('storage'));
    navigate('/');
  };

  return (
    <div className="user-side-nav-wrapper">
      <nav className="user-side-nav">
        
        {/* Hamburger Header - Only visible on Mobile/Tablet */}
        <div className="mobile-nav-header">
           <button className="nav-theme-toggle" onClick={toggleTheme} aria-label="Toggle Theme">
             {theme === 'dark' ? '☀' : '☾'}
           </button>
           <span className="mobile-nav-title">{userName}</span>
          <button className={`hamburger-btn ${isOpen ? "open" : ""}`} onClick={toggleMenu}>
            <span className="bar"></span>
            <span className="bar"></span>
            <span className="bar"></span>
          </button>
        </div>

        {/* Navigation Links */}
        <div className={`nav-links ${isOpen ? "open" : ""}`}>
          {links.map((link) => {
            const isActive = location.pathname.startsWith(link.path);
            
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`nav-item ${isActive ? "active-link" : ""}`}
                onClick={() => setIsOpen(false)} // Auto-close menu when a link is clicked
              >
                {link.label}
              </Link>
            );
          })}
          
          {/* Logout Button - Hidden on desktop, visible in mobile dropdown */}
           <button className="nav-item mobile-logout-btn" onClick={handleLogout}>
             Logout
           </button>
        </div>
        
      </nav>
    </div>
  );
};

export default UserSideNav;