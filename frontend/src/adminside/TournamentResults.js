"use client"
import { useParams, useNavigate } from "react-router-dom"
import theme from "../theme"
import useSWR from "swr"
import axios from "axios"
import { useMemo, useState } from "react"
import ResultImageGenerator from "./components/ResultImageGenerator"
import API_BASE_URL from "../config/apiConfig";

const TournamentResults = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  const [firstPlace, setFirstPlace] = useState("")
  const [secondPlace, setSecondPlace] = useState("")
  const [thirdPlace, setThirdPlace] = useState("")
  const [loading, setLoading] = useState(false)
  const [published, setPublished] = useState(false)
  const [showImageGenerator, setShowImageGenerator] = useState(false)
  const [winners, setWinners] = useState([])
  const [manualResultImage, setManualResultImage] = useState(null)
  const [uploadedImagePath, setUploadedImagePath] = useState("")

  const { data: withParts, error: withPartsError, mutate: mutateWithParts } = useSWR(
    `${API_BASE_URL}/admin/tournaments/withParticipants`,
    (url) => axios.get(url).then((r) => r.data),
    {
      revalidateOnFocus: false,
      shouldRetryOnError: true,
      errorRetryCount: 3,
    }
  )

  const tournament = useMemo(() => {
    if (!withParts) return null;
    console.log("TournamentResults: withParts data:", withParts);
    console.log("TournamentResults: Looking for tournament ID:", id);
    
    const found = (withParts || []).find((x) => {
      // Convert everything to string to safely compare
      const tid = String(x.t_id || x._id || x.id);
      console.log("TournamentResults: Comparing", tid, "with", String(id));
      return tid === String(id);
    });
    
    console.log("TournamentResults: Found tournament:", found);
    return found || null;
  }, [withParts, id]);


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

  const handlePublishResults = async () => {
    if (!firstPlace || !secondPlace || !thirdPlace) {
      alert("Please select winners for all three positions.")
      return
    }

    if (firstPlace === secondPlace || firstPlace === thirdPlace || secondPlace === thirdPlace) {
      alert("Cannot select the same player for multiple positions.")
      return
    }

    setLoading(true)
    try {
      const rankings = [
        { participantId: firstPlace, position: 1 },
        { participantId: secondPlace, position: 2 },
        { participantId: thirdPlace, position: 3 },
      ]

      // Handle manual image upload if exists
      let result_image_path = ""
      if (manualResultImage) {
        const formData = new FormData()
        formData.append("resultImage", manualResultImage)
        
        try {
          const uploadResponse = await axios.post(`${API_BASE_URL}/admin/tournaments/${id}/upload-result-image`, formData, {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          })
          result_image_path = uploadResponse.data.imagePath
          setUploadedImagePath(result_image_path)
        } catch (uploadError) {
          console.error("Image upload failed:", uploadError)
          alert("Failed to upload custom result image. Proceeding with rankings only.")
        }
      }

      // Publish results with optional image path
      await axios.put(`${API_BASE_URL}/admin/tournaments/${id}/publish-result`, {
        rankings,
        result_image_path: result_image_path || undefined
      })

      setPublished(true)
      
      // Prepare winners data for image generation
      const winnersData = [
        {
          position: 1,
          name: populatedParticipants.find(p => p.id === firstPlace)?.name || "Unknown",
          prize: tournament.rewards?.first || 0
        },
        {
          position: 2,
          name: populatedParticipants.find(p => p.id === secondPlace)?.name || "Unknown",
          prize: tournament.rewards?.second || 0
        },
        {
          position: 3,
          name: populatedParticipants.find(p => p.id === thirdPlace)?.name || "Unknown",
          prize: tournament.rewards?.third || 0
        }
      ]
      setWinners(winnersData)
      setShowImageGenerator(true)
      
      alert("Results published successfully! You can now generate or view result images.")
    } catch (err) {
      console.error("[v0] Publish results failed:", err)
      alert(`Failed to publish results: ${err.response?.data?.message || err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const isLoading = !withParts && !withPartsError
  const hasError = withPartsError

  return (
    <div style={{ padding: "1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <h1 style={{ fontSize: "1.5rem", color: theme.colors.primary, textShadow: theme.shadows.titleGlow, margin: 0 }}>
          Publish Results • {tournament?.name || `ID #${id}`}
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

      {hasError ? (
        <div style={{ textAlign: "center", color: "#ff6b6b", padding: "2rem" }}>
          <p>Error loading tournament data: {withPartsError?.message || "Unknown error"}</p>
          <button
            onClick={() => mutateWithParts()}
            style={{
              padding: "8px 12px",
              borderRadius: "8px",
              border: "none",
              background: theme.gradients.primaryButton,
              color: theme.colors.white,
              cursor: "pointer",
              boxShadow: theme.shadows.buttonShadow,
              marginTop: "1rem",
            }}
          >
            Retry
          </button>
        </div>
      ) : isLoading ? (
        <div style={{ textAlign: "center", color: theme.colors.lightGray, padding: "2rem" }}>
          <p>Loading tournament data...</p>
        </div>
      ) : !tournament ? (
        <div style={{ textAlign: "center", color: theme.colors.lightGray, padding: "2rem" }}>
          <p>Tournament not found or no data available.</p>
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
              marginTop: "1rem",
            }}
          >
            Go Back
          </button>
        </div>
      ) : tournament.t_status !== "completed" ? (
        <div style={{ textAlign: "center", color: theme.colors.lightGray, padding: "2rem" }}>
          <p>This tournament is not yet completed or results have already been published.</p>
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
              marginTop: "1rem",
            }}
          >
            Go Back
          </button>
        </div>
      ) : (
        <div
          style={{
            background: theme.gradients.navbarAlt1,
            border: `1px solid ${theme.colors.primary}`,
            borderRadius: 12,
            padding: 16,
          }}
        >
          {/* Tournament Info */}
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ color: theme.colors.secondary, marginBottom: 8 }}>Tournament Details</h3>
            <p style={{ margin: "4px 0", color: theme.colors.lightGray }}>
              Game: <strong>{tournament?.game?.toUpperCase()}</strong>
            </p>
            <p style={{ margin: "4px 0", color: theme.colors.lightGray }}>
              Map: <strong>{tournament?.map}</strong>
            </p>
            <p style={{ margin: "4px 0", color: theme.colors.lightGray }}>
              Total Participants: <strong>{populatedParticipants.length}</strong>
            </p>
            <p style={{ margin: "4px 0", color: theme.colors.lightGray }}>
              Status: <strong style={{ color: "#90A4AE" }}>Completed</strong>
            </p>
          </div>

          {/* Rank Selection */}
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ color: theme.colors.secondary, marginBottom: 12 }}>Select Winners by Rank</h3>

            {/* 1st Place */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", marginBottom: 8, color: theme.colors.white, fontWeight: 600 }}>
                1st Place (Champion)
              </label>
              <select
                value={firstPlace}
                onChange={(e) => setFirstPlace(e.target.value)}
                disabled={published}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: `1px solid ${theme.colors.primary}`,
                  background: "#0f0f0f",
                  color: "#fff",
                  cursor: published ? "not-allowed" : "pointer",
                  opacity: published ? 0.6 : 1,
                }}
              >
                <option value="">-- Select 1st Place Winner --</option>
                {populatedParticipants.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.username}) - {p.team_name || "Solo"}
                  </option>
                ))}
              </select>
            </div>

            {/* 2nd Place */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", marginBottom: 8, color: theme.colors.white, fontWeight: 600 }}>
                2nd Place (Runner-up)
              </label>
              <select
                value={secondPlace}
                onChange={(e) => setSecondPlace(e.target.value)}
                disabled={published}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: `1px solid ${theme.colors.primary}`,
                  background: "#0f0f0f",
                  color: "#fff",
                  cursor: published ? "not-allowed" : "pointer",
                  opacity: published ? 0.6 : 1,
                }}
              >
                <option value="">-- Select 2nd Place Winner --</option>
                {populatedParticipants.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.username}) - {p.team_name || "Solo"}
                  </option>
                ))}
              </select>
            </div>

            {/* 3rd Place */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", marginBottom: 8, color: theme.colors.white, fontWeight: 600 }}>
                3rd Place
              </label>
              <select
                value={thirdPlace}
                onChange={(e) => setThirdPlace(e.target.value)}
                disabled={published}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: `1px solid ${theme.colors.primary}`,
                  background: "#0f0f0f",
                  color: "#fff",
                  cursor: published ? "not-allowed" : "pointer",
                  opacity: published ? 0.6 : 1,
                }}
              >
                <option value="">-- Select 3rd Place Winner --</option>
                {populatedParticipants.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.username}) - {p.team_name || "Solo"}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Selected Winners Summary */}
          {firstPlace && secondPlace && thirdPlace && (
            <div
              style={{
                background: "rgba(0, 255, 200, 0.1)",
                border: `1px solid ${theme.colors.secondary}`,
                borderRadius: 8,
                padding: 12,
                marginBottom: 16,
              }}
            >
              <h4 style={{ color: theme.colors.secondary, margin: "0 0 8px 0" }}>Selected Winners</h4>
              <p style={{ margin: "4px 0", color: theme.colors.lightGray }}>
                1st: {populatedParticipants.find((p) => p.id === firstPlace)?.name}
              </p>
              <p style={{ margin: "4px 0", color: theme.colors.lightGray }}>
                2nd: {populatedParticipants.find((p) => p.id === secondPlace)?.name}
              </p>
              <p style={{ margin: "4px 0", color: theme.colors.lightGray }}>
                3rd: {populatedParticipants.find((p) => p.id === thirdPlace)?.name}
              </p>
            </div>
          )}

          {/* Manual Image Upload */}
          <div style={{ 
            marginBottom: 20,
            background: "rgba(255,255,255,0.05)",
            borderRadius: 8,
            padding: 16
          }}>
            <h3 style={{ color: theme.colors.secondary, marginBottom: 12 }}>Custom Result Image (Optional)</h3>
            <p style={{ color: theme.colors.lightGray, marginBottom: 16, fontSize: "0.9em" }}>
              Upload a custom result image that will be shown alongside the generated one. Max size: 5MB
            </p>
            
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  if (file.size > 5 * 1024 * 1024) { // 5MB limit
                    alert("Image size should be less than 5MB")
                    e.target.value = ""
                    return
                  }
                  setManualResultImage(file)
                }
              }}
              disabled={published}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "8px",
                border: `1px solid ${theme.colors.primary}`,
                background: "#0f0f0f",
                color: theme.colors.white,
                marginBottom: "8px"
              }}
            />
            {manualResultImage && (
              <p style={{ color: theme.colors.lightGray, fontSize: "0.9em" }}>
                Selected: {manualResultImage.name}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: 12 }}>
            <button
              onClick={handlePublishResults}
              disabled={!firstPlace || !secondPlace || !thirdPlace || loading || published}
              style={{
                padding: "10px 16px",
                borderRadius: "8px",
                border: "none",
                background:
                  !firstPlace || !secondPlace || !thirdPlace || loading || published
                    ? "#555"
                    : theme.gradients.primaryButton,
                color: theme.colors.white,
                cursor: !firstPlace || !secondPlace || !thirdPlace || loading || published ? "not-allowed" : "pointer",
                boxShadow: theme.shadows.buttonShadow,
                fontWeight: 600,
              }}
            >
              {loading ? "Publishing..." : published ? "Published" : "Publish Results"}
            </button>
            <button
              onClick={() => navigate(-1)}
              disabled={loading}
              style={{
                padding: "10px 16px",
                borderRadius: "8px",
                border: "none",
                background: theme.gradients.secondaryButton,
                color: theme.colors.white,
                cursor: loading ? "not-allowed" : "pointer",
                boxShadow: theme.shadows.buttonShadow,
              }}
            >
              Cancel
            </button>
          </div>

          {/* Image Generator Section */}
          {showImageGenerator && published && (
            <ResultImageGenerator 
              tournament={tournament}
              winners={winners}
              onImageGenerated={async (imageUrl, blob) => {
                console.log("Image generated:", imageUrl)
                // Convert blob to base64 for sending to server
                const reader = new FileReader()
                reader.onload = async () => {
                  const base64Image = reader.result
                  try {
                    // Send only the image data to backend to share with participants
                    await axios.post(`${API_BASE_URL}/admin/tournaments/${id}/share-result-image`, {
                      resultImage: base64Image
                    })
                    alert("Result image shared with all tournament participants!")
                  } catch (error) {
                    console.error("Failed to share result image:", error)
                    alert("Failed to share result image with participants")
                  }
                }
                reader.readAsDataURL(blob)
              }}
            />
          )}
        </div>
      )}
    </div>
  )
}

export default TournamentResults
