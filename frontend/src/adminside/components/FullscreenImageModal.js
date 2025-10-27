"use client"
import { useEffect } from "react"
import theme from "../../theme"

const FullscreenImageModal = ({ imageUrl, onClose, tournamentName }) => {
  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onClose])

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.95)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "20px"
      }}
      onClick={onClose}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        style={{
          position: "absolute",
          top: "20px",
          right: "20px",
          background: "rgba(0, 0, 0, 0.8)",
          border: "none",
          borderRadius: "50%",
          width: "50px",
          height: "50px",
          color: "#fff",
          fontSize: "24px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 10000,
          transition: "all 0.3s ease"
        }}
        onMouseEnter={(e) => {
          e.target.style.background = "rgba(255, 0, 0, 0.8)"
          e.target.style.transform = "scale(1.1)"
        }}
        onMouseLeave={(e) => {
          e.target.style.background = "rgba(0, 0, 0, 0.8)"
          e.target.style.transform = "scale(1)"
        }}
      >
        ✕
      </button>

      {/* Tournament name */}
      {tournamentName && (
        <div
          style={{
            position: "absolute",
            top: "20px",
            left: "20px",
            background: "rgba(0, 0, 0, 0.8)",
            color: "#fff",
            padding: "10px 20px",
            borderRadius: "8px",
            fontSize: "18px",
            fontWeight: "bold",
            zIndex: 10000
          }}
        >
          {tournamentName}
        </div>
      )}

      {/* Image container */}
      <div
        style={{
          maxWidth: "90vw",
          maxHeight: "90vh",
          position: "relative"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={imageUrl}
          alt="Tournament Result"
          style={{
            maxWidth: "100%",
            maxHeight: "100%",
            objectFit: "contain",
            borderRadius: "8px",
            boxShadow: "0 0 30px rgba(0, 255, 200, 0.3)"
          }}
        />
      </div>

      {/* Instructions */}
      <div
        style={{
          position: "absolute",
          bottom: "20px",
          left: "50%",
          transform: "translateX(-50%)",
          background: "rgba(0, 0, 0, 0.8)",
          color: "#fff",
          padding: "10px 20px",
          borderRadius: "8px",
          fontSize: "14px",
          zIndex: 10000
        }}
      >
        Press ESC or click outside to close
      </div>
    </div>
  )
}

export default FullscreenImageModal
