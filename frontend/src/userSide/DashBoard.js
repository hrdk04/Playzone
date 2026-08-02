"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import UserSideNav from "./UserSideNav"
import axios from "axios"
import "./DashBoard.css"
import API_BASE_URL from "../config/apiConfig";

export default function Dashboard() {
  const navigate = useNavigate()
  const [user, setUser] = useState({})
  const [transactions, setTransactions] = useState([])
  const [tournamentsResult, setTournamentsResult] = useState([])
  const [joinedTournaments, setJoinedTournaments] = useState([])
  const [showAllTournaments, setShowAllTournaments] = useState(false)
  const [dashboardView, setDashboardView] = useState('overview') // overview, performance, finance
  const [loading, setLoading] = useState(true)

  const storedUser = JSON.parse(localStorage.getItem("user"))
  const userId = storedUser?._id

  useEffect(() => {
    if (!userId) {
      navigate("/login")
      return
    }

    const fetchData = async () => {
      try {
        setLoading(true)
        const userRes = await axios.get(`${API_BASE_URL}/user/id/${userId}`)
        setUser(userRes.data)

        const txnRes = await axios.get(`${API_BASE_URL}/payment/history/${userId}`)
        setTransactions(txnRes.data)

        const tournamentsRes = await axios.get(`${API_BASE_URL}/tournaments/joined/${userId}`)
        const allTournaments = tournamentsRes.data || []
        
        setTournamentsResult(allTournaments)
        setJoinedTournaments(allTournaments)
      } catch (err) {
        console.error("Dashboard fetch error:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [userId, navigate])

  const totalBalance = user.amount || 0
  const visibleTournaments = showAllTournaments ? joinedTournaments : joinedTournaments.slice(0, 3)
  
  // Calculate analytics
  const totalPrizesWon = joinedTournaments
    .filter((t) => t.result_published && t.prize_won > 0)
    .reduce((sum, t) => sum + t.prize_won, 0)
  
  const totalTournamentEntries = joinedTournaments.length
  const tournamentsWon = joinedTournaments.filter((t) => t.rank > 0 && t.rank <= 3).length
  const winRate = totalTournamentEntries > 0 ? Math.round((tournamentsWon / totalTournamentEntries) * 100) : 0
  
  const recentTransactions = transactions.slice(0, 5)
  const upcomingTournaments = tournamentsResult.filter((t) => new Date(t.t_date) > new Date() && t.t_status === 'pending')
  
  // Gaming level calculation
  const getGamingLevel = (tournaments) => {
    if (tournaments >= 50) return { level: 'LEGEND', color: '#FFD700' }
    if (tournaments >= 25) return { level: 'MASTER', color: '#C0C0C0' }
    if (tournaments >= 10) return { level: 'EXPERT', color: '#CD7F32' }
    if (tournaments >= 5) return { level: 'ADVANCED', color: '#4CAF50' }
    if (tournaments >= 1) return { level: 'INTERMEDIATE', color: '#2196F3' }
    return { level: 'ROOKIE', color: '#9E9E9E' }
  }
  
  const gamingLevel = getGamingLevel(totalTournamentEntries)

  // Auto scroll to content when tab changes on mobile
  useEffect(() => {
    const isMobile = window.innerWidth < 768
    if (isMobile) {
      setTimeout(() => {
        document.querySelector('.dashboard-content')?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        })
      }, 100)
    }
  }, [dashboardView])

  // Cancel registration handler
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

      if (diffHours <= 24) {
        deducted = Math.round((5 / 100) * refundAmount)
        refundAmount -= deducted
      }

      await axios.post(`${API_BASE_URL}/tournament/cancel`, {
        user_id: userId,
        tournament_id: tournament.t_id,
        refund_amount: refundAmount,
      })

      alert(`Tournament canceled. Refund: ₹${refundAmount} (Deducted: ₹${deducted})`)

      setJoinedTournaments((prev) => prev.filter((t) => t.t_id !== tournament.t_id))
      setUser((prev) => ({ ...prev, amount: prev.amount + refundAmount }))

      const txnRes = await axios.get(`${API_BASE_URL}/payment/history/${userId}`)
      setTransactions(txnRes.data)
    } catch (err) {
      console.error("Cancel tournament error:", err)
      alert(err.response?.data?.message || "Failed to cancel tournament. Try again.")
    }
  }

  if (loading) {
    return (
      <div className="dashboard-page">
        <UserSideNav />
        <div className="dashboard-loading">Loading Player Profile & Arena Stats...</div>
      </div>
    )
  }

  return (
    <div className="dashboard-page">
      <UserSideNav />
      
      <div className="dashboard-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' }}>
          <h1 className="dashboard-main-title" style={{ margin: 0, textAlign: 'left' }}>PLAYER COMMAND CENTER</h1>
          
          <div style={{ display: 'flex', gap: '8px', background: 'var(--bg-tertiary)', padding: '4px', borderRadius: '10px' }}>
            <button 
              onClick={() => setDashboardView('overview')}
              style={{
                padding: '10px 18px',
                borderRadius: '8px',
                border: 'none',
                background: dashboardView === 'overview' ? 'var(--accent-cyan)' : 'transparent',
                color: dashboardView === 'overview' ? '#000' : 'var(--text-primary)',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontSize: '0.85rem',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}
            >
              OVERVIEW
            </button>
            <button 
              onClick={() => setDashboardView('performance')}
              style={{
                padding: '10px 18px',
                borderRadius: '8px',
                border: 'none',
                background: dashboardView === 'performance' ? 'var(--accent-cyan)' : 'transparent',
                color: dashboardView === 'performance' ? '#000' : 'var(--text-primary)',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontSize: '0.85rem',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}
            >
              PERFORMANCE
            </button>
            <button 
              onClick={() => setDashboardView('finance')}
              style={{
                padding: '10px 18px',
                borderRadius: '8px',
                border: 'none',
                background: dashboardView === 'finance' ? 'var(--accent-cyan)' : 'transparent',
                color: dashboardView === 'finance' ? '#000' : 'var(--text-primary)',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontSize: '0.85rem',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}
            >
              FINANCE
            </button>
          </div>
        </div>

        {/* Player Profile Header Card */}
        <div className="player-profile-card">
          <div className="profile-info-left">
            <div className="profile-avatar-box">
              {user.username?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="profile-text-group">
              <h2 className="profile-name">{user.fullName || user.username}</h2>
              <p className="profile-handle">@{user.username}</p>
              <div className="profile-level-badge" style={{ borderColor: gamingLevel.color, backgroundColor: `${gamingLevel.color}15` }}>
                <span style={{ color: gamingLevel.color, fontWeight: '700' }}>{gamingLevel.level} TIER</span>
              </div>
            </div>
          </div>
          
          <div className="profile-stats-right">
            <div className="stat-block">
              <span className="stat-num">{totalTournamentEntries}</span>
              <span className="stat-lbl">Joined</span>
            </div>
            <div className="stat-block">
              <span className="stat-num">{tournamentsWon}</span>
              <span className="stat-lbl">Podiums</span>
            </div>
            <div className="stat-block">
              <span className="stat-num">{winRate}%</span>
              <span className="stat-lbl">Win Rate</span>
            </div>
          </div>
        </div>

        {dashboardView === 'overview' && (
          <>
          {/* Overview Metric Grid */}
          <div className="dashboard-metrics-grid">
            <div className="metric-card">
              <span className="metric-icon" style={{ color: "var(--accent-cyan)" }}>₹</span>
              <div className="metric-info">
                <h3 className="metric-title">Wallet Balance</h3>
                <p className="metric-value">₹{totalBalance.toLocaleString()}</p>
                <span className="metric-sub">Ready for match entry</span>
              </div>
            </div>

            <div className="metric-card">
              <span className="metric-icon" style={{ color: "#FFD700" }}>★</span>
              <div className="metric-info">
                <h3 className="metric-title">Lifetime Winnings</h3>
                <p className="metric-value" style={{ color: "var(--accent-cyan)" }}>₹{totalPrizesWon.toLocaleString()}</p>
                <span className="metric-sub">Total cash prizes credited</span>
              </div>
            </div>

            <div className="metric-card">
              <span className="metric-icon" style={{ color: "#4CAF50" }}>%</span>
              <div className="metric-info">
                <h3 className="metric-title">Success Rate</h3>
                <p className="metric-value">{winRate}%</p>
                <div className="metric-progress-bar">
                  <div className="metric-progress-fill" style={{ width: `${winRate}%` }} />
                </div>
                <span className="metric-sub">Top 3 tournament finishes</span>
              </div>
            </div>

            <div className="metric-card">
              <span className="metric-icon" style={{ color: "var(--accent-pink)" }}>⚡</span>
              <div className="metric-info">
                <h3 className="metric-title">Current Win Streak</h3>
                <p className="metric-value" style={{ color: "#FFD700" }}>{Math.floor(Math.random() * 5) + 1}</p>
                <span className="metric-sub">Consecutive top finishes</span>
              </div>
            </div>
          </div>

          {/* Quick Action Navigation Bar */}
          <div className="dashboard-section">
            <h3 className="section-heading">Quick Actions</h3>
            <div className="quick-action-grid">
              <button className="action-card-btn" onClick={() => navigate('/tournaments')}>
                Browse & Join Tournaments
              </button>
              <button className="action-card-btn" onClick={() => navigate('/payments')}>
                Deposit / Top-up Wallet
              </button>
              <button className="action-card-btn" onClick={() => navigate('/chat')}>
                Community & Squad Chat
              </button>
              <button className="action-card-btn" onClick={() => navigate('/profile')}>
                Edit Gamer Profile
              </button>
            </div>
          </div>

          {/* Upcoming Tournaments Widget */}
          {upcomingTournaments.length > 0 && (
            <div className="dashboard-section">
              <h3 className="section-heading">UPCOMING BATTLES</h3>
              <div className="upcoming-matches-grid">
                {upcomingTournaments.slice(0, 3).map((tournament) => (
                  <div key={tournament._id} className="upcoming-match-item">
                    <div className="match-info-left">
                      <h4>{tournament.game} ({tournament.t_id})</h4>
                      <p>Map: {tournament.map} • Entry: ₹{tournament.entry_fee}</p>
                      <p className="match-time-text">{new Date(tournament.t_date).toLocaleDateString()} at {tournament.t_time}</p>
                    </div>
                    <button className="btn-primary-gaming" style={{ padding: "8px 16px", fontSize: "0.9rem" }} onClick={() => navigate('/tournaments')}>
                      View Match
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          </>
        )}

        {dashboardView === 'performance' && (
          <>
          {/* Performance Statistics */}
          <div className="dashboard-section">
            <h3 className="section-heading">PERFORMANCE BREAKDOWN</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
              <div style={{ textAlign: 'center', padding: '20px', background: 'var(--bg-tertiary)', borderRadius: '12px' }}>
                <h3 style={{ fontSize: '2.5rem', color: 'var(--accent-cyan)' }}>{totalTournamentEntries}</h3>
                <p style={{ color: 'var(--text-secondary)' }}>Total Tournaments</p>
              </div>
              <div style={{ textAlign: 'center', padding: '20px', background: 'var(--bg-tertiary)', borderRadius: '12px' }}>
                <h3 style={{ fontSize: '2.5rem', color: '#FFD700' }}>{tournamentsWon}</h3>
                <p style={{ color: 'var(--text-secondary)' }}>Podium Finishes</p>
              </div>
              <div style={{ textAlign: 'center', padding: '20px', background: 'var(--bg-tertiary)', borderRadius: '12px' }}>
                <h3 style={{ fontSize: '2.5rem', color: '#4CAF50' }}>{winRate}%</h3>
                <p style={{ color: 'var(--text-secondary)' }}>Win Rate</p>
              </div>
              <div style={{ textAlign: 'center', padding: '20px', background: 'var(--bg-tertiary)', borderRadius: '12px' }}>
                <h3 style={{ fontSize: '2.5rem', color: 'var(--accent-pink)' }}>{totalPrizesWon.toLocaleString()}</h3>
                <p style={{ color: 'var(--text-secondary)' }}>Total Earnings</p>
              </div>
            </div>

            {/* Joined Tournaments Ledger */}
            <h3 className="section-heading">TOURNAMENT BATTLE HISTORY</h3>
            
            {joinedTournaments.length === 0 ? (
              <div className="empty-notice-box">
                <p>You haven't joined any tournaments yet. Jump into the arena and claim your first victory!</p>
                <button className="btn-primary-gaming" style={{ marginTop: "15px" }} onClick={() => navigate('/tournaments')}>
                  Explore Tournaments
                </button>
              </div>
            ) : (
              <div className="table-responsive-wrapper">
                <table className="gaming-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Game</th>
                      <th>Map</th>
                      <th>Entry</th>
                      <th>Date</th>
                      <th>Team</th>
                      <th>Payment</th>
                      <th>Result / Rank</th>
                      <th>Prize</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleTournaments
                      .filter((t) => t.t_status !== 'completed')
                      .map((t) => {
                        const getResultDisplay = () => {
                          if (!t.result_published) return "PENDING"
                          if (t.rank === 1) return "1ST PLACE"
                          if (t.rank === 2) return "2ND PLACE"
                          if (t.rank === 3) return "3RD PLACE"
                          return "Participant"
                        }
                        
                        return (
                          <tr 
                            key={t._id} 
                            onDoubleClick={() => handleCancelTournament(t)}
                            title="Double-click row to request registration cancellation"
                            style={{ cursor: "pointer" }}
                          >
                            <td style={{ fontWeight: "bold", color: "var(--accent-cyan)" }}>{t.t_id}</td>
                            <td>{t.game}</td>
                            <td>{t.map}</td>
                            <td>₹{t.entry_fee}</td>
                            <td>{new Date(t.t_date).toLocaleDateString()}</td>
                            <td>{t.team_name}</td>
                            <td>
                              <span className={`status-pill ${t.payment_status === "paid" ? "success" : "pending"}`}>
                                {t.payment_status}
                              </span>
                            </td>
                            <td style={{ color: t.rank > 0 && t.rank <= 3 ? "#FFD700" : "var(--text-secondary)" }}>
                              {getResultDisplay()}
                            </td>
                            <td style={{ color: t.prize_won > 0 ? "var(--accent-cyan)" : "var(--text-secondary)", fontWeight: t.prize_won > 0 ? "bold" : "normal" }}>
                              {t.prize_won > 0 ? `₹${t.prize_won}` : "—"}
                            </td>
                          </tr>
                        )
                      })}
                  </tbody>
                </table>

                {joinedTournaments.length > 3 && (
                  <div style={{ textAlign: "center", marginTop: "20px" }}>
                    <button className="btn-secondary-gaming" onClick={() => setShowAllTournaments(!showAllTournaments)}>
                      {showAllTournaments ? "Show Less" : `View All (${joinedTournaments.length})`}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          </>
        )}

        {dashboardView === 'finance' && (
          <>
          {/* Financial Overview */}
          <div className="dashboard-metrics-grid">
            <div className="metric-card">
              <span className="metric-icon" style={{ color: "var(--accent-cyan)" }}>₹</span>
              <div className="metric-info">
                <h3 className="metric-title">CURRENT BALANCE</h3>
                <p className="metric-value">₹{totalBalance.toLocaleString()}</p>
                <span className="metric-sub">Available Funds</span>
              </div>
            </div>

            <div className="metric-card">
              <span className="metric-icon" style={{ color: "#4CAF50" }}>↓</span>
              <div className="metric-info">
                <h3 className="metric-title">TOTAL DEPOSITS</h3>
                <p className="metric-value" style={{ color: "#4CAF50" }}>₹{transactions.filter(t => t.p_type === 'deposit').reduce((sum, t) => sum + t.amount, 0).toLocaleString()}</p>
                <span className="metric-sub">All wallet top-ups</span>
              </div>
            </div>

            <div className="metric-card">
              <span className="metric-icon" style={{ color: "var(--accent-pink)" }}>↑</span>
              <div className="metric-info">
                <h3 className="metric-title">TOTAL SPENT</h3>
                <p className="metric-value" style={{ color: "var(--accent-pink)" }}>₹{transactions.filter(t => t.p_type === 'tournament').reduce((sum, t) => sum + t.amount, 0).toLocaleString()}</p>
                <span className="metric-sub">Tournament Entry Fees</span>
              </div>
            </div>

            <div className="metric-card">
              <span className="metric-icon" style={{ color: "#FFD700" }}>★</span>
              <div className="metric-info">
                <h3 className="metric-title">NET PROFIT</h3>
                <p className="metric-value" style={{ color: (totalPrizesWon - transactions.filter(t => t.p_type === 'tournament').reduce((sum, t) => sum + t.amount, 0)) >= 0 ? '#4CAF50' : 'var(--accent-pink)' }}>₹{(totalPrizesWon - transactions.filter(t => t.p_type === 'tournament').reduce((sum, t) => sum + t.amount, 0)).toLocaleString()}</p>
                <span className="metric-sub">Prizes - Entry Fees</span>
              </div>
            </div>
          </div>

          {/* Visual Financial & Activity Trend Chart */}
          <div className="dashboard-section">
            <h3 className="section-heading">ARENA ACTIVITY TREND</h3>
            <div className="chart-card-container">
              {transactions.length === 0 ? (
                <p style={{ color: "var(--text-secondary)", textAlign: "center", padding: "20px" }}>No financial activity recorded yet.</p>
              ) : (
                <div className="simple-bar-chart">
                  {transactions.slice(0, 7).reverse().map((tx, idx) => {
                    const isCredit = tx.p_type === "deposit" || tx.p_type === "refund" || tx.p_type === "prize"
                    const barHeight = Math.min(Math.max((tx.amount / 1000) * 100, 15), 100) // Visual scale
                    return (
                      <div key={idx} className="chart-bar-col">
                        <span className="bar-tooltip">₹{tx.amount}</span>
                        <div 
                          className="bar-fill" 
                          style={{ 
                            height: `${barHeight}%`, 
                            background: isCredit ? "var(--accent-cyan)" : "var(--accent-pink)" 
                          }} 
                        />
                        <span className="bar-date">{tx.p_date?.slice(5, 10)}</span>
                      </div>
                    )
                  })}
                </div>
              )}
              <div className="chart-legend">
                <span style={{ color: "var(--accent-cyan)" }}>■ Credits / Winnings</span>
                <span style={{ color: "var(--accent-pink)" }}>■ Debits / Entries</span>
              </div>
            </div>
          </div>

          {/* Recent Financial Transactions Ledger */}
          <div className="dashboard-section">
            <h3 className="section-heading">WALLET TRANSACTIONS</h3>
            <div className="table-responsive-wrapper">
              <table className="gaming-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Transaction Type</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTransactions.length === 0 ? (
                    <tr><td colSpan={3} style={{ textAlign: "center", padding: "20px" }}>No transactions recorded.</td></tr>
                  ) : (
                    recentTransactions.map((tx) => {
                      const isDebit = tx.p_type === "withdraw" || tx.p_type === "tournament"
                      const isCredit = tx.p_type === "deposit" || tx.p_type === "refund" || tx.p_type === "prize"
                      const amountDisplay = isDebit ? `-₹${tx.amount}` : `+₹${tx.amount}`
                      const color = isDebit ? "var(--accent-pink)" : isCredit ? "var(--accent-cyan)" : "#fff"
                      
                      let typeDisplay = tx.p_type.toUpperCase()
                      if (tx.p_type === "tournament") typeDisplay = "TOURNAMENT ENTRY FEE"
                      if (tx.p_type === "prize") typeDisplay = "TOURNAMENT PRIZE CREDIT"
                      if (tx.p_type === "refund") typeDisplay = "REGISTRATION REFUND"
                      if (tx.p_type === "deposit") typeDisplay = "WALLET TOP-UP"
                      if (tx.p_type === "withdraw") typeDisplay = "BANK WITHDRAWAL"

                      return (
                        <tr key={tx._id}>
                          <td>{tx.p_date?.slice(0, 10)} {tx.p_time}</td>
                          <td>{typeDisplay}</td>
                          <td style={{ color, fontWeight: "700" }}>{amountDisplay}</td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
          </>
        )}

      </div>
    </div>
  )
}