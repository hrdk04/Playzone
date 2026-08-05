import { Link, useLocation } from "react-router-dom";
import adminTheme from "../adminTheme";

const linkStyle = (active, isMobile) => ({
  display: "block",
  padding: isMobile ? "0.5rem 0.75rem" : "0.75rem 1rem",
  margin: "0.25rem 0",
  borderRadius: "8px",
  color: active ? adminTheme.accent : adminTheme.textPrimary,
  textDecoration: "none",
  background: active ? "rgba(0, 212, 170, 0.16)" : "transparent",
  borderLeft: active
    ? `4px solid ${adminTheme.accent}`
    : `4px solid transparent`,
  fontSize: isMobile ? "0.9rem" : "1rem",
  fontWeight: active ? "600" : "400",
  letterSpacing: "0.3px",
  transition: "all 0.25s ease-in-out",
  boxShadow: active ? adminTheme.cardShadow : "none",
  cursor: "pointer",
});

const AdminSidebar = ({ isOpen, onClose, isMobile }) => {
  const location = useLocation();

  const sidebarStyle = {
    position: "fixed",
    top: "64px", // navbar height
    left: isMobile ? (isOpen ? "0" : "-240px") : "0",
    width: "240px",
    height: "calc(100vh - 64px)",
    background: "linear-gradient(180deg, var(--bg-secondary), var(--bg-tertiary))",
    borderRight: `1px solid ${adminTheme.borderLight}`,
    boxShadow: adminTheme.cardShadow,
    padding: isMobile ? "0.75rem" : "1rem",
    overflowY: "auto",
    zIndex: 999,
    transition: "left 0.3s ease",
    backdropFilter: "blur(6px)",
  };

  return (
    <aside style={sidebarStyle} aria-label="Admin navigation">
      <nav>
        {/* DASHBOARD */}
        <Link
          to="/admin"
          style={linkStyle(location.pathname === "/admin", isMobile)}
          onClick={() => isMobile && onClose()}
        >
          📊 Dashboard
        </Link>

        {/* TOURNAMENTS */}
        <Link
          to="/admin/tournaments"
          style={linkStyle(
            location.pathname.startsWith("/admin/tournaments") &&
              !location.pathname.includes("/new") &&
              !location.pathname.includes("/results"),
            isMobile
          )}
          onClick={() => isMobile && onClose()}
        >
          🏆 Tournaments
        </Link>

        {/* ADD TOURNAMENT */}
        <Link
          to="/admin/tournaments/new"
          style={linkStyle(
            location.pathname === "/admin/tournaments/new",
            isMobile
          )}
          onClick={() => isMobile && onClose()}
        >
          ➕ Add Tournament
        </Link>

        {/* PLAYERS */}
        <Link
          to="/admin/players"
          style={linkStyle(
            location.pathname.startsWith("/admin/players"),
            isMobile
          )}
          onClick={() => isMobile && onClose()}
        >
          👥 Players
        </Link>

        {/* SETTINGS */}
        <Link
          to="/admin/notifications"
          style={linkStyle(
            location.pathname === "/admin/notifications",
            isMobile
          )}
          onClick={() => isMobile && onClose()}
        >
          🔔 Settings
        </Link>
      </nav>
    </aside>
  );
};

export default AdminSidebar;
