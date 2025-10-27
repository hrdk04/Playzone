"use client"

import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import axios from "axios"
import theme from "../theme"
import useSWR from "swr"

// -------------------- Styles --------------------
const fieldStyle = {
  padding: "10px",
  borderRadius: "8px",
  border: "1px solid #444",
  background: "#0f0f0f",
  color: "#fff",
  width: "100%",
}

const groupStyle = {
  display: "grid",
  gap: "12px",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
}

const infoBoxStyle = {
  padding: "12px",
  background: "#111",
  borderRadius: "8px",
  marginTop: "10px",
  color: "#fff",
  fontSize: "0.9rem",
}

// -------------------- Helper --------------------
const generateTournamentId = () => `T${Math.floor(1000 + Math.random() * 9000)}`

const TournamentForm = ({ mode = "create" }) => {
  const navigate = useNavigate()
  const { id } = useParams()
  const isUpdate = mode === "update"

  const [form, setForm] = useState({
    t_id: generateTournamentId(),
    game: "",
    map: "",
    entry_fee: "",
    t_date: "",
    t_time: "",
    rewards_first: "",
    rewards_second: "",
    rewards_third: "",
    t_status: "pending",
    thumbnail: "",
    mode_type: "solo",
  })

  const [autoRewards, setAutoRewards] = useState(true)
  const [commission, setCommission] = useState(0)
  const [totalPool, setTotalPool] = useState(0)

  // -------------------- Fetch Tournament if update --------------------
  const { data: tData, isLoading: isLoadingT } = useSWR(
    isUpdate && id ? `http://localhost:5000/admin/tournaments/${id}` : null,
    (url) => axios.get(url).then((res) => res.data),
  )

  useEffect(() => {
    if (!isUpdate || !id || !tData) return
    const t = tData || {}
    setForm({
      t_id: t.t_id || id,
      game: t.game || "",
      map: t.map || "",
      entry_fee: t.entry_fee ?? "",
      t_date: (t.t_date || "").slice(0, 10),
      t_time: t.t_time || "",
      rewards_first: t.rewards?.first ?? "",
      rewards_second: t.rewards?.second ?? "",
      rewards_third: t.rewards?.third ?? "",
      t_status: (t.t_status || "pending").toLowerCase(),
      thumbnail: t.thumbnail || "",
      mode_type: t.mode_type || "solo",
    })
  }, [isUpdate, id, tData])

  // -------------------- Handle Input Change --------------------
  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  // -------------------- Auto Calculate Rewards --------------------
  useEffect(() => {
    if (!autoRewards || !form.entry_fee) return

    const entryFeeNum = Number(form.entry_fee)
    if (isNaN(entryFeeNum) || entryFeeNum <= 0) return

    const totalPoolCalc = Math.floor(entryFeeNum * 16 * 0.7) // 30% commission
    const commissionCalc = Math.floor(entryFeeNum * 16 * 0.3)

    const reward1 = Math.floor((totalPoolCalc * 0.5) / 10) * 10
    const reward2 = Math.floor((totalPoolCalc * 0.3) / 10) * 10
    const reward3 = totalPoolCalc - reward1 - reward2

    setTotalPool(totalPoolCalc)
    setCommission(commissionCalc)
    setForm((prev) => ({
      ...prev,
      rewards_first: reward1,
      rewards_second: reward2,
      rewards_third: reward3,
    }))
  }, [form.entry_fee, autoRewards])

  // -------------------- Submit --------------------
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.game || !form.map || !form.entry_fee || !form.t_date || !form.t_time) {
      alert("Please fill all required fields including entry fee.")
      return
    }

    const payload = {
      t_id: form.t_id,
      game: form.game,
      map: form.map,
      mode_type: form.mode_type,
      entry_fee: Number(form.entry_fee),
      t_date: form.t_date,
      t_time: form.t_time,
      rewards: {
        first: Number(form.rewards_first),
        second: Number(form.rewards_second),
        third: Number(form.rewards_third),
      },
      t_status: form.t_status,
      thumbnail: form.thumbnail,
    }

    try {
      if (isUpdate) {
        await axios.put(`http://localhost:5000/admin/tournaments/${id}`, payload)
        alert("✅ Tournament updated successfully!")
      } else {
        await axios.post("http://localhost:5000/admin/tournaments", payload)
        alert("✅ Tournament created successfully!")
      }
      navigate("/admin/tournaments")
    } catch (err) {
      console.error("Save tournament failed:", err)
      alert("Save failed. Check server logs.")
    }
  }

  return (
    <div style={{ padding: "1rem" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <h1 style={{ fontSize: "1.5rem", color: theme.colors.primary, textShadow: theme.shadows.titleGlow, margin: 0 }}>
          {isUpdate ? `Update Tournament • ID #${id}` : "Add New Tournament"}
        </h1>
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

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        style={{
          background: theme.gradients.navbarAlt1,
          border: `1px solid ${theme.colors.primary}`,
          borderRadius: 12,
          padding: 16,
        }}
      >
        <div style={groupStyle}>
          <div>
            <label>Tournament ID</label>
            <input
              name="t_id"
              value={form.t_id}
              readOnly
              disabled
              style={{ ...fieldStyle, background: "#1a1a1a", color: "#888" }}
            />
          </div>
          <div>
            <label>Game</label>
            <input name="game" value={form.game} onChange={handleChange} style={fieldStyle} required />
          </div>
          <div>
            <label>Map</label>
            <input name="map" value={form.map} onChange={handleChange} style={fieldStyle} required />
          </div>
          <div>
            <label>Mode Type</label>
            <select name="mode_type" value={form.mode_type} onChange={handleChange} style={fieldStyle}>
              <option value="squad">Squad</option>
              <option value="solo">Solo</option>
              <option value="duo">Duo</option>
            </select>
          </div>
          <div>
            <label>Entry Fee</label>
            <input type="number" name="entry_fee" value={form.entry_fee} onChange={handleChange} style={fieldStyle} />
          </div>
        </div>

        {/* Auto Reward Checkbox */}
        <div style={{ marginTop: 10 }}>
          <label>
            <input
              type="checkbox"
              checked={autoRewards}
              onChange={() => setAutoRewards((prev) => !prev)}
              style={{ marginRight: "8px" }}
            />
            Auto-calculate rewards based on entry fee
          </label>
        </div>

        {/* Show Commission and Pool */}
        {form.entry_fee && (
          <div style={infoBoxStyle}>
            <p>
              Total Pool (after 30% commission): <b>₹{totalPool}</b>
            </p>
            <p>
              Your Commission (30%): <b>₹{commission}</b>
            </p>
          </div>
        )}

        {/* Rewards */}
        <div style={{ display: "flex", gap: "12px", marginTop: 10 }}>
          <div>
            <label>1st Prize</label>
            <input
              type="number"
              name="rewards_first"
              value={form.rewards_first}
              onChange={handleChange}
              style={fieldStyle}
            />
          </div>
          <div>
            <label>2nd Prize</label>
            <input
              type="number"
              name="rewards_second"
              value={form.rewards_second}
              onChange={handleChange}
              style={fieldStyle}
            />
          </div>
          <div>
            <label>3rd Prize</label>
            <input
              type="number"
              name="rewards_third"
              value={form.rewards_third}
              onChange={handleChange}
              style={fieldStyle}
            />
          </div>
        </div>

        {/* Other fields: Date, Time, Thumbnail, Status */}
        <div style={groupStyle}>
          <div>
            <label>Date</label>
            <input type="date" name="t_date" value={form.t_date} onChange={handleChange} style={fieldStyle} required />
          </div>
          <div>
            <label>Time</label>
            <input type="time" name="t_time" value={form.t_time} onChange={handleChange} style={fieldStyle} required />
          </div>
          <div>
            <label>Thumbnail URL</label>
            <input
              name="thumbnail"
              value={form.thumbnail}
              onChange={handleChange}
              style={fieldStyle}
              placeholder="/bgmi-image.jpg"
            />
          </div>
          <div>
            <label>Status</label>
            <input
              value={form.t_status}
              readOnly
              disabled
              style={{ ...fieldStyle, background: "#1a1a1a", color: "#888" }}
            />
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", gap: "12px", marginTop: 16 }}>
          <button
            type="submit"
            style={{
              padding: "10px 16px",
              borderRadius: "8px",
              border: "none",
              background: theme.gradients.primaryButton,
              color: theme.colors.white,
              cursor: "pointer",
              boxShadow: theme.shadows.buttonShadow,
            }}
          >
            {isUpdate ? "Save Changes" : "Create Tournament"}
          </button>

          <button
            type="button"
            onClick={() => navigate("/admin/tournaments")}
            style={{
              padding: "10px 16px",
              borderRadius: "8px",
              border: "none",
              background: theme.gradients.secondaryButton,
              color: theme.colors.white,
              cursor: "pointer",
              boxShadow: theme.shadows.buttonShadow,
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

export default TournamentForm
