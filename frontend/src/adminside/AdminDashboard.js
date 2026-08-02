"use client";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import theme from "../theme";
import toast, { Toaster } from "react-hot-toast";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Legend,
} from "recharts";
import useSWR from "swr";
import axios from "axios";
import AdminBroadcasting from "./components/AdminBroadcasting";
import API_BASE_URL from "../config/apiConfig";

const fetcher = (url) => axios.get(url).then((r) => r.data);

export default function AdminDashboard({ isMobile = false }) {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ players: 0, tournaments: 0, tournamentGrowth: [] });
  const [topGames, setTopGames] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [adminProfit, setAdminProfit] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [poolPrize, setPoolPrize] = useState(0);
  const [upcomingTournaments, setUpcomingTournaments] = useState(0);
  const [aiTips, setAiTips] = useState([]);
  const [liveNotifications, setLiveNotifications] = useState([]);
  const [selectedSuggestions, setSelectedSuggestions] = useState({});
  const [isProcessingSuggestions, setIsProcessingSuggestions] = useState(false);

  const { data: dashData, isLoading } = useSWR(`${API_BASE_URL}/admin/dashboard`, fetcher);

  // ------------------------------
  // Dashboard Data
  // ------------------------------
  useEffect(() => {
    if (!dashData) return;

    const { stats: s, topGames: tg = [], recentTransactions: rt = [], adminProfit: profit = 0, poolPrize: pool = 0 } = dashData;

    setStats({
      players: s?.players || 0,
      tournaments: s?.tournaments || 0,
      tournamentGrowth: Array.isArray(s?.tournamentGrowth) ? s.tournamentGrowth : [],
    });
    setTopGames(Array.isArray(tg) ? tg : []);
    setRecentTransactions(Array.isArray(rt) ? rt : []);
    setAdminProfit(Number(profit) || 0);
    setPoolPrize(Number(pool) || 0);
    setTotalRevenue(Number(profit) + Number(pool));

    const fetchAiTips = async () => {
      try {
        const { data } = await axios.get(`${API_BASE_URL}/admin/ai-insights`);
        setAiTips((data.suggestions || []).filter(tip => ["warning", "info", "success"].includes(tip.type)));
      } catch (err) {
        console.error(err);
        setAiTips([
          {
            type: "info",
            title: "Welcome to PLAYZONE Admin",
            message: "Your tournament dashboard is ready. Create your first tournament to get started!",
            action: "Get Started",
            options: [{ label: "Create Tournament", value: "create_tournament", checked: false }]
          }
        ]);
      }
    };
    fetchAiTips();
  }, [dashData]);

  // ------------------------------
  // Live Notifications
  // ------------------------------
  useEffect(() => {
    const fetchLiveNotifications = async () => {
      try {
        const { data } = await axios.get(`${API_BASE_URL}/admin/live-notifications`);
        const filtered = (data.notifications || []).filter(n => ["critical", "warning", "info"].includes(n.type));
        setLiveNotifications(filtered);

        filtered.forEach(notification => {
          const style = notification.type === "critical"
            ? { background: "#ff4c4c", color: "#fff" }
            : notification.type === "warning"
            ? { background: "#ffc107", color: "#000" }
            : { background: "#4ecdc4", color: "#fff" };

            if (notification.type !== 'warning') return toast(notification.message, { duration: 5000, style });
          
        });
      } catch (err) {
        console.error(err);
      }
    };

    fetchLiveNotifications();
    const interval = setInterval(fetchLiveNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // ------------------------------
  // Upcoming Tournaments Count
  // ------------------------------
  useEffect(() => {
    const fetchUpcoming = async () => {
      try {
        const { data: tournaments } = await axios.get(`${API_BASE_URL}/admin/upcoming-tournaments`);
        setUpcomingTournaments(tournaments.length);
      } catch (err) {
        console.error(err);
      }
    };
    fetchUpcoming();
    const interval = setInterval(fetchUpcoming, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // ------------------------------
  // Suggestion Handling
  // ------------------------------
  const handleSuggestionChange = (suggestionId, optionValue, checked) => {
    setSelectedSuggestions(prev => ({
      ...prev,
      [suggestionId]: {
        ...prev[suggestionId],
        [optionValue]: checked
      }
    }));
  };

  const processSuggestions = async (suggestion) => {
    setIsProcessingSuggestions(true);
    try {
      const selectedOptions = Object.entries(selectedSuggestions[suggestion.title] || {})
        .filter(([_, checked]) => checked)
        .map(([value]) => ({ value, checked: true }));

      if (!selectedOptions.length) {
        toast.error("Please select at least one option");
        setIsProcessingSuggestions(false);
        return;
      }

      const { data } = await axios.post(`${API_BASE_URL}/admin/suggestion-action`, {
        action: suggestion.action,
        options: selectedOptions,
        adminUsername: localStorage.getItem("adminUsername") || "admin"
      });

      toast.success(`✅ ${suggestion.title} processed successfully!`, { duration: 4000 });
      data.results?.forEach(result => result.status === "success" ? toast.success(result.message) : toast.error(result.message));
    } catch (err) {
      toast.error("Failed to process suggestions: " + (err.response?.data?.message || err.message));
    } finally {
      setIsProcessingSuggestions(false);
    }
  };

  const panelStyle = {
    flex: "1 1 220px",
    minWidth: 220,
    background: theme.gradients.navbarAlt1,
    padding: 20,
    borderRadius: 12,
    textAlign: "center",
    cursor: "pointer",
    transition: "all 0.3s ease",
    boxShadow: theme.shadows.sectionTitleGlow,
    border: `1px solid ${theme.colors.primary}`,
  };

  return (
    <div style={{ padding: isMobile ? "1rem" : "20px", backgroundColor: theme.colors.backgroundColor, color: theme.colors.white, minHeight: "100vh", fontFamily: theme.fonts.primary }}>
      <Toaster position="top-right" reverseOrder={false} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h1 style={{ fontSize: isMobile ? "1.8rem" : "2.5rem", textShadow: theme.shadows.headerGlow, color: theme.colors.primary, margin: 0 }}>
          Admin Dashboard
        </h1>
        <AdminBroadcasting />
      </div>

      {/* Stat Panels */}
      <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", flexWrap: "wrap", justifyContent: isMobile ? "center" : "flex-start", gap: isMobile ? "1rem" : "20px", marginBottom: "40px" }}>
        {!isLoading && (
          <>
            <div style={panelStyle} onClick={() => navigate("/admin/players")}>
              <h2>{stats.players}</h2>
              <p>Total Players</p>
            </div>
            <div style={panelStyle} onClick={() => navigate("/admin/tournaments")}>
              <h2>{stats.tournaments}</h2>
              <p>Total Tournaments</p>
            </div>
            <div style={panelStyle}>
              <h2>₹{totalRevenue.toLocaleString()}</h2>
              <p>Total Tournament Revenue</p>
            </div>
            <div style={panelStyle}>
              <h2>₹{adminProfit.toLocaleString()}</h2>
              <p>Admin Profit</p>
            </div>

             <div style={{ ...panelStyle, minHeight: "400px", overflowY: "auto" }}>
              <h2>🤖 AI Assistant & Live Alerts</h2>
              {aiTips.length > 0 && aiTips.map((tip, i) => (
                <div key={i} style={{ padding: 8, marginTop: 6, borderLeft: `4px solid ${tip.type === "warning" ? "#ffc107" : tip.type === "success" ? "#00c9a7" : "#007bff"}`, background: "rgba(255,255,255,0.05)" }}>
                  <strong>{tip.title}</strong>
                  <p>{tip.message}</p>
                </div>
              ))}

              
            </div>
            <div style={panelStyle}>
             
              {liveNotifications.length > 0 && (
                <div style={{ marginTop: 12, padding: 8, background: "rgba(255,0,0,0.1)", borderRadius: 6, border: "1px solid #ff6b6b" }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: "bold", color: "#ff6b6b", marginBottom: 4 }}>🔔 Live Alerts ({liveNotifications.length})</div>
                  {liveNotifications.map((notif, idx) => (
                    <div key={idx} style={{ fontSize: '1.2rem', textAlign:'justify',padding:'10px', color: notif.type === "critical" ? "#ff4c4c" : notif.type === "warning" ? "#ffc107" : "#4ecdc4", marginBottom: 2 }}>
                      • {notif.message}
                      {/* {console.log(notif.message)} */}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* AI + Live Alerts */}
           
          </>
        )}
      </div>

      {/* Charts Section */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? "1rem" : "30px", marginBottom: "40px" }}>
        {/* Tournament Growth */}
        <div style={{ background: theme.gradients.navbarAlt1, borderRadius: 12, padding: isMobile ? "1rem" : "20px", border: `1px solid ${theme.colors.primary}` }}>
          <h3 style={{ marginBottom: 15, color: theme.colors.secondary }}>Tournament Growth</h3>
          <ResponsiveContainer width="100%" height={isMobile ? 250 : 300}>
            <LineChart data={stats.tournamentGrowth || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="tournaments" stroke={theme.colors.secondary} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Top Games */}
        <div style={{ background: theme.gradients.navbarAlt1, borderRadius: 12, padding: isMobile ? "1rem" : "20px", border: `1px solid ${theme.colors.primary}` }}>
          <h3 style={{ marginBottom: 15, color: theme.colors.secondary }}>Top Games Played</h3>
          <ResponsiveContainer width="100%" height={isMobile ? 250 : 300}>
            <PieChart>
              <Pie data={topGames || []} dataKey="count" nameKey="game" outerRadius={120} fill={theme.colors.primary} label />
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Transactions */}
      <div style={{ background: theme.gradients.navbarAlt1, borderRadius: 12, padding: isMobile ? "1rem" : "20px", border: `1px solid ${theme.colors.primary}` }}>
        <h3 style={{ marginBottom: 15, color: theme.colors.secondary }}>Recent Transactions</h3>
        <div style={{ overflowX: isMobile ? "auto" : "visible" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: isMobile ? 400 : "auto" }}>
            <thead>
              <tr style={{ color: theme.colors.primary }}>
                <th>Amount</th>
                <th>Type</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {recentTransactions.slice(0, 5).map((tx, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #333" }}>
                  <td>₹{Number(tx.amount).toFixed(2)}</td>
                  <td>{tx.type}</td>
                  <td>{new Date(tx.date).toLocaleString()}</td>
                </tr>
              ))}
              {!recentTransactions.length && <tr><td colSpan={3}>No transactions yet.</td></tr>}
            </tbody>
          </table>
        </div>
        {recentTransactions.length > 5 && (
          <div style={{ marginTop: 10, textAlign: "right" }}>
            <button style={{ padding: "6px 12px", backgroundColor: theme.colors.primary, color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" }} onClick={() => navigate("/admin/transactions")}>
              View All
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
