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
  
  // ✅ NEW: Contact/Support Stats
  const [contactStats, setContactStats] = useState({ total: 0, pending: 0, resolved: 0 });
  const [recentContacts, setRecentContacts] = useState([]);
  const [previousPendingCount, setPreviousPendingCount] = useState(0);

  const { data: dashData, isLoading } = useSWR("http://localhost:5000/admin/dashboard", fetcher);

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
        const { data } = await axios.get("http://localhost:5000/admin/ai-insights");
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

  // ✅ NEW: Fetch Contact/Support Messages
  useEffect(() => {
    const fetchContactStats = async () => {
      try {
        const { data } = await axios.get("http://localhost:5000/admin/contacts?status=all");
        
        const newStats = {
          total: data.stats?.total || 0,
          pending: data.stats?.pending || 0,
          resolved: data.stats?.resolved || 0,
        };
        
        setContactStats(newStats);
        
        // Get recent pending contacts
        const pendingContacts = (data.contacts || [])
          .filter(c => c.status === "pending")
          .slice(0, 5);
        setRecentContacts(pendingContacts);

        // ✅ Check for NEW pending contacts
        if (previousPendingCount > 0 && newStats.pending > previousPendingCount) {
          const newCount = newStats.pending - previousPendingCount;
          toast.success(
            `🔔 ${newCount} new support request${newCount > 1 ? 's' : ''} received!`,
            {
              duration: 5000,
              style: {
                background: '#4ecdc4',
                color: '#fff',
                fontWeight: 'bold',
              },
              icon: '💬',
            }
          );

          // Play notification sound (optional)
          // const audio = new Audio('/notification.mp3');
          // audio.play().catch(err => console.log('Audio play failed:', err));
        }

        setPreviousPendingCount(newStats.pending);

      } catch (err) {
        console.error("Error fetching contact stats:", err);
      }
    };

    fetchContactStats();
    
    // Poll every 30 seconds for new contacts
    const interval = setInterval(fetchContactStats, 30000);
    return () => clearInterval(interval);
  }, [previousPendingCount]);

  // ------------------------------
  // Live Notifications
  // ------------------------------
  useEffect(() => {
    const fetchLiveNotifications = async () => {
      try {
        const { data } = await axios.get("http://localhost:5000/admin/live-notifications");
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
        const { data: tournaments } = await axios.get("http://localhost:5000/admin/upcoming-tournaments");
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

      const { data } = await axios.post("http://localhost:5000/admin/suggestion-action", {
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

  // ✅ Special style for pending contacts (with pulse animation)
  const contactPanelStyle = {
    ...panelStyle,
    border: contactStats.pending > 0 ? `2px solid #ffc107` : `1px solid ${theme.colors.primary}`,
    animation: contactStats.pending > 0 ? 'pulse 2s infinite' : 'none',
  };

  return (
    <div style={{ padding: isMobile ? "1rem" : "20px", backgroundColor: theme.colors.backgroundColor, color: theme.colors.white, minHeight: "100vh", fontFamily: theme.fonts.primary }}>
      <Toaster position="top-right" reverseOrder={false} />
      
      {/* ✅ Add CSS for pulse animation */}
      <style>{`
        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(255, 193, 7, 0.7);
          }
          50% {
            box-shadow: 0 0 0 10px rgba(255, 193, 7, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(255, 193, 7, 0);
          }
        }
      `}</style>

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

            {/* ✅ NEW: Support Requests Panel */}
            <div 
              style={contactPanelStyle}
              onClick={() => navigate("/admin/contacts")}
            >
              <div style={{ 
                position: 'relative', 
                display: 'inline-block',
                marginBottom: '10px'
              }}>
                <h2 style={{ 
                  fontSize: '2rem', 
                  color: contactStats.pending > 0 ? '#ffc107' : theme.colors.white,
                  margin: 0
                }}>
                  {contactStats.pending}
                </h2>
                {contactStats.pending > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '-5px',
                    right: '-10px',
                    background: '#ff4c4c',
                    color: '#fff',
                    borderRadius: '50%',
                    width: '20px',
                    height: '20px',
                    fontSize: '0.7rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    animation: 'pulse 1.5s infinite'
                  }}>
                    !
                  </span>
                )}
              </div>
              <p style={{ 
                fontWeight: contactStats.pending > 0 ? 'bold' : 'normal',
                color: contactStats.pending > 0 ? '#ffc107' : theme.colors.lightGray
              }}>
                💬 Pending Support Requests
              </p>
              {contactStats.pending > 0 && (
                <p style={{ 
                  fontSize: '0.85rem', 
                  color: '#ffc107',
                  marginTop: '5px'
                }}>
                  Click to respond →
                </p>
              )}
            </div>

            {/* AI + Live Alerts */}
            <div style={{ ...panelStyle, minHeight: "400px", overflowY: "auto" }}>
              <h2>🤖 AI Assistant & Live Alerts</h2>
              
              {/* ✅ Show Recent Support Requests in AI Panel */}
              {recentContacts.length > 0 && (
                <div style={{ 
                  padding: 12, 
                  marginTop: 10, 
                  background: "rgba(255, 193, 7, 0.1)", 
                  borderRadius: 8,
                  border: "1px solid #ffc107",
                  textAlign: 'left'
                }}>
                  <div style={{ 
                    fontSize: '0.9rem', 
                    fontWeight: "bold", 
                    color: "#ffc107", 
                    marginBottom: 8 
                  }}>
                    💬 Recent Support Requests ({recentContacts.length})
                  </div>
                  {recentContacts.slice(0, 3).map((contact, idx) => (
                    <div 
                      key={idx} 
                      style={{ 
                        fontSize: '0.8rem',
                        padding: '6px',
                        marginBottom: '6px',
                        background: 'rgba(0,0,0,0.2)',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate("/admin/contacts");
                      }}
                    >
                      <div style={{ fontWeight: 'bold', color: '#00ffcc' }}>
                        {contact.subject}
                      </div>
                      <div style={{ color: theme.colors.lightGray, fontSize: '0.75rem' }}>
                        From: {contact.name} • {new Date(contact.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                  {recentContacts.length > 3 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate("/admin/contacts");
                      }}
                      style={{
                        width: '100%',
                        padding: '6px',
                        marginTop: '8px',
                        background: '#ffc107',
                        color: '#000',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        fontWeight: 'bold'
                      }}
                    >
                      View All ({contactStats.pending})
                    </button>
                  )}
                </div>
              )}

              {aiTips.length > 0 && aiTips.map((tip, i) => (
                <div key={i} style={{ padding: 8, marginTop: 6, borderLeft: `4px solid ${tip.type === "warning" ? "#ffc107" : tip.type === "success" ? "#00c9a7" : "#007bff"}`, background: "rgba(255,255,255,0.05)", textAlign: 'left' }}>
                  <strong>{tip.title}</strong>
                  <p style={{ fontSize: '0.85rem', margin: '4px 0' }}>{tip.message}</p>
                </div>
              ))}
            </div>

            <div style={panelStyle}>
              {liveNotifications.length > 0 && (
                <div style={{ marginTop: 12, padding: 8, background: "rgba(255,0,0,0.1)", borderRadius: 6, border: "1px solid #ff6b6b" }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: "bold", color: "#ff6b6b", marginBottom: 4 }}>
                    🔔 Live Alerts ({liveNotifications.length})
                  </div>
                  {liveNotifications.map((notif, idx) => (
                    <div key={idx} style={{ fontSize: '1.2rem', textAlign:'justify', padding:'10px', color: notif.type === "critical" ? "#ff4c4c" : notif.type === "warning" ? "#ffc107" : "#4ecdc4", marginBottom: 2 }}>
                      • {notif.message}
                    </div>
                  ))}
                </div>
              )}
            </div>
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
          <ResponsiveContainer width="100%" height={isMobile ? 250 : 320}>
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
                  <td style={{textAlign:'center',}}>₹{Number(tx.amount).toFixed(2)}</td>
                  <td style={{textAlign:'center',}}>{tx.type}</td>
                  <td style={{textAlign:'center',}}>{new Date(tx.date).toLocaleString()}</td>
                </tr>
              ))}
              {!recentTransactions.length && <tr><td colSpan={3}>No transactions yet.</td></tr>}
            </tbody>
          </table>
        </div>
        {recentTransactions.length > 10 && (
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

