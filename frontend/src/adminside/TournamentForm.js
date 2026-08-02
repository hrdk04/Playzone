"use client"

import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import axios from "axios"
import theme from "../theme"
import useSWR from "swr"
import API_BASE_URL from "../config/apiConfig";

// ✅ GAME THUMBNAIL MAPPING
const GAME_THUMBNAILS = {
  "FREE FIRE": "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/attachments/gen-images/public/free-fire-tournament-thumbnail-FWJXr9klyXNgG4ipmBdUO4JVJLx6b0.jpg",
  "BGMI": "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/attachments/gen-images/public/pubg-tournament-thumbnail-AjPlFiMYXBffKvveih37Gf0QV73jcV.jpg",
  "PUBG": "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/attachments/gen-images/public/bgmi-image-0GVKxNzgkQMecCUcOAwdL2hBQ70Mon.jpg",
  "COD": "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/attachments/gen-images/public/call-of-duty-tournament-thumbnail-arEjVdlWpQ1EO181MsF1aPSMoKE9lC.jpg",
};

// ✅ MAP OPTIONS FOR EACH GAME
const GAME_MAPS = {
  "FREE FIRE": ["Bermuda", "Purgatory", "Kalahari", "Alpine"],
  "BGMI": ["Erangel", "Miramar", "Sanhok", "Vikendi", "Livik"],
  "PUBG": ["Erangel", "Miramar", "Sanhok", "Vikendi", "Karakin"],
  "COD": ["Nuketown", "Shipment", "Crash", "Firing Range", "Standoff"],
};

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
    mode_type: "squad",
    slots: 16, // ✅ Default slots
  })

  const [autoRewards, setAutoRewards] = useState(true)
  const [commission, setCommission] = useState(0)
  const [totalPool, setTotalPool] = useState(0)
  const [customThumbnail, setCustomThumbnail] = useState(false)
  const [registeredTeams, setRegisteredTeams] = useState(0) // ✅ Track registered teams

  // -------------------- Fetch Tournament if update --------------------
  const { data: tData, isLoading: isLoadingT } = useSWR(
    isUpdate && id ? `${API_BASE_URL}/admin/tournaments/${id}` : null,
    (url) => axios.get(url).then((res) => res.data),
  )

  // ✅ Fetch registered teams count for update mode
  useEffect(() => {
    if (isUpdate && id) {
      axios.get(`${API_BASE_URL}/admin/tournaments/${id}/registrations`)
        .then(res => {
          setRegisteredTeams(res.data?.count || 0)
        })
        .catch(err => {
          console.error("Failed to fetch registrations:", err)
          setRegisteredTeams(0)
        })
    }
  }, [isUpdate, id])

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
      slots: t.slots || 16, // ✅ Load existing slots
    })
    
    // Check if thumbnail is custom
    if (t.thumbnail && !Object.values(GAME_THUMBNAILS).includes(t.thumbnail)) {
      setCustomThumbnail(true);
    }
  }, [isUpdate, id, tData])

  // ✅ AUTO-FILL THUMBNAIL WHEN GAME CHANGES
  useEffect(() => {
    if (form.game && GAME_THUMBNAILS[form.game] && !customThumbnail) {
      setForm(prev => ({
        ...prev,
        thumbnail: GAME_THUMBNAILS[form.game],
        map: "" // Reset map when game changes
      }));
    }
  }, [form.game, customThumbnail]);

  // -------------------- Handle Input Change --------------------
  const handleChange = (e) => {
    const { name, value } = e.target
    
    // If manually changing thumbnail, mark as custom
    if (name === "thumbnail") {
      setCustomThumbnail(true);
    }

    // ✅ Validate slots against registered teams
    if (name === "slots") {
      const newSlots = Number(value)
      if (isUpdate && newSlots < registeredTeams) {
        alert(`Cannot set slots below ${registeredTeams} (current registered teams)`)
        return
      }
    }
    
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  // ✅ RESET TO AUTO THUMBNAIL
  const resetToAutoThumbnail = () => {
    if (form.game && GAME_THUMBNAILS[form.game]) {
      setForm(prev => ({
        ...prev,
        thumbnail: GAME_THUMBNAILS[form.game]
      }));
      setCustomThumbnail(false);
    }
  };

  // ✅ -------------------- Auto Calculate Rewards (UPDATED WITH DYNAMIC SLOTS) --------------------
  useEffect(() => {
    if (!autoRewards || !form.entry_fee || !form.slots) return

    const entryFeeNum = Number(form.entry_fee)
    const slotsNum = Number(form.slots)
    
    if (isNaN(entryFeeNum) || entryFeeNum <= 0 || isNaN(slotsNum) || slotsNum <= 0) return

    // ✅ Total revenue from all slots
    const totalRevenue = entryFeeNum * slotsNum

    // ✅ Prize Pool (70%) - rounded to nearest 10
    const totalPoolCalc = Math.round((totalRevenue * 0.7) / 10) * 10
    
    // ✅ Commission = Remaining amount (ensures no money lost)
    const commissionCalc = totalRevenue - totalPoolCalc

    // ✅ Calculate rewards (all multiples of 10)
    const reward1 = Math.round((totalPoolCalc / 2) / 10) * 10      // 50% using /2
    const reward2 = Math.round((totalPoolCalc * 0.3) / 10) * 10    // 30%
    const reward3 = totalPoolCalc - reward1 - reward2              // Remaining ~20%

    setTotalPool(totalPoolCalc)
    setCommission(commissionCalc)
    setForm((prev) => ({
      ...prev,
      rewards_first: reward1,
      rewards_second: reward2,
      rewards_third: reward3,
    }))
  }, [form.entry_fee, form.slots, autoRewards])

  // -------------------- Submit --------------------
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.game || !form.map || !form.entry_fee || !form.t_date || !form.t_time || !form.slots) {
      alert("Please fill all required fields including entry fee and slots.")
      return
    }

    // ✅ Validate slots
    if (Number(form.slots) < 1 || Number(form.slots) > 100) {
      alert("Slots must be between 1 and 100")
      return
    }

    const payload = {
      t_id: form.t_id,
      game: form.game,
      map: form.map,
      mode_type: form.mode_type,
      entry_fee: Number(form.entry_fee),
      slots: Number(form.slots), // ✅ Include slots
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
        await axios.put(`${API_BASE_URL}/admin/tournaments/${id}`, payload)
        alert("✅ Tournament updated successfully!")
      } else {
        await axios.post(`${API_BASE_URL}/admin/tournaments`, payload)
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
          
          {/* ✅ GAME DROPDOWN */}
          <div>
            <label>Game *</label>
            <select 
              name="game" 
              value={form.game} 
              onChange={handleChange} 
              style={fieldStyle} 
              required
            >
              <option value="">-- Select Game --</option>
              <option value="BGMI">BGMI (Battlegrounds Mobile India)</option>
              <option value="FREE FIRE">Free Fire</option>
              <option value="PUBG">PUBG Mobile</option>
              <option value="COD">Call of Duty Mobile</option>
            </select>
          </div>
          
          {/* ✅ MAP DROPDOWN (Dynamic based on game) */}
          <div>
            <label>Map *</label>
            <select 
              name="map" 
              value={form.map} 
              onChange={handleChange} 
              style={fieldStyle} 
              required
              disabled={!form.game}
            >
              <option value="">-- Select Map --</option>
              {form.game && GAME_MAPS[form.game] && GAME_MAPS[form.game].map(mapName => (
                <option key={mapName} value={mapName}>{mapName}</option>
              ))}
            </select>
            {!form.game && (
              <small style={{ color: theme.colors.lightGray, fontSize: '0.8rem' }}>
                Select a game first
              </small>
            )}
          </div>
          
          <div>
            <label>Mode Type</label>
            <select name="mode_type" value={form.mode_type} onChange={handleChange} style={fieldStyle}>
              <option value="solo">Solo</option>
              <option value="duo">Duo</option>
              <option value="squad">Squad</option>
            </select>
          </div>
          
          {/* ✅ SLOTS INPUT */}
          <div>
            <label>Total Slots *</label>
            <input 
              type="number" 
              name="slots" 
              value={form.slots} 
              onChange={handleChange} 
              style={{
                ...fieldStyle,
                border: isUpdate && registeredTeams > 0 ? "1px solid #ffc107" : "1px solid #444"
              }}
              placeholder="e.g., 16"
              min={isUpdate ? registeredTeams : 1}
              max="100"
              required
            />
            {isUpdate && registeredTeams > 0 && (
              <small style={{ color: "#ffc107", fontSize: '0.8rem', display: 'block', marginTop: '0.25rem' }}>
                ⚠️ {registeredTeams} teams already registered (min: {registeredTeams})
              </small>
            )}
            {!isUpdate && (
              <small style={{ color: theme.colors.lightGray, fontSize: '0.8rem', display: 'block', marginTop: '0.25rem' }}>
                Available slots: {form.slots || 16}
              </small>
            )}
          </div>
          
          <div>
            <label>Entry Fee *</label>
            <input 
              type="number" 
              name="entry_fee" 
              value={form.entry_fee} 
              onChange={handleChange} 
              style={fieldStyle}
              placeholder="e.g., 50"
              min="0"
              required
            />
          </div>
        </div>

        {/* ✅ SLOT STATUS (for update mode) */}
        {isUpdate && registeredTeams > 0 && (
          <div style={{
            marginTop: "1rem",
            padding: "1rem",
            background: "rgba(255,193,7,0.1)",
            border: "1px solid rgba(255,193,7,0.3)",
            borderRadius: "8px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}>
            <div>
              <p style={{ margin: 0, fontSize: "0.9rem", color: theme.colors.lightGray }}>Registration Status</p>
              <p style={{ margin: 0, fontSize: "1.3rem", fontWeight: "bold", color: "#fff" }}>
                {registeredTeams} / {form.slots} Teams Registered
              </p>
            </div>
            <div style={{
              width: "150px",
              height: "150px",
              borderRadius: "50%",
              border: "8px solid rgba(255,193,7,0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative"
            }}>
              <div style={{
                position: "absolute",
                width: "100%",
                height: "100%",
                borderRadius: "50%",
                background: `conic-gradient(${theme.colors.primary} ${(registeredTeams / form.slots) * 360}deg, transparent 0deg)`
              }} />
              <div style={{
                position: "relative",
                zIndex: 1,
                background: "#0a0a0a",
                width: "120px",
                height: "120px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column"
              }}>
                <span style={{ fontSize: "2rem", fontWeight: "bold", color: theme.colors.primary }}>
                  {Math.round((registeredTeams / form.slots) * 100)}%
                </span>
                <span style={{ fontSize: "0.8rem", color: theme.colors.lightGray }}>
                  Filled
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ✅ THUMBNAIL PREVIEW & MANAGEMENT */}
        {form.game && (
          <div style={{
            marginTop: "1rem",
            padding: "1rem",
            background: "rgba(0,255,204,0.05)",
            border: "1px solid rgba(0,255,204,0.2)",
            borderRadius: "8px"
          }}>
            <div style={{ 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center",
              marginBottom: "0.5rem"
            }}>
              <label style={{ fontWeight: "bold", color: theme.colors.secondary }}>
                Tournament Thumbnail
              </label>
              {customThumbnail && (
                <button
                  type="button"
                  onClick={resetToAutoThumbnail}
                  style={{
                    padding: "4px 8px",
                    fontSize: "0.8rem",
                    borderRadius: "4px",
                    border: "none",
                    background: theme.colors.primary,
                    color: "#fff",
                    cursor: "pointer"
                  }}
                >
                  ↺ Reset to Auto
                </button>
              )}
            </div>
            
            {/* Thumbnail Preview */}
            {form.thumbnail && (
              <div style={{ marginBottom: "0.5rem", textAlign:'center' }}>
                <img 
                  src={form.thumbnail} 
                  alt="Tournament Thumbnail"
                  style={{
                    width: "100%",
                    maxWidth: "300px",
                    height: "auto",
                    borderRadius: "8px",
                    border: `2px solid ${theme.colors.primary}`
                  }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'block';
                  }}
                />
                <div style={{ 
                  display: 'none', 
                  padding: '1rem', 
                  background: 'rgba(255,0,0,0.1)',
                  borderRadius: '8px',
                  color: '#ff6b6b'
                }}>
                  ⚠️ Image failed to load. Please check URL.
                </div>
              </div>
            )}
            
            {/* Thumbnail URL Input */}
            <div>
              <input
                name="thumbnail"
                value={form.thumbnail}
                onChange={handleChange}
                style={{
                  ...fieldStyle,
                  border: customThumbnail ? "1px solid #ffc107" : "1px solid #444"
                }}
                placeholder="Auto-filled based on game selection"
              />
              <small style={{ 
                color: customThumbnail ? "#ffc107" : theme.colors.lightGray,
                fontSize: '0.8rem',
                display: 'block',
                marginTop: '0.25rem'
              }}>
                {customThumbnail 
                  ? "⚠️ Using custom thumbnail (click 'Reset to Auto' to use default)" 
                  : "✅ Auto-filled from game selection"
                }
              </small>
            </div>
          </div>
        )}

        {/* ✅ Auto Reward Checkbox (UPDATED TEXT) */}
        <div style={{ marginTop: "1rem" }}>
          <label>
            <input
              type="checkbox"
              checked={autoRewards}
              onChange={() => setAutoRewards((prev) => !prev)}
              style={{ marginRight: "8px" }}
            />
            Auto-calculate rewards (~70% prize pool, ~30% commission, all amounts in multiples of ₹10)
          </label>
        </div>

        {/* ✅ Show Commission and Pool (UPDATED WITH DYNAMIC SLOTS) */}
        {form.entry_fee && form.slots && (
          <div style={infoBoxStyle}>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem'
            }}>
              <div>
                <p style={{ margin: 0, color: theme.colors.lightGray }}>
                  Total Revenue ({form.slots} slots)
                </p>
                <p style={{ margin: 0, fontSize: '1.2rem', fontWeight: 'bold', color: '#fff' }}>
                  ₹{(Number(form.entry_fee) * Number(form.slots)).toLocaleString()}
                </p>
              </div>
              <div>
                <p style={{ margin: 0, color: theme.colors.lightGray }}>
                  Prize Pool ({totalPool && Number(form.entry_fee) && Number(form.slots) ? Math.round((totalPool / (Number(form.entry_fee) * Number(form.slots))) * 100) : 70}%)
                </p>
                <p style={{ margin: 0, fontSize: '1.2rem', fontWeight: 'bold', color: theme.colors.secondary }}>
                  ₹{totalPool.toLocaleString()}
                </p>
              </div>
              <div>
                <p style={{ margin: 0, color: theme.colors.lightGray }}>
                  Your Commission ({commission && Number(form.entry_fee) && Number(form.slots) ? Math.round((commission / (Number(form.entry_fee) * Number(form.slots))) * 100) : 30}%)
                </p>
                <p style={{ margin: 0, fontSize: '1.2rem', fontWeight: 'bold', color: theme.colors.primary }}>
                  ₹{commission.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Rewards */}
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: "12px", 
          marginTop: "1rem" 
        }}>
          <div>
            <label>🥇 1st Prize *</label>
            <input
              type="number"
              name="rewards_first"
              value={form.rewards_first}
              onChange={handleChange}
              style={fieldStyle}
              placeholder="Auto-calculated"
              required
            />
            {form.rewards_first && totalPool && (
              <small style={{ color: theme.colors.lightGray, fontSize: '0.8rem' }}>
                {Math.round((form.rewards_first / totalPool) * 100)}% of pool
              </small>
            )}
          </div>
          <div>
            <label>🥈 2nd Prize *</label>
            <input
              type="number"
              name="rewards_second"
              value={form.rewards_second}
              onChange={handleChange}
              style={fieldStyle}
              placeholder="Auto-calculated"
              required
            />
            {form.rewards_second && totalPool && (
              <small style={{ color: theme.colors.lightGray, fontSize: '0.8rem' }}>
                {Math.round((form.rewards_second / totalPool) * 100)}% of pool
              </small>
            )}
          </div>
          <div>
            <label>🥉 3rd Prize *</label>
            <input
              type="number"
              name="rewards_third"
              value={form.rewards_third}
              onChange={handleChange}
              style={fieldStyle}
              placeholder="Auto-calculated"
              required
            />
            {form.rewards_third && totalPool && (
              <small style={{ color: theme.colors.lightGray, fontSize: '0.8rem' }}>
                {Math.round((form.rewards_third / totalPool) * 100)}% of pool
              </small>
            )}
          </div>
        </div>

        {/* Other fields: Date, Time, Status */}
        <div style={{ ...groupStyle, marginTop: "1rem" }}>
          <div>
            <label>Tournament Date *</label>
            <input 
              type="date" 
              name="t_date" 
              value={form.t_date} 
              onChange={handleChange} 
              style={fieldStyle} 
              min={new Date().toISOString().split('T')[0]}
              required 
            />
          </div>
          <div>
            <label>Tournament Time *</label>
            <input 
              type="time" 
              name="t_time" 
              value={form.t_time} 
              onChange={handleChange} 
              style={fieldStyle} 
              required 
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
            <small style={{ color: theme.colors.lightGray, fontSize: '0.8rem' }}>
              Auto-managed by system
            </small>
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", gap: "12px", marginTop: "1.5rem" }}>
          <button
            type="submit"
            style={{
              padding: "12px 24px",
              borderRadius: "8px",
              border: "none",
              background: theme.gradients.primaryButton,
              color: theme.colors.white,
              cursor: "pointer",
              boxShadow: theme.shadows.buttonShadow,
              fontWeight: "bold",
              fontSize: "1rem"
            }}
          >
            {isUpdate ? "💾 Save Changes" : "✨ Create Tournament"}
          </button>

          <button
            type="button"
            onClick={() => navigate("/admin/tournaments")}
            style={{
              padding: "12px 24px",
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
