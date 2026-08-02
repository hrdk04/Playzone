"use client"
import { useState, useRef, useEffect } from "react"
import theme from "../../theme"
import API_BASE_URL from "../../config/apiConfig";

const ResultImageGenerator = ({ tournament, winners, onClose, uploadedImagePath }) => {
  const canvasRef = useRef(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImageUrl, setGeneratedImageUrl] = useState(null)
  const [showUploaded, setShowUploaded] = useState(false)

  // Auto-generate once
  useEffect(() => {
    if (!generatedImageUrl) {
      generateResultImage()
    }
  }, [])

  const handleDownload = async (imageUrl) => {
    if (!imageUrl) return
    
    try {
      let downloadUrl = imageUrl
      let filename = `tournament_${tournament.t_id}_results.png`

      if (imageUrl.startsWith("/")) {
        const response = await fetch(`${API_BASE_URL}${imageUrl}`)
        const blob = await response.blob()
        downloadUrl = URL.createObjectURL(blob)
        filename = `tournament_${tournament.t_id}_uploaded_results.png`
      }

      const link = document.createElement("a")
      link.href = downloadUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      if (imageUrl.startsWith("/")) {
        URL.revokeObjectURL(downloadUrl)
      }
    } catch (error) {
      console.error("Download failed:", error)
      alert("Failed to download image. Please try again.")
    }
  }

  const generateResultImage = async () => {
    if (!tournament || !winners || winners.length < 3) {
      alert("Tournament data or winners information is missing")
      return
    }

    setIsGenerating(true)
    const canvas = canvasRef.current
    if (!canvas) {
      alert("Canvas element not found")
      setIsGenerating(false)
      return
    }

    try {
      const ctx = canvas.getContext("2d")
      canvas.width = 800
      canvas.height = 1000
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // === Background gradient ===
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
      gradient.addColorStop(0, "#0f0c29")
      gradient.addColorStop(0.5, "#302b63")
      gradient.addColorStop(1, "#24243e")
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // === Header ===
      ctx.fillStyle = "#00ffcc"
      ctx.font = "bold 36px Arial"
      ctx.textAlign = "center"
      ctx.fillText("🏆 TOURNAMENT RESULTS 🏆", canvas.width / 2, 60)

      // === Tournament info ===
      ctx.fillStyle = "#ffffff"
      ctx.font = "24px Arial"
      ctx.fillText(tournament.name || `Tournament ${tournament.t_id}`, canvas.width / 2, 120)

      ctx.fillStyle = "#cccccc"
      ctx.font = "18px Arial"
      ctx.fillText(`${tournament.game.toUpperCase()} • ${tournament.map}`, canvas.width / 2, 150)
      ctx.fillText(`Date: ${new Date(tournament.t_date).toLocaleDateString()}`, canvas.width / 2, 180)

      // === Winners heading ===
      ctx.fillStyle = "#00ffcc"
      ctx.font = "bold 28px Arial"
      ctx.fillText("WINNERS", canvas.width / 2, 250)

      // Toggle label
      ctx.fillStyle = "#ffffff"
      ctx.font = "18px Arial"
      ctx.fillText("Generated Image | Uploaded Image", canvas.width / 2, 220)

      // === 1st Place ===
      const firstPlace = winners.find((w) => w.position === 1)
      if (firstPlace) {
        ctx.fillStyle = "#FFD700"
        ctx.fillRect(100, 300, 600, 120)
        ctx.strokeStyle = "#FFA500"
        ctx.lineWidth = 3
        ctx.strokeRect(100, 300, 600, 120)
        ctx.fillStyle = "#000000"
        ctx.font = "bold 32px Arial"
        ctx.fillText("🥇 1st PLACE", canvas.width / 2, 340)
        ctx.font = "bold 24px Arial"
        ctx.fillText(firstPlace.name, canvas.width / 2, 370)
        ctx.font = "20px Arial"
        ctx.fillText(`Prize: ₹${firstPlace.prize}`, canvas.width / 2, 400)
      }

      // === 2nd Place ===
      const secondPlace = winners.find((w) => w.position === 2)
      if (secondPlace) {
        ctx.fillStyle = "#C0C0C0"
        ctx.fillRect(100, 450, 600, 100)
        ctx.strokeStyle = "#808080"
        ctx.lineWidth = 2
        ctx.strokeRect(100, 450, 600, 100)
        ctx.fillStyle = "#000000"
        ctx.font = "bold 28px Arial"
        ctx.fillText("🥈 2nd PLACE", canvas.width / 2, 490)
        ctx.font = "bold 20px Arial"
        ctx.fillText(secondPlace.name, canvas.width / 2, 515)
        ctx.font = "18px Arial"
        ctx.fillText(`Prize: ₹${secondPlace.prize}`, canvas.width / 2, 540)
      }

      // === 3rd Place ===
      const thirdPlace = winners.find((w) => w.position === 3)
      if (thirdPlace) {
        ctx.fillStyle = "#CD7F32"
        ctx.fillRect(100, 580, 600, 100)
        ctx.strokeStyle = "#8B4513"
        ctx.lineWidth = 2
        ctx.strokeRect(100, 580, 600, 100)
        ctx.fillStyle = "#000000"
        ctx.font = "bold 28px Arial"
        ctx.fillText("🥉 3rd PLACE", canvas.width / 2, 620)
        ctx.font = "bold 20px Arial"
        ctx.fillText(thirdPlace.name, canvas.width / 2, 645)
        ctx.font = "18px Arial"
        ctx.fillText(`Prize: ₹${thirdPlace.prize}`, canvas.width / 2, 670)
      }

      // === Footer ===
      ctx.fillStyle = "#888888"
      ctx.font = "16px Arial"
      ctx.fillText("Powered by PLAYZONE", canvas.width / 2, 750)
      ctx.fillText("Where every gamer becomes a legend", canvas.width / 2, 780)
      ctx.fillText(`Generated on ${new Date().toLocaleString()}`, canvas.width / 2, 820)

      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png", 0.95))
      const imageUrl = URL.createObjectURL(blob)
      setGeneratedImageUrl(imageUrl)
    } catch (error) {
      console.error("Error generating image:", error)
      alert("Failed to generate result image")
    } finally {
      setIsGenerating(false)
    }
  }

  const downloadImage = () => {
    if (generatedImageUrl) handleDownload(generatedImageUrl)
  }

  return (
    <div style={{ marginTop: "20px" }}>
      <h3 style={{ color: theme.colors.secondary, marginBottom: "12px" }}>
        Generate Shareable Result Image
      </h3>

      <div style={{ marginBottom: "16px" }}>
        <button
          onClick={generateResultImage}
          disabled={isGenerating}
          style={{
            padding: "12px 24px",
            borderRadius: "8px",
            border: "none",
            background: isGenerating ? "#555" : theme.gradients.primaryButton,
            color: theme.colors.white,
            cursor: isGenerating ? "not-allowed" : "pointer",
            boxShadow: theme.shadows.buttonShadow,
            fontWeight: 600,
            marginRight: "12px",
          }}
        >
          {isGenerating ? "Generating..." : "Generate Result Image"}
        </button>
      </div>

      {(generatedImageUrl || uploadedImagePath) && (
        <div style={{ marginTop: "20px" }}>
          {uploadedImagePath && (
            <div
              style={{
                display: "flex",
                gap: "10px",
                marginBottom: "16px",
                background: "rgba(0,0,0,0.3)",
                padding: "8px",
                borderRadius: "8px",
              }}
            >
              <button
                onClick={() => setShowUploaded(false)}
                style={{
                  padding: "8px 16px",
                  borderRadius: "6px",
                  border: "none",
                  background: !showUploaded
                    ? theme.gradients.primaryButton
                    : "rgba(255,255,255,0.1)",
                  color: theme.colors.white,
                  cursor: "pointer",
                }}
              >
                Generated Image
              </button>
              <button
                onClick={() => setShowUploaded(true)}
                style={{
                  padding: "8px 16px",
                  borderRadius: "6px",
                  border: "none",
                  background: showUploaded
                    ? theme.gradients.primaryButton
                    : "rgba(255,255,255,0.1)",
                  color: theme.colors.white,
                  cursor: "pointer",
                }}
              >
                Uploaded Image
              </button>
            </div>
          )}

          <div
            style={{
              border: `2px solid ${theme.colors.primary}`,
              borderRadius: "8px",
              padding: "16px",
              background: "rgba(0, 255, 200, 0.1)",
            }}
          >
            {showUploaded && uploadedImagePath ? (
              <>
                <h4 style={{ color: theme.colors.white, marginBottom: "12px" }}>
                  Uploaded Result Image:
                </h4>
                <img
                  src={`${API_BASE_URL}${uploadedImagePath}`}
                  alt="Uploaded Tournament Results"
                  style={{
                    maxWidth: "100%",
                    height: "auto",
                    borderRadius: "4px",
                    boxShadow: "0 4px 8px rgba(0,0,0,0.3)",
                  }}
                />
              </>
            ) : (
              <>
                <h4 style={{ color: theme.colors.white, marginBottom: "12px" }}>
                  Generated Result Image:
                </h4>
                <img
                  src={generatedImageUrl}
                  alt="Generated Tournament Results"
                  style={{
                    maxWidth: "100%",
                    height: "auto",
                    borderRadius: "4px",
                    boxShadow: "0 4px 8px rgba(0,0,0,0.3)",
                  }}
                />
              </>
            )}

            <div style={{ marginTop: "16px", display: "flex", gap: "12px" }}>
              <button
                onClick={() =>
                  handleDownload(showUploaded ? uploadedImagePath : generatedImageUrl)
                }
                style={{
                  padding: "8px 16px",
                  borderRadius: "6px",
                  border: "none",
                  background: theme.gradients.secondaryButton,
                  color: theme.colors.white,
                  cursor: "pointer",
                  boxShadow: theme.shadows.buttonShadow,
                }}
              >
                📥 Download Image
              </button>
            </div>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} style={{ display: "none" }} />
    </div>
  )
}

export default ResultImageGenerator
