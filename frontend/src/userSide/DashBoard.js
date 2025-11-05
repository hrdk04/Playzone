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
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)

  const storedUser = JSON.parse(localStorage.getItem("user"))
  const userId = storedUser?._id

  // Responsive handler
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768)
    }

    window.addEventListener('resize', handleResize)
    handleResize()

    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (!userId) return

    const fetchData = async () => {
      try {
        const userRes = await axios.get(`http://localhost:5000/user/id/${userId}`)
        setUser(userRes.data)

        const txnRes = await axios.get(`http://localhost:5000/payment/history/${userId}`)
        setTransactions(txnRes.data)

        const tournamentsRes = await axios.get(`http://localhost:5000/tournaments/joined/${userId}`)
        const activeTournaments = tournamentsRes.data
        setTournamentsResult(tournamentsRes.data)
        setJoinedTournaments(activeTournaments)
      } catch (err) {
        console.error("Dashboard fetch error:", err)
      }
    }

    fetchData()
  }, [userId])

  const totalBalance = user.amount || 0
  const visibleTournaments = showAllTournaments ? joinedTournaments : joinedTournaments.slice(0, 3)
  
  const totalPrizesWon = joinedTournaments
    .filter(t => t.result_published && t.prize_won > 0)
    .reduce((sum, t) => sum + t.prize_won, 0)
  
  const totalTournamentEntries = joinedTournaments.length
  const tournamentsWon = joinedTournaments.filter(t => t.rank > 0 && t.rank <= 3).length
  const winRate = totalTournamentEntries > 0 ? Math.round((tournamentsWon / totalTournamentEntries) * 100) : 0
  const recentTransactions = transactions.slice(0, 5)
  const upcomingTournaments = tournamentsResult.filter(t => new Date(t.t_date) > new Date() && t.t_status === 'pending')
  
  const getGamingLevel = (tournaments) => {
    if (tournaments >= 50) return { level: 'Legend', color: '#FFD700', icon: '👑' }
    if (tournaments >= 25) return { level: 'Master', color: '#C0C0C0', icon: '🏆' }
    if (tournaments >= 10) return { level: 'Expert', color: '#CD7F32', icon: '🥇' }
    if (tournaments >= 5) return { level: 'Advanced', color: '#4CAF50', icon: '🥈' }
    if (tournaments >= 1) return { level: 'Intermediate', color: '#2196F3', icon: '🥉' }
    return { level: 'Rookie', color: '#9E9E9E', icon: '🎮' }
  }
  
  const gamingLevel = getGamingLevel(totalTournamentEntries)

  const handleCancelTournament = async (tournament) => {
    const confirmCancel = window.confirm(`Are you sure you want to cancel your registration for ${tournament.t_id}?`)
    if (tournament.t_status === "completed") return alert("Tournament Over!")
    if (!confirmCancel) return

    try {
      const tournamentDate = new Date(tournament.t_date)
      const now = new Date()
      const diffMs = tournamentDate - now
      const diffHours = diffMs / (1000 * 60 * 60)

      let refundAmount = tournament.entry_fee
      let deducted = 0

      if (diffHours <= 24) {
        deducted = Math.round((5 / 100) * refundAmount)
        refundAmount -= deducted
      }

      await axios.post(`http://localhost:5000/tournament/cancel`, {
        user_id: userId,
        tournament_id: tournament.t_id,
        refund_amount: refundAmount,
      })

      alert(`Tournament canceled. Refund: ₹${refundAmount} (Deducted: ₹${deducted})`)
      setJoinedTournaments((prev) => prev.filter((t) => t.t_id !== tournament.t_id))
      setUser((prev) => ({ ...prev, amount: prev.amount + refundAmount }))

      const txnRes = await axios.get(`http://localhost:5000/payment/history/${userId}`)
      setTransactions(txnRes.data)
    } catch (err) {
      console.error("Cancel tournament error:", err)
      alert("Failed to cancel tournament. Try again.")
    }
  }

  return (
    <div style={styles.page}>
      {<UserSideNav />}
      
      <div style={{
        ...styles.mainContent,
      
        padding: isMobile ? '20px 15px' : '80px 30px',
      }}>
        <h1 style={{
          ...styles.title,
          fontSize: isMobile ? '24px' : theme.sizes.sectionTitleFontSize,
        }}>
          🎮 Dashboard
        </h1>

        <div style={{
          ...styles.contentWrapper,
          width: isMobile ? '95%' : '85vw',
          padding: isMobile ? '20px 15px' : '3% 2%',
        }}>

          {/* Player Profile Header */}
          <div style={{
            ...styles.playerProfile,
            flexDirection: isMobile ? 'column' : 'row',
            padding: isMobile ? '20px' : '25px',
          }}>
            <div style={{
              ...styles.profileInfo,
              flexDirection: isMobile ? 'column' : 'row',
              textAlign: isMobile ? 'center' : 'left',
            }}>
              <div style={styles.profileAvatar}>
                {user.username?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div style={styles.profileDetails}>
                <h2 style={{
                  ...styles.playerName,
                  fontSize: isMobile ? '20px' : '24px',
                }}>
                  {user.fullName || user.username}
                </h2>
                <p style={styles.playerUsername}>@{user.username}</p>
                {/* <div style={styles.gamingLevel}>
                  <span style={{ color: gamingLevel.color, fontSize: '20px' }}>
                    {gamingLevel.icon}
                  </span>
                  <span style={{ color: gamingLevel.color, fontWeight: 'bold' }}>
                    {gamingLevel.level}
                  </span>
                </div> */}
              </div>
            </div>
            <div style={{
              ...styles.profileStats,
              marginTop: isMobile ? '20px' : 0,
              width: isMobile ? '100%' : 'auto',
              justifyContent: isMobile ? 'space-around' : 'flex-end',
            }}>
              <div style={styles.statItem}>
                <span style={styles.statValue}>{totalTournamentEntries}</span>
                <span style={styles.statLabel}>Tournaments</span>
              </div>
              <div style={styles.statItem}>
                <span style={styles.statValue}>{tournamentsWon}</span>
                <span style={styles.statLabel}>Wins</span>
              </div>
              <div style={styles.statItem}>
                <span style={styles.statValue}>{winRate}%</span>
                <span style={styles.statLabel}>Win Rate</span>
              </div>
            </div>
          </div>

          {/* Overview Cards */}
          <div style={{
            ...styles.overview,
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(250px, 1fr))',
          }}>
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>💰 Wallet Balance</h3>
              <p style={styles.cardValue}>₹{totalBalance.toLocaleString()}</p>
              <small style={styles.cardSubtext}>Available for tournaments</small>
            </div>
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>🏆 Total Prizes</h3>
              <p style={styles.cardValue}>₹{totalPrizesWon.toLocaleString()}</p>
              <small style={styles.cardSubtext}>Lifetime earnings</small>
            </div>
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>📈 Win Rate</h3>
              <p style={styles.cardValue}>{winRate}%</p>
              <small style={styles.cardSubtext}>Tournament success rate</small>
            </div>
            {/* <div style={styles.card}>
              <h3 style={styles.cardTitle}>🎯 Gaming Level</h3>
              <p style={{ ...styles.cardValue, color: gamingLevel.color }}>
                {gamingLevel.icon} {gamingLevel.level}
              </p>
              <small style={styles.cardSubtext}>Based on participation</small>
            </div> */}
          </div>

          {/* Quick Actions */}
          <div style={styles.quickActions}>
            <h3 style={styles.sectionTitle}>Quick Actions</h3>
            <div style={{
              ...styles.actionButtons,
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))',
            }}>
              <button 
                style={styles.actionButton}
                onClick={() => window.location.href = '/tournaments'}
              >
                🎮 Join Tournament
              </button>
              <button 
                style={styles.actionButton}
                onClick={() => window.location.href = '/payments'}
              >
                💳 Add Money
              </button>
              <button 
                style={styles.actionButton}
                onClick={() => window.location.href = '/chat'}
              >
                💬 Open Chat
              </button>
              <button 
                style={styles.actionButton}
                onClick={() => window.location.href = '/profile'}
              >
                👤 Edit Profile
              </button>
            </div>
          </div>

          {/* Upcoming Tournaments */}
          {upcomingTournaments.length > 0 && (
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>🚀 Upcoming Tournaments</h2>
              <div style={{
                ...styles.upcomingTournaments,
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(300px, 1fr))',
              }}>
                {upcomingTournaments.slice(0, 3).map((tournament) => (
                  <div key={tournament._id} style={{
                    ...styles.upcomingCard,
                    flexDirection: isMobile ? 'column' : 'row',
                    gap: isMobile ? '15px' : 0,
                  }}>
                    <div style={styles.upcomingInfo}>
                      <h4 style={styles.upcomingTitle}>{tournament.game}</h4>
                      <p style={styles.upcomingDetails}>
                        {tournament.t_id} • {tournament.map} • ₹{tournament.entry_fee}
                      </p>
                      <p style={styles.upcomingDate}>
                        {new Date(tournament.t_date).toLocaleDateString()} at {tournament.t_time}
                      </p>
                    </div>
                    <div style={styles.upcomingActions}>
                      <button 
                        style={{
                          ...styles.joinButton,
                          width: isMobile ? '100%' : 'auto',
                        }}
                        onClick={() => window.location.href = '/tournaments'}
                      >
                        Join Now
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Transactions */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>💰 Recent Transactions</h2>
            {isMobile ? (
              // Mobile: Card View
              <div style={styles.transactionCards}>
                {recentTransactions.map((t) => {
                  const isDebit = t.p_type === "withdraw" || t.p_type === "tournament"
                  const isCredit = t.p_type === "deposit" || t.p_type === "refund" || t.p_type === "prize"
                  const amountDisplay = isDebit ? `-₹${t.amount}` : `+₹${t.amount}`
                  const color = isDebit ? "tomato" : isCredit ? "lime" : "#fff"
                  
                  let typeDisplay = t.p_type
                  if (t.p_type === "tournament" && t.tournament_id) {
                    typeDisplay = `Tournament Entry`
                  } else if (t.p_type === "prize" && t.tournament_id) {
                    typeDisplay = `🏆 Prize Won`
                  } else if (t.p_type === "refund" && t.tournament_id) {
                    typeDisplay = `🔄 Tournament Refund`
                  }
                  
                  return (
                    <div key={t._id} style={styles.transactionCard}>
                      <div style={styles.transactionHeader}>
                        <span style={styles.transactionType}>{typeDisplay}</span>
                        <span style={{ ...styles.transactionAmount, color }}>{amountDisplay}</span>
                      </div>
                      <div style={styles.transactionDate}>{t.p_date?.slice(0, 10)}</div>
                    </div>
                  )
                })}
              </div>
            ) : (
              // Desktop: Table View
              <div style={styles.tableWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Date</th>
                      <th style={styles.th}>Type</th>
                      <th style={styles.th}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTransactions.map((t) => {
                      const isDebit = t.p_type === "withdraw" || t.p_type === "tournament"
                      const isCredit = t.p_type === "deposit" || t.p_type === "refund" || t.p_type === "prize"
                      const amountDisplay = isDebit ? `-₹${t.amount}` : `+₹${t.amount}`
                      const color = isDebit ? "tomato" : isCredit ? "lime" : "#fff"
                      
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
                          <td style={styles.td}>{t.p_date?.slice(0, 10)}</td>
                          <td style={styles.td}>{typeDisplay}</td>
                          <td style={{ ...styles.td, color }}>{amountDisplay}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Joined Tournaments */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>🏆 My Joined Tournaments</h2>
            
            {joinedTournaments.length === 0 ? (
              <p style={{ color: theme.colors.lightGray }}>No active tournaments yet.</p>
            ) : isMobile ? (
              // Mobile: Card View
              <div style={styles.tournamentCards}>
                {visibleTournaments.map((t) => {
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
                    <div 
                      key={t._id} 
                      style={styles.tournamentCard}
                      onDoubleClick={() => handleCancelTournament(t)}
                    >
                      <div style={styles.tournamentCardHeader}>
                        <h4 style={styles.tournamentCardTitle}>{t.game}</h4>
                        <span style={{
                          ...styles.tournamentCardStatus,
                          color: t.payment_status === "paid" ? "lime" : "tomato"
                        }}>
                          {t.payment_status}
                        </span>
                      </div>
                      <div style={styles.tournamentCardBody}>
                        <div style={styles.tournamentCardRow}>
                          <span>ID:</span>
                          <span>{t.t_id}</span>
                        </div>
                        <div style={styles.tournamentCardRow}>
                          <span>Map:</span>
                          <span>{t.map}</span>
                        </div>
                        <div style={styles.tournamentCardRow}>
                          <span>Fee:</span>
                          <span>₹{t.entry_fee}</span>
                        </div>
                        <div style={styles.tournamentCardRow}>
                          <span>Date:</span>
                          <span>{new Date(t.t_date).toLocaleDateString()}</span>
                        </div>
                        <div style={styles.tournamentCardRow}>
                          <span>Team:</span>
                          <span>{t.team_name}</span>
                        </div>
                        <div style={styles.tournamentCardRow}>
                          <span>Result:</span>
                          <span style={{ color: t.rank > 0 && t.rank <= 3 ? "#FFD700" : "#8B7355" }}>
                            {getResultDisplay()}
                          </span>
                        </div>
                        <div style={styles.tournamentCardRow}>
                          <span>Prize:</span>
                          <span style={{ color: t.prize_won > 0 ? "lime" : "#8B7355" }}>
                            {getPrizeDisplay()}
                          </span>
                        </div>
                      </div>
                      <small style={styles.tournamentCardHint}>Double-tap to cancel</small>
                    </div>
                  )
                })}
              </div>
            ) : (
              // Desktop: Table View
              <div style={styles.tableWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Tournament ID</th>
                      <th style={styles.th}>Game</th>
                      <th style={styles.th}>Map</th>
                      <th style={styles.th}>Entry Fee</th>
                      <th style={styles.th}>Date</th>
                      <th style={styles.th}>Team Name</th>
                      <th style={styles.th}>Payment Status</th>
                      <th style={styles.th}>Result</th>
                      <th style={styles.th}>Prize Won</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleTournaments.map((t) => {
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
                          <td style={styles.td}>{t.t_id}</td>
                          <td style={styles.td}>{t.game}</td>
                          <td style={styles.td}>{t.map}</td>
                          <td style={styles.td}>₹{t.entry_fee}</td>
                          <td style={styles.td}>{new Date(t.t_date).toLocaleDateString()}</td>
                          <td style={styles.td}>{t.team_name}</td>
                          <td style={{ ...styles.td, color: t.payment_status === "paid" ? "lime" : "tomato" }}>
                            {t.payment_status}
                          </td>
                          <td style={{ ...styles.td, color: t.rank > 0 && t.rank <= 3 ? "#FFD700" : "#8B7355" }}>
                            {getResultDisplay()}
                          </td>
                          <td style={{ ...styles.td, color: t.prize_won > 0 ? "lime" : "#8B7355" }}>
                            {getPrizeDisplay()}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
            
            {joinedTournaments.length > 3 && (
              <div style={{ textAlign: "center", marginTop: "1rem" }}>
                <button 
                  onClick={() => setShowAllTournaments(!showAllTournaments)}
                  style={styles.viewAllButton}
                >
                  {showAllTournaments ? "Show Less" : "View All"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const styles = {
  page: {
    display: "flex",
    minHeight: "100vh",
    background: theme.gradients.homeBackground,
    fontFamily: theme.fonts.primary,
    color: theme.colors.white,
  },
  mainContent: {
    flex: 1,
    transition: "margin-left 0.3s ease",
  },
  title: {
    textAlign: "center",
    marginBottom: "40px",
    textShadow: theme.shadows.titleGlow,
  },
  contentWrapper: {
    position: "sticky",
    top: "0%",
    border: "2px solid #81959fff",
    borderTop: "1px solid transparent",
    background: "#040404ff",
    borderRadius: "10px",
    margin: "0 auto",
    height: "auto",
  },
  playerProfile: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: theme.gradients.navbarAlt1,
    padding: "25px",
    borderRadius: "15px",
    marginBottom: "30px",
    border: "1px solid rgba(255, 255, 255, 0.1)",
  },
  profileInfo: {
    display: "flex",
    alignItems: "center",
    gap: "20px",
  },
  profileAvatar: {
    width: "80px",
    height: "80px",
    borderRadius: "50%",
    background: theme.gradients.primaryButton,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "32px",
    fontWeight: "bold",
    color: theme.colors.white,
    boxShadow: theme.shadows.sectionTitleGlow,
  },
  profileDetails: {
    display: "flex",
    flexDirection: "column",
    gap: "5px",
  },
  playerName: {
    margin: 0,
    fontSize: "24px",
    fontWeight: "bold",
    color: theme.colors.white,
  },
  playerUsername: {
    margin: 0,
    fontSize: "16px",
    color: theme.colors.lightGray,
  },
  gamingLevel: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "14px",
  },
  profileStats: {
    display: "flex",
    gap: "30px",
  },
  statItem: {
    textAlign: "center",
  },
  statValue: {
    display: "block",
    fontSize: "24px",
    fontWeight: "bold",
    color: theme.colors.white,
  },
  statLabel: {
    fontSize: "12px",
    color: theme.colors.lightGray,
    textTransform: "uppercase",
    letterSpacing: "1px",
  },
  overview: {
    display: "grid",
    gap: "20px",
    marginBottom: "40px",
  },
  card: {
    background: theme.gradients.navbarAlt1,
    padding: "25px",
    borderRadius: "15px",
    textAlign: "center",
    boxShadow: theme.shadows.sectionTitleGlow,
    border: "1px solid rgba(255, 255, 255, 0.1)",
    transition: "transform 0.2s ease",
  },
  cardTitle: { 
    fontSize: "1.1rem", 
    marginBottom: "10px", 
    color: theme.colors.lightGray,
    fontWeight: "600",
  },
  cardValue: { 
    fontSize: "2rem", 
    fontWeight: "bold", 
    textShadow: theme.shadows.activeTextGlow,
    marginBottom: "5px",
  },
  cardSubtext: {
    fontSize: "0.9rem",
    color: theme.colors.lightGray,
    opacity: 0.8,
  },
  quickActions: {
    marginBottom: "40px",
  },
  actionButtons: {
    display: "grid",
    gap: "15px",
    marginTop: "15px",
  },
  actionButton: {
    padding: "15px 20px",
    background: theme.gradients.primaryButton,
    color: theme.colors.white,
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "600",
    transition: "all 0.3s ease",
    boxShadow: "0 4px 15px rgba(0, 0, 0, 0.2)",
  },
  upcomingTournaments: {
    display: "grid",
    gap: "20px",
    marginTop: "20px",
  },
  upcomingCard: {
    background: theme.gradients.navbarAlt1,
    padding: "20px",
    borderRadius: "12px",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  upcomingInfo: {
    flex: 1,
  },
  upcomingTitle: {
    margin: 0,
    fontSize: "18px",
    fontWeight: "bold",
    color: theme.colors.white,
    marginBottom: "5px",
  },
  upcomingDetails: {
    margin: 0,
    fontSize: "14px",
    color: theme.colors.lightGray,
    marginBottom: "5px",
  },
  upcomingDate: {
    margin: 0,
    fontSize: "12px",
    color: theme.colors.lightGray,
  },
  upcomingActions: {
    marginLeft: "15px",
  },
  joinButton: {
    padding: "10px 20px",
    background: theme.gradients.primaryButton,
    color: theme.colors.white,
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "600",
  },
  section: { 
    marginBottom: "40px" 
  },
  sectionTitle: { 
    fontSize: "1.5rem", 
    marginBottom: "15px", 
    textShadow: theme.shadows.titleGlow,
    fontWeight: "bold",
  },
  // Mobile: Card Views
  transactionCards: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  transactionCard: {
    background: theme.gradients.navbarAlt1,
    padding: "15px",
    borderRadius: "10px",
    border: "1px solid rgba(255, 255, 255, 0.1)",
  },
  transactionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "8px",
  },
  transactionType: {
    fontSize: "14px",
    fontWeight: "600",
    color: theme.colors.white,
  },
  transactionAmount: {
    fontSize: "16px",
    fontWeight: "bold",
  },
  transactionDate: {
    fontSize: "12px",
    color: theme.colors.lightGray,
  },
  tournamentCards: {
    display: "flex",
    flexDirection: "column",
    gap: "15px",
  },
  tournamentCard: {
    background: theme.gradients.navbarAlt1,
    padding: "15px",
    borderRadius: "12px",
    border: "1px solid rgba(255, 255, 255, 0.1)",
  },
  tournamentCardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px",
  },
  tournamentCardTitle: {
    margin: 0,
    fontSize: "16px",
    fontWeight: "bold",
    color: theme.colors.white,
  },
  tournamentCardStatus: {
    fontSize: "12px",
    fontWeight: "600",
    textTransform: "uppercase",
  },
  tournamentCardBody: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  tournamentCardRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "13px",
    color: theme.colors.lightGray,
  },
  tournamentCardHint: {
    display: "block",
    marginTop: "10px",
    fontSize: "11px",
    color: theme.colors.lightGray,
    opacity: 0.6,
    textAlign: "center",
  },
  // Desktop: Table Views
  tableWrapper: {
    overflowX: "auto",
    borderRadius: "8px",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    borderRadius: "8px",
    overflow: "hidden",
    background: theme.gradients.navbarAlt2,
    border: "1px solid rgba(255, 255, 255, 0.1)",
  },
  th: {
    padding: "15px",
    background: theme.gradients.navbar,
    borderBottom: theme.borders.navbarBottom,
    color: theme.colors.white,
    textAlign: "left",
    fontWeight: "600",
  },
  td: {
    padding: "12px 15px",
    borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
    color: theme.colors.white,
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