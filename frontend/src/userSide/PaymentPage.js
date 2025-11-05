"use client"

import { useEffect, useState } from "react"
import toast, { Toaster } from "react-hot-toast"
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
  
  // Payment Gateway States
  const [showPaymentGateway, setShowPaymentGateway] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState("upi")
  const [paymentStep, setPaymentStep] = useState(1)
  
  // Payment Form States
  const [upiId, setUpiId] = useState("")
  const [cardNumber, setCardNumber] = useState("")
  const [cardName, setCardName] = useState("")
  const [cardExpiry, setCardExpiry] = useState("")
  const [cardCVV, setCardCVV] = useState("")
  const [selectedBank, setSelectedBank] = useState("")
  const [selectedWallet, setSelectedWallet] = useState("")

  const emailOrUsername = localStorage.getItem("userName")
  const location = useLocation()
  const navigate = useNavigate()

useEffect(() => {
  const fetchUser = async () => {
    // Prevent duplicate calls
    if (user) return
    
    const loadingToast = toast.loading("Loading wallet data...")
    
    try {
      const localUser = JSON.parse(localStorage.getItem("user"))
      
      // Check for local user first
      if (localUser?._id) {
        const u = await axios.get(`http://localhost:5000/user/id/${localUser._id}`)
        setUser(u.data)
        await loadHistory(u.data._id)
        toast.success("Wallet loaded successfully!", {
  position: 'top-right'
}, { id: loadingToast },)
        return 
      }
      
      if (emailOrUsername) {
        const u = await axios.get(`http://localhost:5000/user/${emailOrUsername}`)
        setUser(u.data)
        await loadHistory(u.data._id)
        toast.success("Wallet loaded successfully!", {
  position: 'top-right'
}, { id: loadingToast },)
        return
      }
      
      // If neither condition is met, dismiss loading toast
      toast.dismiss(loadingToast)
      
    } catch (err) {
      console.error(err)
      toast.error("Failed to load wallet data", { id: loadingToast })
    }
  }
  
  fetchUser()
}, []) // Remove emailOrUsername from dependencies

  useEffect(() => {
    const s = location.state
    if (s?.requiredAmount && Number(s.requiredAmount) > 0) {
      setModalType("deposit")
      setAmount(String(s.requiredAmount))
      setShowModal(true)
      toast("Insufficient balance! Please add money", {
        icon: "💰",
        duration: 4000,
      })
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
      toast.error("Failed to load transaction history")
    } finally {
      setLoadingHistory(false)
    }
  }

  const openModal = (type) => {
    setModalType(type)
    setAmount("")
    setShowModal(true)
    resetPaymentForm()
  }

  const resetPaymentForm = () => {
    setPaymentStep(1)
    setPaymentMethod("upi")
    setUpiId("")
    setCardNumber("")
    setCardName("")
    setCardExpiry("")
    setCardCVV("")
    setSelectedBank("")
    setSelectedWallet("")
  }

  const proceedToPayment = () => {
    if (!amount || Number(amount) <= 0) {
      toast.error("Please enter a valid amount", { duration: 3000 })
      return
    }
    
    if (Number(amount) < 10) {
      toast.error("Minimum amount is ₹10", { duration: 3000 })
      return
    }

    if (Number(amount) > 100000) {
      toast.error("Maximum amount is ₹1,00,000", { duration: 3000 })
      return
    }

    if (modalType === "withdraw") {
      if (Number(amount) > user?.amount) {
        toast.error("Insufficient balance for withdrawal", { duration: 3000 })
        return
      }
      processWithdrawal()
    } else {
      setShowModal(false)
      setShowPaymentGateway(true)
      setPaymentStep(1)
      toast.success("Redirecting to payment gateway...", { duration: 2000 })
    }
  }

  const processWithdrawal = async () => {
    if (!upiId) {
      toast.error("Please enter UPI ID for withdrawal", { duration: 3000 })
      return
    }

    const upiRegex = /^[\w.-]+@[\w.-]+$/
    if (!upiRegex.test(upiId)) {
      toast.error("Please enter a valid UPI ID", { duration: 3000 })
      return
    }

    setProcessing(true)
    const withdrawToast = toast.loading("Processing withdrawal request...")

    setTimeout(async () => {
      try {
        const payload = { 
          user_id: user._id, 
          amount: Number(amount), 
          time: new Date().toLocaleTimeString(),
          upi_id: upiId
        }

        const res = await axios.post("http://localhost:5000/payment/withdraw", payload)
        const newBalance = res.data.balance
        setUser((prev) => ({ ...prev, amount: newBalance }))
        await loadHistory(user._id)
        
        toast.success(
          `Withdrawal successful! ₹${amount} will be transferred to ${upiId} within 24 hours`,
          { id: withdrawToast, duration: 5000 }
        )
        setShowModal(false)
        resetPaymentForm()
      } catch (err) {
        console.error(err)
        toast.error(err.response?.data?.message || "Withdrawal failed", { id: withdrawToast })
      } finally {
        setProcessing(false)
      }
    }, 1500)
  }

  const handlePaymentSubmit = () => {
    // Validate based on payment method
    if (paymentMethod === "upi") {
      if (!upiId) {
        toast.error("Please enter UPI ID", { duration: 3000 })
        return
      }
      const upiRegex = /^[\w.-]+@[\w.-]+$/
      if (!upiRegex.test(upiId)) {
        toast.error("Invalid UPI ID format", { duration: 3000 })
        return
      }
    }
    
    if (paymentMethod === "card") {
      if (!cardNumber || !cardName || !cardExpiry || !cardCVV) {
        toast.error("Please fill all card details", { duration: 3000 })
        return
      }
      if (cardNumber.replace(/\s/g, "").length !== 16) {
        toast.error("Invalid card number (must be 16 digits)", { duration: 3000 })
        return
      }
      if (cardCVV.length !== 3) {
        toast.error("Invalid CVV (must be 3 digits)", { duration: 3000 })
        return
      }
      const expiryRegex = /^(0[1-9]|1[0-2])\/\d{2}$/
      if (!expiryRegex.test(cardExpiry)) {
        toast.error("Invalid expiry date (MM/YY)", { duration: 3000 })
        return
      }
    }
    
    if (paymentMethod === "netbanking" && !selectedBank) {
      toast.error("Please select a bank", { duration: 3000 })
      return
    }
    
    if (paymentMethod === "wallet" && !selectedWallet) {
      toast.error("Please select a wallet", { duration: 3000 })
      return
    }

    // Move to processing step
    setPaymentStep(3)
    toast.loading("Connecting to payment gateway...", { duration: 1500 })
    
    // Simulate payment processing
    setTimeout(() => {
      processPayment()
    }, 3000)
  }

  const processPayment = async () => {
    const paymentToast = toast.loading("Processing your payment...")
    
    try {
      const payload = { 
        user_id: user._id, 
        amount: Number(amount), 
        time: new Date().toLocaleTimeString(),
        payment_method: paymentMethod
      }

      const res = await axios.post("http://localhost:5000/payment/deposit", payload)
      const newBalance = res.data.balance
      setUser((prev) => ({ ...prev, amount: newBalance }))
      await loadHistory(user._id)
      
      // Show success screen
      setPaymentStep(4)
      toast.success(`Payment successful! ₹${amount} added to wallet`, { 
        id: paymentToast,
        duration: 4000,
        icon: "🎉"
      })
      
      // Check if there's a pending tournament registration
      setTimeout(() => {
        const pendingRegistration = location.state?.action === "topup_then_register" && location.state?.meta

        if (pendingRegistration) {
          toast.success("Redirecting to tournament registration...", { icon: "🎮", duration: 2000 })
          navigate("/tournaments", {
            state: {
              resumeRegister: true,
              tournament: location.state.meta,
              teamName: location.state.teamName,
            },
          })
        } else {
          setShowPaymentGateway(false)
          resetPaymentForm()
        }
      }, 2500)
      
    } catch (err) {
      console.error(err)
      toast.error(err.response?.data?.message || "Payment failed. Please try again.", { 
        id: paymentToast,
        duration: 4000 
      })
      setShowPaymentGateway(false)
      resetPaymentForm()
    }
  }

  const formatCardNumber = (value) => {
    const cleaned = value.replace(/\s/g, "")
    const chunks = cleaned.match(/.{1,4}/g)
    return chunks ? chunks.join(" ") : cleaned
  }

  const formatExpiry = (value) => {
    const cleaned = value.replace(/\D/g, "")
    if (cleaned.length >= 2) {
      return cleaned.slice(0, 2) + "/" + cleaned.slice(2, 4)
    }
    return cleaned
  }

  return (
    <div style={styles.page}>
      {/* Toast Container - Now with Highest Z-Index */}
      <Toaster
        position="top-center"
        reverseOrder={false}
        gutter={8}
        containerStyle={{
          top: 20,
          zIndex: 99999, // Highest z-index to appear above everything
        }}
        toastOptions={{
          // Default options
          duration: 3000,
          style: {
            background: "linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)",
            color: "#fff",
            border: "2px solid rgba(255,255,255,0.15)",
            padding: "16px 20px",
            borderRadius: "12px",
            fontSize: "14px",
            fontFamily: theme.fonts.primary,
            boxShadow: "0 10px 40px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.05)",
            maxWidth: "90vw",
            minWidth: "280px",
            fontWeight: "500",
          },
          // Success
          success: {
            duration: 3000,
            style: {
              background: "linear-gradient(135deg, #1a3a1a 0%, #0d1f0d 100%)",
              border: "2px solid rgba(76, 175, 80, 0.4)",
              boxShadow: "0 10px 40px rgba(76, 175, 80, 0.3), 0 0 20px rgba(76, 175, 80, 0.2)",
            },
            iconTheme: {
              primary: "#4caf50",
              secondary: "#fff",
            },
          },
          // Error
          error: {
            duration: 4000,
            style: {
              background: "linear-gradient(135deg, #3a1a1a 0%, #1f0d0d 100%)",
              border: "2px solid rgba(244, 67, 54, 0.4)",
              boxShadow: "0 10px 40px rgba(244, 67, 54, 0.3), 0 0 20px rgba(244, 67, 54, 0.2)",
            },
            iconTheme: {
              primary: "#f44336",
              secondary: "#fff",
            },
          },
          // Loading
          loading: {
            style: {
              background: "linear-gradient(135deg, #1a2a3a 0%, #0d151f 100%)",
              border: "2px solid rgba(33, 150, 243, 0.4)",
              boxShadow: "0 10px 40px rgba(33, 150, 243, 0.3), 0 0 20px rgba(33, 150, 243, 0.2)",
            },
            iconTheme: {
              primary: "#2196f3",
              secondary: "#fff",
            },
          },
          // Custom styles
          blank: {
            style: {
              background: "linear-gradient(135deg, #2a2a1a 0%, #1a1a0d 100%)",
              border: "2px solid rgba(255, 193, 7, 0.4)",
              boxShadow: "0 10px 40px rgba(255, 193, 7, 0.3), 0 0 20px rgba(255, 193, 7, 0.2)",
            },
          },
        }}
      />

      <UserSideNav />
      <div style={styles.container}>
        <center>
          <h1 style={styles.title}>💳 Wallet Dashboard</h1>
          <div style={styles.balanceRow}>
            <div style={styles.balanceBox}>
              <p style={{ color: theme.colors.lightGray, margin: 0, fontSize: "0.9rem" }}>Available Balance</p>
              <h2 style={{ margin: "8px 0 0 0", fontSize: "clamp(1.5rem, 5vw, 2rem)" }}>₹{user?.amount ?? 0}</h2>
            </div>
            <div style={styles.actionBox}>
              <button style={styles.primaryButton} onClick={() => openModal("deposit")}>
                + Add Money
              </button>
              <button style={styles.ghostButton} onClick={() => openModal("withdraw")}>
                Withdraw
              </button>
              <button 
                style={styles.refreshButton} 
                onClick={() => {
                  toast.promise(
                    loadHistory(user?._id),
                    {
                      loading: "Refreshing...",
                      success: "Transaction history updated!",
                      error: "Failed to refresh",
                    }
                  )
                }}
              >
                ⟳
              </button>
            </div>
          </div>
        </center>

        <div style={styles.transactionsSection}>
          <h3 style={styles.sectionTitle}>Recent Transactions</h3>
          <div style={styles.historyContainer}>
            {loadingHistory ? (
              <p style={styles.emptyState}>Loading...</p>
            ) : history.length === 0 ? (
              <p style={styles.emptyState}>No transactions yet.</p>
            ) : (
              <div style={styles.tableWrapper}>
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
                      if (h.p_type === "tournament") typeDisplay = `Tournament Fee`
                      if (h.p_type === "prize") typeDisplay = `Prize Won`
                      if (h.p_type === "refund") typeDisplay = `Refund`
                      if (h.p_type === "deposit") typeDisplay = `Deposit`

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
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Initial Modal - Amount Entry */}
      {showModal && (
        <div style={styles.modalOverlay} onClick={() => !processing && setShowModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>
              {modalType === "deposit" ? "💰 Add Money to Wallet" : "🏧 Withdraw Funds"}
            </h3>

            <p style={styles.currentBalance}>
              Current Balance: <strong style={{ color: "#4eff8c" }}>₹{user?.amount ?? 0}</strong>
            </p>

            <label style={styles.label}>Enter Amount (₹)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              style={styles.modalInput}
              placeholder="e.g. 500"
              min="10"
              max="100000"
            />
            <p style={styles.amountHint}>Min: ₹10 | Max: ₹1,00,000</p>

            {modalType === "withdraw" && (
              <>
                <label style={styles.label}>UPI ID (for withdrawal)</label>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="yourname@paytm"
                  style={styles.modalInput}
                />
              </>
            )}

            <div style={styles.modalActions}>
              <button onClick={proceedToPayment} style={styles.primaryButton} disabled={processing}>
                {processing ? "Processing..." : modalType === "deposit" ? "Proceed to Payment" : "Submit Request"}
              </button>
              <button onClick={() => setShowModal(false)} style={styles.ghostButton} disabled={processing}>
                Cancel
              </button>
            </div>

            <p style={styles.demoNote}>
              📌 Demo Mode: This is a dummy payment system for educational purposes
            </p>
          </div>
        </div>
      )}

      {/* Payment Gateway Modal */}
      {showPaymentGateway && (
        <div style={styles.paymentOverlay}>
          <div style={styles.paymentGateway} onClick={(e) => e.stopPropagation()}>
            
            {/* Header */}
            <div style={styles.gatewayHeader}>
              <div style={styles.headerLeft}>
                <button 
                  style={styles.backButton} 
                  onClick={() => {
                    if (paymentStep === 1) {
                      setShowPaymentGateway(false)
                      setShowModal(true)
                      toast("Payment cancelled", { icon: "❌", duration: 2000 })
                    } else if (paymentStep === 2) {
                      setPaymentStep(1)
                    }
                  }}
                >
                  ←
                </button>
                <span style={styles.gatewayTitle}>GamePay Gateway</span>
              </div>
              <div style={styles.secureBadge}>🔒 Secure</div>
            </div>

            {/* Payment Amount Display */}
            <div style={styles.amountDisplay}>
              <span style={styles.amountLabel}>Amount to Pay</span>
              <span style={styles.amountValue}>₹{amount}</span>
            </div>

            {/* Step 1: Payment Method Selection */}
            {paymentStep === 1 && (
              <div style={styles.paymentContent}>
                <h4 style={styles.stepTitle}>Select Payment Method</h4>
                
                <div style={styles.methodGrid}>
                  <div 
                    style={paymentMethod === "upi" ? {...styles.methodCard, ...styles.methodCardActive} : styles.methodCard}
                    onClick={() => {
                      setPaymentMethod("upi")
                      toast.success("UPI selected", { icon: "📱", duration: 1500 })
                    }}
                  >
                    <div style={styles.methodIcon}>📱</div>
                    <div style={styles.methodName}>UPI</div>
                    <div style={styles.methodDesc}>PhonePe, GPay, Paytm</div>
                  </div>

                  <div 
                    style={paymentMethod === "card" ? {...styles.methodCard, ...styles.methodCardActive} : styles.methodCard}
                    onClick={() => {
                      setPaymentMethod("card")
                      toast.success("Card selected", { icon: "💳", duration: 1500 })
                    }}
                  >
                    <div style={styles.methodIcon}>💳</div>
                    <div style={styles.methodName}>Card</div>
                    <div style={styles.methodDesc}>Credit/Debit Card</div>
                  </div>

                  <div 
                    style={paymentMethod === "netbanking" ? {...styles.methodCard, ...styles.methodCardActive} : styles.methodCard}
                    onClick={() => {
                      setPaymentMethod("netbanking")
                      toast.success("Net Banking selected", { icon: "🏦", duration: 1500 })
                    }}
                  >
                    <div style={styles.methodIcon}>🏦</div>
                    <div style={styles.methodName}>Net Banking</div>
                    <div style={styles.methodDesc}>All Major Banks</div>
                  </div>

                  <div 
                    style={paymentMethod === "wallet" ? {...styles.methodCard, ...styles.methodCardActive} : styles.methodCard}
                    onClick={() => {
                      setPaymentMethod("wallet")
                      toast.success("Wallet selected", { icon: "👛", duration: 1500 })
                    }}
                  >
                    <div style={styles.methodIcon}>👛</div>
                    <div style={styles.methodName}>Wallets</div>
                    <div style={styles.methodDesc}>Paytm, PhonePe</div>
                  </div>
                </div>

                <button style={styles.proceedButton} onClick={() => setPaymentStep(2)}>
                  Continue
                </button>
              </div>
            )}

            {/* Step 2: Payment Details */}
            {paymentStep === 2 && (
              <div style={styles.paymentContent}>
                
                {/* UPI Payment */}
                {paymentMethod === "upi" && (
                  <div style={styles.formContainer}>
                    <h4 style={styles.stepTitle}>Enter UPI Details</h4>
                    <label style={styles.label}>UPI ID</label>
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="yourname@paytm"
                      style={styles.paymentInput}
                    />
                    <div style={styles.upiApps}>
                      <img src="https://img.icons8.com/color/48/000000/paytm.png" alt="Paytm" style={styles.appIcon} />
                      <img src="https://img.icons8.com/color/48/000000/google-pay-india.png" alt="GPay" style={styles.appIcon} />
                      <img src="https://img.icons8.com/color/48/000000/phonepe.png" alt="PhonePe" style={styles.appIcon} />
                    </div>
                  </div>
                )}

                {/* Card Payment */}
                {paymentMethod === "card" && (
                  <div style={styles.formContainer}>
                    <h4 style={styles.stepTitle}>Enter Card Details</h4>
                    
                    <label style={styles.label}>Card Number</label>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => {
                        const formatted = formatCardNumber(e.target.value)
                        if (formatted.replace(/\s/g, "").length <= 16) {
                          setCardNumber(formatted)
                        }
                      }}
                      placeholder="1234 5678 9012 3456"
                      style={styles.paymentInput}
                      maxLength="19"
                    />

                    <label style={styles.label}>Cardholder Name</label>
                    <input
                      type="text"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value.toUpperCase())}
                      placeholder="JOHN DOE"
                      style={styles.paymentInput}
                    />

                    <div style={styles.cardRow}>
                      <div style={styles.cardCol}>
                        <label style={styles.label}>Expiry (MM/YY)</label>
                        <input
                          type="text"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                          placeholder="12/25"
                          style={styles.paymentInput}
                          maxLength="5"
                        />
                      </div>
                      <div style={styles.cardCol}>
                        <label style={styles.label}>CVV</label>
                        <input
                          type="password"
                          value={cardCVV}
                          onChange={(e) => {
                            if (e.target.value.length <= 3 && /^\d*$/.test(e.target.value)) {
                              setCardCVV(e.target.value)
                            }
                          }}
                          placeholder="123"
                          style={styles.paymentInput}
                          maxLength="3"
                        />
                      </div>
                    </div>

                    <div style={styles.cardLogos}>
                      <img src="https://img.icons8.com/color/48/000000/visa.png" alt="Visa" style={styles.cardLogo} />
                      <img src="https://img.icons8.com/color/48/000000/mastercard.png" alt="Mastercard" style={styles.cardLogo} />
                      <img src="https://img.icons8.com/color/48/000000/rupay.png" alt="RuPay" style={styles.cardLogo} />
                    </div>
                  </div>
                )}

                {/* Net Banking */}
                {paymentMethod === "netbanking" && (
                  <div style={styles.formContainer}>
                    <h4 style={styles.stepTitle}>Select Your Bank</h4>
                    <div style={styles.bankGrid}>
                      {["SBI", "HDFC", "ICICI", "Axis", "PNB", "Kotak"].map((bank) => (
                        <div
                          key={bank}
                          style={selectedBank === bank ? {...styles.bankCard, ...styles.bankCardActive} : styles.bankCard}
                          onClick={() => {
                            setSelectedBank(bank)
                            toast.success(`${bank} Bank selected`, { duration: 1500 })
                          }}
                        >
                          🏦 {bank}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Wallets */}
                {paymentMethod === "wallet" && (
                  <div style={styles.formContainer}>
                    <h4 style={styles.stepTitle}>Select Wallet</h4>
                    <div style={styles.walletGrid}>
                      {[
                        { name: "Paytm", icon: "https://img.icons8.com/color/48/000000/paytm.png" },
                        { name: "PhonePe", icon: "https://img.icons8.com/color/48/000000/phonepe.png" },
                        { name: "Amazon Pay", icon: "https://img.icons8.com/color/48/000000/amazon.png" },
                      ].map((wallet) => (
                        <div
                          key={wallet.name}
                          style={selectedWallet === wallet.name ? {...styles.walletCard, ...styles.walletCardActive} : styles.walletCard}
                          onClick={() => {
                            setSelectedWallet(wallet.name)
                            toast.success(`${wallet.name} selected`, { duration: 1500 })
                          }}
                        >
                          <img src={wallet.icon} alt={wallet.name} style={styles.walletIcon} />
                          <span>{wallet.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button style={styles.proceedButton} onClick={handlePaymentSubmit}>
                  Pay ₹{amount}
                </button>
              </div>
            )}

            {/* Step 3: Processing */}
            {paymentStep === 3 && (
              <div style={styles.processingContainer}>
                <div style={styles.spinner}></div>
                <h3 style={styles.processingTitle}>Processing Payment...</h3>
                <p style={styles.processingText}>Please wait while we confirm your transaction</p>
                <p style={styles.processingAmount}>₹{amount}</p>
              </div>
            )}

            {/* Step 4: Success */}
            {paymentStep === 4 && (
              <div style={styles.successContainer}>
                <div style={styles.successIcon}>✓</div>
                <h3 style={styles.successTitle}>Payment Successful!</h3>
                <p style={styles.successText}>₹{amount} has been added to your wallet</p>
                <div style={styles.successDetails}>
                  <div style={styles.detailRow}>
                    <span>New Balance:</span>
                    <strong style={{color: "#4eff8c"}}>₹{user?.amount}</strong>
                  </div>
                  <div style={styles.detailRow}>
                    <span>Transaction ID:</span>
                    <strong>TXN{Date.now().toString().slice(-8)}</strong>
                  </div>
                  <div style={styles.detailRow}>
                    <span>Payment Method:</span>
                    <strong>{paymentMethod.toUpperCase()}</strong>
                  </div>
                </div>
                <p style={styles.redirectText}>Redirecting...</p>
              </div>
            )}

            {/* Footer */}
            <div style={styles.gatewayFooter}>
              <p style={styles.footerText}>🎓 College Project Demo - No Real Money Transaction</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* Responsive Styles */
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
    padding: "clamp(20px, 5vw, 60px) clamp(10px, 3vw, 20px)",
    margin: "2% auto",
    maxWidth: "900px",
    width: "95%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  title: {
    fontSize: "clamp(1.3rem, 4vw, 1.8rem)",
    textShadow: theme.shadows.titleGlow,
    marginBottom: "20px",
  },
  balanceRow: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "20px",
    width: "100%",
  },
  balanceBox: {
    background: theme.gradients.navbarAlt1,
    padding: "clamp(15px, 3vw, 20px)",
    borderRadius: "12px",
    width: "100%",
    maxWidth: "300px",
    textAlign: "center",
    boxShadow: theme.shadows.sectionTitleGlow,
  },
  actionBox: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    justifyContent: "center",
    width: "100%",
  },
  primaryButton: {
    background: theme.gradients.secondaryButton,
    border: "none",
    padding: "clamp(8px, 2vw, 10px) clamp(12px, 3vw, 16px)",
    borderRadius: "8px",
    color: "#fff",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "clamp(0.85rem, 2vw, 1rem)",
    minWidth: "120px",
    transition: "all 0.3s ease",
  },
  ghostButton: {
    background: "transparent",
    border: "1px solid rgba(255,255,255,0.15)",
    padding: "clamp(8px, 2vw, 10px) clamp(12px, 3vw, 16px)",
    borderRadius: "8px",
    color: "#fff",
    cursor: "pointer",
    fontSize: "clamp(0.85rem, 2vw, 1rem)",
    minWidth: "120px",
    transition: "all 0.3s ease",
  },
  refreshButton: {
    background: "transparent",
    border: "1px solid rgba(255,255,255,0.1)",
    padding: "clamp(6px, 1.5vw, 8px) clamp(10px, 2.5vw, 12px)",
    borderRadius: "8px",
    color: "#fff",
    cursor: "pointer",
    fontSize: "clamp(0.85rem, 2vw, 1rem)",
  },
  transactionsSection: {
    marginTop: "30px",
    width: "100%",
    maxWidth: "800px",
  },
  sectionTitle: {
    fontSize: "clamp(1rem, 3vw, 1.2rem)",
    marginBottom: "12px",
  },
  historyContainer: {
    maxHeight: "350px",
    overflowY: "auto",
    borderRadius: "8px",
    background: "rgba(255,255,255,0.02)",
    backdropFilter: "blur(8px)",
    border: "1px solid rgba(255,255,255,0.05)",
  },
  tableWrapper: {
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "clamp(0.75rem, 2vw, 0.9rem)",
    minWidth: "500px",
  },
  th: {
    padding: "clamp(8px, 2vw, 12px)",
    background: "rgba(18, 21, 52, 0.84)",
    position: "sticky",
    top: 0,
    textAlign: "left",
    fontSize: "clamp(0.75rem, 2vw, 0.9rem)",
    zIndex: 1,
  },
  td: {
    padding: "clamp(8px, 2vw, 10px)",
    fontSize: "clamp(0.75rem, 2vw, 0.875rem)",
  },
  tr: {
    borderBottom: "1px solid rgba(255,255,255,0.05)",
  },
  emptyState: {
    textAlign: "center",
    padding: "40px 20px",
    color: "#999",
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.85)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
    padding: "20px",
  },
  modal: {
    background: "linear-gradient(135deg, #1a1a1a 0%, #0d0d0d 100%)",
    padding: "clamp(20px, 5vw, 30px)",
    width: "100%",
    maxWidth: "450px",
    borderRadius: "16px",
    border: "1px solid rgba(255,255,255,0.1)",
    boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
  },
  modalTitle: {
    textAlign: "center",
    marginBottom: "10px",
    fontSize: "clamp(1.1rem, 4vw, 1.3rem)",
  },
  currentBalance: {
    textAlign: "center",
    marginBottom: "20px",
    color: "#aaa",
    fontSize: "clamp(0.85rem, 2.5vw, 0.95rem)",
  },
  modalInput: {
    width: "100%",
    padding: "clamp(10px, 2.5vw, 12px)",
    marginBottom: "8px",
    borderRadius: "8px",
    border: "1px solid rgba(255,255,255,0.15)",
    background: "#1a1a1a",
    color: "#fff",
    fontSize: "clamp(0.9rem, 2.5vw, 1rem)",
    boxSizing: "border-box",
  },
  label: {
    display: "block",
    marginBottom: "8px",
    color: "#ccc",
    fontSize: "clamp(0.8rem, 2vw, 0.9rem)",
    fontWeight: "500",
  },
  amountHint: {
    fontSize: "clamp(0.7rem, 2vw, 0.75rem)",
    color: "#888",
    marginBottom: "15px",
    marginTop: "-4px",
  },
  modalActions: {
    display: "flex",
    gap: "10px",
    marginTop: "20px",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  demoNote: {
    textAlign: "center",
    color: "#ff9800",
    fontSize: "clamp(0.7rem, 2vw, 0.8rem)",
    marginTop: "15px",
    fontWeight: "500",
    background: "rgba(255, 152, 0, 0.1)",
    padding: "8px",
    borderRadius: "6px",
  },

  // Payment Gateway Styles
  paymentOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.95)",
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
    zIndex: 10000,
    padding: "clamp(10px, 3vw, 20px)",
    overflowY: "auto",
  },
  paymentGateway: {
    background: "linear-gradient(135deg, #1e1e1e 0%, #121212 100%)",
    width: "100%",
    maxWidth: "500px",
    borderRadius: "clamp(12px, 3vw, 16px)",
    border: "1px solid rgba(255,255,255,0.1)",
    boxShadow: "0 20px 80px rgba(0,0,0,0.8)",
    marginTop: "clamp(20px, 5vh, 40px)",
    marginBottom: "20px",
  },
  gatewayHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "clamp(12px, 3vw, 16px)",
    borderBottom: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(0,0,0,0.3)",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  backButton: {
    background: "transparent",
    border: "none",
    color: "#fff",
    fontSize: "clamp(1.2rem, 4vw, 1.5rem)",
    cursor: "pointer",
    padding: "4px 8px",
  },
  gatewayTitle: {
    fontSize: "clamp(1rem, 3vw, 1.2rem)",
    fontWeight: "600",
  },
  secureBadge: {
    background: "rgba(76, 175, 80, 0.2)",
    color: "#4caf50",
    padding: "4px 12px",
    borderRadius: "12px",
    fontSize: "clamp(0.7rem, 2vw, 0.8rem)",
    border: "1px solid rgba(76, 175, 80, 0.3)",
  },
  amountDisplay: {
    padding: "clamp(16px, 4vw, 24px)",
    textAlign: "center",
    background: "rgba(255,255,255,0.02)",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
  },
  amountLabel: {
    display: "block",
    fontSize: "clamp(0.8rem, 2vw, 0.9rem)",
    color: "#aaa",
    marginBottom: "8px",
  },
  amountValue: {
    display: "block",
    fontSize: "clamp(1.8rem, 6vw, 2.5rem)",
    fontWeight: "700",
    color: "#4eff8c",
  },
  paymentContent: {
    padding: "clamp(16px, 4vw, 24px)",
  },
  stepTitle: {
    fontSize: "clamp(1rem, 3vw, 1.1rem)",
    marginBottom: "clamp(16px, 4vw, 20px)",
    textAlign: "center",
  },
  methodGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
    gap: "clamp(10px, 2vw, 12px)",
    marginBottom: "20px",
  },
  methodCard: {
    background: "rgba(255,255,255,0.03)",
    border: "2px solid rgba(255,255,255,0.1)",
    borderRadius: "12px",
    padding: "clamp(12px, 3vw, 16px)",
    textAlign: "center",
    cursor: "pointer",
    transition: "all 0.3s ease",
  },
  methodCardActive: {
    background: "rgba(51, 153, 204, 0.15)",
    border: "2px solid #3399cc",
    transform: "scale(1.02)",
  },
  methodIcon: {
    fontSize: "clamp(1.8rem, 5vw, 2.5rem)",
    marginBottom: "8px",
  },
  methodName: {
    fontSize: "clamp(0.9rem, 2.5vw, 1rem)",
    fontWeight: "600",
    marginBottom: "4px",
  },
  methodDesc: {
    fontSize: "clamp(0.7rem, 2vw, 0.75rem)",
    color: "#aaa",
  },
  formContainer: {
    marginBottom: "20px",
  },
  paymentInput: {
    width: "100%",
    padding: "clamp(10px, 2.5vw, 12px)",
    marginBottom: "clamp(12px, 3vw, 16px)",
    borderRadius: "8px",
    border: "1px solid rgba(255,255,255,0.2)",
    background: "rgba(255,255,255,0.05)",
    color: "#fff",
    fontSize: "clamp(0.9rem, 2.5vw, 1rem)",
    boxSizing: "border-box",
  },
  upiApps: {
    display: "flex",
    justifyContent: "center",
    gap: "clamp(12px, 3vw, 16px)",
    marginTop: "16px",
  },
  appIcon: {
    width: "clamp(36px, 10vw, 48px)",
    height: "clamp(36px, 10vw, 48px)",
    opacity: 0.8,
  },
  cardRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "clamp(10px, 2vw, 12px)",
  },
  cardCol: {
    flex: 1,
  },
  cardLogos: {
    display: "flex",
    justifyContent: "center",
    gap: "clamp(10px, 2vw, 12px)",
    marginTop: "12px",
  },
  cardLogo: {
    width: "clamp(32px, 8vw, 40px)",
    height: "clamp(32px, 8vw, 40px)",
  },
  bankGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))",
    gap: "clamp(8px, 2vw, 10px)",
  },
  bankCard: {
    background: "rgba(255,255,255,0.03)",
    border: "2px solid rgba(255,255,255,0.1)",
    borderRadius: "8px",
    padding: "clamp(12px, 3vw, 16px)",
    textAlign: "center",
    cursor: "pointer",
    fontSize: "clamp(0.85rem, 2vw, 0.95rem)",
    transition: "all 0.3s ease",
  },
  bankCardActive: {
    background: "rgba(51, 153, 204, 0.15)",
    border: "2px solid #3399cc",
    transform: "scale(1.02)",
  },
  walletGrid: {
    display: "grid",
    gap: "clamp(10px, 2vw, 12px)",
  },
  walletCard: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    background: "rgba(255,255,255,0.03)",
    border: "2px solid rgba(255,255,255,0.1)",
    borderRadius: "8px",
    padding: "clamp(12px, 3vw, 16px)",
    cursor: "pointer",
    transition: "all 0.3s ease",
    fontSize: "clamp(0.9rem, 2.5vw, 1rem)",
  },
  walletCardActive: {
    background: "rgba(51, 153, 204, 0.15)",
    border: "2px solid #3399cc",
    transform: "scale(1.02)",
  },
  walletIcon: {
    width: "clamp(32px, 8vw, 40px)",
    height: "clamp(32px, 8vw, 40px)",
  },
  proceedButton: {
    width: "100%",
    padding: "clamp(12px, 3vw, 16px)",
    background: "linear-gradient(135deg, #4caf50, #45a049)",
    border: "none",
    borderRadius: "8px",
    color: "#fff",
    fontSize: "clamp(0.95rem, 2.5vw, 1.1rem)",
    fontWeight: "700",
    cursor: "pointer",
    marginTop: "clamp(16px, 4vw, 20px)",
    transition: "all 0.3s ease",
  },
  processingContainer: {
    padding: "clamp(40px, 10vw, 60px) clamp(20px, 5vw, 30px)",
    textAlign: "center",
  },
  spinner: {
    width: "clamp(50px, 15vw, 60px)",
    height: "clamp(50px, 15vw, 60px)",
    border: "4px solid rgba(255,255,255,0.1)",
    borderTop: "4px solid #3399cc",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    margin: "0 auto 20px",
  },
  processingTitle: {
    fontSize: "clamp(1.2rem, 4vw, 1.5rem)",
    marginBottom: "10px",
  },
  processingText: {
    color: "#aaa",
    fontSize: "clamp(0.85rem, 2.5vw, 0.95rem)",
    marginBottom: "16px",
  },
  processingAmount: {
    fontSize: "clamp(1.5rem, 5vw, 2rem)",
    color: "#4eff8c",
    fontWeight: "700",
  },
  successContainer: {
    padding: "clamp(40px, 10vw, 60px) clamp(20px, 5vw, 30px)",
    textAlign: "center",
  },
  successIcon: {
    width: "clamp(60px, 18vw, 80px)",
    height: "clamp(60px, 18vw, 80px)",
    background: "#4caf50",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "clamp(2rem, 8vw, 3rem)",
    margin: "0 auto 20px",
    color: "#fff",
    animation: "scaleIn 0.5s ease",
  },
  successTitle: {
    fontSize: "clamp(1.2rem, 4vw, 1.5rem)",
    color: "#4caf50",
    marginBottom: "10px",
  },
  successText: {
    fontSize: "clamp(0.95rem, 2.5vw, 1.1rem)",
    marginBottom: "20px",
  },
  successDetails: {
    background: "rgba(255,255,255,0.03)",
    borderRadius: "8px",
    padding: "clamp(16px, 4vw, 20px)",
    marginBottom: "20px",
  },
  detailRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "clamp(8px, 2vw, 10px) 0",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
    fontSize: "clamp(0.85rem, 2vw, 0.95rem)",
  },
  redirectText: {
    color: "#aaa",
    fontSize: "clamp(0.8rem, 2vw, 0.85rem)",
    fontStyle: "italic",
  },
  gatewayFooter: {
    padding: "clamp(12px, 3vw, 16px)",
    borderTop: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(0,0,0,0.3)",
  },
  footerText: {
    textAlign: "center",
    fontSize: "clamp(0.7rem, 2vw, 0.75rem)",
    color: "#ff9800",
    margin: 0,
  },
}

// Add CSS animations
const styleSheet = document.createElement("style")
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  @keyframes scaleIn {
    0% { transform: scale(0); }
    50% { transform: scale(1.1); }
    100% { transform: scale(1); }
  }

  /* Scrollbar Styling */
  div::-webkit-scrollbar {
    width: 6px;
  }
  
  div::-webkit-scrollbar-track {
    background: rgba(255,255,255,0.02);
  }
  
  div::-webkit-scrollbar-thumb {
    background: rgba(255,255,255,0.1);
    border-radius: 3px;
  }
  
  div::-webkit-scrollbar-thumb:hover {
    background: rgba(255,255,255,0.2);
  }
`
document.head.appendChild(styleSheet)