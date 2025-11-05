"use client"

// src/userSide/History.js
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import toast, { Toaster } from "react-hot-toast"
import theme from "../theme"
import UserSideNav from "./UserSideNav"
import axios from "axios"

const History = () => {
  const navigate = useNavigate()

  const [gameType, setGameType] = useState("all")
  const [resultFilter, setResultFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [startDate, setStartDate] = useState("")
  const [loading, setLoading] = useState(false)
  const [historyData, setHistoryData] = useState([])

  // Fetch joined tournaments, filter to completed
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        let user = JSON.parse(localStorage.getItem("user"))
        if (!user?._id) {
          const userName = localStorage.getItem("userName")
          if (userName) {
            const res = await axios.get(`http://localhost:5000/user/${encodeURIComponent(userName)}`)
            user = res.data
          }
        }
        if (!user?._id) {
          toast.error("User not found. Please login again.")
          return
        }

        const tRes = await axios.get(`http://localhost:5000/tournaments/joined/${user._id}`)
        const completed = (tRes.data || []).filter((t) => String(t.t_status).toLowerCase() === "completed")

        const mapped = completed.map((t, idx) => ({
          id: t._id || idx,
          tournamentName: t.t_id || `${t.game} Tournament`,
          game: t.game || "Game",
          date: t.t_date ? new Date(t.t_date).toISOString().slice(0, 10) : "",
          result:
            t.rank === 1
              ? "Winner"
              : t.rank === 2
                ? "2nd Place"
                : t.rank === 3
                  ? "3rd Place"
                  : "Participant",
          position: t.rank || null,
          prizeWon: t.prize_won > 0 ? `₹${t.prize_won}` : "—",
          participants: t.participants || 0,
          entryFee: t.entry_fee || 0,
          resultPublished: t.result_published || false,
        }))

        setHistoryData(mapped)
        toast.success(`${mapped.length} completed tournaments loaded`,{
  position: 'top-right'
} )
      } catch (e) {
        console.error("History load error:", e)
        toast.error("Failed to load tournament history")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filteredHistory = historyData.filter((item) => {
    const matchesGame = gameType === "all" || (item.game || "").toLowerCase().includes(gameType.toLowerCase())
    const matchesResult = resultFilter === "all" || (item.result || "").toLowerCase() === resultFilter.toLowerCase()
    const matchesSearch = (item.tournamentName || "").toLowerCase().includes(searchQuery.toLowerCase())
    const matchesDate = !startDate || new Date(item.date) >= new Date(startDate)

    return matchesGame && matchesResult && matchesSearch && matchesDate
  })

  // Result badge color
  const getResultColor = (result) => {
    switch (result.toLowerCase()) {
      case "winner":
        return "#FFD700" // Gold
      case "2nd place":
        return "#C0C0C0" // Silver
      case "3rd place":
        return "#CD7F32" // Bronze
      default:
        return "#8B7355" // Brown for participant
    }
  }

  return (
    <div style={styles.container}>
      {/* Toast Container */}
      <Toaster
        position="top-center"
        reverseOrder={false}
        containerStyle={{
          top: 80,
          zIndex: 99999,
        }}
        toastOptions={{
          duration: 3000,
          style: {
            background: "linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)",
            color: "#fff",
            border: "2px solid rgba(255,255,255,0.15)",
            padding: "16px 20px",
            borderRadius: "12px",
            fontSize: "14px",
            fontFamily: theme.fonts.primary,
            boxShadow: "0 10px 40px rgba(0,0,0,0.8)",
            maxWidth: "90vw",
            minWidth: "280px",
          },
          success: {
            style: {
              background: "linear-gradient(135deg, #1a3a1a 0%, #0d1f0d 100%)",
              border: "2px solid rgba(76, 175, 80, 0.4)",
            },
            iconTheme: {
              primary: "#4caf50",
              secondary: "#fff",
            },
          },
          error: {
            style: {
              background: "linear-gradient(135deg, #3a1a1a 0%, #1f0d0d 100%)",
              border: "2px solid rgba(244, 67, 54, 0.4)",
            },
            iconTheme: {
              primary: "#f44336",
              secondary: "#fff",
            },
          },
        }}
      />

      <UserSideNav />

      {/* Header Section */}
      <div style={styles.header}>
        <button onClick={() => navigate(-1)} style={styles.backButton}>
          ← Back
        </button>
      </div>

      {/* Title */}
      <h1 style={styles.title}>🏆 Tournament History</h1>

      {/* Filters Section */}
      <div style={styles.filtersContainer}>
        <select value={gameType} onChange={(e) => setGameType(e.target.value)} style={styles.filterInput}>
          <option value="all">All Games</option>
          <option value="BGMI">BGMI</option>
          <option value="COD">CALL OF DUTY</option>
          <option value="PUBG">PUBG</option>
          <option value="FREE FIRE">FREE FIRE</option>
        </select>

        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          style={styles.filterInput}
        />

        <select value={resultFilter} onChange={(e) => setResultFilter(e.target.value)} style={styles.filterInput}>
          <option value="all">All Results</option>
          <option value="winner">Winners</option>
          <option value="2nd place">2nd Place</option>
          <option value="3rd place">3rd Place</option>
        </select>

        <input
          type="text"
          placeholder="Search tournaments..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={styles.searchInput}
        />
      </div>

      {/* Cards Section */}
      <div style={styles.cardsGrid}>
        {loading ? (
          <div style={styles.loadingContainer}>
            <div style={styles.spinner}></div>
            <h2 style={styles.loadingText}>Loading tournament history...</h2>
          </div>
        ) : filteredHistory.length > 0 ? (
          filteredHistory.map((tournament) => (
            <div key={tournament.id} style={styles.card}>
              <div style={styles.cardHeader}>
                <h3 style={styles.cardTitle}>{tournament.tournamentName}</h3>
                <span
                  style={{
                    ...styles.resultBadge,
                    backgroundColor: getResultColor(tournament.result),
                  }}
                >
                  {tournament.result}
                </span>
              </div>

              <div style={styles.cardBody}>
                <p style={styles.cardInfo}>
                  <span style={styles.icon}>🎮</span> {tournament.game}
                </p>
                <p style={styles.cardInfo}>
                  <span style={styles.icon}>📅</span> {new Date(tournament.date).toLocaleDateString()}
                </p>

                <div style={styles.cardStats}>
                  <div style={styles.statItem}>
                    <span style={styles.statLabel}>Prize Won</span>
                    <span style={styles.statValue}>{tournament.prizeWon}</span>
                  </div>
                  <div style={styles.statItem}>
                    <span style={styles.statLabel}>Entry Fee</span>
                    <span style={styles.statValue}>₹{tournament.entryFee}</span>
                  </div>
                </div>
              </div>

              {tournament.resultPublished && (
                <div style={styles.cardFooter}>
                  <button
                    onClick={() => navigate(`/tournaments/results/${tournament.tournamentName}`)}
                    style={styles.viewResultsButton}
                  >
                    🏆 View Results
                  </button>
                </div>
              )}
            </div>
          ))
        ) : (
          <div style={styles.emptyState}>
            <span style={styles.emptyIcon}>📭</span>
            <h2 style={styles.emptyTitle}>No Tournament History Found</h2>
            <p style={styles.emptyText}>
              {historyData.length === 0
                ? "You haven't completed any tournaments yet"
                : "No tournaments match your current filters"}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

/* ==================== RESPONSIVE STYLES ==================== */
const styles = {
  container: {
    padding: "clamp(10px, 3vw, 20px)",
    margin: "0 auto",
    backgroundColor: theme.colors.backgroundColor,
    minHeight: "100vh",
    color: theme.colors.white,
    fontFamily: theme.fonts.primary,
  },

  header: {
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
    marginBottom: "clamp(20px, 5vw, 40px)",
    marginTop: "clamp(60px, 15vw, 80px)",
    padding: "0 clamp(10px, 3vw, 50px)",
  },

  backButton: {
    padding: "clamp(8px, 2vw, 10px) clamp(16px, 4vw, 20px)",
    borderRadius: "6px",
    background: theme.gradients.secondaryButton,
    color: theme.colors.white,
    cursor: "pointer",
    fontFamily: theme.fonts.primary,
    fontSize: "clamp(0.85rem, 2.5vw, 1rem)",
    boxShadow: theme.shadows.buttonShadow,
    transition: theme.animations.transition,
    border: "none",
    fontWeight: "600",
  },

  title: {
    fontSize: "clamp(1.5rem, 5vw, 2.5rem)",
    margin: "clamp(20px, 5vw, 40px) 0",
    color: theme.colors.primary,
    textAlign: "center",
    textShadow: theme.shadows.headerGlow,
  },

  filtersContainer: {
    background: "rgba(10, 10, 10, 0.6)",
    width: "clamp(90%, 80vw, 80%)",
    padding: "clamp(12px, 3vw, 20px)",
    margin: "0 auto clamp(20px, 5vw, 40px)",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "clamp(10px, 2vw, 20px)",
    border: `1px solid ${theme.colors.secondary}`,
    borderRadius: "8px",
    boxShadow: "0 0 16px rgba(0, 255, 224, 0.2)",
  },

  filterInput: {
    width: "100%",
    padding: "clamp(8px, 2vw, 10px)",
    borderRadius: "8px",
    backgroundColor: theme.colors.navbarDark,
    border: `1px solid ${theme.colors.primary}`,
    color: theme.colors.white,
    fontSize: "clamp(0.85rem, 2vw, 1rem)",
    fontFamily: theme.fonts.primary,
    boxSizing: "border-box",
  },

  searchInput: {
    width: "100%",
    padding: "clamp(8px, 2vw, 10px)",
    borderRadius: "8px",
    backgroundColor: theme.colors.navbarDark,
    border: `1px solid ${theme.colors.primary}`,
    color: theme.colors.white,
    fontSize: "clamp(0.85rem, 2vw, 1rem)",
    fontFamily: theme.fonts.primary,
    boxSizing: "border-box",
    gridColumn: "1 / -1", // Span full width on mobile
  },

  cardsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(clamp(280px, 90vw, 320px), 1fr))",
    gap: "clamp(15px, 3vw, 20px)",
    padding: "0 clamp(10px, 3vw, 9%)",
    marginBottom: "clamp(20px, 5vw, 40px)",
  },

  card: {
    backgroundColor: theme.colors.navbarDark,
    borderRadius: "12px",
    padding: "clamp(15px, 3vw, 20px)",
    border: `1px solid ${theme.colors.primary}`,
    boxShadow: "0 0 16px rgba(255, 0, 127, 0.1)",
    transition: "all 0.3s ease",
    display: "flex",
    flexDirection: "column",
  },

  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "15px",
    gap: "10px",
    flexWrap: "wrap",
  },

  cardTitle: {
    margin: 0,
    color: theme.colors.secondary,
    fontSize: "clamp(1rem, 3vw, 1.2rem)",
    fontWeight: "600",
    flex: 1,
    minWidth: "150px",
  },

  resultBadge: {
    padding: "4px 12px",
    borderRadius: "20px",
    color: "white",
    fontSize: "clamp(0.75rem, 2vw, 0.875rem)",
    fontWeight: "bold",
    whiteSpace: "nowrap",
  },

  cardBody: {
    flex: 1,
  },

  cardInfo: {
    margin: "8px 0",
    color: theme.colors.lightGray,
    fontSize: "clamp(0.85rem, 2vw, 0.95rem)",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },

  icon: {
    fontSize: "clamp(1rem, 3vw, 1.2rem)",
  },

  cardStats: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: "15px",
    gap: "10px",
    flexWrap: "wrap",
  },

  statItem: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },

  statLabel: {
    color: theme.colors.lightGray,
    fontSize: "clamp(0.75rem, 2vw, 0.85rem)",
  },

  statValue: {
    color: theme.colors.secondary,
    fontSize: "clamp(0.9rem, 2.5vw, 1rem)",
    fontWeight: "600",
  },

  cardFooter: {
    marginTop: "15px",
    textAlign: "center",
  },

  viewResultsButton: {
    width: "100%",
    padding: "clamp(8px, 2vw, 10px) clamp(12px, 3vw, 16px)",
    borderRadius: "6px",
    border: "none",
    background: theme.gradients.primaryButton,
    color: theme.colors.white,
    cursor: "pointer",
    boxShadow: theme.shadows.buttonShadow,
    fontWeight: 600,
    fontSize: "clamp(0.85rem, 2vw, 0.9rem)",
    transition: "all 0.3s ease",
  },

  loadingContainer: {
    gridColumn: "1 / -1",
    textAlign: "center",
    marginTop: "clamp(40px, 10vw, 80px)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "20px",
  },

  spinner: {
    width: "clamp(40px, 10vw, 60px)",
    height: "clamp(40px, 10vw, 60px)",
    border: "4px solid rgba(255, 255, 255, 0.1)",
    borderTop: "4px solid #00ffe0",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },

  loadingText: {
    color: theme.colors.lightGray,
    fontSize: "clamp(1rem, 3vw, 1.5rem)",
  },

  emptyState: {
    gridColumn: "1 / -1",
    textAlign: "center",
    marginTop: "clamp(40px, 10vw, 80px)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "15px",
    padding: "clamp(20px, 5vw, 40px)",
  },

  emptyIcon: {
    fontSize: "clamp(3rem, 10vw, 5rem)",
  },

  emptyTitle: {
    color: theme.colors.lightGray,
    fontSize: "clamp(1.2rem, 4vw, 1.8rem)",
    margin: "0",
  },

  emptyText: {
    color: theme.colors.lightGray,
    fontSize: "clamp(0.9rem, 2.5vw, 1rem)",
    maxWidth: "500px",
    lineHeight: "1.6",
  },
}

// Add keyframe animation
const styleSheet = document.createElement("style")
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  /* Mobile specific adjustments */
  @media (max-width: 768px) {
    /* Make cards full width on very small screens */
    ${styles.cardsGrid} {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 480px) {
    /* Stack filters on small screens */
    ${styles.filtersContainer} {
      grid-template-columns: 1fr;
    }
  }

  /* Hover effects for desktop */
  @media (hover: hover) {
    button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(0, 255, 224, 0.4);
    }

    div[style*="card"]:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(255, 0, 127, 0.3);
    }
  }
`
document.head.appendChild(styleSheet)

export default History  