"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import theme from "../theme"
import { useNavigate } from "react-router-dom"

const AdminPlayers = () => {
  const [players, setPlayers] = useState([])
  const [totalPlayers, setTotalPlayers] = useState(0)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const navigate = useNavigate()

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
    }
  }

  useEffect(() => {
    fetchPlayers()
  }, [search, page, limit])

  // Delete player
  const deletePlayer = async (id) => {
    if (!window.confirm("Are you sure you want to delete this player?")) return
    try {
      await axios.delete(`http://localhost:5000/admin/players/${id}`)
      fetchPlayers()
    } catch (err) {
      console.error("Error deleting player:", err)
    }
  }

  const totalPages = limit === "all" ? 1 : Math.ceil(totalPlayers / limit)

  return (
    <div style={{ marginTop: "5%", padding: "1rem" }}>
      <h1
        style={{
          fontSize: theme.sizes.sectionTitleFontSize,
          marginBottom: "2rem",
          textShadow: theme.shadows.titleGlow,
          textAlign: "left",
        }}
      >
        Player Management
      </h1>
      <button
        onClick={() => {
          navigate(-1)
        }}
        style={{
          padding: "10px 20px",
          borderRadius: "6px",
          marginTop: "-7%",
          background: theme.gradients.secondaryButton,
          color: theme.colors.white,
          cursor: "pointer",
          fontFamily: theme.fonts.primary,
          fontSize: "1rem",
          boxShadow: theme.shadows.buttonShadow,
          transition: theme.animations.transition,
          border: "none",
          position: "absolute",
          right: "50px",
        }}
      >
        ← Back
      </button>
      {/* Stats */}
      <div
        style={{
          width: "96%",
          background: theme.gradients.navbarAlt1,
          padding: "1rem",
          borderRadius: "12px",
          boxShadow: theme.shadows.sectionTitleGlow,
          marginBottom: "2rem",
          textAlign: "left",
          marginRight: "auto",
        }}
      >
        <h2>Total Registered Players: {totalPlayers}</h2>
      </div>

      {/* Search + Filter */}
      <div
        style={{
          marginBottom: "1rem",
          display: "flex",
          flexWrap: "wrap",
          gap: "1rem",
          justifyContent: "right",
          paddingRight: "1.4rem",
        }}
      >
        <input
          type="text"
          placeholder="Search by username, email, or name..."
          value={search}
          onChange={(e) => {
            setPage(1)
            setSearch(e.target.value)
          }}
          style={{
            padding: "10px",
            borderRadius: "8px",
            flex: "1 1 250px",
            maxWidth: "250px",
            minWidth: "200px",
            border: `1px solid ${theme.colors.primary}`,
            background: theme.colors.navbarDark,
            color: theme.colors.white,
          }}
        />

        <select
          value={limit}
          onChange={(e) => {
            setPage(1)
            setLimit(e.target.value === "all" ? "all" : Number.parseInt(e.target.value))
          }}
          style={{
            padding: "10px",
            borderRadius: "8px",
            minWidth: "120px",
            border: `1px solid ${theme.colors.primary}`,
            background: theme.colors.navbarDark,
            color: theme.colors.white,
          }}
        >
          <option value={10}>10</option>
          <option value={25}>25</option>
          <option value={50}>50</option>
          <option value="all">All</option>
        </select>
      </div>

      {/* Player List Table */}
      <div
        style={{
          overflowX: "auto",
          background: theme.colors.navbarDark,
          borderRadius: "12px",
          padding: "1rem",
          boxShadow: "0 0 10px rgba(255,255,255,0.1)",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            minWidth: "600px",
          }}
        >
          <thead>
            <tr style={{ background: theme.colors.primary, color: "#fff" }}>
              <th style={{ padding: "10px" }}>Name</th>
              <th style={{ padding: "10px" }}>Username</th>
              <th style={{ padding: "10px" }}>Email</th>
              <th style={{ padding: "10px" }}>Contact</th>
              <th style={{ padding: "10px" }}>Amount</th>
              <th style={{ padding: "10px" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {players.length > 0 ? (
              players.map((player) => (
                <tr key={player._id}>
                  <td style={{ padding: "10px", color: theme.colors.white }}>{player.fullName}</td>
                  <td style={{ padding: "10px", color: theme.colors.white }}>{player.username}</td>
                  <td style={{ padding: "10px", color: theme.colors.white }}>{player.email}</td>
                  <td style={{ padding: "10px", color: theme.colors.white }}>{player.contact}</td>
                  <td style={{ padding: "10px", color: theme.colors.white }}>${player.amount}</td>
                  <td style={{ padding: "10px", textAlign: "center" }}>
                    <button
                      onClick={() => alert(`Viewing ${player.username}`)}
                      style={{
                        marginRight: "5px",
                        background: theme.colors.secondary,
                        border: "none",
                        padding: "6px 8px",
                        borderRadius: "6px",
                        cursor: "pointer",
                        color: "#fff",
                        fontSize: "0.9rem",
                      }}
                    >
                      View
                    </button>
                    <button
                      onClick={() => deletePlayer(player._id)}
                      style={{
                        background: "red",
                        border: "none",
                        padding: "6px 8px",
                        borderRadius: "6px",
                        cursor: "pointer",
                        color: "#fff",
                        fontSize: "0.9rem",
                      }}
                      disabled
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="6"
                  style={{
                    textAlign: "center",
                    padding: "20px",
                    color: "gray",
                  }}
                >
                  No players found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {limit !== "all" && (
        <div
          style={{
            marginTop: "1rem",
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: "1rem",
          }}
        >
          <button
            disabled={page === 1}
            onClick={() => setPage((prev) => prev - 1)}
            style={{
              padding: "8px 12px",
              borderRadius: "6px",
              border: "none",
              background: theme.colors.primary,
              color: "#fff",
              cursor: page === 1 ? "not-allowed" : "pointer",
              minWidth: "100px",
            }}
          >
            Previous
          </button>
          <span style={{ color: theme.colors.white, alignSelf: "center" }}>
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage((prev) => prev + 1)}
            style={{
              padding: "8px 12px",
              borderRadius: "6px",
              border: "none",
              background: theme.colors.primary,
              color: "#fff",
              cursor: page === totalPages ? "not-allowed" : "pointer",
              minWidth: "100px",
            }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}

export default AdminPlayers
