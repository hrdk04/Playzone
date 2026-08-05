"use client"

import { useCallback, useEffect, useState } from "react"
import UserSideNav from "./UserSideNav"
import axios from "axios"
import { useLocation, useNavigate } from "react-router-dom"
import "./PaymentPage.css"
import API_BASE_URL from "../config/apiConfig";

export default function PaymentPage() {
  const [user, setUser] = useState(null)
  const [history, setHistory] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState("deposit")
  const [amount, setAmount] = useState("")
  const [upiId, setUpiId] = useState("")
  const [processing, setProcessing] = useState(false)

  const emailOrUsername = localStorage.getItem("userName")
  const location = useLocation()
  const navigate = useNavigate()

  const loadHistory = useCallback(async (userId) => {
    if (!userId) return
    setLoadingHistory(true)
    try {
      const res = await axios.get(`${API_BASE_URL}/payment/history/${userId}`)
      const sorted = res.data.sort((a, b) => new Date(b.p_date) - new Date(a.p_date))
      setHistory(sorted.slice(0, 20))
    } catch (err) {
      console.error("Error loading history", err)
    } finally {
      setLoadingHistory(false)
    }
  }, [])

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const localUser = JSON.parse(localStorage.getItem("user"))
        if (localUser?._id) {
          const u = await axios.get(`${API_BASE_URL}/user/id/${localUser._id}`)
          setUser(u.data)
          await loadHistory(u.data._id)
          return
        }
        if (emailOrUsername) {
          const u = await axios.get(`${API_BASE_URL}/user/${emailOrUsername}`)
          setUser(u.data)
          await loadHistory(u.data._id)
        }
      } catch (err) {
        console.error(err)
      }
    }
    fetchUser()
  }, [emailOrUsername, loadHistory])

  useEffect(() => {
    const s = location.state
    if (s?.requiredAmount && Number(s.requiredAmount) > 0) {
      setModalType("deposit")
      setAmount(String(s.requiredAmount))
      setShowModal(true)
    }
  }, [location.state])

  const openModal = (type) => {
    setModalType(type)
    setAmount("")
    setUpiId("")
    setShowModal(true)
  }

  // NOTE: This function is structured to be replaced with a Real Payment Gateway SDK (e.g., Razorpay)
  const submitPayment = async () => {
    if (!amount || Number(amount) <= 0) return alert("Enter a valid amount")
    if (modalType === "withdraw" && (!upiId || !upiId.includes("@"))) return alert("Enter a valid UPI ID for withdrawal")
    
    setProcessing(true)

    // Simulated Gateway Delay
    setTimeout(async () => {
      try {
        const payload = { 
          user_id: user._id, 
          amount: Number(amount), 
          time: new Date().toLocaleTimeString(),
          upi_id: upiId // Added for real withdrawal context
        }

        const url = modalType === "deposit"
            ? `${API_BASE_URL}/payment/deposit`
            : `${API_BASE_URL}/payment/withdraw`

        const res = await axios.post(url, payload)
        const newBalance = res.data.balance
        
        setUser((prev) => ({ ...prev, amount: newBalance }))
        await loadHistory(user._id)

        // Check if there's a pending tournament registration flow
        const pendingRegistration = location.state?.action === "topup_then_register" && location.state?.meta

        if (pendingRegistration) {
          alert("Payment successful! Returning to tournament registration...")
          navigate("/tournaments", {
            state: {
              resumeRegister: true,
              tournament: location.state.meta,
              teamName: location.state.teamName
            }
          })
        } else {
          alert(`${modalType === "deposit" ? "Deposit" : "Withdrawal request"} successful!`)
        }
      } catch (err) {
        console.error(err)
        alert(err.response?.data?.message || "Payment processing failed")
      } finally {
        setProcessing(false)
        setShowModal(false)
      }
    }, 1500)
  }

  return (
    <div className="payment-page-wrapper">
      <UserSideNav />
      
      <div className="payment-main-container">
        {/* Header & Balance Card */}
        <div className="wallet-header-section">
          <h1 className="payment-page-title">💳 Secure Wallet</h1>
          
          <div className="wallet-balance-card">
            <div className="balance-info-block">
              <p className="balance-label">Available Balance</p>
              <h2 className="balance-value">₹{user?.amount ?? 0}</h2>
            </div>
            
            <div className="wallet-action-buttons">
              <button className="btn-primary-gaming" onClick={() => openModal("deposit")}>
                💰 Add Funds
              </button>
              <button className="btn-secondary-gaming" onClick={() => openModal("withdraw")}>
                🏦 Withdraw
              </button>
              <button className="wallet-refresh-btn" onClick={() => loadHistory(user?._id)}>
                ⟳ Sync
              </button>
            </div>
          </div>
        </div>

        {/* Transaction Ledger */}
        <div className="transactions-ledger-section">
          <h3 className="ledger-title">Financial Ledger</h3>
          
          <div className="ledger-table-container">
            {loadingHistory ? (
              <div className="ledger-empty-state">Syncing transactions...</div>
            ) : history.length === 0 ? (
              <div className="ledger-empty-state">No transaction history found.</div>
            ) : (
              <table className="ledger-table">
                <thead>
                  <tr>
                    <th>Date & Time</th>
                    <th>Reference Type</th>
                    <th style={{ textAlign: "right" }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {history.slice(0, 15).map((h) => {
                    const isDebit = h.p_type === "withdraw" || h.p_type === "tournament"
                    const amountClass = isDebit ? "amount-debit" : "amount-credit"
                    const amountDisplay = isDebit ? `- ₹${h.amount}` : `+ ₹${h.amount}`
                    
                    let typeDisplay = h.p_type.toUpperCase()
                    if (h.p_type === "tournament") typeDisplay = `🎟️ Match Entry (${h.tournament_id})`
                    if (h.p_type === "prize") typeDisplay = `🏆 Prize Won (${h.tournament_id})`
                    if (h.p_type === "refund") typeDisplay = `🔄 Refund (${h.tournament_id})`
                    if (h.p_type === "deposit") typeDisplay = `💳 Wallet Top-up`
                    if (h.p_type === "withdraw") typeDisplay = `🏧 Bank Withdrawal`

                    return (
                      <tr key={h._id}>
                        <td>
                          <div className="td-date">{new Date(h.p_date).toLocaleDateString()}</div>
                          <div className="td-time">{h.p_time}</div>
                        </td>
                        <td className="td-type">{typeDisplay}</td>
                        <td className={`td-amount ${amountClass}`}>{amountDisplay}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Secure Checkout Modal */}
      {showModal && (
        <div className="payment-modal-overlay">
          <div className="payment-modal-card">
            <h3 className="payment-modal-title">
              {modalType === "deposit" ? "💰 Secure Top-Up" : "🏧 Withdraw Funds"}
            </h3>

            <div className="modal-balance-display">
              Current Balance: <span>₹{user?.amount ?? 0}</span>
            </div>

            <div className="payment-form-group">
              <label className="payment-label">Amount (₹)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="payment-input"
                placeholder={modalType === "deposit" ? "Minimum ₹10" : "Minimum ₹100"}
                min="1"
              />
            </div>

            {/* Display UPI input prominently for withdrawals, optional for deposits right now */}
            <div className="payment-form-group">
              <label className="payment-label">UPI ID / VPA</label>
              <input 
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                className="payment-input" 
                placeholder="yourname@upi" 
              />
            </div>

            <div className="payment-modal-actions">
              <button 
                onClick={submitPayment} 
                className={`btn-primary-gaming payment-full-width ${processing ? "processing" : ""}`} 
                disabled={processing}
              >
                {processing 
                  ? "Processing Securely..." 
                  : modalType === "deposit" ? "Pay Securely" : "Submit Request"
                }
              </button>
              <button 
                onClick={() => setShowModal(false)} 
                className="btn-secondary-gaming payment-full-width" 
                disabled={processing}
              >
                Cancel
              </button>
            </div>
            
            <p className="payment-disclaimer">
              {modalType === "deposit" 
                ? "🔒 Secured by 256-bit encryption. Currently in development mode." 
                : "⏳ Withdrawals are processed to your UPI ID within 24 hours."}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}