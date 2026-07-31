"use client"

// src/userSide/History.js
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import UserSideNav from "./UserSideNav"
import axios from "axios"
import "./History.css" // ✅ INJECTING THE NEW CSS

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

  const getResultClass = (result) => {
    switch (result.toLowerCase()) {
      case "winner": return "result-winner"
      case "2nd place": return "result-second"
      case "3rd place": return "result-third"
      default: return ""
    }
  }

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
    <div className="history-page-wrapper">
      <UserSideNav />
      
      <button onClick={() => navigate(-1)} className="floating-back-btn">
        ← Back
      </button>

      <div className="history-main-content">
        <h1 className="history-page-title">Tournament History</h1>

        {/* Filters Section */}
        <div className="history-filters-container">
          {/* Game type filter */}
          <select
            value={gameType}
            onChange={(e) => setGameType(e.target.value)}
            className="history-filter-input"
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
            className="history-filter-input"
          />

          {/* Result filter */}
          <select
            value={resultFilter}
            onChange={(e) => setResultFilter(e.target.value)}
            className="history-filter-input"
          >
            <option value="all">All Results</option>
            <option value="winner">Winners</option>
            <option value="2nd Place">2nd place</option>
            <option value="3rd place">3rd Place</option>
            <option value="participant">Participants</option>
          </select>

          {/* Search */}
          <input
            type="text"
            placeholder="Search tournaments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="history-filter-input"
          />
        </div>

        {/* Cards Section */}
        <div className="history-grid-container">
          {loading ? (
            <div className="history-loading-state">
              <h2>Loading Career History...</h2>
            </div>
          ) : filteredHistory.length > 0 ? (
            filteredHistory.map((tournament) => (
              <div key={tournament.id} className={`history-card ${getResultClass(tournament.result)}`}>
                
                <div className="history-card-header">
                  <h3 className="history-tourney-name">{tournament.tournamentName}</h3>
                  <span
                    className="history-result-badge"
                    style={{ backgroundColor: getResultColor(tournament.result) }}
                  >
                    {tournament.result}
                  </span>
                </div>

                <div className="history-card-body">
                  <p>🎮 <strong>Game:</strong> {tournament.game}</p>
                  <p>📅 <strong>Date:</strong> {new Date(tournament.date).toLocaleDateString()}</p>
                  
                  <div className="history-financials">
                    <p className="history-entry">Entry: ₹{tournament.entryFee}</p>
                    <p className="history-prize">Won: {tournament.prizeWon}</p>
                  </div>
                </div>

                {/* View Results Button */}
                {tournament.resultPublished && (
                  <div className="history-card-footer">
                    <button
                      onClick={() => navigate(`/tournaments/results/${tournament.tournamentName}`)}
                      className="btn-primary-gaming w-100"
                    >
                      🏆 View Match Results
                    </button>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="history-empty-state">
              <h2>No tournament history found matching your filters</h2>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default History