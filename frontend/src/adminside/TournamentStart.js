"use client"
import { useParams, useNavigate } from "react-router-dom"
import theme from "../theme"
import useSWR from "swr"
import axios from "axios"
import { useEffect, useMemo, useState } from "react"
import API_BASE_URL from "../config/apiConfig";

const mockParticipants = (id) => [
  { id: `u-${id}-1`, name: "John Doe", username: "johnny", email: "john@example.com" },
  { id: `u-${id}-2`, name: "Aisha Khan", username: "aisha", email: "aisha@example.com" },
  { id: `u-${id}-3`, name: "Liam Patel", username: "liam", email: "liam@example.com" },
]

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

  const { data: withParts } = useSWR(`${API_BASE_URL}/admin/tournaments/withParticipants`, (url) =>
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
          await axios.put(`${API_BASE_URL}/admin/tournaments/${id}`, { t_status: "completed" })
          setCompleted(true)
        } catch (e) {
          console.error("[v0] auto-complete failed:", e)
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

  const sendRoomDetails = () => {
    if (!roomId || !roomPass) return alert("Enter Room ID and Password first.")
    const emails = populatedParticipants.map((p) => p.email).filter(Boolean)
    if (!emails.length) return alert("No participant emails found.")
    const subject = encodeURIComponent(
      `Room Details • ${tournament?.game?.toUpperCase() || "Tournament"} ${tournament?.t_id || id}`,
    )
    const body = encodeURIComponent(
      `Hello Player,%0A%0ARoom ID: ${roomId}%0APassword: ${roomPass}%0AStart Time: ${startTime?.toLocaleString() || "-"}%0A%0AAll the best!`,
    )
    window.location.href = `mailto:?bcc=${emails.join(",")}&subject=${subject}&body=${body}`
  }

  const isLoading = !withParts || !tournament

  return (
    <div style={{ padding: "1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <h1 style={{ fontSize: "1.5rem", color: theme.colors.primary, textShadow: theme.shadows.titleGlow, margin: 0 }}>
          Start Tournament • ID #{id}
        </h1>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {running ? (
            <span style={{ color: "#00C853", fontWeight: 600 }}>Running</span>
          ) : completed ? (
            <span style={{ color: "#90A4AE" }}>Completed</span>
          ) : (
            <span style={{ color: "#FFC107" }}>Pending</span>
          )}
          <button
            onClick={() => navigate(-1)}
            style={{
              padding: "8px 12px",
              borderRadius: "8px",
              border: "none",
              background: theme.gradients.secondaryButton,
              color: theme.colors.white,
              cursor: "pointer",
              boxShadow: theme.shadows.buttonShadow,
            }}
          >
            ← Back
          </button>
        </div>
      </div>

      <div
        style={{
          background: theme.gradients.navbarAlt1,
          border: `1px solid ${theme.colors.primary}`,
          borderRadius: 12,
          padding: 16,
          marginBottom: 16,
        }}
      >
        <strong style={{ color: theme.colors.secondary, display: "block", marginBottom: 8 }}>Room Credentials</strong>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <input
            placeholder="Room ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            style={{
              padding: 10,
              borderRadius: 8,
              background: "#0f0f0f",
              color: "#fff",
              border: "1px solid #444",
              minWidth: 220,
            }}
          />
          <input
            placeholder="Password"
            value={roomPass}
            onChange={(e) => setRoomPass(e.target.value)}
            style={{
              padding: 10,
              borderRadius: 8,
              background: "#0f0f0f",
              color: "#fff",
              border: "1px solid #444",
              minWidth: 220,
            }}
          />
          {!saved ? (
            <button
              onClick={() => setSaved(true)}
              style={{
                padding: "8px 12px",
                borderRadius: "8px",
                border: "none",
                background: theme.gradients.primaryButton,
                color: theme.colors.white,
                cursor: "pointer",
                boxShadow: theme.shadows.buttonShadow,
              }}
            >
              Save
            </button>
          ) : (
            <>
              <button
                onClick={sendRoomDetails}
                style={{
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border: "none",
                  background: theme.gradients.primaryButton,
                  color: theme.colors.white,
                  cursor: "pointer",
                  boxShadow: theme.shadows.buttonShadow,
                }}
              >
                Send Details to Players (Email)
              </button>
              <span style={{ color: "#9CCC65" }}>Saved</span>
            </>
          )}
        </div>
        <div style={{ marginTop: 8, color: theme.colors.lightGray, fontSize: 12 }}>
          Starts: {startTime ? startTime.toLocaleString() : "-"} • Ends: {endTime ? endTime.toLocaleString() : "-"} (40
          min duration)
        </div>
      </div>

      <div
        style={{
          background: theme.colors.navbarDark,
          borderRadius: 12,
          overflowX: "auto",
          opacity: saved ? 1 : 0.5,
          pointerEvents: saved ? "auto" : "none",
        }}
      >
        <table style={{ width: "100%", minWidth: 700, borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: theme.colors.primary, color: "#000" }}>
              <th style={{ padding: 10, textAlign: "left" }}>Team</th>
              <th style={{ padding: 10, textAlign: "left" }}>Name</th>
              <th style={{ padding: 10, textAlign: "left" }}>Username</th>
              <th style={{ padding: 10, textAlign: "left" }}>Email</th>
            </tr>
          </thead>
          <tbody>
            {!isLoading && populatedParticipants.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: 12, color: "gray" }}>
                  No participants joined yet.
                </td>
              </tr>
            ) : populatedParticipants.length ? (
              populatedParticipants.map((p) => (
                <tr key={p.id} style={{ borderBottom: "1px solid #333" }}>
                  <td style={{ padding: 10 }}>{p.team_name}</td>
                  <td style={{ padding: 10 }}>{p.name}</td>
                  <td style={{ padding: 10 }}>{p.username}</td>
                  <td style={{ padding: 10 }}>{p.email}</td>
                </tr>
              ))
            ) : (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i}>
                  <td style={{ padding: 10, color: "gray" }}>Loading…</td>
                  <td style={{ padding: 10, color: "gray" }}>Loading…</td>
                  <td style={{ padding: 10, color: "gray" }}>Loading…</td>
                  <td style={{ padding: 10, color: "gray" }}>Loading…</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default TournamentStart
