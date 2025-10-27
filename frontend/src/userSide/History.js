"use client"

// src/userSide/History.js
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
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
        if (!user?._id) return

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
      } catch (e) {
        console.error("History load error:", e)
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
      case "2nd Place":
        return "#C0C0C0" // Silver
      case "3rd place":
        return "#CD7F32" // Bronze
      default:
        return "#8B7355" // Brown for participant
    }
  }

  return (
    <div
      style={{
        padding: "20px",
        // maxWidth: '1200px',
        margin: "0 auto",
        backgroundColor: theme.colors.backgroundColor,
        minHeight: "100vh",
        color: theme.colors.white,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", marginBottom: "40px", position: "relative" }}>
        <UserSideNav />
        <button
          onClick={() => {
            navigate(-1)
          }}
          style={{
            padding: "10px 20px",
            borderRadius: "6px",
            marginTop: "50px",
            background: theme.gradients.secondaryButton,
            color: theme.colors.white,
            cursor: "pointer",
            fontFamily: theme.fonts.primary,
            fontSize: "1rem",
            boxShadow: theme.shadows.buttonShadow,
            transition: theme.animations.transition,
            border: "none",
            position: "absolute",
            right: "50px",
          }}
        >
          ← Back
        </button>
      </div>

      {/* Title */}
      <h1
        style={{
          fontSize: "2.5rem",
          marginTop: "5rem",
          color: theme.colors.primary,
          textAlign: "center",
          textShadow: theme.shadows.headerGlow,
        }}
      >
        Tournament History
      </h1>

      {/* Filters Section */}
      <div
        style={{
          background: "rgba(10, 10, 10, 0.6)",
          width: "80%",
          padding: "20px",
          //   borderRadius: '12px',
          marginBottom: "2rem",
          margin: "0 auto",
          display: "flex",
          flexWrap: "wrap",
          gap: "20px",
          border: `1px solid ${theme.colors.secondary}`,
          borderRadius: "6px",
          boxShadow: "0 0 16px rgba(0, 255, 224, 0.2)",
        }}
      >
        {/* Game type filter */}
        <select
          value={gameType}
          onChange={(e) => setGameType(e.target.value)}
          style={{
            flex: 1,
            minWidth: "200px",
            padding: "10px",
            borderRadius: "8px",
            backgroundColor: theme.colors.navbarDark,
            border: `1px solid ${theme.colors.primary}`,
            color: theme.colors.white,
          }}
        >
          <option value="all">All Games</option>
          <option value="BGMI">BGMI</option>
          <option value="COD">CALL OF DUTY</option>
          <option value="PUBG">PUBG</option>
          <option value="FREE FIRE">FREE FIRE</option>
        </select>

        {/* Date filter */}
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          style={{
            flex: 1,
            minWidth: "200px",
            padding: "10px",
            borderRadius: "8px",
            backgroundColor: theme.colors.navbarDark,
            border: `1px solid ${theme.colors.primary}`,
            color: theme.colors.white,
          }}
        />

        {/* Result filter */}
        <select
          value={resultFilter}
          onChange={(e) => setResultFilter(e.target.value)}
          style={{
            flex: 1,
            minWidth: "200px",
            padding: "10px",
            borderRadius: "8px",
            backgroundColor: theme.colors.navbarDark,
            border: `1px solid ${theme.colors.primary}`,
            color: theme.colors.white,
          }}
        >
          <option value="all">All Results</option>
          <option value="winner">Winners</option>
          <option value="2nd Place">2nd place</option>
          <option value="3rd place">3rd Place</option>
          {/* <option value="participant">Participants</option> */}
        </select>

        {/* Search */}
        <input
          type="text"
          placeholder="Search tournaments..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            flex: 1,
            minWidth: "200px",
            padding: "10px",
            borderRadius: "8px",
            backgroundColor: theme.colors.navbarDark,
            border: `1px solid ${theme.colors.primary}`,
            color: theme.colors.white,
          }}
        />
      </div>

      {/* Cards Section */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: "20px",
          margin: "3% 9%",
        }}
      >
        {loading ? (
          <div style={{ textAlign: "center", marginTop: "2rem", color: theme.colors.lightGray }}>
            <h2>Loading...</h2>
          </div>
        ) : filteredHistory.length > 0 ? (
          filteredHistory.map((tournament) => (
            <div
              key={tournament.id}
              style={{
                backgroundColor: theme.colors.navbarDark,
                borderRadius: "12px",
                padding: "20px",
                border: `1px solid ${theme.colors.primary}`,
                boxShadow: "0 0 16px rgba(255, 0, 127, 0.1)",
                transition: "all 0.3s ease",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "15px",
                }}
              >
                <h3 style={{ margin: 0, color: theme.colors.secondary }}>{tournament.tournamentName}</h3>
                <span
                  style={{
                    padding: "4px 12px",
                    borderRadius: "20px",
                    backgroundColor: getResultColor(tournament.result),
                    color: "white",
                    fontSize: "0.875rem",
                    fontWeight: "bold",
                  }}
                >
                  {tournament.result}
                </span>
              </div>

              <p style={{ margin: "5px 0", color: theme.colors.lightGray }}>🎮 {tournament.game}</p>
              <p style={{ margin: "5px 0", color: theme.colors.lightGray }}>
                📅 {new Date(tournament.date).toLocaleDateString()}
              </p>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  color: theme.colors.lightGray,
                  fontSize: "0.875rem",
                }}
              >
                <p>Prize Won: {tournament.prizeWon}</p>
                <p>Entry Fee: ₹{tournament.entryFee}</p>
                {/* <p>Participants: {tournament.participants}</p> */}
              </div>

              {/* View Results Button */}
              {tournament.resultPublished && (
                <div style={{ marginTop: "15px", textAlign: "center" }}>
                  <button
                    onClick={() => navigate(`/tournaments/results/${tournament.tournamentName}`)}
                    style={{
                      padding: "8px 16px",
                      borderRadius: "6px",
                      border: "none",
                      background: theme.gradients.primaryButton,
                      color: theme.colors.white,
                      cursor: "pointer",
                      boxShadow: theme.shadows.buttonShadow,
                      fontWeight: 600,
                      fontSize: "0.9rem"
                    }}
                  >
                    🏆 View Results
                  </button>
                </div>
              )}
            </div>
          ))
        ) : (
          <div style={{ textAlign: "center", marginTop: "2rem", color: theme.colors.lightGray }}>
            <h2>No tournament history found matching your filters</h2>
          </div>
        )}
      </div>
    </div>
  )
}

export default History
