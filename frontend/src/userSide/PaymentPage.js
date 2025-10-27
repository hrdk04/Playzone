"use client"

import { useEffect, useState } from "react"
import theme from "../theme"
import UserSideNav from "./UserSideNav"
import axios from "axios"
import { useLocation, useNavigate } from "react-router-dom"

export default function PaymentPage() {
  const [user, setUser] = useState(null)
  const [history, setHistory] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState("deposit")
  const [amount, setAmount] = useState("")
  const [processing, setProcessing] = useState(false)

  const emailOrUsername = localStorage.getItem("userName")
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const localUser = JSON.parse(localStorage.getItem("user"))
        if (localUser?._id) {
          const u = await axios.get(`http://localhost:5000/user/id/${localUser._id}`)
          setUser(u.data)
          await loadHistory(u.data._id)
          return
        }
        if (emailOrUsername) {
          const u = await axios.get(`http://localhost:5000/user/${emailOrUsername}`)
          setUser(u.data)
          await loadHistory(u.data._id)
        }
      } catch (err) {
        console.error(err)
      }
    }
    fetchUser()
  }, [emailOrUsername])

  useEffect(() => {
    const s = location.state
    if (s?.requiredAmount && Number(s.requiredAmount) > 0) {
      setModalType("deposit")
      setAmount(String(s.requiredAmount))
      setShowModal(true)
    }
  }, [location.state])

  const loadHistory = async (userId = user?._id) => {
    if (!userId) return
    setLoadingHistory(true)
    try {
      const res = await axios.get(`http://localhost:5000/payment/history/${userId}`)
      const sorted = res.data.sort((a, b) => new Date(b.p_date) - new Date(a.p_date))
      setHistory(sorted.slice(0, 20))
    } catch (err) {
      console.error("Error loading history", err)
    } finally {
      setLoadingHistory(false)
    }
  }

  const openModal = (type) => {
    setModalType(type)
    setAmount("")
    setShowModal(true)
  }

  const submitPayment = async () => {
    if (!amount || Number(amount) <= 0) return alert("Enter a valid amount")
    setProcessing(true)

    setTimeout(async () => {
      try {
        const payload = { user_id: user._id, amount: Number(amount), time: new Date().toLocaleTimeString() }

        const url =
          modalType === "deposit"
            ? "http://localhost:5000/payment/deposit"
            : "http://localhost:5000/payment/withdraw"

        const res = await axios.post(url, payload)
        alert(`${modalType === "deposit" ? "Deposit" : "Withdrawal"} successful — new balance ₹${res.data.balance}`)
        setUser((prev) => ({ ...prev, amount: res.data.balance }))
        await loadHistory(user._id)
      } catch (err) {
        console.error(err)
        alert(err.response?.data?.message || "Payment failed")
      } finally {
        setProcessing(false)
        setShowModal(false)
      }
    }, 1000)
  }

  return (
    <div style={styles.page}>
      <UserSideNav />
      <div style={styles.container}>
        <center>
          <h1 style={styles.title}>💳 Wallet Dashboard</h1>
          <div style={styles.balanceRow}>
            <div style={styles.balanceBox}>
              <p style={{ color: theme.colors.lightGray, margin: 0 }}>Available Balance</p>
              <h2 style={{ margin: 0, fontSize: "2rem" }}>₹{user?.amount ?? 0}</h2>
            </div>
            <div style={styles.actionBox}>
              <button style={styles.primaryButton} onClick={() => openModal("deposit")}>
                + Add Money
              </button>
              <button style={styles.ghostButton} onClick={() => openModal("withdraw")}>
                Withdraw
              </button>
              <button style={styles.refreshButton} onClick={() => loadHistory(user?._id)}>
                ⟳ Refresh
              </button>
            </div>
          </div>
        </center>

        <div style={styles.transactionsSection}>
          <h3 style={styles.sectionTitle}>Recent Transactions</h3>
          <div style={styles.historyContainer}>
            {loadingHistory ? (
              <p>Loading...</p>
            ) : history.length === 0 ? (
              <p>No transactions yet.</p>
            ) : (
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Date</th>
                    <th style={styles.th}>Type</th>
                    <th style={styles.th}>Amount</th>
                    <th style={styles.th}>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {history.slice(0, 10).map((h) => {
                    const isDebit = h.p_type === "withdraw" || h.p_type === "tournament"
                    const color = isDebit ? "#ff5c5c" : "#4eff8c"
                    const amountDisplay = isDebit ? `-₹${h.amount}` : `+₹${h.amount}`
                    let typeDisplay = h.p_type
                    if (h.p_type === "tournament" && h.tournament_id)
                      typeDisplay = `Tournament (${h.tournament_id})`
                    if (h.p_type === "prize" && h.tournament_id)
                      typeDisplay = `Prize Won (${h.tournament_id})`
                    if (h.p_type === "refund" && h.tournament_id)
                      typeDisplay = `Refund (${h.tournament_id})`

                    return (
                      <tr key={h._id} style={styles.tr}>
                        <td style={styles.td}>{new Date(h.p_date).toLocaleDateString()}</td>
                        <td style={styles.td}>{typeDisplay}</td>
                        <td style={{ ...styles.td, color, fontWeight: "600" }}>{amountDisplay}</td>
                        <td style={styles.td}>{h.p_time}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Modal Section */}
      {showModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h3 style={{ textAlign: "center", marginBottom: 10 }}>
              {modalType === "deposit" ? "💰 Add Money (UPI Only)" : "🏧 Withdraw Funds"}
            </h3>

            {/* Display Current Balance inside modal */}
            <p style={{ textAlign: "center", marginBottom: 20, color: "#aaa" }}>
              Current Balance: <strong style={{ color: "#4eff8c" }}>₹{user?.amount ?? 0}</strong>
            </p>

            <label style={styles.label}>Amount (₹)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              style={styles.modalInput}
              placeholder="e.g. 500"
              min="1"
            />
            <label style={styles.label}>UPI ID</label>
            <input placeholder="yourname@upi" style={styles.modalInput} />

            <div style={{ display: "flex", gap: 10, marginTop: 20, flexWrap: "wrap", justifyContent: "center" }}>
              <button onClick={submitPayment} style={styles.primaryButton} disabled={processing}>
                {processing ? "Processing..." : modalType === "deposit" ? "Confirm Deposit" : "Request Withdrawal"}
              </button>
              <button onClick={() => setShowModal(false)} style={styles.ghostButton} disabled={processing}>
                Cancel
              </button>
            </div>
            <p style={styles.disclaimer}>⚠️ This is a dummy payment. No real transaction occurs.</p>
          </div>
        </div>
      )}
    </div>
  )
}

/* Styles */
const styles = {
  page: {
    display: "flex",
    flexDirection: "column",
    background: theme.gradients.homeBackground,
    color: theme.colors.white,
    minHeight: "100vh",
    fontFamily: theme.fonts.primary,
    overflow: "hidden", 
  },
  container: {
    flex: 1,
    padding: "60px 20px",
    margin: "2% auto",
    maxWidth: 900,
    width: "95%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: { fontSize: "1.8rem", textShadow: theme.shadows.titleGlow, marginBottom: 20 },
  balanceRow: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 20,
  },
  balanceBox: {
    background: theme.gradients.navbarAlt1,
    padding: 20,
    borderRadius: 12,
    minWidth: 200,
    textAlign: "center",
    boxShadow: theme.shadows.sectionTitleGlow,
  },
  actionBox: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  primaryButton: {
    background: theme.gradients.secondaryButton,
    border: "none",
    padding: "10px 16px",
    borderRadius: 8,
    color: "#fff",
    cursor: "pointer",
    fontWeight: "600",
  },
  ghostButton: {
    background: "transparent",
    border: "1px solid rgba(255,255,255,0.15)",
    padding: "10px 16px",
    borderRadius: 8,
    color: "#fff",
    cursor: "pointer",
  },
  refreshButton: {
    background: "transparent",
    border: "1px solid rgba(255,255,255,0.1)",
    padding: "8px 12px",
    borderRadius: 8,
    color: "#fff",
    cursor: "pointer",
  },
  transactionsSection: {
    marginTop: 30,
    width: "100%",
    maxWidth: 800,
    flex: "1 1 auto",
  },
  sectionTitle: { fontSize: 18, marginBottom: 8 },
  historyContainer: {
    maxHeight: 250,
    overflowY: "auto", // ✅ Only this section scrolls
    borderRadius: 8,
    background: "rgba(255,255,255,0.02)",
    backdropFilter: "blur(8px)",
  },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 14 },
  th: {
    padding: 10,
    background: "rgba(18, 21, 52, 0.84)",
    position: "sticky",
    top: 0,
    textAlign: "left",
  },
  td: { padding: 10 },
  tr: { borderBottom: "1px solid rgba(255,255,255,0.05)" },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.7)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
    overflow: "hidden",
  },
  modal: {
    background: "#121212",
    padding: 20,
    width: "90%",
    maxWidth: 420,
    borderRadius: 12,
  },
  modalInput: {
    width: "100%",
    padding: 10,
    marginBottom: 10,
    borderRadius: 6,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "#1a1a1a",
    color: "#fff",
  },
  label: { display: "block", marginBottom: 6, color: "#ccc", fontSize: 13 },
  disclaimer: { textAlign: "center", color: "#999", fontSize: 12, marginTop: 12 },
}
