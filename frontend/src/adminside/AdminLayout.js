import { Navigate, Route, Routes } from "react-router-dom";
import { useState, useEffect } from "react";
import AdminNavbar from "./components/AdminNavbar";
import AdminDashboard from "./AdminDashboard";
import AdminTournaments from "./ManageTournaments";
import AdminPlayers from "./ManagePlayers";
import theme from "../theme";
import AdminSidebar from "./components/AdminSidebar";
import TournamentStart from "./TournamentStart";
import TournamentForm from "./TournamentForm";
import TournamentResults from "./TournamentResults";
import AdminProfile from "./components/AdminNotificationSettings";
import { SWRConfig } from "swr";
import axios from "axios";

const AdminLayout = () => {
  const isAdminLoggedIn = localStorage.getItem("admin");

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [screenWidth, setScreenWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setScreenWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobile = screenWidth <= 768;
  const isTablet = screenWidth > 768 && screenWidth <= 1024;
  const sidebarWidth = 240;

  if (!isAdminLoggedIn) return <Navigate to="/login" />;

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        overflowX: "hidden", // prevent horizontal scroll
        background: theme.gradients.homeBackground,
        color: theme.colors.white,
        fontFamily: theme.fonts.primary,
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
            background: "rgba(0,0,0,0.5)",
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
            padding: isMobile ? "1rem" : isTablet ? "1.5rem" : "2rem",
            paddingTop: isMobile ? "calc(64px + 1rem)" : "calc(64px + 2rem)",
            width: "100%",
            maxWidth: "100%", // prevent overflow
            boxSizing: "border-box",
            background:
              "radial-gradient(circle at 50% 0%, rgba(13,13,13,0.95), rgba(7,7,7,0.98))",
            boxShadow: "inset 0 0 40px rgba(255,0,128,0.1)",
            borderTop: "1px solid rgba(255,0,128,0.1)",
            borderLeft: "1px solid rgba(0,255,224,0.05)",
            borderRight: "1px solid rgba(255,0,255,0.05)",
          }}
        >
          <SWRConfig
            value={{
              fetcher: (url) =>
                axios
                  .get(`http://localhost:5000${url.startsWith("/") ? "" : "/"}${url}`)
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
              <Route path="notifications" element={<AdminProfile username={localStorage.getItem("admin")} isMobile={isMobile || isTablet} />} />
            </Routes>
          </SWRConfig>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
