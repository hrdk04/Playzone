"use client"

import { useState, useEffect } from "react"
import theme from "../theme"
import UserSideNav from "./UserSideNav"
import axios from "axios"

export default function Dashboard() {
  const [user, setUser] = useState({})
  const [transactions, setTransactions] = useState([])
  const [tournamentsResult, setTournamentsResult] = useState([])
  const [joinedTournaments, setJoinedTournaments] = useState([])
  const [showAllTournaments, setShowAllTournaments] = useState(false)

  const storedUser = JSON.parse(localStorage.getItem("user"))
  const userId = storedUser?._id

  useEffect(() => {
    if (!userId) return

    const fetchData = async () => {
      try {
        const userRes = await axios.get(`http://localhost:5000/user/id/${userId}`)
        setUser(userRes.data)

        const txnRes = await axios.get(`http://localhost:5000/payment/history/${userId}`)
        setTransactions(txnRes.data)

        const tournamentsRes = await axios.get(`http://localhost:5000/tournaments/joined/${userId}`)
        const activeTournaments = tournamentsRes.data.filter((t) => t.t_status === "completed")
        setTournamentsResult(tournamentsRes.data)
        // console.log(activeTournaments)
        setJoinedTournaments(activeTournaments)
      } catch (err) {
        console.error("Dashboard fetch error:", err)
      }
    }

    fetchData()
  }, [userId])

  const totalBalance = user.amount || 0
  const visibleTournaments = showAllTournaments ? joinedTournaments : joinedTournaments.slice(0, 3)
  
  // Calculate total prizes won
  const totalPrizesWon = joinedTournaments
    .filter(t => t.result_published && t.prize_won > 0)
    .reduce((sum, t) => sum + t.prize_won, 0)
  
  // Calculate total tournament entries
  const totalTournamentEntries = joinedTournaments.length

  // --------------------------
  // Cancel registration handler
  // --------------------------
  const handleCancelTournament = async (tournament) => {
    const confirmCancel = window.confirm(`Are you sure you want to cancel your registration for ${tournament.t_id}?`)
    if (!confirmCancel) return

    try {
      const tournamentDate = new Date(tournament.t_date)
      const now = new Date()
      const diffMs = tournamentDate - now
      const diffHours = diffMs / (1000 * 60 * 60)

      let refundAmount = tournament.entry_fee
      let deducted = 0

      // Deduct 5% if canceling within 24 hours
      if (diffHours <= 24) {
        deducted = Math.round((5 / 100) * refundAmount)
        refundAmount -= deducted
      }

      // Call backend API to cancel registration
      await axios.post(`http://localhost:5000/tournament/cancel`, {
        user_id: userId,
        tournament_id: tournament.t_id,
        refund_amount: refundAmount,
      })

      alert(`Tournament canceled. Refund: ₹${refundAmount} (Deducted: ₹${deducted})`)

      // Update local state
      setJoinedTournaments((prev) => prev.filter((t) => t.t_id !== tournament.t_id))

      // Update user's balance locally
      setUser((prev) => ({ ...prev, amount: prev.amount + refundAmount }))

      // Optionally, refresh transactions
      const txnRes = await axios.get(`http://localhost:5000/payment/history/${userId}`)
      setTransactions(txnRes.data)
    } catch (err) {
      console.error("Cancel tournament error:", err)
      alert("Failed to cancel tournament. Try again.")
    }
  }

  return (
    <div style={styles.page}>
      <UserSideNav />
        <div style={{ flex: 1, padding: "80px 30px" }}>
          <h1 style={styles.title}>🎮 User Dashboard</h1>
        <div
          style={{
            position: "sticky",
            top: "0%",
            border: "2px solid #81959fff ",
            borderTop: "1px solid transparent",
            background: "#040404ff",
            borderRadius: "10px",
            width: "85vw",
            margin: "-1% auto",
            padding: "3% 2%",
            height: "auto",
          }}
        >

          {/* Overview */}
          <div style={styles.overview}>
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>💰 Balance</h3>
              <p style={styles.cardValue}>₹{totalBalance}</p>
            </div>
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>🏆 Prizes Won</h3>
              <p style={styles.cardValue}>₹{totalPrizesWon}</p>
            </div>
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>🎮 Tournaments</h3>
              <p style={styles.cardValue}>{totalTournamentEntries}</p>
            </div>
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>📊 Win Rate</h3>
              <p style={styles.cardValue}>
                {totalTournamentEntries > 0 
                  ? Math.round((joinedTournaments.filter(t => t.rank > 0 && t.rank <= 3).length / totalTournamentEntries) * 100)
                  : 0}%
              </p>
            </div>
          </div>

          {/* Transactions */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>💰 Transactions</h2>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Date</th>
                  <th style={styles.th}>Type</th>
                  <th style={styles.th}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {transactions.slice(0,6).map((t) => {
                  const isDebit = t.p_type === "withdraw" || t.p_type === "tournament"
                  const isCredit = t.p_type === "deposit" || t.p_type === "refund" || t.p_type === "prize"
                  const amountDisplay = isDebit ? `-₹${t.amount}` : `+₹${t.amount}`
                  const color = isDebit ? "tomato" : isCredit ? "lime" : "#fff"
                  
                  // Enhanced type display
                  let typeDisplay = t.p_type
                  if (t.p_type === "tournament" && t.tournament_id) {
                    typeDisplay = `Tournament Entry`
                  } else if (t.p_type === "prize" && t.tournament_id) {
                    typeDisplay = `🏆 Prize Won`
                  } else if (t.p_type === "refund" && t.tournament_id) {
                    typeDisplay = `🔄 Tournament Refund`
                  }
                  
                  
                  return (  
                    <tr key={t._id}>
                      <td>{t.p_date?.slice(0, 10)}</td>
                      <td>{typeDisplay}</td>
                      <td style={{ color }}>{amountDisplay}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Joined Tournaments */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>🏆 My Joined Tournaments</h2>
            
            {joinedTournaments.length === 0  ? (
              <p style={{ color: theme.colors.lightGray }}>No active tournaments yet.</p>
            ) : ( 
              <>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th>Tournament ID</th>
                      <th>Game</th>
                      <th>Map</th>
                      <th>Entry Fee</th>
                      <th>Date</th>
                      <th>Team Name</th>
                      <th>Payment Status</th>
                      <th>Result</th>
                      <th>Prize Won</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleTournaments.filter((t)=>t.t_status!== 'completed')
                    .map((t) => {

                      const getResultDisplay = () => {
                        if (!t.result_published) return "Pending"
                        if (t.rank === 1) return "🥇 1st Place"
                        if (t.rank === 2) return "🥈 2nd Place"
                        if (t.rank === 3) return "🥉 3rd Place"
                        return "Participant"
                      }
                      
                      const getPrizeDisplay = () => {
                        if (!t.result_published || t.prize_won === 0) return "—"
                        return `₹${t.prize_won}`
                      }
                      
                      return (
                        <tr
                          key={t._id}
                          onDoubleClick={() => handleCancelTournament(t)}
                          style={{ cursor: "pointer" }}
                          title="Double-click to cancel registration"
                        >
                          <td>{t.t_id}</td>
                          <td>{t.game}</td>
                          <td>{t.map}</td>
                          <td>₹{t.entry_fee}</td>
                          <td>{new Date(t.t_date).toLocaleDateString()}</td>
                          <td>{t.team_name}</td>
                          <td style={{ color: t.payment_status === "paid" ? "lime" : "tomato" }}>{t.payment_status}</td>
                          <td style={{ color: t.rank > 0 && t.rank <= 3 ? "#FFD700" : "#8B7355" }}>{getResultDisplay()}</td>
                          <td style={{ color: t.prize_won > 0 ? "lime" : "#8B7355" }}>{getPrizeDisplay()}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                {joinedTournaments.length > 3 && (
                  <div style={{ textAlign: "center", marginTop: "1rem" }}>
                    <button onClick={() => setShowAllTournaments(!showAllTournaments)}>
                      {showAllTournaments ? "Show Less" : "View All"}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Inline CSS (same as before)
const styles = {
  page: {
    display: "flex",
    minHeight: "100vh",
    background: theme.gradients.homeBackground,
    fontFamily: theme.fonts.primary,
    color: theme.colors.white,
  },
  title: {
    fontSize: theme.sizes.sectionTitleFontSize,
    textAlign: "center",
    marginBottom: "40px",
    textShadow: theme.shadows.titleGlow,
  },
  overview: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "20px",
    marginBottom: "40px",
  },
  card: {
    background: theme.gradients.navbarAlt1,
    padding: "20px",
    borderRadius: "12px",
    textAlign: "center",
    boxShadow: theme.shadows.sectionTitleGlow,
  },
  cardTitle: { fontSize: "1.2rem", marginBottom: "10px", color: theme.colors.lightGray },
  cardValue: { fontSize: "1.6rem", fontWeight: "bold", textShadow: theme.shadows.activeTextGlow },
  section: { marginBottom: "40px" },
  sectionTitle: { fontSize: "1.5rem", marginBottom: "15px", textShadow: theme.shadows.titleGlow },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    borderRadius: "8px",
    overflow: "hidden",
    background: theme.gradients.navbarAlt2,
  },
  th: {
    padding: "12px",
    background: theme.gradients.navbar,
    borderBottom: theme.borders.navbarBottom,
    color: theme.colors.white,
    textAlign: "left",
  },
  viewAllButton: {
    padding: "0.5rem 1rem",
    borderRadius: "4px",
    border: "none",
    background: theme.gradients.secondaryButton,
    color: theme.colors.white,
    cursor: "pointer",
  },
}
