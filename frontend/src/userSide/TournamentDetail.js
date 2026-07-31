"use client"
import { useState, useEffect, useCallback } from "react"
import { useParams, useNavigate } from "react-router-dom"
import axios from "axios"
import { toast } from 'react-toastify'
import "./TournamentDetail.css"

const CACHE_KEY = "playzone_tournament_detail_cache"
const CACHE_DURATION = 3 * 60 * 1000 // 3 minutes

export default function TournamentDetail() {
  const navigate = useNavigate()
  const { id } = useParams()
  
  const [tournament, setTournament] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userData, setUserData] = useState(null)
  const [teamName, setTeamName] = useState("")
  const [registerLoading, setRegisterLoading] = useState(false)
  const [showTeamForm, setShowTeamForm] = useState(false)
  const [showConfirmPay, setShowConfirmPay] = useState(false)
  const [expandedTeam, setExpandedTeam] = useState(null)
  const [countdown, setCountdown] = useState("")

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"))
    setIsLoggedIn(!!user)
    const userName = localStorage.getItem("userName")
    if (userName) {
      axios.get(`http://localhost:5000/user/${userName}`)
        .then(res => setUserData(res.data))
        .catch(() => {})
    }

    // Check if user just logged in and should register for this tournament
    const registerIntent = localStorage.getItem("tournament_register_intent")
    if (registerIntent && user) {
      try {
        const intent = JSON.parse(registerIntent)
        if (intent.tournamentId === id) {
          localStorage.removeItem("tournament_register_intent")
          // Open registration form after a short delay
          setTimeout(() => {
            setShowTeamForm(true)
          }, 500)
        }
      } catch {}
    }
  }, [id])

  useEffect(() => {
    const fetchTournament = async () => {
      // Check cache
      const cacheKey = `${CACHE_KEY}_${id}`
      const cached = localStorage.getItem(cacheKey)
      if (cached) {
        try {
          const parsed = JSON.parse(cached)
          if (Date.now() - parsed.timestamp < CACHE_DURATION) {
            setTournament(parsed.data)
            setLoading(false)
            return
          }
        } catch {}
      }

      setLoading(true)
      setError(null)
      try {
        const res = await axios.get(`http://localhost:5000/admin/tournaments/${id}`)
        setTournament(res.data)
        // Cache it
        localStorage.setItem(cacheKey, JSON.stringify({
          data: res.data,
          timestamp: Date.now()
        }))
      } catch (err) {
        console.error("Error fetching tournament:", err)
        setError("Failed to load tournament details. Please try again.")
      } finally {
        setLoading(false)
      }
    }
    if (id) fetchTournament()
  }, [id])

  // Countdown timer for upcoming tournaments
  useEffect(() => {
    if (!tournament || tournament.t_status !== "pending") return
    
    const interval = setInterval(() => {
      const tournamentDate = new Date(tournament.t_date)
      const now = new Date()
      const diff = tournamentDate - now
      
      if (diff <= 0) {
        setCountdown("STARTING SOON")
        return
      }
      
      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)
      
      if (days > 0) {
        setCountdown(`${days}d ${hours}h ${minutes}m`)
      } else if (hours > 0) {
        setCountdown(`${hours}h ${minutes}m ${seconds}s`)
      } else {
        setCountdown(`${minutes}m ${seconds}s`)
      }
    }, 1000)
    
    return () => clearInterval(interval)
  }, [tournament])

  const handleBack = useCallback(() => navigate(-1), [navigate])

  const isParticipant = userData && tournament?.participants?.some(
    p => p.user_id?._id?.toString() === userData._id?.toString() ||
         p.user_id?.toString() === userData._id?.toString()
  )

  const canRegister = tournament &&
    tournament.t_status === "pending" &&
    isLoggedIn &&
    !isParticipant &&
    (tournament.participants?.length || 0) < (tournament.slots || 16)

  const handleRegisterClick = () => {
    if (!isLoggedIn) {
      toast.info("Please login to register for this tournament")
      // Save intent to redirect back after login
      localStorage.setItem("tournament_register_intent", JSON.stringify({
        tournamentId: id,
        timestamp: Date.now()
      }))
      navigate("/login")
      return
    }
    setShowTeamForm(true)
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
    if (!tournament) return
    try {
      setRegisterLoading(true)
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
      const fee = Number(tournament.entry_fee || 0)

      if (balance < fee) {
        toast.info("Insufficient balance. Redirecting to payment page...")
        setTimeout(() => {
          navigate("/payments", {
            state: {
              action: "topup_then_register",
              topUpFor: "tournament",
              requiredAmount: Math.max(fee - balance, 1),
              returnTo: `/tournament/${id}`,
              meta: tournament,
              teamName: teamName,
            },
          })
        }, 1500)
        return
      }

      const payload = {
        user_id: user._id,
        tournament_id: tournament.t_id,
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
      } catch {}
      
      setShowConfirmPay(false)
      setTeamName("")
      // Refresh tournament data
      const res = await axios.get(`http://localhost:5000/admin/tournaments/${id}`)
      setTournament(res.data)
    } catch (err) {
      toast.error(err?.response?.data?.message || "Registration failed. Please try again.")
    } finally {
      setRegisterLoading(false)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="td-page">
        <div className="td-loading-container">
          <div className="td-spinner"></div>
          <p className="td-loading-text">Loading tournament details...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !tournament) {
    return (
      <div className="td-page">
        <div className="td-error-container">
          <div className="td-error-icon">⚠️</div>
          <h2>Tournament Not Found</h2>
          <p>{error || "The tournament you're looking for doesn't exist or has been removed."}</p>
          <button onClick={() => navigate("/tournaments")} className="btn-primary-gaming">
            Browse Tournaments
          </button>
        </div>
      </div>
    )
  }

  const prizePool = (tournament.rewards?.first || 0) +
    (tournament.rewards?.second || 0) +
    (tournament.rewards?.third || 0)

  const slotsFilled = tournament.participants?.length || 0
  const totalSlots = tournament.slots || 16
  const slotsProgress = Math.round((slotsFilled / totalSlots) * 100)
  const slotsRemaining = totalSlots - slotsFilled

  const getModeIcon = (mode) => {
    if (mode === "squad") return "👥"
    if (mode === "duo") return "👫"
    return "👤"
  }

  return (
    <div className="td-page">
      <button onClick={handleBack} className="td-back-btn">← Back</button>

      <div className="td-container">
        {/* Hero Section with Game Background */}
        <div className="td-hero">
          {tournament.thumbnail && (
            <div 
              className="td-hero-bg-image"
              style={{ backgroundImage: `url(${tournament.thumbnail})` }}
            ></div>
          )}
          <div className="td-hero-bg-overlay"></div>
          <div className="td-hero-content">
            <div className="td-hero-badges">
              <div className={`td-status-badge ${tournament.t_status}`}>
                {(tournament.t_status === "pending" && "UPCOMING") ||
                 (tournament.t_status === "running" && "🔴 LIVE") ||
                 (tournament.t_status === "completed" && "COMPLETED")}
              </div>
              {tournament.t_status === "pending" && countdown && (
                <div className="td-countdown-badge">
                  ⏰ Starts in: {countdown}
                </div>
              )}
            </div>
            <h1 className="td-title">{tournament.t_id}</h1>
            <p className="td-game-name">{tournament.game?.toUpperCase()} • {tournament.map}</p>
            <div className="td-hero-stats">
              <div className="td-hero-stat">
                <span className="td-hero-stat-value">₹{prizePool}</span>
                <span className="td-hero-stat-label">Prize Pool</span>
              </div>
              <div className="td-hero-stat">
                <span className="td-hero-stat-value">{slotsFilled}/{totalSlots}</span>
                <span className="td-hero-stat-label">Slots</span>
              </div>
              <div className="td-hero-stat">
                <span className="td-hero-stat-value">{getModeIcon(tournament.mode_type || "solo")} {(tournament.mode_type || "solo").toUpperCase()}</span>
                <span className="td-hero-stat-label">Mode</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="td-content-grid">
          {/* Left Column - Details */}
          <div className="td-left">
            {/* Info Cards */}
            <div className="td-info-cards">
              <div className="td-info-card">
                <span className="td-info-icon">🎮</span>
                <span className="td-info-label">Game</span>
                <span className="td-info-value">{tournament.game?.toUpperCase()}</span>
              </div>
              <div className="td-info-card">
                <span className="td-info-icon">🗺️</span>
                <span className="td-info-label">Map</span>
                <span className="td-info-value">{tournament.map}</span>
              </div>
              <div className="td-info-card">
                <span className="td-info-icon">⚔️</span>
                <span className="td-info-label">Mode</span>
                <span className="td-info-value">{(tournament.mode_type || "solo").toUpperCase()}</span>
              </div>
              <div className="td-info-card">
                <span className="td-info-icon">📅</span>
                <span className="td-info-label">Date</span>
                <span className="td-info-value">{new Date(tournament.t_date).toLocaleDateString('en-IN')}</span>
              </div>
              <div className="td-info-card">
                <span className="td-info-icon">⏰</span>
                <span className="td-info-label">Time</span>
                <span className="td-info-value">{tournament.t_time}</span>
              </div>
              <div className="td-info-card">
                <span className="td-info-icon">💵</span>
                <span className="td-info-label">Entry Fee</span>
                <span className="td-info-value td-fee">₹{tournament.entry_fee}</span>
              </div>
            </div>

            {/* Prize Pool */}
            <div className="td-section">
              <h3 className="td-section-title">🏆 Prize Pool Distribution</h3>
              <div className="td-prizes">
                <div className="td-prize-card td-prize-1st">
                  <div className="td-prize-medal">🥇</div>
                  <div className="td-prize-info">
                    <span className="td-prize-rank">1st Place</span>
                    <span className="td-prize-amount">₹{tournament.rewards?.first || 0}</span>
                  </div>
                </div>
                <div className="td-prize-card td-prize-2nd">
                  <div className="td-prize-medal">🥈</div>
                  <div className="td-prize-info">
                    <span className="td-prize-rank">2nd Place</span>
                    <span className="td-prize-amount">₹{tournament.rewards?.second || 0}</span>
                  </div>
                </div>
                <div className="td-prize-card td-prize-3rd">
                  <div className="td-prize-medal">🥉</div>
                  <div className="td-prize-info">
                    <span className="td-prize-rank">3rd Place</span>
                    <span className="td-prize-amount">₹{tournament.rewards?.third || 0}</span>
                  </div>
                </div>
              </div>
              <div className="td-prize-total">
                <span className="td-prize-total-icon">💰</span>
                Total Prize Pool: <strong>₹{prizePool}</strong>
              </div>
            </div>

            {/* Tournament Rules */}
            <div className="td-section">
              <h3 className="td-section-title">📋 Tournament Rules & Regulations</h3>
              <ul className="td-rules">
                <li>All participants must join the match room at least 5 minutes before the scheduled time.</li>
                <li>Fair play is mandatory. Any form of cheating, hacking, or teaming with enemies will result in immediate disqualification.</li>
                <li>Entry fee is non-refundable once the tournament starts.</li>
                <li>Results are final and binding. No disputes will be entertained after result publication.</li>
                <li>Players must use their registered in-game ID. Any mismatch will lead to disqualification.</li>
                <li>Room ID and password will be shared in the tournament lobby before the match.</li>
                <li>In case of a tie, the player with more kills/points will be ranked higher.</li>
              </ul>
            </div>

            {/* Tournament Format */}
            <div className="td-section">
              <h3 className="td-section-title">📊 Tournament Format</h3>
              <div className="td-format-grid">
                <div className="td-format-card">
                  <div className="td-format-icon">🎯</div>
                  <div className="td-format-info">
                    <h4>Match Type</h4>
                    <p>{(tournament.mode_type || "solo").toUpperCase()}</p>
                  </div>
                </div>
                <div className="td-format-card">
                  <div className="td-format-icon">👥</div>
                  <div className="td-format-info">
                    <h4>Team Size</h4>
                    <p>{tournament.mode_type === "squad" ? "4 Players" : tournament.mode_type === "duo" ? "2 Players" : "1 Player"}</p>
                  </div>
                </div>
                <div className="td-format-card">
                  <div className="td-format-icon">🏆</div>
                  <div className="td-format-info">
                    <h4>Qualification</h4>
                    <p>Top 3 Winners</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Registration & Teams */}
          <div className="td-right">
            {/* Registration Card */}
            <div className="td-reg-card">
              <h3 className="td-reg-title">⚔️ Join the Battle</h3>
              
              <div className="td-slots">
                <div className="td-slots-header">
                  <span>Slots Available</span>
                  <span className="td-slots-count">{slotsRemaining} / {totalSlots}</span>
                </div>
                <div className="td-slots-bar">
                  <div className="td-slots-fill" style={{ width: `${slotsProgress}%` }}></div>
                </div>
                <div className="td-slots-percentage">{slotsProgress}% Filled</div>
              </div>

              {isParticipant ? (
                <div className="td-registered-badge">
                  ✅ You are registered for this tournament
                </div>
              ) : tournament.t_status === "completed" ? (
                <div className="td-status-msg">This tournament has ended. Check the results!</div>
              ) : tournament.t_status === "running" ? (
                <div className="td-status-msg">This tournament is currently running. Registration is closed.</div>
              ) : slotsFilled >= totalSlots ? (
                <div className="td-status-msg">All slots are filled! Registration is closed.</div>
              ) : canRegister ? (
                <button onClick={handleRegisterClick} className="td-register-btn">
                  ⚡ Register Now — ₹{tournament.entry_fee}
                </button>
              ) : (
                <div className="td-login-prompt">
                  <p className="td-login-text">Please login to register for this tournament</p>
                  <button 
                    onClick={() => {
                      localStorage.setItem("tournament_register_intent", JSON.stringify({
                        tournamentId: id,
                        timestamp: Date.now()
                      }))
                      navigate("/login")
                    }} 
                    className="td-login-btn"
                  >
                    🔐 Login to Register
                  </button>
                </div>
              )}

              {tournament.t_status === "running" && (
                <div className="td-live-msg">🔴 LIVE — Tournament is in progress</div>
              )}

              {tournament.result_published && (
                <button
                  onClick={() => navigate(`/tournaments/results/${tournament.t_id}`)}
                  className="td-results-btn"
                >
                  🏆 View Results
                </button>
              )}
            </div>

            {/* Participants */}
            <div className="td-section">
              <h3 className="td-section-title">
                ⚔️ Warriors ({slotsFilled})
              </h3>
              {tournament.participants?.length > 0 ? (
                <div className="td-teams-list">
                  {tournament.participants.map((p, idx) => {
                    const playerName = p.user_id?.fullName || p.user_id?.username || "Unknown Player"
                    const isCurrentUser = userData &&
                      (p.user_id?._id?.toString() === userData._id?.toString() ||
                       p.user_id?.toString() === userData._id?.toString())
                    return (
                      <div
                        key={idx}
                        className={`td-team-item ${isCurrentUser ? 'td-current-user' : ''}`}
                        onClick={() => setExpandedTeam(expandedTeam === idx ? null : idx)}
                      >
                        <div className="td-team-info">
                          <span className="td-team-rank">#{idx + 1}</span>
                          <span className="td-team-name">{playerName}</span>
                          {p.team_name && <span className="td-team-tag">Team: {p.team_name}</span>}
                          {isCurrentUser && <span className="td-you-tag">YOU</span>}
                          {p.rank > 0 && <span className="td-rank-tag">#{p.rank}</span>}
                        </div>
                        {expandedTeam === idx && (
                          <div className="td-team-expanded">
                            <p>Team: {p.team_name || "Solo"}</p>
                            <p>Status: {p.payment_status === "paid" ? "✅ Registered" : "⏳ Pending"}</p>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="td-no-teams">
                  <div className="td-no-teams-icon">⚔️</div>
                  <p>No warriors yet. Be the first to join the battle!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Team Form Modal */}
      {showTeamForm && (
        <div className="td-modal-overlay">
          <div className="td-modal-card">
            <div className="td-modal-icon">⚔️</div>
            <h2>Join the Battle</h2>
            <p className="td-modal-subtitle">Entry Fee: ₹{tournament.entry_fee}</p>
            <form onSubmit={handleTeamSave}>
              <input
                type="text"
                placeholder="Enter Your Squad Name"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                required
                className="td-input"
              />
              <div className="td-modal-btns">
                <button type="submit" disabled={registerLoading} className="btn-primary-gaming">
                  {registerLoading ? "Saving..." : "Save & Continue"}
                </button>
                <button type="button" onClick={() => setShowTeamForm(false)} className="btn-secondary-gaming">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Payment Modal */}
      {showConfirmPay && (
        <div className="td-modal-overlay">
          <div className="td-modal-card">
            <div className="td-modal-icon">💥</div>
            <h2>Confirm Registration</h2>
            <div className="td-modal-details">
              <p><strong>Tournament:</strong> {tournament.t_id}</p>
              <p><strong>Game:</strong> {tournament.game}</p>
              <p><strong>Map:</strong> {tournament.map}</p>
              <p><strong>Date:</strong> {new Date(tournament.t_date).toLocaleDateString()} {tournament.t_time}</p>
              <p><strong>Squad:</strong> <span className="td-cyan">{teamName}</span></p>
              <p><strong>Entry Fee:</strong> <span className="td-pink">₹{tournament.entry_fee}</span></p>
            </div>
            <div className="td-modal-btns">
              <button onClick={handlePayAndRegister} disabled={registerLoading} className="btn-primary-gaming">
                {registerLoading ? "Processing..." : "⚡ Pay & Join Match"}
              </button>
              <button onClick={() => setShowConfirmPay(false)} className="btn-secondary-gaming">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}