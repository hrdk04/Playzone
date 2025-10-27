"use client"

import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import axios from "axios"
import theme from "../theme"
import UserSideNav from "./UserSideNav"

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
  const [viewAll, setViewAll] = useState({ high: false, mid: false, low: false })
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const [selectedTournament, setSelectedTournament] = useState(null)
  const [tournaments, setTournaments] = useState([])

  // NEW STATES
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
        // Automatically trigger registration after returning from payment
        setShowConfirmPay(true)
        setTimeout(() => {
          handlePayAndRegister()
        }, 500)
      }
      // Clear the state after processing
      navigate(location.pathname + location.search, { replace: true, state: {} })
    }
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
      .catch((err) => console.error("Error fetching tournaments:", err))
  }, [])

  const handleTournamentClick = (tournament) => {
    // Handle completed tournaments differently
    if (tournament.status === "completed") {
      if (tournament.result_published) {
        // Navigate to results page for completed tournaments with published results
        navigate(`/tournaments/results/${tournament.id}`)
      } else {
        // Show message for completed tournaments without results
        alert("Tournament completed but results are not yet published. Please check back later.")
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
    if (!teamName.trim()) return
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
        alert("Please login again.")
        navigate("/login")
        return
      }

      const userRes = await axios.get(`http://localhost:5000/user/id/${user._id}`)
      const balance = Number(userRes.data?.amount || 0)
      const fee = Number(selectedTournament.entryFee || 0)

      if (balance < fee) {
        const deficit = Math.max(fee - balance, 1)
        navigate("/payments", {
          state: {
            action: "topup_then_register",
            topUpFor: "tournament",
            requiredAmount: deficit,
            returnTo: location.pathname + location.search, // Preserve exact location
            meta: selectedTournament,
            teamName: teamName,
          },
        })
        return
      }

      const payload = {
        user_id: user._id,
        tournament_id: selectedTournament.id,
        team_name: teamName,
        payment_method: "wallet", // was pay_method; fixing to match server.js
      }
      const reg = await axios.post("http://localhost:5000/tournament/register", payload)
      alert(reg.data?.message || "Registered successfully!")

      // Refresh user balance from backend and persist so Dashboard reflects deduction
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
      alert(err?.response?.data?.message || "Registration failed.")
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => navigate(-1)

  const filtered = tournaments.filter((t) => {
    if (filter === "all") return t.status === "pending" || t.status === "running"
    if (filter === "pending") return t.status === "pending"
    if (filter === "running") return t.status === "running"
    if (filter === "upcoming") return t.status === "pending" || t.status === "running"
    if (filter === "completed") return t.status === "completed"
    return t.status === filter
  })

  const high = filtered.filter((t) => t.poolPrize > 1000)
  const mid = filtered.filter((t) => t.poolPrize <= 1000 && t.poolPrize >= 500)
  const low = filtered.filter((t) => t.poolPrize < 500)

  const renderRow = (list, category) => {
    const limit = 4
    const visible = viewAll[category] ? list : list.slice(0, limit)

    return (
      <div style={{ marginBottom: "2rem" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingRight: "2rem",
          }}
        >
          <h2
            style={{
              fontSize: theme.sizes.sectionTitleFontSize,
              color: theme.colors.secondary,
              textShadow: theme.shadows.sectionTitleGlow,
              marginBottom: "1rem",
            }}
          >
            {category === "high" && "Pool Prize > ₹1000"}
            {category === "mid" && "₹500 - ₹1000 Tournaments"}
            {category === "low" && "< ₹500 Tournaments"}
          </h2>

          {list.length > limit && (
            <button
              onClick={() => setViewAll({ ...viewAll, [category]: !viewAll[category] })}
              style={{
                marginTop: "1rem",
                padding: theme.spacing.buttonPadding,
                background: theme.gradients.secondaryButton,
                color: theme.colors.white,
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                boxShadow: theme.shadows.buttonShadow,
              }}
            >
              {viewAll[category] ? "Show Less" : "View All"}
            </button>
          )}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: viewAll[category]
              ? "repeat(auto-fit, minmax(320px, 1fr))"
              : "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "1rem",
          }}
        >
          {visible.map((t) => (
            <div
              key={t.id}
              style={{
                backgroundImage: `url(${t.thumbnail})`,
                backgroundPosition: "center",
                backgroundSize: "cover",
                padding:t.status === 'completed'? "0" :"1rem",
                borderRadius: "8px",
                minHeight: "220px",
                position: "relative",
                overflow: "hidden",
                cursor: "pointer",
                transition: "transform 0.3s ease",
                opacity: t.status === "completed" ? 1 : 1,
                filter: t.status === "completed" ? "none" : "none",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateX(5px)"
              }}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "translateX(0)")}
              onClick={() => handleTournamentClick(t)}
            >
              <div
                style={{
                  backgroundColor: "rgba(0,0,0,0.6)",
                  padding: "0.5rem",
                  borderRadius: "8px",
                  color: theme.colors.white,
                  height: "95%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  position: "relative",
                }}
              >
                <div style={ {textAlign: t.status==='completed' ? 'none': 'center', } }>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems:  "center", marginBottom: "0.5rem" }}>
                    <h3
                      style={{
                        color: theme.colors.primary,
                        margin: 0,
                        fontSize: "1.1rem"
                      }}
                    >
                      {t.id}
                    </h3>
                    <span style={{
                      padding: "0.2rem 0.5rem",
                      borderRadius: "12px",
                      fontSize: "0.7rem",
                      fontWeight: "bold",
                      background: t.status === "completed" ? "#28a745" : 
                                 t.status === "running" ? "#ffc107" : 
                                 t.status === "pending" ? "#17a2b8" : "#6c757d",
                      color: "#fff"
                    }}>
                      {t.status==="pending" ?  "upcoming".toUpperCase():"".toUpperCase()
                       || t.status === 'running'? "running".toUpperCase(): ""
                       || t.status === 'completed'? "completed".toUpperCase(): ""}
                    </span>
                  </div>
                  <p style={{ margin: "0.2rem 0", fontSize: "1.5rem", color: theme.colors.secondary, textAlign:'center' }}>🏆 Prizepool:  ₹{t.poolPrize}</p>
                  
                  
                  <p style={{ margin: "0.2rem 0", fontSize: "1rem",paddingTop:'6px' }}>🎮 {t.game}</p>
                  <p style={{ margin: "0.2rem 0", fontSize: "1rem",paddingTop:'6px' }}>🗺️ Map: {t.map}</p>
                  <p style={{ margin: "0.2rem 0", fontSize: "1rem", paddingTop: "6px" }}>
                        📅 {t.date}{" "}
                        {parseInt(t.time) >= 12
                          ? `${t.time} PM`
                          : `${t.time} AM`}
                      </p>
                  <p style={{ margin: "0.2rem 0", fontSize: "1rem",paddingTop:'6px', color:'#65dda5ff' }}>💰 Entry: ₹{t.entryFee}</p>
                  
                  
                  {/* Results Available Indicator */}
                  {t.status === "completed" && t.result_published && (
                    <div style={{
                      margin: "0.5rem 0",
                      padding: "0.3rem 0.6rem",
                      background: "rgba(0, 255, 200, 0.2)",
                      border: "1px solid #00ffcc",
                      borderRadius: "4px",
                      fontSize: "0.8rem",
                      color: "#00ffcc",
                      textAlign: "center",
                      fontWeight: "bold"
                    }}>
                      🏆 Results Published
                    </div>
                  )}
                </div>
                
                {/* Completed overlay */}
                {t.status === "completed" && (
                  <div style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    background: "rgba(0, 0, 0, 0.9)",
                    color: "#fff",
                    padding: "1rem",
                    borderRadius: "8px",
                    textAlign: "center",
                    fontWeight: "bold",
                    fontSize: "1.2rem",
                    border: "2px solid #28a745",
                    cursor: "pointer",
                    transition: "all 0.3s ease"
                  }}
                  onClick={(e) => {
                    e.stopPropagation()
                    if (t.result_published) {
                      navigate(`/tournaments/results/${t.id}`,"_blank")
                    } else {
                      alert("Tournament completed but results are not yet published. Please check back later.")
                    }
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = "rgba(40, 167, 69, 0.9)"
                    e.target.style.transform = "translate(-50%, -50%) scale(1.05)"
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = "rgba(0, 0, 0, 0.9)"
                    e.target.style.transform = "translate(-50%, -50%) scale(1)"
                  }}
                  >
                    {t.result_published ? "🏆 View Results" : "⏳ Results Pending"}
                  </div>
                )}
                
                <div
                  style={{
                    position: "absolute",
                    bottom: "0",
                    left: "0",
                    height: "100%",
                    width: "100%",
                    backgroundColor: "rgba(0, 0, 0, 1)",
                    borderRadius: "8px",
                    opacity: 0,
                    transition: "opacity 0.4s ease",
                    textAlign:'center'
                  }}
                  onMouseEnter={(e) => (t.status==="completed" ? "none" : e.currentTarget.style.opacity = 1)}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = 0)}
                >
                  <center><p style={{ margin: "0.2rem 0", fontSize: "2rem", color: theme.colors.secondary }}>🏆 Pool: ₹{t.poolPrize}</p>
                  </center> 
                  <p style={{fontSize:'1.5rem'}}>🏆 1st: {t.reward_1}</p>
                  <p style={{fontSize:'1.3rem'}}>🥈 2nd: {t.reward_2}</p>
                  <p style={{fontSize:'1.2rem'}}>🥉 3rd: {t.reward_3}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        backgroundColor: isDashboardView ? "transparent" : theme.colors.darkGray,
        backgroundImage:" url('https://st4.depositphotos.com/24297044/27344/v/450/depositphotos_273440920-stock-illustration-blue-background-gradient-abstract-texture.jpg')",
        backgroundRepeat:'no-repeat',
        backgroundSize:"cover",
        backgroundPosition:'center',
        backgroundAttachment:'fixed',
        minHeight: isDashboardView ? "auto" : "100vh",
        color: theme.colors.white,
        fontFamily: theme.fonts.primary,
        padding: isDashboardView ? "1rem" : "2rem",
      }}
    >
      {isLoggedIn && (
        <>
          <UserSideNav />
          <button
            onClick={handleBack}
            style={{
              marginLeft: "90%",
              padding: "10px 20px",
              borderRadius: "6px",
              border: "none",
              background: theme.gradients.secondaryButton,
              color: theme.colors.white,
              cursor: "pointer",
              fontFamily: theme.fonts.primary,
              fontSize: "1rem",
              boxShadow: theme.shadows.buttonShadow,
              transition: theme.animations.transition,
            }}
          >
            Back
          </button>
        </>
      )}

      <div
        style={{
          position: "sticky",
          top: "10%",
          border: "2px solid #81959fff",
          background: "#ffffff16",
          borderRadius: "10px",
          width: "85vw",
          margin: "6% auto",
          padding: "1% 2%",
          height: "max-content",
        }}
      >
        <h1
          style={{
            fontSize: theme.sizes.titleFontSize,
            textAlign: "center",
            marginBottom: "1rem",
            textShadow: theme.shadows.titleGlow,
          }}
        >
          Playzone Tournaments
        </h1>

        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ marginBottom: "1rem", color: theme.colors.lightGray }}>
            Showing {filtered.length} tournament{filtered.length !== 1 ? 's' : ''} 
            {filter !== "all" && ` (${filter} tournaments)`}
          </div>
          <button
            onClick={() => setFilter("all")}
            style={{
              margin: "0 0.5rem",
              padding: "0.5rem 1rem",
              border: "none",
              borderRadius: "4px",
              color: "#fff",
              cursor: "pointer",
              boxShadow: "0 0 10px #ff00ff",
              background: filter === "all" ? theme.gradients.primaryButton : theme.gradients.secondaryButton,
            }}
          >
            All ({tournaments.length - tournaments.filter(t => t.status === "completed").length})
          </button>
          <button
            onClick={() => setFilter("upcoming")}
            style={{
              margin: "0 0.5rem",
              padding: "0.5rem 1rem",
              border: "none",
              borderRadius: "4px",
              color: "#fff",
              cursor: "pointer",
              boxShadow: "0 0 10px #ff00ff",
              background: filter === "upcoming" ? theme.gradients.primaryButton : theme.gradients.secondaryButton,
            }}
          >
            Upcoming ({tournaments.filter(t => t.status === "pending" || t.status === "running").length})
          </button>
          <button
            onClick={() => setFilter("running")}
            style={{
              margin: "0 0.5rem",
              padding: "0.5rem 1rem",
              border: "none",
              borderRadius: "4px",
              color: "#fff",
              cursor: "pointer",
              boxShadow: "0 0 10px #ff00ff",
              background: filter === "running" ? theme.gradients.primaryButton : theme.gradients.secondaryButton,
            }}
          >
            Running ({tournaments.filter(t => t.status === "running").length})
          </button>
          <button
            onClick={() => setFilter("completed")}
            style={{
              margin: "0 0.5rem",
              padding: "0.5rem 1rem",
              border: "none",
              borderRadius: "4px",
              color: "#fff",
              cursor: "pointer",
              boxShadow: "0 0 10px #ff00ff",
              background: filter === "completed" ? theme.gradients.primaryButton : theme.gradients.secondaryButton,
            }}
          >
            Completed ({tournaments.filter(t => t.status === "completed").length})
          </button>
        </div>

        {filtered.length === 0 ? (
          <div style={{
            textAlign: "center",
            padding: "3rem",
            color: theme.colors.lightGray,
            fontSize: "1.2rem"
          }}>
            <h3>No tournaments found</h3>
            <p>No tournaments match the current filter criteria.</p>
            <button
              onClick={() => setFilter("all")}
              style={{
                marginTop: "1rem",
                padding: "0.75rem 1.5rem",
                border: "none",
                borderRadius: "4px",
                color: "#fff",
                cursor: "pointer",
                boxShadow: "0 0 10px #ff00ff",
                background: theme.gradients.primaryButton,
              }}
            >
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

        {showLoginPrompt && selectedTournament && (
          <LoginPrompt
            tournament={selectedTournament}
            navigate={navigate}
            onClose={() => {
              setShowLoginPrompt(false)
              setSelectedTournament(null)
            }}
          />
        )}

        {showTeamForm && selectedTournament && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(0,0,0,0.7)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 1000,
            }}
          >
            <div
              style={{
                backgroundColor: "#111",
                padding: "2rem",
                borderRadius: "10px",
                width: "90%",
                maxWidth: "420px",
                textAlign: "center",
                border: `1px solid ${theme.colors.primary}`,
              }}
            >
              <h2>Register Team</h2>
              <p>Entry Fee: ₹{selectedTournament.entryFee}</p>
              <form onSubmit={handleTeamSave}>
                <input
                  type="text"
                  placeholder="Enter Team Name"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  required
                  style={{
                    width: "90%",
                    padding: "10px",
                    margin: "10px 0",
                    borderRadius: "5px",
                    border: "1px solid #555",
                  }}
                />
                <div style={{ display: "flex", justifyContent: "center", gap: "1rem" }}>
                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      margin: "0 0.5rem",
                      padding: "0.5rem 1rem",
                      border: "none",
                      borderRadius: "4px",
                      color: "#fff",
                      cursor: "pointer",
                      boxShadow: "0 0 10px #ff00ff",
                      background: theme.gradients.primaryButton,
                    }}
                  >
                    {loading ? "Saving..." : "Save"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowTeamForm(false)}
                    style={{
                      margin: "0 0.5rem",
                      padding: "0.5rem 1rem",
                      border: "none",
                      borderRadius: "4px",
                      color: "#fff",
                      cursor: "pointer",
                      boxShadow: "0 0 10px #ff00ff",
                      background: theme.gradients.secondaryButton,
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showConfirmPay && selectedTournament && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(0,0,0,0.7)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 1100,
            }}
          >
            <div
              style={{
                backgroundColor: "#111",
                padding: "2rem",
                borderRadius: "10px",
                width: "90%",
                maxWidth: "520px",
                border: `1px solid ${theme.colors.primary}`,
              }}
            >
              <h2 style={{ marginTop: 0 }}>Confirm Registration</h2>
              <div style={{ marginBottom: "1rem", color: theme.colors.lightGray }}>
                <p>
                  <strong>Tournament:</strong> {selectedTournament.id}
                </p>
                <p>
                  <strong>Game:</strong> {selectedTournament.game}
                </p>
                <p>
                  <strong>Map:</strong> {selectedTournament.map}
                </p>
                <p>
                  <strong>Date:</strong> {selectedTournament.date} {selectedTournament.time}
                </p>
                <p>
                  <strong>Team:</strong> {teamName}
                </p>
                <p>
                  <strong>Entry Fee:</strong> ₹{selectedTournament.entryFee}
                </p>
              </div>
              <div style={{ display: "flex", gap: "12px" }}>
                <button
                  onClick={handlePayAndRegister}
                  disabled={loading}
                  style={{
                    margin: "0 0.5rem",
                    padding: "0.75rem 1.5rem",
                    border: "none",
                    borderRadius: "4px",
                    color: "#fff",
                    cursor: "pointer",
                    boxShadow: "0 0 10px #ff00ff",
                    background: theme.gradients.primaryButton,
                  }}
                >
                  {loading ? "Processing..." : "Pay & Join"}
                </button>
                <button
                  onClick={() => setShowConfirmPay(false)}
                  style={{
                    margin: "0 0.5rem",
                    padding: "0.75rem 1.5rem",
                    border: "none",
                    borderRadius: "4px",
                    color: "#fff",
                    cursor: "pointer",
                    boxShadow: "0 0 10px #ff00ff",
                    background: theme.gradients.secondaryButton,
                  }}
                >
                  Close
                </button>
              </div>
              <p style={{ marginTop: 10, color: theme.colors.lightGray }}>
                Payment uses your wallet balance. If balance is insufficient, you'll be redirected to add funds via UPI
                and can resume here.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const LoginPrompt = ({ onClose, tournament, navigate }) => (
  <div
    style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0,0,0,0.8)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 1000,
    }}
  >
    <div
      style={{
        backgroundColor: theme.colors.backgroundColor,
        padding: "2rem",
        borderRadius: "8px",
        maxWidth: "400px",
        width: "90%",
        textAlign: "center",
        border: `1px solid ${theme.colors.primary}`,
        boxShadow: theme.shadows.modalShadow,
      }}
    >
      <h2 style={{ color: theme.colors.primary, marginBottom: "1rem" }}>Login Required</h2>
      <p style={{ marginBottom: "1.5rem", color: theme.colors.white }}>Please login to register for {tournament.id}</p>
      <div style={{ display: "flex", justifyContent: "center", gap: "1rem" }}>
        <button
          onClick={() => navigate("/login")}
          style={{
            margin: "0 0.5rem",
            padding: "0.75rem 2rem",
            border: "none",
            borderRadius: "4px",
            color: "#fff",
            cursor: "pointer",
            boxShadow: "0 0 10px #ff00ff",
            background: theme.gradients.primaryButton,
          }}
        >
          Login
        </button>
        <button
          onClick={onClose}
          style={{
            margin: "0 0.5rem",
            padding: "0.75rem 2rem",
            border: "none",
            borderRadius: "4px",
            color: "#fff",
            cursor: "pointer",
            boxShadow: "0 0 10px #ff00ff",
            background: theme.gradients.secondaryButton,
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
)
