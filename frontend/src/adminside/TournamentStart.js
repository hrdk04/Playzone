"use client"
import { useParams, useNavigate } from "react-router-dom"
import theme from "../theme"
import useSWR from "swr"
import axios from "axios"
import { useEffect, useMemo, useState } from "react"
import toast, { Toaster } from "react-hot-toast"

const parseStartTime = (t) => {
  if (!t?.t_date || !t?.t_time) return null
  try {
    const dateStr = typeof t.t_date === "string" ? t.t_date : new Date(t.t_date).toISOString().slice(0, 10)
    const iso = `${dateStr}T${t.t_time.length === 5 ? t.t_time : t.t_time || "00:00"}`
    const d = new Date(iso)
    return isNaN(d.getTime()) ? null : d
  } catch {
    return null
  }
}

const TournamentStart = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  const [roomId, setRoomId] = useState("")
  const [roomPass, setRoomPass] = useState("")
  const [saved, setSaved] = useState(false)
  const [running, setRunning] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [sendingAll, setSendingAll] = useState(false)
  const [sendingIndividual, setSendingIndividual] = useState({})

  const { data: withParts, mutate } = useSWR("http://localhost:5000/admin/tournaments/withParticipants", (url) =>
    axios.get(url).then((r) => r.data),
  )

  const tournament = useMemo(() => {
    if (!withParts) return null
    return (withParts || []).find((x) => (x.t_id || x.id || x._id) === id) || null
  }, [withParts, id])

  const startTime = useMemo(() => parseStartTime(tournament), [tournament])
  const endTime = useMemo(() => (startTime ? new Date(startTime.getTime() + 40 * 60 * 1000) : null), [startTime])

  useEffect(() => {
    if (!startTime) return
    const tick = async () => {
      const now = new Date()
      if (now >= startTime && endTime && now < endTime) {
        setRunning(true)
      } else {
        setRunning(false)
      }
      if (endTime && now >= endTime && !completed) {
        try {
          await axios.put(`http://localhost:5000/admin/tournaments/${id}`, { t_status: "completed" })
          setCompleted(true)
          toast.success("Tournament automatically completed!")
        } catch (e) {
          console.error("Auto-complete failed:", e)
        }
      }
    }
    tick()
    const i = setInterval(tick, 5000)
    return () => clearInterval(i)
  }, [startTime, endTime, id, completed])

  const populatedParticipants = useMemo(() => {
    if (!tournament?.participants) return []
    return tournament.participants.map((p, idx) => ({
      id: p.user_id?._id || p.user_id || idx,
      name: p.user_id?.fullName || p.name || p.fullName || "",
      username: p.user_id?.username || p.username || "",
      email: p.user_id?.email || p.email || "",
      team_name: p.team_name || "",
    }))
  }, [tournament])

  // ✅ SAVE ROOM CREDENTIALS
  const handleSaveCredentials = () => {
    if (!roomId.trim() || !roomPass.trim()) {
      return toast.error("Please enter both Room ID and Password")
    }
    setSaved(true)
    toast.success("Room credentials saved! Ready to send to players.")
  }

  // ✅ SEND TO ALL PARTICIPANTS
  const sendRoomDetailsToAll = async () => {
    if (!roomId || !roomPass) {
      return toast.error("Please save room credentials first")
    }

    const validParticipants = populatedParticipants.filter((p) => p.email)
    if (!validParticipants.length) {
      return toast.error("No participants with valid emails found")
    }

    setSendingAll(true)
    let successCount = 0
    let failCount = 0

    try {
      // Send emails via backend API
      for (const participant of validParticipants) {
        try {
          await axios.post(`http://localhost:5000/admin/tournaments/${id}/send-credentials`, {
            roomId,
            roomPass,
            email: participant.email,
            tournamentName: tournament?.game || "Tournament",
            date: tournament?.t_date,
            time: tournament?.t_time,
          })
          successCount++
        } catch (err) {
          console.error(`Failed to send to ${participant.email}:`, err)
          failCount++
        }
      }

      if (successCount > 0) {
        toast.success(`✅ Credentials sent to ${successCount} player${successCount > 1 ? 's' : ''}!`)
      }
      if (failCount > 0) {
        toast.error(`❌ Failed to send to ${failCount} player${failCount > 1 ? 's' : ''}`)
      }
    } catch (error) {
      console.error("Send all error:", error)
      toast.error("Failed to send credentials. Please try again.")
    } finally {
      setSendingAll(false)
    }
  }

  // ✅ SEND TO INDIVIDUAL PARTICIPANT
  const sendToIndividual = async (participant) => {
    if (!roomId || !roomPass) {
      return toast.error("Please save room credentials first")
    }

    setSendingIndividual((prev) => ({ ...prev, [participant.id]: true }))

    try {
      await axios.post(`http://localhost:5000/admin/tournaments/${id}/send-credentials`, {
        roomId,
        roomPass,
        email: participant.email,
        tournamentName: tournament?.game || "Tournament",
        date: tournament?.t_date,
        time: tournament?.t_time,
      })
      toast.success(`✅ Sent to ${participant.name || participant.email}`)
    } catch (error) {
      console.error("Send individual error:", error)
      toast.error(`❌ Failed to send to ${participant.name || participant.email}`)
    } finally {
      setSendingIndividual((prev) => ({ ...prev, [participant.id]: false }))
    }
  }

  // ✅ COPY ROOM DETAILS TO CLIPBOARD
  const copyToClipboard = () => {
    const text = `🎮 ${tournament?.game?.toUpperCase() || "TOURNAMENT"} - Room Details

🆔 Room ID: ${roomId}
🔑 Password: ${roomPass}
📅 Date: ${startTime ? new Date(tournament.t_date).toLocaleDateString() : "-"}
⏰ Time: ${tournament?.t_time || "-"}

Join on time! Good luck! 🏆`

    navigator.clipboard.writeText(text).then(
      () => toast.success("📋 Copied to clipboard!"),
      () => toast.error("Failed to copy")
    )
  }

  const isLoading = !withParts || !tournament

  // ✅ STATUS BADGE COMPONENT
  const StatusBadge = () => {
    if (completed) {
      return (
        <div style={{
          padding: "8px 16px",
          borderRadius: "20px",
          background: "rgba(144, 164, 174, 0.2)",
          border: "1px solid #90A4AE",
          color: "#90A4AE",
          fontWeight: "bold",
          fontSize: "0.9rem"
        }}>
          ✓ Completed
        </div>
      )
    }
    if (running) {
      return (
        <div style={{
          padding: "8px 16px",
          borderRadius: "20px",
          background: "rgba(0, 200, 83, 0.2)",
          border: "1px solid #00C853",
          color: "#00C853",
          fontWeight: "bold",
          fontSize: "0.9rem",
          animation: "pulse 2s infinite"
        }}>
          🟢 Live Now
        </div>
      )
    }
    return (
      <div style={{
        padding: "8px 16px",
        borderRadius: "20px",
        background: "rgba(255, 193, 7, 0.2)",
        border: "1px solid #FFC107",
        color: "#FFC107",
        fontWeight: "bold",
        fontSize: "0.9rem"
      }}>
        ⏳ Pending
      </div>
    )
  }

  return (
    <div style={{ padding: "1rem", maxWidth: "1400px", margin: "0 auto" }}>
      <Toaster position="top-right" reverseOrder={false} />
      
      {/* ✅ CSS for animations */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>

      {/* Header */}
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
        marginBottom: "1.5rem",
        flexWrap: "wrap",
        gap: "1rem"
      }}>
        <div>
          <h1 style={{ 
            fontSize: "1.8rem", 
            color: theme.colors.primary, 
            textShadow: theme.shadows.titleGlow, 
            margin: 0,
            marginBottom: "0.5rem"
          }}>
            Start Tournament
          </h1>
          <p style={{ margin: 0, color: theme.colors.lightGray, fontSize: "0.9rem" }}>
            Tournament ID: <strong style={{ color: theme.colors.secondary }}>#{id}</strong>
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <StatusBadge />
          <button
            onClick={() => navigate(-1)}
            style={{
              padding: "10px 16px",
              borderRadius: "8px",
              border: "none",
              background: theme.gradients.secondaryButton,
              color: theme.colors.white,
              cursor: "pointer",
              boxShadow: theme.shadows.buttonShadow,
              fontWeight: "500"
            }}
          >
            ← Back
          </button>
        </div>
      </div>

      {/* Tournament Info Card */}
      {tournament && (
        <div style={{
          background: theme.gradients.navbarAlt1,
          border: `1px solid ${theme.colors.primary}`,
          borderRadius: "12px",
          padding: "1.5rem",
          marginBottom: "1.5rem"
        }}>
          <h2 style={{ 
            color: theme.colors.secondary, 
            marginBottom: "1rem",
            fontSize: "1.2rem"
          }}>
            📋 Tournament Information
          </h2>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "1rem"
          }}>
            <div>
              <div style={{ color: theme.colors.lightGray, fontSize: "0.85rem", marginBottom: "0.25rem" }}>
                Game
              </div>
              <div style={{ color: theme.colors.white, fontWeight: "bold", fontSize: "1.1rem" }}>
                {tournament.game || "-"}
              </div>
            </div>
            <div>
              <div style={{ color: theme.colors.lightGray, fontSize: "0.85rem", marginBottom: "0.25rem" }}>
                Map
              </div>
              <div style={{ color: theme.colors.white, fontWeight: "bold", fontSize: "1.1rem" }}>
                {tournament.map || "-"}
              </div>
            </div>
            <div>
              <div style={{ color: theme.colors.lightGray, fontSize: "0.85rem", marginBottom: "0.25rem" }}>
                Mode
              </div>
              <div style={{ color: theme.colors.white, fontWeight: "bold", fontSize: "1.1rem", textTransform: "capitalize" }}>
                {tournament.mode_type || "Solo"}
              </div>
            </div>
            <div>
              <div style={{ color: theme.colors.lightGray, fontSize: "0.85rem", marginBottom: "0.25rem" }}>
                Entry Fee
              </div>
              <div style={{ color: theme.colors.primary, fontWeight: "bold", fontSize: "1.1rem" }}>
                ₹{tournament.entry_fee || 0}
              </div>
            </div>
            <div>
              <div style={{ color: theme.colors.lightGray, fontSize: "0.85rem", marginBottom: "0.25rem" }}>
                Start Time
              </div>
              <div style={{ color: theme.colors.white, fontWeight: "bold", fontSize: "1.1rem" }}>
                {startTime ? startTime.toLocaleString() : "-"}
              </div>
            </div>
            <div>
              <div style={{ color: theme.colors.lightGray, fontSize: "0.85rem", marginBottom: "0.25rem" }}>
                End Time (40 min)
              </div>
              <div style={{ color: theme.colors.white, fontWeight: "bold", fontSize: "1.1rem" }}>
                {endTime ? endTime.toLocaleString() : "-"}
              </div>
            </div>
            <div>
              <div style={{ color: theme.colors.lightGray, fontSize: "0.85rem", marginBottom: "0.25rem" }}>
                Participants
              </div>
              <div style={{ color: theme.colors.secondary, fontWeight: "bold", fontSize: "1.1rem" }}>
                {populatedParticipants.length} / 16
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Room Credentials Card */}
      <div style={{
        background: theme.gradients.navbarAlt1,
        border: `2px solid ${saved ? theme.colors.secondary : theme.colors.primary}`,
        borderRadius: "12px",
        padding: "1.5rem",
        marginBottom: "1.5rem"
      }}>
        <div style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center",
          marginBottom: "1rem",
          flexWrap: "wrap",
          gap: "0.5rem"
        }}>
          <h2 style={{ 
            color: theme.colors.secondary, 
            margin: 0,
            fontSize: "1.2rem"
          }}>
            🔑 Room Credentials
          </h2>
          {saved && (
            <span style={{
              padding: "4px 12px",
              borderRadius: "12px",
              background: "rgba(0, 200, 83, 0.2)",
              border: "1px solid #00C853",
              color: "#00C853",
              fontSize: "0.85rem",
              fontWeight: "bold"
            }}>
              ✓ Saved
            </span>
          )}
        </div>

        <div style={{ 
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "1rem",
          marginBottom: "1rem"
        }}>
          <div>
            <label style={{ 
              display: "block", 
              marginBottom: "0.5rem",
              color: theme.colors.lightGray,
              fontSize: "0.9rem",
              fontWeight: "500"
            }}>
              Room ID *
            </label>
            <input
              placeholder="Enter Room ID"
              value={roomId}
              onChange={(e) => {
                setRoomId(e.target.value)
                if (saved) setSaved(false)
              }}
              style={{
                padding: "12px",
                borderRadius: "8px",
                background: "#0f0f0f",
                color: "#fff",
                border: "1px solid #444",
                width: "100%",
                fontSize: "1rem",
                outline: "none"
              }}
            />
          </div>
          <div>
            <label style={{ 
              display: "block", 
              marginBottom: "0.5rem",
              color: theme.colors.lightGray,
              fontSize: "0.9rem",
              fontWeight: "500"
            }}>
              Password *
            </label>
            <input
              placeholder="Enter Password"
              value={roomPass}
              onChange={(e) => {
                setRoomPass(e.target.value)
                if (saved) setSaved(false)
              }}
              style={{
                padding: "12px",
                borderRadius: "8px",
                background: "#0f0f0f",
                color: "#fff",
                border: "1px solid #444",
                width: "100%",
                fontSize: "1rem",
                outline: "none"
              }}
            />
          </div>
        </div>

        <div style={{ 
          display: "flex", 
          gap: "0.75rem", 
          flexWrap: "wrap" 
        }}>
          {!saved ? (
            <button
              onClick={handleSaveCredentials}
              style={{
                padding: "12px 24px",
                borderRadius: "8px",
                border: "none",
                background: theme.gradients.primaryButton,
                color: theme.colors.white,
                cursor: "pointer",
                boxShadow: theme.shadows.buttonShadow,
                fontWeight: "bold",
                fontSize: "0.95rem"
              }}
            >
              💾 Save Credentials
            </button>
          ) : (
            <>
              <button
                onClick={sendRoomDetailsToAll}
                disabled={sendingAll}
                style={{
                  padding: "12px 24px",
                  borderRadius: "8px",
                  border: "none",
                  background: sendingAll ? "#666" : theme.gradients.primaryButton,
                  color: theme.colors.white,
                  cursor: sendingAll ? "not-allowed" : "pointer",
                  boxShadow: theme.shadows.buttonShadow,
                  fontWeight: "bold",
                  fontSize: "0.95rem",
                  opacity: sendingAll ? 0.7 : 1
                }}
              >
                {sendingAll ? "📤 Sending..." : "📧 Send to All Players"}
              </button>
              <button
                onClick={copyToClipboard}
                style={{
                  padding: "12px 24px",
                  borderRadius: "8px",
                  border: `1px solid ${theme.colors.primary}`,
                  background: "transparent",
                  color: theme.colors.white,
                  cursor: "pointer",
                  fontWeight: "500",
                  fontSize: "0.95rem"
                }}
              >
                📋 Copy Details
              </button>
            </>
          )}
        </div>

        {!saved && (
          <p style={{ 
            marginTop: "0.75rem", 
            color: theme.colors.lightGray, 
            fontSize: "0.85rem",
            margin: "0.75rem 0 0 0"
          }}>
            💡 Save credentials first before sending to players
          </p>
        )}
      </div>

      {/* Participants Table */}
      <div style={{
        background: theme.gradients.navbarAlt1,
        border: `1px solid ${theme.colors.primary}`,
        borderRadius: "12px",
        overflow: "hidden"
      }}>
        <div style={{ 
          padding: "1rem 1.5rem", 
          borderBottom: `1px solid ${theme.colors.primary}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "0.5rem"
        }}>
          <h2 style={{ 
            color: theme.colors.secondary, 
            margin: 0,
            fontSize: "1.2rem"
          }}>
            👥 Registered Participants
          </h2>
          <div style={{
            padding: "6px 12px",
            borderRadius: "12px",
            background: "rgba(0, 255, 204, 0.1)",
            border: "1px solid rgba(0, 255, 204, 0.3)",
            color: theme.colors.primary,
            fontSize: "0.9rem",
            fontWeight: "bold"
          }}>
            {populatedParticipants.length} / 16 Players
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ 
            width: "100%", 
            minWidth: "700px", 
            borderCollapse: "collapse" 
          }}>
            <thead>
              <tr style={{ 
                background: "rgba(0, 255, 204, 0.05)",
                borderBottom: `2px solid ${theme.colors.primary}`
              }}>
                <th style={{ 
                  padding: "12px 16px", 
                  textAlign: "left",
                  color: theme.colors.primary,
                  fontWeight: "600",
                  fontSize: "0.9rem"
                }}>
                  #
                </th>
                <th style={{ 
                  padding: "12px 16px", 
                  textAlign: "left",
                  color: theme.colors.primary,
                  fontWeight: "600",
                  fontSize: "0.9rem"
                }}>
                  Team Name
                </th>
                <th style={{ 
                  padding: "12px 16px", 
                  textAlign: "left",
                  color: theme.colors.primary,
                  fontWeight: "600",
                  fontSize: "0.9rem"
                }}>
                  Player Name
                </th>
                <th style={{ 
                  padding: "12px 16px", 
                  textAlign: "left",
                  color: theme.colors.primary,
                  fontWeight: "600",
                  fontSize: "0.9rem"
                }}>
                  Username
                </th>
                <th style={{ 
                  padding: "12px 16px", 
                  textAlign: "left",
                  color: theme.colors.primary,
                  fontWeight: "600",
                  fontSize: "0.9rem"
                }}>
                  Email
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
              {!isLoading && populatedParticipants.length === 0 ? (
                <tr>
                  <td 
                    colSpan={6} 
                    style={{ 
                      padding: "3rem", 
                      textAlign: "center",
                      color: theme.colors.lightGray 
                    }}
                  >
                    <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>😔</div>
                    <div style={{ fontSize: "1.1rem" }}>No participants joined yet.</div>
                    <div style={{ fontSize: "0.9rem", marginTop: "0.5rem" }}>
                      Players will appear here once they register.
                    </div>
                  </td>
                </tr>
              ) : populatedParticipants.length ? (
                populatedParticipants.map((p, index) => (
                  <tr 
                    key={p.id} 
                    style={{ 
                      borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                      transition: "background 0.2s ease"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "rgba(0, 255, 204, 0.03)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                  >
                    <td style={{ 
                      padding: "12px 16px",
                      color: theme.colors.lightGray,
                      fontWeight: "500"
                    }}>
                      {index + 1}
                    </td>
                    <td style={{ 
                      padding: "12px 16px",
                      color: theme.colors.white,
                      fontWeight: "600"
                    }}>
                      {p.team_name || "-"}
                    </td>
                    <td style={{ 
                      padding: "12px 16px",
                      color: theme.colors.white 
                    }}>
                      {p.name || "-"}
                    </td>
                    <td style={{ 
                      padding: "12px 16px",
                      color: theme.colors.secondary 
                    }}>
                      @{p.username || "-"}
                    </td>
                    <td style={{ 
                      padding: "12px 16px",
                      color: theme.colors.lightGray,
                      fontSize: "0.9rem"
                    }}>
                      {p.email || "-"}
                    </td>
                    <td style={{ 
                      padding: "12px 16px",
                      textAlign: "center"
                    }}>
                      {saved && p.email && (
                        <button
                          onClick={() => sendToIndividual(p)}
                          disabled={sendingIndividual[p.id]}
                          style={{
                            padding: "6px 12px",
                            borderRadius: "6px",
                            border: "none",
                            background: sendingIndividual[p.id] ? "#666" : theme.colors.secondary,
                            color: "#fff",
                            cursor: sendingIndividual[p.id] ? "not-allowed" : "pointer",
                            fontSize: "0.8rem",
                            fontWeight: "500",
                            opacity: sendingIndividual[p.id] ? 0.6 : 1
                          }}
                        >
                          {sendingIndividual[p.id] ? "Sending..." : "📧 Send"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                // Loading state
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} style={{ 
                      padding: "12px 16px", 
                      color: theme.colors.lightGray,
                      textAlign: "center"
                    }}>
                      Loading participants...
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info Footer */}
      <div style={{
        marginTop: "1.5rem",
        padding: "1rem",
        background: "rgba(0, 119, 255, 0.05)",
        border: "1px solid rgba(0, 119, 255, 0.2)",
        borderRadius: "8px",
        color: theme.colors.lightGray,
        fontSize: "0.9rem",
        lineHeight: "1.6"
      }}>
        <strong style={{ color: theme.colors.secondary }}>💡 Pro Tips:</strong>
        <ul style={{ margin: "0.5rem 0 0 0", paddingLeft: "1.5rem" }}>
          <li>Enter Room ID and Password, then click "Save Credentials"</li>
          <li>Send credentials to all players at once or individually</li>
          <li>Use "Copy Details" to paste in WhatsApp/Discord groups</li>
          <li>Tournament auto-completes 40 minutes after start time</li>
          <li>Participants receive professional email with tournament details</li>
        </ul>
      </div>
    </div>
  )
}

export default TournamentStart