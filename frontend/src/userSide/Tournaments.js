"use client"

import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import axios from "axios"
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import UserSideNav from "./UserSideNav"
import { SkeletonGrid } from "../components/Skeleton"
import "./Tournaments.css"
import API_BASE_URL from "../config/apiConfig";

const gameThumbs = {
  bgmi: "https://yourcdn.com/bgmi.jpg",
  pubg: "https://yourcdn.com/pubg.jpg",
  cod: "https://yourcdn.com/cod.jpg",
  ff: "https://yourcdn.com/ff.jpg",
}

const CACHE_KEY = "playzone_tournaments_cache"
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes cache

export default function Tournaments() {
  const navigate = useNavigate()
  const location = useLocation()
  const abortControllerRef = useRef(null)

  const [filter, setFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("all") 
  const [viewAll, setViewAll] = useState({ high: false, mid: false, low: false })
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const [selectedTournament, setSelectedTournament] = useState(null)
  const [tournaments, setTournaments] = useState([])
  const [pageLoading, setPageLoading] = useState(true)
  const [fetchError, setFetchError] = useState(null)
  const [retryCount, setRetryCount] = useState(0)
  const [highlightId, setHighlightId] = useState(null)

  const [showTeamForm, setShowTeamForm] = useState(false)
  const [teamName, setTeamName] = useState("")
  const [registerLoading, setRegisterLoading] = useState(false)
  const [showConfirmPay, setShowConfirmPay] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  const isDashboardView = location.pathname.startsWith("/dashboard")

  // Check login status
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"))
    setIsLoggedIn(!!user)
  }, [])

  // Handle highlight from home page navigation
  useEffect(() => {
    if (location.state?.highlightId) {
      setHighlightId(location.state.highlightId)
      // Clear state after using it
      navigate(location.pathname + location.search, { replace: true, state: {} })
      
      // Scroll to highlighted tournament after a short delay
      setTimeout(() => {
        const element = document.getElementById(`tournament-${location.state.highlightId}`)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' })
          // Remove highlight after 4 seconds (matching 5-blink animation)
          setTimeout(() => setHighlightId(null), 4000)
        }
      }, 500)
    }
  }, [location.state, navigate])

  // Resume registration flow from redirect
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

  // Fetch tournaments with caching and abort controller
  useEffect(() => {
    const fetchTournaments = async () => {
      // Cancel previous request if any
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      abortControllerRef.current = new AbortController()

      // Check cache first
      const cached = getCachedTournaments()
      if (cached) {
        setTournaments(cached)
        setPageLoading(false)
        setFetchError(null)
        return
      }

      setPageLoading(true)
      setFetchError(null)

      try {
        const res = await axios.get(`${API_BASE_URL}/admin/tournaments`, {
          signal: abortControllerRef.current.signal
        })
        
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
        setCacheTournaments(data)
        setFetchError(null)
      } catch (err) {
        if (err.name === "CanceledError" || err.code === "ERR_CANCELED") {
          return // Silently ignore cancelled requests
        }
        console.error("Error fetching tournaments:", err)
        setFetchError("Failed to load tournaments. Please check your connection.")
        toast.error("Failed to load tournaments")
      } finally {
        setPageLoading(false)
      }
    }

    fetchTournaments()

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [retryCount])

  // Cache helpers
  const getCachedTournaments = () => {
    try {
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY))
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data
      }
      return null
    } catch {
      return null
    }
  }

  const setCacheTournaments = (data) => {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        data,
        timestamp: Date.now()
      }))
    } catch {
      // localStorage might be full, silently fail
    }
  }

  // Memoized derived data for performance
  const availableDates = useMemo(() => {
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
  }, [tournaments])

  const filtered = useMemo(() => {
    return tournaments.filter((t) => {
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
  }, [tournaments, filter, dateFilter])

  const { high, mid, low } = useMemo(() => {
    return {
      high: filtered.filter((t) => t.poolPrize > 1000),
      mid: filtered.filter((t) => t.poolPrize <= 1000 && t.poolPrize >= 500),
      low: filtered.filter((t) => t.poolPrize < 500),
    }
  }, [filtered])

  const handleTournamentClick = useCallback((tournament) => {
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
    
    // Navigate to tournament detail page
    navigate(`/tournament/${tournament.id}`)
  }, [navigate])

  const handleBack = useCallback(() => navigate(-1), [navigate])

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
      setRegisterLoading(true)

      let user = JSON.parse(localStorage.getItem("user"))
      if (!user?._id) {
        const userName = localStorage.getItem("userName")
        if (userName) {
          const res = await axios.get(`${API_BASE_URL}/user/${encodeURIComponent(userName)}`)
          user = res.data
        }
      }
      if (!user?._id) {
        toast.error("Please login again")
        navigate("/login")
        return
      }

      const userRes = await axios.get(`${API_BASE_URL}/user/id/${user._id}`)
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
      
      const reg = await axios.post(`${API_BASE_URL}/tournament/register`, payload)
      
      toast.success(reg.data?.message || "Registered successfully! 🎉", {
        autoClose: 3000
      })

      try {
        const refreshed = await axios.get(`${API_BASE_URL}/user/id/${user._id}`)
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
      setRegisterLoading(false)
    }
  }

  const handleRetry = useCallback(() => {
    setRetryCount(prev => prev + 1)
  }, [])

  const renderRow = useCallback((list, category) => {
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
          {visible.map((t) => {
            const isHighlighted = highlightId === t.id
            return (
              <div 
                key={t.id} 
                id={`tournament-${t.id}`}
                className={`tournament-card ${isHighlighted ? 'tournament-highlighted' : ''}`}
                onClick={() => handleTournamentClick(t)}
              >
                <div className="tournament-img-wrapper">
                  <img src={t.thumbnail} alt={t.game} className="tournament-img" loading="lazy" />
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
            )
          })}
        </div>
      </div>
    )
  }, [viewAll, handleTournamentClick, navigate, highlightId])

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

        {/* Show skeleton while loading */}
        {pageLoading ? (
          <div className="page-loading-container">
            <div className="loading-spinner">
              <div className="spinner-ring"></div>
              <p>Loading tournaments...</p>
            </div>
            <SkeletonGrid count={6} />
          </div>
        ) : fetchError ? (
          /* Error state with retry */
          <div className="empty-arena-state">
            <div className="error-icon">⚠️</div>
            <h3>Something went wrong</h3>
            <p>{fetchError}</p>
            <button onClick={handleRetry} className="btn-primary-gaming mt-3">
              🔄 Try Again
            </button>
          </div>
        ) : (
          <>
            {/* Main Status Filters (always visible) */}
            <div className="filter-main-bar">
                        
              <div className="filter-row">
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
                  <button onClick={() => setShowFilters(!showFilters)} className="more-filters-btn">
                    {showFilters ? "✕ Less" : "📅 More Filters"} &nbsp;
                  </button>
                
                </div>
                {/* Date Filter (collapsible) */}
                {showFilters && (
                  <div className="date-filter-expanded" style={{ margin: "1% auto", textAlign:"center"}}>
                    <label>Filter by Date:</label>
                    <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="date-select">
                      <option value="all">All Dates ({tournaments.length})</option>
                      {availableDates.map(({ value, label }) => {
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
                )}

                <div className="filter-count-text">
                  Showing {filtered.length} tournament{filtered.length !== 1 ? 's' : ''} 
                  {filter !== "all" && ` (${filter})`}
                  {dateFilter !== "all" && ` on ${availableDates.find(d => d.value === dateFilter)?.label || dateFilter}`}
                </div>
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
                <button onClick={handlePayAndRegister} disabled={registerLoading} className="btn-primary-gaming">
                  {registerLoading ? "Processing..." : "Pay & Join Match"}
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