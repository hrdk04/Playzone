"use client"
import { useNavigate } from "react-router-dom"
import theme from "../../theme"

const AdminNavbar = ({ onMenuClick, isMobile }) => {
  const navigate = useNavigate()

  const handleLogout = () => {
    localStorage.removeItem("admin")
    localStorage.removeItem("adminName")
    window.dispatchEvent(new Event("storage"))
    navigate("/login")
  }

  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        background: theme.gradients.navbar,
        height: "64px",
        padding: isMobile ? "0 0.5rem" : "0 1rem",
        color: theme.colors.white,
        borderLeft: isMobile ? `5px solid ${theme.colors.primary}` : `10px solid ${theme.colors.primary}`,
        borderBottom: `1px solid ${theme.colors.primary}`,
        borderRight: isMobile ? `5px solid ${theme.colors.primary}` : `10px solid ${theme.colors.primary}`,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        boxShadow: theme.shadows.navbarShadow,
      }}
    >
      <div style={{ 
        display: "flex", 
        alignItems: "center", 
        gap: isMobile ? "0.5rem" : "1rem" 
      }}>
        {/* Mobile Menu Button */}
        {isMobile && (
          <button
            onClick={onMenuClick}
            style={{
              background: "transparent",
              border: "none",
              color: theme.colors.white,
              cursor: "pointer",
              padding: "0.5rem",
              fontSize: "1.2rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            aria-label="Toggle Menu"
          >
            ☰
          </button>
        )}
        
        <div style={{ 
          fontSize: isMobile ? "1.2rem" : "1.5rem", 
          fontWeight: "bold" 
        }}>
          {isMobile ? "Admin" : "Admin Panel"}
        </div>
      </div>
      
      <div>
        <button
          onClick={handleLogout}
          style={{
            background: "transparent",
            border: `1px solid ${theme.colors.white}`,
            borderRadius: "8px",
            padding: isMobile ? "0.3rem 0.6rem" : "0.4rem 0.8rem",
            color: theme.colors.white,
            cursor: "pointer",
            fontSize: isMobile ? "0.9rem" : "1rem",
          }}
          aria-label="Logout"
        >
          {isMobile ? "Exit" : "Logout"}
        </button>
      </div>
    </nav>
  )
}

export default AdminNavbar
