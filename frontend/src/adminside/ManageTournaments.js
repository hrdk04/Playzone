"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import theme from "../theme"
// import useSWR, { useSWRConfig } from "swr"
import useSWR from "swr"
import FullscreenImageModal from "./components/FullscreenImageModal"
import API_BASE_URL from "../config/apiConfig";

const gameThumbs = {
  bgmi: "/bgmi-tournament-thumbnail.jpg",
  pubg: "/pubg-tournament-thumbnail.jpg",
  cod: "/call-of-duty-tournament-thumbnail.jpg",
  ff: "/free-fire-tournament-thumbnail.jpg",
}

const Button = ({ kind = "secondary", children, style: extraStyle, ...props }) => (
  <button
    {...props}
    style={{
      padding: "8px 12px",
      borderRadius: "8px",
      border: "none",
      background: kind === "primary" ? theme.gradients.primaryButton : theme.gradients.secondaryButton,
      color: theme.colors.white,
      cursor: "pointer",
      boxShadow: theme.shadows.buttonShadow,
      transition: "transform 0.2s",
      ...extraStyle,
    }}
    onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
    onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
  >
    {children}
  </button>
)

const formatDate = (dateStr) => {
  if (!dateStr) return "-"
  const d = new Date(dateStr)
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })
}

const formatTime = (timeStr) => {
  if (!timeStr) return "-"
  const t = new Date(`1970-01-01T${timeStr}:00`)
  return t.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })
}

// Countdown timer hook
const useCountdown = (targetDate, targetTime) => {
  const [timeLeft, setTimeLeft] = useState(null)

  useEffect(() => {
    if (!targetDate || !targetTime) {
      setTimeLeft(null)
      return
    }

    const calculateTimeLeft = () => {
      const now = new Date()
      const [hours, minutes] = targetTime.split(':').map(Number)
      const tournamentDateTime = new Date(targetDate)
      tournamentDateTime.setHours(hours, minutes, 0, 0)
      
      const difference = tournamentDateTime.getTime() - now.getTime()
      
      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24))
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((difference % (1000 * 60)) / 1000)
        
        return { days, hours, minutes, seconds, total: difference }
      }
      return null
    }

    const updateTimer = () => {
      setTimeLeft(calculateTimeLeft())
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [targetDate, targetTime])

  return timeLeft
}

// Format countdown display
const formatCountdown = (timeLeft) => {
  if (!timeLeft) return "Tournament started"
  
  const { days, hours, minutes, seconds } = timeLeft
  
  if (days > 0) {
    return `${days}d ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

const AdminTournaments = ({ isMobile = false }) => {
  const navigate = useNavigate()
  // const { mutate: globalMutate } = useSWRConfig()
  
  const [filter, setFilter] = useState("active") // Changed default to show pending and running tournaments
  const [showStartModal, setShowStartModal] = useState(false)
  const [selectedTournament, setSelectedTournament] = useState(null)
  const [roomId, setRoomId] = useState("")
  const [roomPass, setRoomPass] = useState("")
  const [sendStatuses, setSendStatuses] = useState({})
  const [isSendingAll, setIsSendingAll] = useState(false)
  const [showImageModal, setShowImageModal] = useState(false)
  const [selectedImageUrl, setSelectedImageUrl] = useState("")
  const [selectedTournamentName, setSelectedTournamentName] = useState("")

  const { data, isLoading, mutate } = useSWR(`${API_BASE_URL}/admin/tournaments`, (url) =>
    axios.get(url).then((res) => res.data),
  )

  const { data: withParts } = useSWR(`${API_BASE_URL}/admin/tournaments/withParticipants`, (url) =>
    axios.get(url).then((res) => res.data),
  )

  const participantsCountByTid = (withParts || []).reduce((acc, t) => {
    const key = t.t_id || t.id || t._id
    acc[key] = Array.isArray(t.participants) ? t.participants.length : 0
    return acc
  }, {})

  const participantsByTid = (withParts || []).reduce((acc, t) => {
    const key = t.t_id || t.id || t._id
    acc[key] = Array.isArray(t.participants) ? t.participants : []
    return acc
  }, {})

  const handleAdd = () => navigate("/admin/tournaments/new")
  const handleStart = async (tid) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/admin/tournaments/${tid}`)
      setSelectedTournament({
        id: tid,
        name: res.data.name,
        date: res.data.t_date,
        time: res.data.t_time,
        participants: Array.isArray(res.data.participants) ? res.data.participants : [],
      })
      setRoomId("")
      setRoomPass("")
      setSendStatuses({})
      setShowStartModal(true)
    } catch (err) {
      console.error(err)
      alert("Failed to fetch tournament participants")
    }
  }

  const handleUpdate = (tid) => navigate(`/admin/tournaments/${tid}/update`)
  const handleDelete = async (tid) => {
    if (!window.confirm("Delete this tournament?")) return
    try {
      await axios.delete(`${API_BASE_URL}/admin/tournaments/${tid}`)
      mutate((current) => (current || []).filter((x) => (x.id || x.t_id || x._id) !== tid), false)
    } catch (e) {
      console.error("[v0] Delete failed:", e)
      alert("Delete failed")
    }
  }

  const handlePublishResults = (tid) => {
    navigate(`/admin/tournaments/${tid}/results`)
  }

  const handleViewResultImage = (imagePath, tournamentName) => {
    if (imagePath) {
      setSelectedImageUrl(`${API_BASE_URL}/${imagePath}`)
      setSelectedTournamentName(tournamentName)
      setShowImageModal(true)
    }
  }

  const sendToOne = async (email) => {
    if (!selectedTournament || !roomId || !roomPass) return
    try {
      setSendStatuses((s) => ({ ...s, [email]: "pending" }))
      const res = await axios.post(
        `${API_BASE_URL}/admin/tournaments/${selectedTournament.id}/send-credentials`,
        {
          roomId,
          roomPass,
          email,
          tournamentName: selectedTournament.name,
          date: selectedTournament.date,
          time: selectedTournament.time,
        },
      )
      if (res.data?.ok) {
        setSendStatuses((s) => ({ ...s, [email]: "ok" }))
      } else {
        setSendStatuses((s) => ({ ...s, [email]: "error" }))
      }
    } catch (e) {
      console.error("[v0] sendToOne error:", e)
      setSendStatuses((s) => ({ ...s, [email]: "error" }))
    }
  }

  const sendToAllSequential = async () => {
    if (!selectedTournament) return
    const list = selectedParts.map((p) => getParticipantEmail(p)).filter((e) => !!e)

    if (!list.length) {
      alert("No participant emails found.")
      return
    }
    if (!roomId || !roomPass) {
      alert("Please enter Room ID and Password.")
      return
    }

    setIsSendingAll(true)
    try {
      for (const email of list) {
        // eslint-disable-next-line no-await-in-loop
        await sendToOne(email)
      }
    } finally {
      setIsSendingAll(false)
    }
  }

  const selectedParts = Array.isArray(selectedTournament?.participants)
    ? selectedTournament.participants
    : participantsByTid[selectedTournament?.id] || []

  const getParticipantName = (p) => p?.user_id?.fullName || p?.user_id?.username || p?.username || "—"
  const getParticipantEmail = (p) => p?.user_id?.email || p?.email || "—"
  const getParticipantTeam = (p) => p?.team_name || "—"

  const items = (data || []).map((t) => {
    const id = t.id || t.t_id || t._id
    const game = (t.game || "").toLowerCase()
    const map = t.map || ""
    const date = t.t_date || t.date || ""
    const time = t.t_time || t.time || ""
    const entryFee = t.entry_fee ?? t.entryFee ?? 0
    const rewards = t.rewards || { first: t.reward_1 ?? 0, second: t.reward_2 ?? 0, third: t.reward_3 ?? 0 }
    const poolPrize = Number(rewards.first) + Number(rewards.second) + Number(rewards.third)
    const mode = t.mode_type || t.mode || "solo"
 const statusRaw = (t.t_status || t.status || "").toLowerCase();
const status = ["running", "in-progress", "ongoing"].includes(statusRaw)
      ? "running"
      : ["upcoming", "pending", "scheduled"].includes(statusRaw)
        ? "pending"
        : ["completed", "done", "finished", "ended"].includes(statusRaw)
          ? "completed"
          : statusRaw || "pending";

    const resultPublished = t.result_published || false
    const resultImagePath = t.result_image_path || null

    return {
      id,
      name: t.name || `Tournament ${id}`,
      game,
      thumbnail: t.thumbnail,
      map,
      date,
      time,
      entryFee,
      poolPrize,
      rewards,
      mode,
      status,
      resultPublished,
      resultImagePath,
    }
  })

  const filtered = items.filter((t) => {
    if (filter === "all") return true;
    if (filter === "active") return t.status === "pending" || t.status === "running";
    if (filter === "completed") return t.status === "completed" && !t.resultPublished
    return t.status === filter
  })

  return (
    <div style={{ padding: isMobile ? "0.25rem" : "0.5rem" }}>
      {/* Header */}
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: isMobile ? "flex-start" : "center", 
        marginBottom: "1rem",
        flexDirection: isMobile ? "column" : "row",
        gap: isMobile ? "0.5rem" : "0"
      }}>
        <h1 style={{ 
          fontSize: isMobile ? "1.5rem" : theme.sizes.sectionTitleFontSize, 
          textShadow: theme.shadows.titleGlow, 
          margin: 0 
        }}>
          Tournament Management
        </h1>
        <div style={{ 
          display: "flex", 
          gap: "0.5rem",
          flexWrap: isMobile ? "wrap" : "nowrap",
          width: isMobile ? "100%" : "auto"
        }}>
          <Button 
            onClick={() => navigate(-1)}
            style={{ fontSize: isMobile ? "0.8rem" : "0.9rem", padding: isMobile ? "6px 8px" : "8px 12px" }}
          >
            ← Back
          </Button>
          <Button 
            kind="primary" 
            onClick={handleAdd}
            style={{ fontSize: isMobile ? "0.8rem" : "0.9rem", padding: isMobile ? "6px 8px" : "8px 12px" }}
          >
            + Add New Tournament
          </Button>
        </div>
      </div>

      {/* Filter */}
      <div style={{ 
        textAlign: "center", 
        marginBottom: "1rem",
        overflowX: isMobile ? "auto" : "visible",
        paddingBottom: isMobile ? "0.5rem" : "0"
      }}>
        <div style={{ 
          display: "flex", 
          gap: isMobile ? "0.25rem" : "0.5rem",
          justifyContent: isMobile ? "flex-start" : "center",
          flexWrap: isMobile ? "wrap" : "nowrap",
          minWidth: isMobile ? "max-content" : "auto"
        }}>
          {["active", "pending", "running", "completed"].map((f) => (
            <Button
              key={f}
              kind={filter === f ? "primary" : "secondary"}
              onClick={() => setFilter(f)}
              style={{ 
                marginRight: f !== "completed" ? (isMobile ? 4 : 8) : 0,
                fontSize: isMobile ? "0.7rem" : "0.9rem",
                padding: isMobile ? "4px 8px" : "8px 12px",
                whiteSpace: "nowrap"
              }}
            >
              {isMobile ? 
                (f === "active" ? "Active" : f.charAt(0).toUpperCase() + f.slice(1)) :
                (f === "active" ? "Active (Pending + Running)" : f.charAt(0).toUpperCase() + f.slice(1))
              }
            </Button>
          ))}
        </div>
      </div>

      {/* Tournament Cards */}
      {isLoading ? (
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(280px, 1fr))", 
          gap: isMobile ? "0.75rem" : "1rem" 
        }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              style={{
                background: "#131313",
                borderRadius: 8,
                height: 240,
                animation: "pulse 1.2s ease-in-out infinite",
                opacity: 0.7,
              }}
            />
          ))}
        </div>
      ) : filtered.length ? (
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(360px, 1fr))", 
          gap: isMobile ? "0.75rem" : "1rem" 
        }}>
          {filtered.map((t) => {
            const joinedCount = participantsCountByTid[t.id] ?? 0
            return <TournamentCard 
              key={t.id}
              tournament={t}
              joinedCount={joinedCount}
              onStart={handleStart}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
              onPublishResults={handlePublishResults}
              onViewResultImage={handleViewResultImage}
              isMobile={isMobile}
            />
          })}
        </div>
      ) : (
        <div style={{ padding: 20, textAlign: "center", color: "gray" }}>No tournaments found.</div>
      )}

      {showStartModal && selectedTournament && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
          }}
        >
          <div
            style={{
              width: "min(820px, 92vw)",
              background: "#101010",
              borderRadius: 12,
              boxShadow: theme.shadows.buttonShadow,
              padding: 16,
              color: "#fff",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <h3 style={{ margin: 0 }}>{selectedTournament.name}</h3>
              <Button onClick={() => setShowStartModal(false)}>Close</Button>
            </div>
            <p style={{ marginTop: 0, color: "#c8c8c8", fontSize: 14 }}>
              {formatDate(selectedTournament.date)} • {formatTime(selectedTournament.time)}
            </p>

            {/* Single Credentials form ONLY */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ display: "block", marginBottom: 6, color: "#ddd" }}>Room ID</label>
                <input
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  placeholder="Enter Room ID"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 8,
                    border: "1px solid #2a2a2a",
                    background: "#0f0f0f",
                    color: "#fff",
                  }}
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: 6, color: "#ddd" }}>Password</label>
                <input
                  value={roomPass}
                  onChange={(e) => setRoomPass(e.target.value)}
                  placeholder="Enter Password"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 8,
                    border: "1px solid #2a2a2a",
                    background: "#0f0f0f",
                    color: "#fff",
                  }}
                />
              </div>
            </div>

            {/* Participants list with per-recipient status */}
            <div style={{ marginTop: 8, marginBottom: 12 }}>
              <h4 style={{ margin: "6px 0" }}>Enrolled Players</h4>
              <div
                style={{
                  maxHeight: 260,
                  overflow: "auto",
                  border: "1px solid #1f1f1f",
                  borderRadius: 8,
                  padding: 8,
                  background: "#0b0b0b",
                }}
              >
                {selectedParts.length ? (
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                    <thead>
                      <tr style={{ textAlign: "left", color: "#bdbdbd" }}>
                        <th style={{ padding: "8px 6px", borderBottom: "1px solid #222" }}>#</th>
                        <th style={{ padding: "8px 6px", borderBottom: "1px solid #222" }}>Full Name / Username</th>
                        <th style={{ padding: "8px 6px", borderBottom: "1px solid #222" }}>Team</th>
                        <th style={{ padding: "8px 6px", borderBottom: "1px solid #222" }}>Email</th>
                        <th style={{ padding: "8px 6px", borderBottom: "1px solid #222" }}>Status</th>
                        <th style={{ padding: "8px 6px", borderBottom: "1px solid #222" }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedParts.map((p, idx) => {
                        const email = getParticipantEmail(p)
                        const status = sendStatuses[email] || "idle"
                        return (
                          <tr key={p._id || p.user_id?._id || idx}>
                            <td style={{ padding: "8px 6px", borderBottom: "1px solid #181818" }}>{idx + 1}</td>
                            <td style={{ padding: "8px 6px", borderBottom: "1px solid #181818" }}>
                              {getParticipantName(p)}
                            </td>
                            <td style={{ padding: "8px 6px", borderBottom: "1px solid #181818" }}>
                              {getParticipantTeam(p)}
                            </td>
                            <td style={{ padding: "8px 6px", borderBottom: "1px solid #181818" }}>{email}</td>
                            <td style={{ padding: "8px 6px", borderBottom: "1px solid #181818" }}>
                              {status === "ok" ? "✅" : status === "error" ? "❌" : status === "pending" ? "⏳" : "—"}
                            </td>
                            <td style={{ padding: "8px 6px", borderBottom: "1px solid #181818" }}>
                              <Button
                                onClick={() => sendToOne(email)}
                                disabled={!email || !roomId || !roomPass || status === "pending"}
                              >
                                Send
                              </Button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                ) : (
                  <div style={{ color: "#bdbdbd", padding: 8 }}>No participants joined yet.</div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <Button
                kind="primary"
                onClick={sendToAllSequential}
                disabled={!roomId || !roomPass || !selectedParts.length || isSendingAll}
              >
                {isSendingAll ? "Sending..." : "Send Credentials to All"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Image Modal */}
      {showImageModal && (
        <FullscreenImageModal
          imageUrl={selectedImageUrl}
          tournamentName={selectedTournamentName}
          onClose={() => {
            setShowImageModal(false)
            setSelectedImageUrl("")
            setSelectedTournamentName("")
          }}
        />
      )}
    </div>
  )
}

// Tournament Card Component with Countdown Timer
const TournamentCard = ({ tournament: t, joinedCount, onStart, onUpdate, onDelete, onPublishResults, onViewResultImage, isMobile = false }) => {
  const timeLeft = useCountdown(t.date, t.time)
  
  return (
    <div
      style={{
        position: "relative",
        height: isMobile ? 240 : 280,
        borderRadius: 14,
        overflow: "hidden",
        backgroundImage: `url(${t.thumbnail || gameThumbs[t.game] || gameThumbs.bgmi})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        boxShadow: theme.shadows.buttonShadow,
      }}
    >
      {/* Dark gradient overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.65) 40%, rgba(0,0,0,0.85) 100%)",
        }}
      />

      {/* Left details */}
      <div
        style={{
          position: "absolute",
          top: 14,
          left: 14,
          right: 14,
          display: "flex",
          alignItems: "flex-start",
          gap: 12,
        }}
      >
        <div style={{ color: "#fff", maxWidth: isMobile ? "70%" : "65%" }}>
          <h3 style={{ 
            margin: 0, 
            color: theme.colors.primary, 
            textShadow: theme.shadows.titleGlow,
            fontSize: isMobile ? "1rem" : "1.1rem"
          }}>
            {t.name}
          </h3>
          <p style={{ margin: "4px 0", fontSize: isMobile ? 12 : 14 }}>
            {t.game.toUpperCase()} • {t.map} • {t.mode.charAt(0).toUpperCase() + t.mode.slice(1)}
          </p>
          <p style={{ margin: "4px 0", fontSize: isMobile ? 12 : 14 }}>
            {formatDate(t.date)} • {formatTime(t.time)}
          </p>
          <p style={{ margin: "4px 0", fontSize: isMobile ? 12 : 14 }}>Entry Fee: ₹{t.entryFee}</p>
          
          {/* Result Image Indicator */}
          {t.status === "completed" && t.resultPublished && t.resultImagePath && (
            <div style={{
              margin: "8px 0",
              padding: "4px 8px",
              background: "rgba(0, 255, 200, 0.2)",
              border: "1px solid #00ffcc",
              borderRadius: "4px",
              fontSize: isMobile ? 10 : 12,
              color: "#00ffcc",
              textAlign: "center",
              cursor: "pointer",
              transition: "all 0.3s ease"
            }}
            onClick={() => onViewResultImage(t.resultImagePath, t.name)}
            onMouseEnter={(e) => {
              e.target.style.background = "rgba(0, 255, 200, 0.3)"
              e.target.style.transform = "scale(1.02)"
            }}
            onMouseLeave={(e) => {
              e.target.style.background = "rgba(0, 255, 200, 0.2)"
              e.target.style.transform = "scale(1)"
            }}
            >
              🏆 Results Published - Click to View
            </div>
          )}
          
          {/* Countdown Timer */}
          {timeLeft && (
            <div
              style={{
                margin: "8px 0",
                padding: "6px 12px",
                background: timeLeft.total < 3600000 ? "rgba(255, 0, 0, 0.3)" : "rgba(0, 255, 0, 0.3)",
                borderRadius: 6,
                border: `1px solid ${timeLeft.total < 3600000 ? "#ff4444" : "#44ff44"}`,
                fontSize: 12,
                fontWeight: "bold",
                textAlign: "center",
              }}
            >
              ⏰ {formatCountdown(timeLeft)}
            </div>
          )}
        </div>

        {/* Center pool prize */}
        <div
          style={{
            marginLeft: "auto",
            textAlign: "center",
            background: theme.gradients.primaryButton,
            padding: "10px 18px",
            borderRadius: 10,
            color: "#fff",
            fontWeight: 700,
            boxShadow: theme.shadows.buttonShadow,
          }}
        >
          Pool ₹{t.poolPrize}
        </div>
      </div>

      {/* Right actions - Show different buttons based on status */}
      <div
        style={{
          position: "absolute",
          
          right: 14,
          bottom: 14,
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        {t.status === "completed" ? (
          <>
            {t.resultPublished ? (
              <>
                {t.resultImagePath && (
                  <Button 
                    kind="primary" 
                    onClick={() => onViewResultImage(t.resultImagePath, t.name)}
                    style={{ background: "linear-gradient(90deg, #00ffcc, #0077ff)" }}
                  >
                    🏆 View Results
                  </Button>
                )}
                <Button onClick={() => onUpdate(t.id)}>Update</Button>
                <Button
                  onClick={() => onDelete(t.id)}
                  style={{ background: "linear-gradient(90deg, #ff4747, #e20000)" }}
                >
                  Delete
                </Button>
              </>
            ) : (
              <>
                <Button kind="primary" onClick={() => onPublishResults(t.id)}>
                  Publish Results
                </Button>
                {/* <Button  onClick={() => onUpdate(t.id)}>Update</Button> */}
                <Button disabled
                  onClick={() => onDelete(t.id)}
                  style={{ background: "linear-gradient(90deg, #ff4747, #e20000)" }}
                >Delete</Button>
              </>
            )}
          </>
        ) : (
          <>
            <Button kind="primary" onClick={() => onStart(t.id)}>
              Start
            </Button>
            <Button disabled={t.status==="running"} style={{cursor: t.status==="running"?'not-allowed':'pointer', color: t.status==="running"?'red':'white'}} onClick={() => onUpdate(t.id)} >Update</Button>
            <Button disabled={t.status==="running"} hidden={t.status==="running" } style={{cursor: t.status==="running"? 'not-allowed':'pointer', color: t.status==="running"?'red':'white', background:  t.status==="running"?'white': "linear-gradient(90deg, #ff4747, #e20000)" }}
              onClick={() => onDelete(t.id)}
            >
              Delete
            </Button>
          </>
        )}
      </div>

      {/* Hover footer with joined and rewards */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          padding: "10px 12px",
          background: "rgba(0,0,0,0.85)",
          color: "#fff",
          textAlign: "center",
          fontSize: 14,
          opacity: 0,
          transition: "opacity 0.25s ease",
        }}
        className="hoverFooter"
      >
        <div>Players joined: {joinedCount}</div>
        <div>
          Rewards: 1st ₹{t.rewards.first} | 2nd ₹{t.rewards.second} | 3rd ₹{t.rewards.third}
        </div>
      </div>

      <style>
        {`
          div:hover > .hoverFooter { opacity: 1; }
        `}
      </style>
    </div>
  )
}

export default AdminTournaments
