"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import theme from "../theme"
import { useNavigate } from "react-router-dom"
import toast, { Toaster } from "react-hot-toast"

const AdminPlayers = () => {
  const [players, setPlayers] = useState([])
  const [totalPlayers, setTotalPlayers] = useState(0)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [selectedPlayer, setSelectedPlayer] = useState(null)
  const [playerDetails, setPlayerDetails] = useState(null)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  const [activeTab, setActiveTab] = useState("tournaments") // For mobile tabs
  const navigate = useNavigate()

  // ✅ RESPONSIVE DETECTION
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Fetch players
  const fetchPlayers = async () => {
    try {
      const res = await axios.get("http://localhost:5000/admin/players", {
        params: { search, page, limit },
      })
      setPlayers(res.data.users)
      setTotalPlayers(res.data.totalPlayers)
    } catch (err) {
      console.error("Error fetching players:", err)
      toast.error("Failed to load players")
    }
  }

  useEffect(() => {
    fetchPlayers()
  }, [search, page, limit])

  // ✅ FETCH DETAILED PLAYER INFORMATION
  const fetchPlayerDetails = async (playerId) => {
    setLoadingDetails(true)
    try {
      const playerRes = await axios.get(`http://localhost:5000/user/id/${playerId}`)
      const player = playerRes.data

      const tournamentsRes = await axios.get(`http://localhost:5000/tournaments/joined/${playerId}`)
      const tournaments = tournamentsRes.data

      const paymentsRes = await axios.get(`http://localhost:5000/payment/history/${playerId}`)
      const payments = paymentsRes.data

      const stats = {
        totalTournaments: tournaments.length,
        completedTournaments: tournaments.filter(t => t.t_status === 'completed').length,
        activeTournaments: tournaments.filter(t => t.t_status === 'running' || t.t_status === 'pending').length,
        wins: tournaments.filter(t => t.rank === 1).length,
        top3Finishes: tournaments.filter(t => t.rank > 0 && t.rank <= 3).length,
        totalEarnings: tournaments.reduce((sum, t) => sum + (t.prize_won || 0), 0),
        totalSpent: payments.filter(p => p.p_type === 'tournament' || p.p_type === 'withdraw').reduce((sum, p) => sum + p.amount, 0),
        totalDeposits: payments.filter(p => p.p_type === 'deposit').reduce((sum, p) => sum + p.amount, 0),
        winRate: tournaments.filter(t => t.t_status === 'completed').length > 0 
          ? ((tournaments.filter(t => t.rank === 1).length / tournaments.filter(t => t.t_status === 'completed').length) * 100).toFixed(1)
          : 0
      }

      const recentActivity = [
        ...tournaments.slice(0, 5).map(t => ({
          type: 'tournament',
          date: t.t_date,
          description: `Joined ${t.game} tournament`,
          details: t.t_id
        })),
        ...payments.slice(0, 5).map(p => ({
          type: 'payment',
          date: p.p_date || p.createdAt,
          description: `${p.p_type.charAt(0).toUpperCase() + p.p_type.slice(1)} - ₹${p.amount}`,
          details: p.p_id
        }))
      ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10)

      setPlayerDetails({
        player,
        tournaments,
        payments,
        stats,
        recentActivity
      })
      setSelectedPlayer(playerId)
      setActiveTab("tournaments") // Reset to first tab on mobile
    } catch (err) {
      console.error("Error fetching player details:", err)
      toast.error("Failed to load player details")
    } finally {
      setLoadingDetails(false)
    }
  }

  // Delete player
  const deletePlayer = async (id) => {
    if (!window.confirm("Are you sure you want to delete this player? This action cannot be undone.")) return
    try {
      await axios.delete(`http://localhost:5000/admin/players/${id}`)
      toast.success("Player deleted successfully")
      fetchPlayers()
    } catch (err) {
      console.error("Error deleting player:", err)
      toast.error("Failed to delete player")
    }
  }

  // ✅ EXPORT PLAYER DATA
  const exportPlayerData = () => {
    const csv = [
      ['Name', 'Username', 'Email', 'Contact', 'Balance', 'Join Date'],
      ...players.map(p => [
        p.fullName,
        p.username,
        p.email,
        p.contact || 'N/A',
        p.amount,
        new Date(p.createdAt).toLocaleDateString()
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `players_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    toast.success("Player data exported successfully")
  }

  const totalPages = limit === "all" ? 1 : Math.ceil(totalPlayers / limit)

  return (
    <div style={{ 
      padding: isMobile ? "0.75rem" : "1rem", 
      maxWidth: "1600px", 
      margin: "0 auto" 
    }}>
      <Toaster position="top-right" reverseOrder={false} />

      {/* ✅ RESPONSIVE HEADER */}
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: isMobile ? "flex-start" : "center", 
        marginBottom: isMobile ? "1rem" : "2rem",
        flexDirection: isMobile ? "column" : "row",
        gap: "1rem"
      }}>
        <h1 style={{
          fontSize: isMobile ? "1.5rem" : theme.sizes.sectionTitleFontSize,
          textShadow: theme.shadows.titleGlow,
          color: theme.colors.primary,
          margin: 0
        }}>
          👥 Player Management
        </h1>
        <div style={{ 
          display: "flex", 
          gap: "0.5rem",
          width: isMobile ? "100%" : "auto"
        }}>
          <button
            onClick={exportPlayerData}
            style={{
              padding: isMobile ? "8px 12px" : "10px 20px",
              borderRadius: "8px",
              background: theme.gradients.primaryButton,
              color: theme.colors.white,
              border: "none",
              cursor: "pointer",
              fontWeight: "bold",
              boxShadow: theme.shadows.buttonShadow,
              fontSize: isMobile ? "0.85rem" : "1rem",
              flex: isMobile ? "1" : "0",
              
            }}
          >
            {isMobile ? "📊 Export" : "📊Export-Data"}
          </button>
          <button
            onClick={() => navigate(-1)}
            style={{
              padding: isMobile ? "8px 12px" : "10px 20px",
              borderRadius: "8px",
              background: theme.gradients.secondaryButton,
              color: theme.colors.white,
              border: "none",
              cursor: "pointer",
              fontWeight: "500",
              boxShadow: theme.shadows.buttonShadow,
              fontSize: isMobile ? "0.85rem" : "1rem",
              flex: isMobile ? "1" : "0"
            }}
          >
            {isMobile ? "← Back" : "← Back"}
          </button>
        </div>
      </div>

      {/* ✅ RESPONSIVE STATS CARDS */}
      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(200px, 1fr))",
        gap: isMobile ? "0.75rem" : "1rem",
        marginBottom: isMobile ? "1rem" : "2rem"
      }}>
        <div style={{
          background: theme.gradients.navbarAlt1,
          padding: isMobile ? "1rem" : "1.5rem",
          borderRadius: "12px",
          border: `1px solid ${theme.colors.primary}`,
          textAlign: "center"
        }}>
          <div style={{ 
            fontSize: isMobile ? "1.5rem" : "2rem", 
            color: theme.colors.primary, 
            fontWeight: "bold" 
          }}>
            {totalPlayers}
          </div>
          <div style={{ 
            color: theme.colors.lightGray, 
            marginTop: "0.5rem",
            fontSize: isMobile ? "0.85rem" : "1rem"
          }}>
            Total Players
          </div>
        </div>
        
        <div style={{
          background: theme.gradients.navbarAlt1,
          padding: isMobile ? "1rem" : "1.5rem",
          borderRadius: "12px",
          border: `1px solid ${theme.colors.secondary}`,
          textAlign: "center"
        }}>
          <div style={{ 
            fontSize: isMobile ? "1.5rem" : "2rem", 
            color: theme.colors.secondary, 
            fontWeight: "bold" 
          }}>
            {players.filter(p => p.amount > 0).length}
          </div>
          <div style={{ 
            color: theme.colors.lightGray, 
            marginTop: "0.5rem",
            fontSize: isMobile ? "0.85rem" : "1rem"
          }}>
            Active Players
          </div>
        </div>
        
        <div style={{
          background: theme.gradients.navbarAlt1,
          padding: isMobile ? "1rem" : "1.5rem",
          borderRadius: "12px",
          border: `1px solid #FFA500`,
          textAlign: "center"
        }}>
          <div style={{ 
            fontSize: isMobile ? "1.5rem" : "2rem", 
            color: "#FFA500", 
            fontWeight: "bold" 
          }}>
            ₹{players.reduce((sum, p) => sum + (p.amount || 0), 0).toLocaleString()}
          </div>
          <div style={{ 
            color: theme.colors.lightGray, 
            marginTop: "0.5rem",
            fontSize: isMobile ? "0.85rem" : "1rem"
          }}>
            Total Wallet Balance
          </div>
        </div>
      </div>

      {/* ✅ RESPONSIVE SEARCH + FILTER */}
      <div style={{
        background: theme.gradients.navbarAlt1,
        padding: isMobile ? "0.75rem" : "1rem",
        borderRadius: "12px",
        marginBottom: "1.5rem",
        border: `1px solid ${theme.colors.primary}`,
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        gap: "0.75rem",
        alignItems: "stretch"
      }}>
        <input
          type="text"
          placeholder={isMobile ? "🔍 Search..." : "🔍 Search by name, username, or email..."}
          value={search}
          onChange={(e) => {
            setPage(1)
            setSearch(e.target.value)
          }}
          style={{
            padding: isMobile ? "8px 12px" : "10px 15px",
            borderRadius: "8px",
            flex: "1",
            border: "1px solid #444",
            background: "#0f0f0f",
            color: theme.colors.white,
            fontSize: isMobile ? "0.85rem" : "0.95rem"
          }}
        />

        <div style={{ 
          display: "flex", 
          gap: "0.5rem", 
          alignItems: "center",
          justifyContent: isMobile ? "space-between" : "flex-start"
        }}>
          <label style={{ 
            color: theme.colors.lightGray, 
            fontSize: isMobile ? "0.85rem" : "0.9rem",
            whiteSpace: "nowrap"
          }}>
            Show:
          </label>
          <select
            value={limit}
            onChange={(e) => {
              setPage(1)
              setLimit(e.target.value === "all" ? "all" : Number.parseInt(e.target.value))
            }}
            style={{
              padding: isMobile ? "8px 12px" : "10px 15px",
              borderRadius: "8px",
              border: "1px solid #444",
              background: "#0f0f0f",
              color: theme.colors.white,
              cursor: "pointer",
              fontSize: isMobile ? "0.85rem" : "0.95rem",
              flex: isMobile ? "1" : "0"
            }}
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value="all">All</option>
          </select>
        </div>
      </div>

      {/* ✅ RESPONSIVE PLAYER LIST - TABLE FOR DESKTOP, CARDS FOR MOBILE */}
      {isMobile ? (
        // MOBILE CARD VIEW
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {players.length > 0 ? (
            players.map((player) => (
              <div
                key={player._id}
                style={{
                  background: theme.gradients.navbarAlt1,
                  borderRadius: "12px",
                  border: `1px solid ${theme.colors.primary}`,
                  padding: "1rem",
                  overflow: "hidden"
                }}
              >
                {/* Player Header */}
                <div style={{ 
                  display: "flex", 
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: "0.75rem",
                  gap: "0.5rem"
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      color: theme.colors.white, 
                      fontWeight: "bold",
                      fontSize: "1rem",
                      marginBottom: "0.25rem"
                    }}>
                      {player.fullName}
                    </div>
                    <div style={{ 
                      color: theme.colors.secondary, 
                      fontSize: "0.85rem",
                      marginBottom: "0.25rem"
                    }}>
                      @{player.username}
                    </div>
                    <div style={{ 
                      color: theme.colors.lightGray, 
                      fontSize: "0.8rem" 
                    }}>
                      {player.email}
                    </div>
                  </div>
                  <div style={{
                    padding: "4px 10px",
                    borderRadius: "12px",
                    background: player.amount > 0 ? "rgba(0, 200, 83, 0.1)" : "rgba(144, 164, 174, 0.1)",
                    border: `1px solid ${player.amount > 0 ? "#00C853" : "#90A4AE"}`,
                    color: player.amount > 0 ? "#00C853" : "#90A4AE",
                    fontWeight: "bold",
                    fontSize: "0.85rem",
                    whiteSpace: "nowrap"
                  }}>
                    ₹{player.amount?.toLocaleString() || 0}
                  </div>
                </div>

                {/* Player Info */}
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "0.5rem",
                  marginBottom: "0.75rem",
                  padding: "0.75rem",
                  background: "rgba(0,0,0,0.2)",
                  borderRadius: "8px"
                }}>
                  <div>
                    <div style={{ 
                      fontSize: "0.75rem", 
                      color: theme.colors.lightGray,
                      marginBottom: "0.25rem"
                    }}>
                      Contact
                    </div>
                    <div style={{ 
                      fontSize: "0.85rem", 
                      color: theme.colors.white 
                    }}>
                      {player.contact || "N/A"}
                    </div>
                  </div>
                  <div>
                    <div style={{ 
                      fontSize: "0.75rem", 
                      color: theme.colors.lightGray,
                      marginBottom: "0.25rem"
                    }}>
                      Joined
                    </div>
                    <div style={{ 
                      fontSize: "0.85rem", 
                      color: theme.colors.white 
                    }}>
                      {new Date(player.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    onClick={() => fetchPlayerDetails(player._id)}
                    style={{
                      flex: 1,
                      background: theme.colors.secondary,
                      border: "none",
                      padding: "8px",
                      borderRadius: "6px",
                      cursor: "pointer",
                      color: "#fff",
                      fontSize: "0.85rem",
                      fontWeight: "500"
                    }}
                  >
                    👁️ View
                  </button>
                  <button
                    onClick={() => deletePlayer(player._id)}
                    style={{
                      flex: 1,
                      background: "#dc3545",
                      border: "none",
                      padding: "8px",
                      borderRadius: "6px",
                      cursor: "pointer",
                      color: "#fff",
                      fontSize: "0.85rem",
                      fontWeight: "500"
                    }}
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div style={{
              background: theme.gradients.navbarAlt1,
              padding: "3rem 1rem",
              borderRadius: "12px",
              textAlign: "center",
              color: theme.colors.lightGray,
              border: `1px solid ${theme.colors.primary}`
            }}>
              <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>😔</div>
              <div style={{ fontSize: "1.1rem", marginBottom: "0.5rem" }}>No players found</div>
              <div style={{ fontSize: "0.85rem" }}>Try adjusting your search</div>
            </div>
          )}
        </div>
      ) : (
        // DESKTOP TABLE VIEW
        <div style={{
          background: theme.gradients.navbarAlt1,
          borderRadius: "12px",
          overflow: "hidden",
          border: `1px solid ${theme.colors.primary}`
        }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{
              width: "100%",
              borderCollapse: "collapse",
              minWidth: "800px"
            }}>
              <thead>
                <tr style={{ 
                  background: "rgba(0, 255, 204, 0.1)",
                  borderBottom: `2px solid ${theme.colors.primary}`
                }}>
                  <th style={{ 
                    padding: "12px 16px", 
                    textAlign: "left",
                    color: theme.colors.primary,
                    fontWeight: "600",
                    fontSize: "0.9rem"
                  }}>
                    Player
                  </th>
                  <th style={{ 
                    padding: "12px 16px", 
                    textAlign: "left",
                    color: theme.colors.primary,
                    fontWeight: "600",
                    fontSize: "0.9rem"
                  }}>
                    Contact
                  </th>
                  <th style={{ 
                    padding: "12px 16px", 
                    textAlign: "center",
                    color: theme.colors.primary,
                    fontWeight: "600",
                    fontSize: "0.9rem"
                  }}>
                    Wallet Balance
                  </th>
                  <th style={{ 
                    padding: "12px 16px", 
                    textAlign: "center",
                    color: theme.colors.primary,
                    fontWeight: "600",
                    fontSize: "0.9rem"
                  }}>
                    Join Date
                  </th>
                  <th style={{ 
                    padding: "12px 16px", 
                    textAlign: "center",
                    color: theme.colors.primary,
                    fontWeight: "600",
                    fontSize: "0.9rem"
                  }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {players.length > 0 ? (
                  players.map((player) => (
                    <tr 
                      key={player._id}
                      style={{ 
                        borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                        transition: "background 0.2s ease"
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "rgba(0, 255, 204, 0.03)"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                    >
                      <td style={{ padding: "12px 16px" }}>
                        <div>
                          <div style={{ 
                            color: theme.colors.white, 
                            fontWeight: "600",
                            marginBottom: "0.25rem"
                          }}>
                            {player.fullName}
                          </div>
                          <div style={{ 
                            color: theme.colors.secondary, 
                            fontSize: "0.85rem" 
                          }}>
                            @{player.username}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <div>
                          <div style={{ 
                            color: theme.colors.white, 
                            fontSize: "0.9rem",
                            marginBottom: "0.25rem"
                          }}>
                            {player.email}
                          </div>
                          <div style={{ 
                            color: theme.colors.lightGray, 
                            fontSize: "0.85rem" 
                          }}>
                            {player.contact || "Not provided"}
                          </div>
                        </div>
                      </td>
                      <td style={{ 
                        padding: "12px 16px", 
                        textAlign: "center"
                      }}>
                        <div style={{
                          display: "inline-block",
                          padding: "4px 12px",
                          borderRadius: "12px",
                          background: player.amount > 0 ? "rgba(0, 200, 83, 0.1)" : "rgba(144, 164, 174, 0.1)",
                          border: `1px solid ${player.amount > 0 ? "#00C853" : "#90A4AE"}`,
                          color: player.amount > 0 ? "#00C853" : "#90A4AE",
                          fontWeight: "bold",
                          fontSize: "0.9rem"
                        }}>
                          ₹{player.amount?.toLocaleString() || 0}
                        </div>
                      </td>
                      <td style={{ 
                        padding: "12px 16px", 
                        textAlign: "center",
                        color: theme.colors.lightGray,
                        fontSize: "0.9rem"
                      }}>
                        {new Date(player.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ 
                        padding: "12px 16px", 
                        textAlign: "center" 
                      }}>
                        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center" }}>
                          <button
                            onClick={() => fetchPlayerDetails(player._id)}
                            style={{
                              background: theme.colors.secondary,
                              border: "none",
                              padding: "6px 12px",
                              borderRadius: "6px",
                              cursor: "pointer",
                              color: "#fff",
                              fontSize: "0.85rem",
                              fontWeight: "500"
                            }}
                          >
                            👁️ View
                          </button>
                          <button
                            onClick={() => deletePlayer(player._id)}
                            style={{
                              background: "#dc3545",
                              border: "none",
                              padding: "6px 12px",
                              borderRadius: "6px",
                              cursor: "pointer",
                              color: "#fff",
                              fontSize: "0.85rem",
                              fontWeight: "500"
                            }}
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="5"
                      style={{
                        textAlign: "center",
                        padding: "3rem",
                        color: theme.colors.lightGray
                      }}
                    >
                      <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>😔</div>
                      <div style={{ fontSize: "1.1rem" }}>No players found</div>
                      <div style={{ fontSize: "0.9rem", marginTop: "0.5rem" }}>
                        Try adjusting your search criteria
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ✅ RESPONSIVE PAGINATION */}
      {limit !== "all" && totalPages > 1 && (
        <div style={{
          marginTop: "1.5rem",
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          alignItems: "center",
          gap: isMobile ? "0.5rem" : "1rem"
        }}>
          <button
            disabled={page === 1}
            onClick={() => setPage((prev) => prev - 1)}
            style={{
              padding: isMobile ? "8px 16px" : "10px 20px",
              borderRadius: "8px",
              border: "none",
              background: page === 1 ? "#666" : theme.colors.primary,
              color: "#fff",
              cursor: page === 1 ? "not-allowed" : "pointer",
              fontWeight: "500",
              opacity: page === 1 ? 0.5 : 1,
              fontSize: isMobile ? "0.85rem" : "1rem"
            }}
          >
            {isMobile ? "←" : "← Previous"}
          </button>
          <span style={{ 
            color: theme.colors.white, 
            fontSize: isMobile ? "0.85rem" : "0.95rem",
            fontWeight: "500"
          }}>
            {page} / {totalPages}
          </span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage((prev) => prev + 1)}
            style={{
              padding: isMobile ? "8px 16px" : "10px 20px",
              borderRadius: "8px",
              border: "none",
              background: page === totalPages ? "#666" : theme.colors.primary,
              color: "#fff",
              cursor: page === totalPages ? "not-allowed" : "pointer",
              fontWeight: "500",
              opacity: page === totalPages ? 0.5 : 1,
              fontSize: isMobile ? "0.85rem" : "1rem"
            }}
          >
            {isMobile ? "→" : "Next →"}
          </button>
        </div>
      )}

      {/* ✅ RESPONSIVE PLAYER DETAIL MODAL */}
      {selectedPlayer && playerDetails && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.95)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: isMobile ? "0.5rem" : "1rem",
            overflow: "auto"
          }}
          onClick={() => {
            setSelectedPlayer(null)
            setPlayerDetails(null)
          }}
        >
          <div
            style={{
              background: theme.gradients.navbarAlt1,
              borderRadius: isMobile ? "12px" : "16px",
              border: `2px solid ${theme.colors.primary}`,
              maxWidth: isMobile ? "100%" : "1200px",
              width: "100%",
              maxHeight: "90vh",
              overflow: "auto",
              padding: isMobile ? "1rem" : "2rem"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* ✅ RESPONSIVE PROFILE HEADER */}
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: isMobile ? "1rem" : "2rem",
              flexWrap: "wrap",
              gap: "1rem"
            }}>
              <div style={{ flex: 1, minWidth: "200px" }}>
                <h2 style={{ 
                  color: theme.colors.primary, 
                  fontSize: isMobile ? "1.25rem" : "1.8rem",
                  margin: 0,
                  marginBottom: "0.5rem"
                }}>
                  {playerDetails.player.fullName}
                </h2>
                <div style={{ 
                  color: theme.colors.secondary,
                  fontSize: isMobile ? "0.95rem" : "1.1rem",
                  marginBottom: "0.5rem"
                }}>
                  @{playerDetails.player.username}
                </div>
                <div style={{ 
                  color: theme.colors.lightGray,
                  fontSize: isMobile ? "0.8rem" : "0.9rem"
                }}>
                  Member since {new Date(playerDetails.player.createdAt).toLocaleDateString()}
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedPlayer(null)
                  setPlayerDetails(null)
                }}
                style={{
                  padding: isMobile ? "8px 16px" : "10px 20px",
                  borderRadius: "8px",
                  border: "none",
                  background: "#666",
                  color: "#fff",
                  cursor: "pointer",
                  fontWeight: "500",
                  fontSize: isMobile ? "0.85rem" : "1rem"
                }}
              >
                ✕ Close
              </button>
            </div>

            {/* ✅ RESPONSIVE STATS GRID */}
            <div style={{
              display: "grid",
              gridTemplateColumns: isMobile 
                ? "repeat(2, 1fr)" 
                : "repeat(auto-fit, minmax(180px, 1fr))",
              gap: isMobile ? "0.5rem" : "1rem",
              marginBottom: isMobile ? "1rem" : "2rem"
            }}>
              <StatCard 
                icon="🎮" 
                value={playerDetails.stats.totalTournaments} 
                label="Tournaments"
                color="#00C853"
                isMobile={isMobile}
              />
              <StatCard 
                icon="🏆" 
                value={playerDetails.stats.wins} 
                label="Wins"
                color="#FFD700"
                isMobile={isMobile}
              />
              <StatCard 
                icon="🥇" 
                value={playerDetails.stats.top3Finishes} 
                label="Top 3"
                color="#FFA500"
                isMobile={isMobile}
              />
              <StatCard 
                icon="📊" 
                value={`${playerDetails.stats.winRate}%`} 
                label="Win Rate"
                color={theme.colors.primary}
                isMobile={isMobile}
              />
              <StatCard 
                icon="💰" 
                value={`₹${playerDetails.stats.totalEarnings.toLocaleString()}`} 
                label="Earnings"
                color="#00C853"
                isMobile={isMobile}
              />
              <StatCard 
                icon="💳" 
                value={`₹${playerDetails.player.amount.toLocaleString()}`} 
                label="Balance"
                color={theme.colors.secondary}
                isMobile={isMobile}
              />
            </div>

            {/* ✅ MOBILE TABS / DESKTOP GRID */}
            {isMobile ? (
              // MOBILE TAB VIEW
              <div>
                {/* Tab Navigation */}
                <div style={{
                  display: "flex",
                  gap: "0.5rem",
                  marginBottom: "1rem",
                  overflowX: "auto",
                  paddingBottom: "0.5rem"
                }}>
                  {["tournaments", "transactions", "activity", "info"].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      style={{
                        padding: "8px 16px",
                        borderRadius: "8px",
                        border: `1px solid ${activeTab === tab ? theme.colors.primary : "#333"}`,
                        background: activeTab === tab ? "rgba(0, 255, 204, 0.1)" : "rgba(0,0,0,0.3)",
                        color: activeTab === tab ? theme.colors.primary : theme.colors.lightGray,
                        cursor: "pointer",
                        fontSize: "0.85rem",
                        fontWeight: activeTab === tab ? "bold" : "normal",
                        whiteSpace: "nowrap"
                      }}
                    >
                      {tab === "tournaments" && "🏆 Tournaments"}
                      {tab === "transactions" && "💳 Transactions"}
                      {tab === "activity" && "📋 Activity"}
                      {tab === "info" && "📧 Info"}
                    </button>
                  ))}
                </div>

                {/* Tab Content */}
                <div style={{
                  background: "rgba(0,0,0,0.3)",
                  padding: "1rem",
                  borderRadius: "12px",
                  border: "1px solid rgba(255,255,255,0.1)"
                }}>
                  {activeTab === "tournaments" && (
                    <TournamentHistory 
                      tournaments={playerDetails.tournaments} 
                      isMobile={isMobile} 
                    />
                  )}
                  {activeTab === "transactions" && (
                    <TransactionHistory 
                      payments={playerDetails.payments} 
                      isMobile={isMobile} 
                    />
                  )}
                  {activeTab === "activity" && (
                    <RecentActivity 
                      activity={playerDetails.recentActivity} 
                      isMobile={isMobile} 
                    />
                  )}
                  {activeTab === "info" && (
                    <ContactInfo 
                      player={playerDetails.player} 
                      isMobile={isMobile} 
                    />
                  )}
                </div>
              </div>
            ) : (
              // DESKTOP GRID VIEW
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                gap: "1.5rem",
                marginBottom: "1.5rem"
              }}>
                <TournamentHistory tournaments={playerDetails.tournaments} />
                <TransactionHistory payments={playerDetails.payments} />
                <RecentActivity activity={playerDetails.recentActivity} />
              </div>
            )}

            {/* Contact Info - Always show on desktop, in tab on mobile */}
            {!isMobile && (
              <ContactInfo player={playerDetails.player} />
            )}
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {loadingDetails && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.8)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1001
        }}>
          <div style={{ 
            color: theme.colors.white,
            fontSize: isMobile ? "1.25rem" : "1.5rem",
            textAlign: "center"
          }}>
            <div style={{ fontSize: isMobile ? "2rem" : "3rem", marginBottom: "1rem" }}>⏳</div>
            Loading player details...
          </div>
        </div>
      )}
    </div>
  )
}

// ✅ RESPONSIVE HELPER COMPONENTS
const StatCard = ({ icon, value, label, color, isMobile = false }) => (
  <div style={{
    background: "rgba(0,0,0,0.3)",
    padding: isMobile ? "0.75rem" : "1.25rem",
    borderRadius: isMobile ? "10px" : "12px",
    border: `1px solid ${color}20`,
    textAlign: "center"
  }}>
    <div style={{ 
      fontSize: isMobile ? "1.25rem" : "1.5rem", 
      marginBottom: "0.5rem" 
    }}>
      {icon}
    </div>
    <div style={{ 
      fontSize: isMobile ? "1.25rem" : "1.8rem", 
      fontWeight: "bold", 
      color: color,
      marginBottom: "0.25rem"
    }}>
      {value}
    </div>
    <div style={{ 
      fontSize: isMobile ? "0.75rem" : "0.85rem", 
      color: theme.colors.lightGray 
    }}>
      {label}
    </div>
  </div>
)

const TournamentHistory = ({ tournaments, isMobile = false }) => (
  <div style={{
    background: "rgba(0,0,0,0.3)",
    padding: isMobile ? "1rem" : "1.5rem",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.1)"
  }}>
    <h3 style={{ 
      color: theme.colors.secondary, 
      marginBottom: "1rem",
      fontSize: isMobile ? "1rem" : "1.1rem"
    }}>
      🏆 Tournament History ({tournaments.length})
    </h3>
    <div style={{ maxHeight: "300px", overflowY: "auto" }}>
      {tournaments.slice(0, 5).map((t, idx) => (
        <div
          key={idx}
          style={{
            padding: isMobile ? "0.5rem" : "0.75rem",
            marginBottom: "0.5rem",
            background: "rgba(0,0,0,0.2)",
            borderRadius: "8px",
            borderLeft: `3px solid ${
              t.rank === 1 ? "#FFD700" : 
              t.rank === 2 ? "#C0C0C0" : 
              t.rank === 3 ? "#CD7F32" : 
              "#666"
            }`
          }}
        >
          <div style={{ 
            display: "flex", 
            justifyContent: "space-between",
            marginBottom: "0.25rem",
            flexWrap: "wrap",
            gap: "0.5rem"
          }}>
            <span style={{ 
              color: theme.colors.white, 
              fontWeight: "600",
              fontSize: isMobile ? "0.85rem" : "0.95rem"
            }}>
              {t.game}
            </span>
            {t.rank > 0 && (
              <span style={{ 
                color: t.rank === 1 ? "#FFD700" : 
                       t.rank === 2 ? "#C0C0C0" : 
                       t.rank === 3 ? "#CD7F32" : "#666",
                fontWeight: "bold",
                fontSize: isMobile ? "0.85rem" : "0.95rem"
              }}>
                {t.rank === 1 && "🥇"}
                {t.rank === 2 && "🥈"}
                {t.rank === 3 && "🥉"}
                {t.rank > 3 && `#${t.rank}`}
              </span>
            )}
          </div>
          <div style={{ 
            fontSize: isMobile ? "0.75rem" : "0.85rem", 
            color: theme.colors.lightGray 
          }}>
            {t.t_id} • {new Date(t.t_date).toLocaleDateString()}
          </div>
          {t.prize_won > 0 && (
            <div style={{ 
              marginTop: "0.25rem",
              color: "#00C853",
              fontWeight: "bold",
              fontSize: isMobile ? "0.8rem" : "0.9rem"
            }}>
              Won: ₹{t.prize_won}
            </div>
          )}
        </div>
      ))}
      {tournaments.length === 0 && (
        <div style={{ 
          textAlign: "center", 
          padding: "2rem",
          color: theme.colors.lightGray,
          fontSize: isMobile ? "0.85rem" : "1rem"
        }}>
          No tournaments yet
        </div>
      )}
    </div>
  </div>
)

const TransactionHistory = ({ payments, isMobile = false }) => (
  <div style={{
    background: "rgba(0,0,0,0.3)",
    padding: isMobile ? "1rem" : "1.5rem",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.1)"
  }}>
    <h3 style={{ 
      color: theme.colors.secondary, 
      marginBottom: "1rem",
      fontSize: isMobile ? "1rem" : "1.1rem"
    }}>
      💳 Transaction History ({payments.length})
    </h3>
    <div style={{ maxHeight: "300px", overflowY: "auto" }}>
      {payments.slice(0, 5).map((p, idx) => (
        <div
          key={idx}
          style={{
            padding: isMobile ? "0.5rem" : "0.75rem",
            marginBottom: "0.5rem",
            background: "rgba(0,0,0,0.2)",
            borderRadius: "8px",
            borderLeft: `3px solid ${
              p.p_type === 'deposit' ? "#00C853" :
              p.p_type === 'prize' ? "#FFD700" :
              p.p_type === 'withdraw' ? "#FFA500" :
              "#666"
            }`
          }}
        >
          <div style={{ 
            display: "flex", 
            justifyContent: "space-between",
            marginBottom: "0.25rem",
            flexWrap: "wrap",
            gap: "0.5rem"
          }}>
            <span style={{ 
              color: theme.colors.white,
              textTransform: "capitalize",
              fontWeight: "600",
              fontSize: isMobile ? "0.85rem" : "0.95rem"
            }}>
              {p.p_type}
            </span>
            <span style={{ 
              color: p.p_type === 'deposit' || p.p_type === 'prize' || p.p_type === 'refund' ? "#00C853" : "#ff6b6b",
              fontWeight: "bold",
              fontSize: isMobile ? "0.85rem" : "0.95rem"
            }}>
              {p.p_type === 'deposit' || p.p_type === 'prize' || p.p_type === 'refund' ? "+" : "-"}
              ₹{p.amount}
            </span>
          </div>
          <div style={{ 
            fontSize: isMobile ? "0.75rem" : "0.85rem", 
            color: theme.colors.lightGray 
          }}>
            {p.p_id} • {new Date(p.p_date || p.createdAt).toLocaleDateString()}
          </div>
        </div>
      ))}
      {payments.length === 0 && (
        <div style={{ 
          textAlign: "center", 
          padding: "2rem",
          color: theme.colors.lightGray,
          fontSize: isMobile ? "0.85rem" : "1rem"
        }}>
          No transactions yet
        </div>
      )}
    </div>
  </div>
)

const RecentActivity = ({ activity, isMobile = false }) => (
  <div style={{
    background: "rgba(0,0,0,0.3)",
    padding: isMobile ? "1rem" : "1.5rem",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.1)"
  }}>
    <h3 style={{ 
      color: theme.colors.secondary, 
      marginBottom: "1rem",
      fontSize: isMobile ? "1rem" : "1.1rem"
    }}>
      📋 Recent Activity
    </h3>
    <div style={{ maxHeight: "300px", overflowY: "auto" }}>
      {activity.map((item, idx) => (
        <div
          key={idx}
          style={{
            padding: isMobile ? "0.5rem" : "0.75rem",
            marginBottom: "0.5rem",
            background: "rgba(0,0,0,0.2)",
            borderRadius: "8px"
          }}
        >
          <div style={{ 
            color: theme.colors.white,
            marginBottom: "0.25rem",
            fontSize: isMobile ? "0.8rem" : "0.9rem"
          }}>
            {item.type === 'tournament' ? '🎮' : '💳'} {item.description}
          </div>
          <div style={{ 
            fontSize: isMobile ? "0.7rem" : "0.75rem", 
            color: theme.colors.lightGray 
          }}>
            {new Date(item.date).toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  </div>
)

const ContactInfo = ({ player, isMobile = false }) => (
  <div style={{
    marginTop: isMobile ? "0" : "1.5rem",
    padding: isMobile ? "1rem" : "1.5rem",
    background: "rgba(0, 119, 255, 0.05)",
    border: "1px solid rgba(0, 119, 255, 0.2)",
    borderRadius: "12px"
  }}>
    <h3 style={{ 
      color: theme.colors.secondary, 
      marginBottom: "1rem",
      fontSize: isMobile ? "1rem" : "1.1rem"
    }}>
      📧 Contact Information
    </h3>
    <div style={{
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(250px, 1fr))",
      gap: isMobile ? "0.75rem" : "1rem"
    }}>
      <InfoItem label="Email" value={player.email} isMobile={isMobile} />
      <InfoItem label="Contact" value={player.contact || "Not provided"} isMobile={isMobile} />
      <InfoItem 
        label="Date of Birth" 
        value={player.dob ? new Date(player.dob).toLocaleDateString() : "Not provided"} 
        isMobile={isMobile}
      />
      <InfoItem label="User ID" value={player._id} isMobile={isMobile} />
    </div>
  </div>
)

const InfoItem = ({ label, value, isMobile = false }) => (
  <div>
    <div style={{ 
      color: theme.colors.lightGray, 
      fontSize: isMobile ? "0.75rem" : "0.85rem",
      marginBottom: "0.25rem"
    }}>
      {label}
    </div>
    <div style={{ 
      color: theme.colors.white,
      fontSize: isMobile ? "0.85rem" : "0.95rem",
      fontWeight: "500",
      wordBreak: "break-word"
    }}>
      {value}
    </div>
  </div>
)

export default AdminPlayers