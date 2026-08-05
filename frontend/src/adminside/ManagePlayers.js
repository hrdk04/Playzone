"use client"

import { useCallback, useEffect, useState } from "react"
import axios from "axios"
import { useNavigate } from "react-router-dom"
import "./ManagePlayers.css"
import API_BASE_URL from "../config/apiConfig";

const AdminPlayers = () => {
  const [players, setPlayers] = useState([])
  const [totalPlayers, setTotalPlayers] = useState(0)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const navigate = useNavigate()

  // Fetch players
  const fetchPlayers = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/admin/players`, {
        params: { search, page, limit },
      })
      setPlayers(res.data.users)
      setTotalPlayers(res.data.totalPlayers)
    } catch (err) {
      console.error("Error fetching players:", err)
    }
  }, [search, page, limit])

  useEffect(() => {
    fetchPlayers()
  }, [fetchPlayers])

  // Delete player
  const deletePlayer = async (id) => {
    if (!window.confirm("Are you sure you want to delete this player?")) return
    try {
      await axios.delete(`${API_BASE_URL}/admin/players/${id}`)
      fetchPlayers()
    } catch (err) {
      console.error("Error deleting player:", err)
    }
  }

  const totalPages = limit === "all" ? 1 : Math.ceil(totalPlayers / limit)

  return (
    <div className="admin-players-page">
      <div className="admin-players-header">
        <h1 className="admin-players-title">Player Management</h1>
        <button
          onClick={() => {
            navigate(-1)
          }}
          className="admin-players-back-btn"
        >
          ← Back
        </button>
      </div>
      {/* Stats */}
      <div className="admin-players-stats">
        <h2>Total Registered Players: {totalPlayers}</h2>
      </div>

      {/* Search + Filter */}
      <div className="admin-players-controls">
        <input
          type="text"
          placeholder="Search by username, email, or name..."
          value={search}
          onChange={(e) => {
            setPage(1)
            setSearch(e.target.value)
          }}
          className="admin-players-input"
        />

        <select
          value={limit}
          onChange={(e) => {
            setPage(1)
            setLimit(e.target.value === "all" ? "all" : Number.parseInt(e.target.value))
          }}
          className="admin-players-select"
        >
          <option value={10}>10</option>
          <option value={25}>25</option>
          <option value={50}>50</option>
          <option value="all">All</option>
        </select>
      </div>

      {/* Player List Table */}
      <div className="admin-players-table-wrap">
        <table className="admin-players-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Username</th>
              <th>Email</th>
              <th>Contact</th>
              <th>Amount</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {players.length > 0 ? (
              players.map((player) => (
                <tr key={player._id}>
                  <td>{player.fullName}</td>
                  <td>{player.username}</td>
                  <td>{player.email}</td>
                  <td>{player.contact}</td>
                  <td>${player.amount}</td>
                  <td className="admin-players-actions">
                    <button
                      onClick={() => alert(`Viewing ${player.username}`)}
                      className="admin-players-btn admin-players-btn-view"
                    >
                      View
                    </button>
                    <button
                      onClick={() => deletePlayer(player._id)}
                      className="admin-players-btn admin-players-btn-delete"
                      disabled
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="admin-players-empty">
                  No players found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {limit !== "all" && (
        <div className="admin-players-pagination">
          <button
            disabled={page === 1}
            onClick={() => setPage((prev) => prev - 1)}
            className="admin-players-page-btn"
          >
            Previous
          </button>
          <span className="admin-players-page-indicator">
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage((prev) => prev + 1)}
            className="admin-players-page-btn"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}

export default AdminPlayers
