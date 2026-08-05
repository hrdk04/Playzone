import { Navigate, Route, Routes } from "react-router-dom";
import { useState, useEffect } from "react";
import AdminNavbar from "./components/AdminNavbar";
import AdminDashboard from "./AdminDashboard";
import AdminTournaments from "./ManageTournaments";
import AdminPlayers from "./ManagePlayers";
import adminTheme from "./adminTheme";
import AdminSidebar from "./components/AdminSidebar";
import TournamentStart from "./TournamentStart";
import TournamentForm from "./TournamentForm";
import TournamentResults from "./TournamentResults";
import AdminProfile from "./components/AdminNotificationSettings";
import { SWRConfig } from "swr";
import axios from "axios";
import API_BASE_URL from "../config/apiConfig";

const AdminLayout = () => {
  const isAdminLoggedIn = localStorage.getItem("admin");

  // Resolve admin username string from stored `adminName` (preferred) or `admin` object
  const rawAdmin = localStorage.getItem("admin");
  let adminUsername = localStorage.getItem("adminName") || null;
  if (!adminUsername) {
    try {
      if (rawAdmin) {
        const parsed = JSON.parse(rawAdmin);
        if (parsed?.username && !parsed.username.includes("@")) adminUsername = parsed.username
        else if (typeof rawAdmin === "string" && !rawAdmin.includes("@")) adminUsername = rawAdmin
      }
    } catch (e) {
      if (rawAdmin && !rawAdmin.includes("@")) adminUsername = rawAdmin
    }
  }
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [screenWidth, setScreenWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setScreenWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobile = screenWidth <= 768;
  const isTablet = screenWidth > 768 && screenWidth <= 1024;
  const isLaptop = screenWidth > 1024 && screenWidth <= 1440;
  const sidebarWidth = isTablet ? 200 : 240;
  const mainPadding = isMobile ? "0.75rem" : isTablet ? "1.25rem" : isLaptop ? "1.5rem" : "2rem";
  const mainPaddingTop = isMobile ? "calc(64px + 0.75rem)" : "calc(64px + 1.5rem)";

  if (!isAdminLoggedIn) return <Navigate to="/login" />;

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        overflowX: "hidden", // prevent horizontal scroll
        background: adminTheme.pageBg,
        color: adminTheme.textPrimary,
        fontFamily: "'Rajdhani', 'Poppins', sans-serif",
      }}
    >
      {/* Sidebar */}
      <AdminSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isMobile={isMobile || isTablet}
      />

      {/* Overlay for mobile/tablet */}
      {(isMobile || isTablet) && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 998,
            background: "rgba(0,0,0,0.35)",
            backdropFilter: "blur(3px)",
          }}
        />
      )}

      {/* Main Content */}
      <div
        style={{
          flex: 1, // takes remaining space automatically
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
          transition: "margin-left 0.3s ease",
          marginLeft:
            !isMobile && !isTablet && sidebarOpen ? sidebarWidth : 0,
        }}
      >
        {/* Navbar */}
        <AdminNavbar
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          isMobile={isMobile || isTablet}
        />

        <main
          style={{
            flex: 1,
            padding: mainPadding,
            paddingTop: mainPaddingTop,
            width: "100%",
            maxWidth: "100%", // prevent overflow
            boxSizing: "border-box",
            background:
              "radial-gradient(circle at top right, rgba(0, 212, 170, 0.08), transparent 40%), radial-gradient(circle at bottom left, rgba(255, 45, 123, 0.08), transparent 45%), var(--bg-primary)",
            boxShadow: "inset 0 0 30px rgba(0,0,0,0.12)",
            borderTop: `1px solid ${adminTheme.border}`,
            borderLeft: `1px solid ${adminTheme.borderLight}`,
            borderRight: "none",
          }}
        >
          <SWRConfig
            value={{
              fetcher: (url) =>
                axios
                  .get(`${API_BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`)
                  .then((r) => r.data),
              dedupingInterval: 3000,
              revalidateOnFocus: false,
              shouldRetryOnError: false,
            }}
          >
            <Routes>
              <Route index element={<AdminDashboard isMobile={isMobile || isTablet} />} />
              <Route path="tournaments" element={<AdminTournaments isMobile={isMobile || isTablet} />} />
              <Route path="tournaments/new" element={<TournamentForm mode="create" isMobile={isMobile || isTablet} />} />
              <Route path="tournaments/:id/update" element={<TournamentForm mode="update" isMobile={isMobile || isTablet} />} />
              <Route path="tournaments/:id/start" element={<TournamentStart isMobile={isMobile || isTablet} />} />
              <Route path="tournaments/:id/results" element={<TournamentResults isMobile={isMobile || isTablet} />} />
              <Route path="players" element={<AdminPlayers isMobile={isMobile || isTablet} />} />
              <Route path="notifications" element={<AdminProfile username={adminUsername} isMobile={isMobile || isTablet} />} />
            </Routes>
          </SWRConfig>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
