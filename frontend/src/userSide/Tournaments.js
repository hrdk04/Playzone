"use client"

import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import axios from "axios"
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import UserSideNav from "./UserSideNav"
import "./Tournaments.css" // ✅ INJECTING THE NEW CSS

const gameThumbs = {
  bgmi: "https://yourcdn.com/bgmi.jpg",
  pubg: "https://yourcdn.com/pubg.jpg",
  cod: "https://yourcdn.com/cod.jpg",
  ff: "https://yourcdn.com/ff.jpg",
}

export default function Tournaments() {
  const navigate = useNavigate()
  const location = useLocation()

  const [filter, setFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("all") 
  const [viewAll, setViewAll] = useState({ high: false, mid: false, low: false })
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const [selectedTournament, setSelectedTournament] = useState(null)
  const [tournaments, setTournaments] = useState([])

  const [showTeamForm, setShowTeamForm] = useState(false)
  const [teamName, setTeamName] = useState("")
  const [loading, setLoading] = useState(false)
  const [showConfirmPay, setShowConfirmPay] = useState(false)

  const isDashboardView = location.pathname.startsWith("/dashboard")

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"))
    setIsLoggedIn(!!user)
  }, [])

  useEffect(() => {
    if (location.state?.resumeRegister && location.state?.tournament) {
      setSelectedTournament(location.state.tournament)
      if (location.state.teamName) {
        setTeamName(location.state.teamName)
        setShowConfirmPay(true)
        setTimeout(() => {
          handlePayAndRegister()
        }, 500)
      }
      navigate(location.pathname + location.search, { replace: true, state: {} })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state, navigate])

  useEffect(() => {
    axios
      .get("http://localhost:5000/admin/tournaments")
      .then((res) => {
        const data = res.data.map((t) => ({
          id: t.t_id,
          game: t.game,
          map: t.map,
          entryFee: t.entry_fee,
          date: t.t_date?.slice(0, 10) || "",
          time: t.t_time || "",
          status: t.t_status.toLowerCase(),
          result_published: t.result_published || false,
          reward_1: t.rewards?.first ? `₹${t.rewards.first}` : "₹0",
          reward_2: t.rewards?.second ? `₹${t.rewards.second}` : "₹0",
          reward_3: t.rewards?.third ? `₹${t.rewards.third}` : "₹0",
          poolPrize: (t.rewards?.first || 0) + (t.rewards?.second || 0) + (t.rewards?.third || 0),
          thumbnail: t.thumbnail || gameThumbs[t.game] || "",
        }))
        setTournaments(data)
      })
      .catch((err) => {
        console.error("Error fetching tournaments:", err)
        toast.error("Failed to load tournaments")
      })
  }, [])

  const getAvailableDates = () => {
    const today = new Date().toISOString().slice(0, 10)
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
    
    const uniqueDates = [...new Set(tournaments.map(t => t.date).filter(Boolean))]
    const dateOptions = []
    
    uniqueDates.forEach(date => {
      if (date === today) {
        dateOptions.push({ value: date, label: "Today", sortOrder: 0 })
      } else if (date === yesterday) {
        dateOptions.push({ value: date, label: "Yesterday", sortOrder: 1 })
      } else {
        const d = new Date(date)
        const label = d.toLocaleDateString('en-IN', { 
          day: '2-digit', month: 'short', year: 'numeric', weekday: 'short'
        })
        dateOptions.push({ value: date, label: `${label}`, sortOrder: 2 })
      }
    })
    
    return dateOptions.sort((a, b) => {
      if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder
      return new Date(b.value) - new Date(a.value)
    })
  }

  const handleTournamentClick = (tournament) => {
    if (tournament.status === "completed") {
      if (tournament.result_published) {
        navigate(`/tournaments/results/${tournament.id}`)
      } else {
        toast.info("Tournament completed but results are not yet published. Please check back later.", {
          autoClose: 4000
        })
      }
      return
    }
    
    if (!isLoggedIn) {
      setSelectedTournament(tournament)
      setShowLoginPrompt(true)
    } else {
      setSelectedTournament(tournament)
      setShowTeamForm(true)
    }
  }

  const handleTeamSave = (e) => {
    e.preventDefault()
    if (!teamName.trim()) {
      toast.warning("Please enter a team name")
      return
    }
    setShowTeamForm(false)
    setShowConfirmPay(true)
  }

  const handlePayAndRegister = async () => {
    if (!selectedTournament) return
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
        toast.error("Please login again")
        navigate("/login")
        return
      }

      const userRes = await axios.get(`http://localhost:5000/user/id/${user._id}`)
      const balance = Number(userRes.data?.amount || 0)
      const fee = Number(selectedTournament.entryFee || 0)

      if (balance < fee) {
        const deficit = Math.max(fee - balance, 1)
        toast.info("Insufficient balance. Redirecting to payment page...")
        setTimeout(() => {
          navigate("/payments", {
            state: {
              action: "topup_then_register",
              topUpFor: "tournament",
              requiredAmount: deficit,
              returnTo: location.pathname + location.search,
              meta: selectedTournament,
              teamName: teamName,
            },
          })
        }, 1500)
        return
      }

      const payload = {
        user_id: user._id,
        tournament_id: selectedTournament.id,
        team_name: teamName,
        payment_method: "wallet",
      }
      
      const reg = await axios.post("http://localhost:5000/tournament/register", payload)
      
      toast.success(reg.data?.message || "Registered successfully! 🎉", {
        autoClose: 3000
      })

      try {
        const refreshed = await axios.get(`http://localhost:5000/user/id/${user._id}`)
        localStorage.setItem("user", JSON.stringify(refreshed.data))
      } catch (e) {
        console.log("[v0] User refresh after register failed, will still proceed:", e?.message)
      }

      setShowConfirmPay(false)
      setTeamName("")
      setSelectedTournament(null)
    } catch (err) {
      console.error("Register error:", err)
      toast.error(err?.response?.data?.message || "Registration failed. Please try again.", {
        autoClose: 4000
      })
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => navigate(-1)

  const filtered = tournaments.filter((t) => {
    let statusMatch = true
    if (filter === "all") {
      statusMatch = t.status === "pending" || t.status === "running"
    } else if (filter === "pending") {
      statusMatch = t.status === "pending"
    } else if (filter === "running") {
      statusMatch = t.status === "running"
    } else if (filter === "upcoming") {
      statusMatch = t.status === "pending" || t.status === "running"
    } else if (filter === "completed") {
      statusMatch = t.status === "completed"
    } else {
      statusMatch = t.status === filter
    }
    
    let dateMatch = true
    if (dateFilter !== "all") {
      dateMatch = t.date === dateFilter
    }
    
    return statusMatch && dateMatch
  })

  const high = filtered.filter((t) => t.poolPrize > 1000)
  const mid = filtered.filter((t) => t.poolPrize <= 1000 && t.poolPrize >= 500)
  const low = filtered.filter((t) => t.poolPrize < 500)

  const renderRow = (list, category) => {
    const limit = 4
    const visible = viewAll[category] ? list : list.slice(0, limit)

    return (
      <div className="arena-tier-section">
        <div className="arena-tier-header">
          <h2 className="arena-tier-title">
            {category === "high" && "Elite Tier (Pool > ₹1000)"}
            {category === "mid" && "Challenger Tier (₹500 - ₹1000)"}
            {category === "low" && "Starter Tier (< ₹500)"}
          </h2>

          {list.length > limit && (
            <button
              onClick={() => setViewAll({ ...viewAll, [category]: !viewAll[category] })}
              className="btn-secondary-gaming"
            >
              {viewAll[category] ? "Show Less" : "View All"}
            </button>
          )}
        </div>

        <div className={`grid-container ${viewAll[category] ? 'expanded' : ''}`}>
          {visible.map((t) => (
            <div key={t.id} className="tournament-card" onClick={() => handleTournamentClick(t)}>
              
              <div className="tournament-img-wrapper">
                <img src={t.thumbnail} alt={t.game} className="tournament-img" />
                <div className={`status-badge ${t.status}`}>
                  {t.status.toUpperCase()}
                </div>
              </div>

              <div className="tournament-info">
                <h3>{t.id}</h3>
                <p>🎮 {t.game}</p>
                <p>🗺️ Map: {t.map}</p>
                <p>📅 {t.date} • {parseInt(t.time) >= 12 ? `${t.time} PM` : `${t.time} AM`}</p>
                
                <div className="tournament-prizes">
                  <span className="prize-entry">Entry: ₹{t.entryFee}</span>
                  <span className="prize-pool">Pool: ₹{t.poolPrize}</span>
                </div>

                {t.status === "completed" && t.result_published && (
                  <div className="results-published-tag">
                    🏆 Results Published
                  </div>
                )}
              </div>
              
              {/* Completed Overlay */}
              {t.status === "completed" && (
                <div 
                  className="completed-overlay"
                  onClick={(e) => {
                    e.stopPropagation()
                    if (t.result_published) {
                      navigate(`/tournaments/results/${t.id}`)
                    } else {
                      toast.info("Tournament completed but results are not yet published. Please check back later.")
                    }
                  }}
                >
                  {t.result_published ? "🏆 View Results" : "⏳ Results Pending"}
                </div>
              )}
              
              {/* Hover Prize Reveal (Hidden if completed) */}
              {t.status !== "completed" && (
                <div className="prize-hover-reveal">
                  <p className="hover-pool">🏆 Pool: ₹{t.poolPrize}</p>
                  <p>🥇 1st: {t.reward_1}</p>
                  <p>🥈 2nd: {t.reward_2}</p>
                  <p>🥉 3rd: {t.reward_3}</p>
                </div>
              )}

            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={`tournaments-page-wrapper ${isDashboardView ? 'dashboard-mode' : ''}`}>
      <ToastContainer position="top-right" autoClose={3000} theme="dark" />

      {isLoggedIn && !isDashboardView && (
        <>
          <UserSideNav />
          <button onClick={handleBack} className="floating-back-btn">
            ← Back
          </button>
        </>
      )}

      <div className="tournaments-main-content">
        <h1 className="tournaments-page-title">Playzone Arena</h1>

        {/* Filters Section */}
        <div className="arena-filters-container">
          <div className="status-filters">
            <div className="filter-count-text">
              Showing {filtered.length} tournament{filtered.length !== 1 ? 's' : ''} 
              {filter !== "all" && ` (${filter})`}
              {dateFilter !== "all" && ` on ${getAvailableDates().find(d => d.value === dateFilter)?.label || dateFilter}`}
            </div>
            
            <div className="filter-btn-group">
              <button onClick={() => setFilter("all")} className={`filter-btn ${filter === "all" ? "active" : ""}`}>
                All ({tournaments.length - tournaments.filter(t => t.status === "completed").length})
              </button>
              <button onClick={() => setFilter("upcoming")} className={`filter-btn ${filter === "upcoming" ? "active" : ""}`}>
                Upcoming ({tournaments.filter(t => t.status === "pending" || t.status === "running").length})
              </button>
              <button onClick={() => setFilter("running")} className={`filter-btn ${filter === "running" ? "active" : ""}`}>
                Running ({tournaments.filter(t => t.status === "running").length})
              </button>
              <button onClick={() => setFilter("completed")} className={`filter-btn ${filter === "completed" ? "active" : ""}`}>
                Completed ({tournaments.filter(t => t.status === "completed").length})
              </button>
            </div>
          </div>

          <div className="date-filter">
            <label>Filter by Date:</label>
            <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="date-select">
              <option value="all">All Dates ({tournaments.length})</option>
              {getAvailableDates().map(({ value, label }) => {
                const count = tournaments.filter(t => t.date === value).length
                return <option key={value} value={value}>{label} ({count})</option>
              })}
            </select>
            
            {dateFilter !== "all" && (
              <button onClick={() => setDateFilter("all")} className="clear-date-btn">
                ✕ Clear
              </button>
            )}
          </div>
        </div>

        {/* Tournament Rendering */}
        {filtered.length === 0 ? (
          <div className="empty-arena-state">
            <h3>No tournaments found</h3>
            <p>No tournaments match the current filter criteria.</p>
            <button onClick={() => { setFilter("all"); setDateFilter("all"); }} className="btn-primary-gaming mt-3">
              Show All Tournaments
            </button>
          </div>
        ) : (
          <>
            {high.length > 0 && renderRow(high, "high")}
            {mid.length > 0 && renderRow(mid, "mid")}
            {low.length > 0 && renderRow(low, "low")}
          </>
        )}

        {/* Modals */}
        {showLoginPrompt && selectedTournament && (
          <LoginPrompt tournament={selectedTournament} navigate={navigate} onClose={() => { setShowLoginPrompt(false); setSelectedTournament(null); }} />
        )}

        {showTeamForm && selectedTournament && (
          <div className="modal-overlay">
            <div className="modal-card">
              <h2>Register Team</h2>
              <p className="modal-subtitle">Entry Fee: ₹{selectedTournament.entryFee}</p>
              <form onSubmit={handleTeamSave}>
                <input
                  type="text"
                  placeholder="Enter Team Name"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  required
                  className="auth-input mb-3"
                />
                <div className="modal-btn-group">
                  <button type="submit" disabled={loading} className="btn-primary-gaming">
                    {loading ? "Saving..." : "Save & Continue"}
                  </button>
                  <button type="button" onClick={() => setShowTeamForm(false)} className="btn-secondary-gaming">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showConfirmPay && selectedTournament && (
          <div className="modal-overlay">
            <div className="modal-card">
              <h2>Confirm Registration</h2>
              <div className="modal-details-box">
                <p><strong>Tournament:</strong> {selectedTournament.id}</p>
                <p><strong>Game:</strong> {selectedTournament.game}</p>
                <p><strong>Map:</strong> {selectedTournament.map}</p>
                <p><strong>Date:</strong> {selectedTournament.date} {selectedTournament.time}</p>
                <p><strong>Team:</strong> <span className="text-cyan">{teamName}</span></p>
                <p><strong>Entry Fee:</strong> <span className="text-pink">₹{selectedTournament.entryFee}</span></p>
              </div>
              <div className="modal-btn-group">
                <button onClick={handlePayAndRegister} disabled={loading} className="btn-primary-gaming">
                  {loading ? "Processing..." : "Pay & Join Match"}
                </button>
                <button onClick={() => setShowConfirmPay(false)} className="btn-secondary-gaming">
                  Cancel
                </button>
              </div>
              <p className="modal-footer-note">
                Payment uses your wallet balance. If balance is insufficient, you will be automatically redirected to add funds.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const LoginPrompt = ({ onClose, tournament, navigate }) => (
  <div className="modal-overlay">
    <div className="modal-card">
      <h2 className="text-cyan">Login Required</h2>
      <p className="modal-subtitle">Please login to register for {tournament.id}</p>
      <div className="modal-btn-group">
        <button onClick={() => navigate("/login")} className="btn-primary-gaming">
          Login Now
        </button>
        <button onClick={onClose} className="btn-secondary-gaming">
          Cancel
        </button>
      </div>
    </div>
  </div>
)