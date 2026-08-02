import React, { useState } from "react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import "./Contact.css";
import API_BASE_URL from "../config/apiConfig";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [selectedProblem, setSelectedProblem] = useState("");
  const [showContactForm, setShowContactForm] = useState(false);

  // ✅ COMMON PROBLEMS WITH INSTANT SOLUTIONS (100% Preserved)
  const commonProblems = [
    {
      id: "registration",
      title: "How do I register for a tournament?",
      category: "Tournament",
      icon: "🏆",
      solution: `
        <h3 class="solution-heading">Tournament Registration Guide</h3>
        <div class="solution-body-text">
          <p><strong>Step-by-step process:</strong></p>
          <ol class="solution-list">
            <li>Log in to your PLAYZONE account</li>
            <li>Navigate to <strong>Tournaments</strong> section from the menu</li>
            <li>Browse available tournaments or use filters (Game, Date, Entry Fee)</li>
            <li>Click on the tournament you want to join</li>
            <li>Click <strong>"Register"</strong> button</li>
            <li>Enter your <strong>Team Name</strong></li>
            <li>Choose payment method:
              <ul class="sub-list">
                <li><strong>Wallet</strong> - Instant registration (if sufficient balance)</li>
                <li><strong>UPI/QR Code</strong> - Pay via payment gateway</li>
              </ul>
            </li>
            <li>Confirm registration</li>
            <li>You'll receive confirmation email with tournament details</li>
          </ol>
          
          <div class="solution-alert warning">
            <strong>⚠️ Important:</strong>
            <ul class="sub-list">
              <li>Registration closes when slots are full or 30 minutes before tournament starts</li>
              <li>Ensure you have sufficient wallet balance or valid payment method</li>
              <li>Room ID and Password will be sent 30 minutes before tournament time</li>
            </ul>
          </div>

          <p class="solution-tip"><strong>💡 Pro Tip:</strong> Add funds to your wallet beforehand for instant registration!</p>
        </div>
      `,
    },
    {
      id: "payment_failed",
      title: "My payment failed but money was deducted",
      category: "Payment",
      icon: "💳",
      solution: `
        <h3 class="solution-heading">Payment Failure Resolution</h3>
        <div class="solution-body-text">
          <p><strong>Don't worry! Here's what happens:</strong></p>
          
          <div class="solution-alert success">
            <strong>✅ Automatic Refund Process:</strong>
            <ul class="sub-list">
              <li><strong>Bank Hold:</strong> Your bank temporarily holds the amount</li>
              <li><strong>Auto-Release:</strong> If payment fails, bank releases it within 24-48 hours</li>
              <li><strong>Direct Refund:</strong> Money returns to your original payment source</li>
            </ul>
          </div>

          <p><strong>Check your payment status:</strong></p>
          <ol class="solution-list">
            <li>Go to <strong>Dashboard → Wallet</strong></li>
            <li>Click <strong>Transaction History</strong></li>
            <li>Look for the failed transaction</li>
            <li>Status will show "Failed" or "Pending Refund"</li>
          </ol>

          <p><strong>If money not refunded after 48 hours:</strong></p>
          <ol class="solution-list">
            <li>Take screenshot of bank deduction</li>
            <li>Note the Transaction ID</li>
            <li>Contact us via form below with:
              <ul class="sub-list">
                <li>Transaction ID</li>
                <li>Amount deducted</li>
                <li>Date & time of transaction</li>
                <li>Screenshot of bank statement</li>
              </ul>
            </li>
          </ol>

          <div class="solution-alert info">
            <strong>💡 Quick Fix:</strong> Try using Wallet payment instead of direct UPI for instant registration!
          </div>
        </div>
      `,
    },
    {
      id: "room_credentials",
      title: "I didn't receive Room ID and Password",
      category: "Tournament",
      icon: "🔑",
      solution: `
        <h3 class="solution-heading">Room Credentials Not Received</h3>
        <div class="solution-body-text">
          <p><strong>Room ID and Password are sent 30 minutes before tournament starts.</strong></p>

          <p><strong>Quick Checks:</strong></p>
          <ol class="solution-list">
            <li><strong>Check Spam/Junk Folder</strong> - Emails might be filtered</li>
            <li><strong>Verify Email Address:</strong>
              <ul class="sub-list">
                <li>Go to Profile → Settings</li>
                <li>Check if email is correct</li>
                <li>Update if needed</li>
              </ul>
            </li>
            <li><strong>Check Tournament Status:</strong>
              <ul class="sub-list">
                <li>Go to Dashboard → My Tournaments</li>
                <li>Verify payment status is "Paid"</li>
                <li>Check if tournament is still "Upcoming"</li>
              </ul>
            </li>
            <li><strong>Timing:</strong> Credentials are sent exactly 30 minutes before start time</li>
          </ol>

          <div class="solution-alert warning">
            <strong>⏰ Still Not Received?</strong>
            <p>If you don't receive credentials 15 minutes before tournament:</p>
            <ol class="solution-list">
              <li>Use the contact form below</li>
              <li>Select subject: "Urgent - Room Credentials Missing"</li>
              <li>Provide Tournament ID</li>
              <li>We'll send them immediately via WhatsApp/Email</li>
            </ol>
          </div>

          <p class="solution-tip"><strong>💡 Pro Tip:</strong> Add <code class="code-tag">{process.env.REACT_APP_EMAIL}</code> to your contacts to prevent spam filtering!</p>
        </div>
      `,
    },
    {
      id: "forgot_password",
      title: "I forgot my password / Can't login",
      category: "Account",
      icon: "🔐",
      solution: `
        <h3 class="solution-heading">Password Reset & Login Help</h3>
        <div class="solution-body-text">
          <p><strong>Reset Your Password:</strong></p>
          <ol class="solution-list">
            <li>Go to <strong>Login Page</strong></li>
            <li>Click <strong>"Forgot Password?"</strong> link</li>
            <li>Enter your registered <strong>Email Address</strong></li>
            <li>Click <strong>"Send OTP"</strong></li>
            <li>Check your email for 6-digit OTP (check spam folder too)</li>
            <li>Enter OTP on the verification page</li>
            <li>Create a <strong>new password</strong> (minimum 6 characters)</li>
            <li>Login with your new password</li>
          </ol>

          <div class="solution-alert danger">
            <strong>⚠️ Common Login Issues:</strong>
            <ul class="sub-list">
              <li><strong>Wrong Email/Username:</strong> Use the exact email/username you registered with</li>
              <li><strong>Case Sensitive:</strong> Password is case-sensitive (check Caps Lock)</li>
              <li><strong>Browser Cache:</strong> Clear cookies and try again</li>
              <li><strong>Multiple Accounts:</strong> If you have multiple accounts, try other email addresses</li>
            </ul>
          </div>

          <p><strong>Still Can't Access Your Account?</strong></p>
          <p>Contact us with:</p>
          <ul class="sub-list">
            <li>Registered email address</li>
            <li>Username (if you remember)</li>
            <li>Approximate registration date</li>
            <li>Last successful login date</li>
          </ul>

          <p class="solution-tip"><strong>💡 Security Tip:</strong> Use a password manager to remember strong passwords!</p>
        </div>
      `,
    },
    {
      id: "wallet_deposit",
      title: "How do I add money to my wallet?",
      category: "Payment",
      icon: "💰",
      solution: `
        <h3 class="solution-heading">Wallet Deposit Guide</h3>
        <div class="solution-body-text">
          <p><strong>Adding Money to Your Wallet:</strong></p>
          <ol class="solution-list">
            <li>Login to your account</li>
            <li>Go to <strong>Dashboard → Wallet</strong></li>
            <li>Click <strong>"Add Money"</strong> or <strong>"Deposit"</strong> button</li>
            <li>Enter the amount you want to add (minimum ₹10)</li>
            <li>Choose payment method:
              <ul class="sub-list">
                <li><strong>UPI</strong> - PhonePe, Google Pay, Paytm, etc.</li>
                <li><strong>QR Code</strong> - Scan and pay</li>
                <li><strong>Net Banking</strong> - Direct bank transfer</li>
              </ul>
            </li>
            <li>Complete the payment</li>
            <li>Money will be <strong>instantly credited</strong> to your wallet</li>
          </ol>

          <div class="solution-alert success">
            <strong>✅ Benefits of Using Wallet:</strong>
            <ul class="sub-list">
              <li><strong>Instant Registration:</strong> No payment delays during tournament signup</li>
              <li><strong>Quick Withdrawals:</strong> Withdraw winnings anytime</li>
              <li><strong>No Repeated Payments:</strong> Add once, use for multiple tournaments</li>
              <li><strong>Secure:</strong> Your money is safely stored in your account</li>
            </ul>
          </div>

          <p><strong>Checking Wallet Balance:</strong></p>
          <ul class="sub-list">
            <li>Visible on Dashboard (top right)</li>
            <li>Check Transaction History for all deposits/withdrawals</li>
          </ul>

          <p class="solution-tip"><strong>💡 Smart Tip:</strong> Add ₹500-1000 to participate in multiple tournaments without repeated payments!</p>
        </div>
      `,
    },
    {
      id: "withdraw_winnings",
      title: "How do I withdraw my winnings?",
      category: "Payment",
      icon: "🏆",
      solution: `
        <h3 class="solution-heading">Withdraw Your Winnings</h3>
        <div class="solution-body-text">
          <p><strong>Prize Distribution Process:</strong></p>
          <ol class="solution-list">
            <li><strong>Tournament Ends</strong> - Admin verifies results (24 hours)</li>
            <li><strong>Results Published</strong> - Winners announced</li>
            <li><strong>Auto-Credit</strong> - Prize money automatically added to your wallet</li>
            <li><strong>Email Notification</strong> - You receive confirmation email</li>
          </ol>

          <p><strong>Withdrawing Money from Wallet:</strong></p>
          <ol class="solution-list">
            <li>Go to <strong>Dashboard → Wallet</strong></li>
            <li>Click <strong>"Withdraw"</strong> button</li>
            <li>Enter withdrawal amount:
              <ul class="sub-list">
                <li><strong>Minimum:</strong> ₹100</li>
                <li><strong>Maximum:</strong> Your available balance</li>
              </ul>
            </li>
            <li>Provide bank account details:
              <ul class="sub-list">
                <li>Account Holder Name</li>
                <li>Account Number</li>
                <li>IFSC Code</li>
                <li>Bank Name</li>
              </ul>
            </li>
            <li>Submit withdrawal request</li>
            <li>Money transferred within <strong>24-48 hours</strong></li>
          </ol>

          <div class="solution-alert info">
            <strong>💵 Withdrawal Timeline:</strong>
            <ul class="sub-list">
              <li><strong>Working Days:</strong> 24-48 hours</li>
              <li><strong>Weekends/Holidays:</strong> May take up to 72 hours</li>
              <li><strong>First Withdrawal:</strong> May require KYC verification</li>
            </ul>
          </div>

          <p><strong>Track Withdrawal Status:</strong> Dashboard → Wallet → Transaction History → Look for "Withdraw" entries</p>
          <p class="solution-tip"><strong>💡 Note:</strong> Keep some balance in wallet for future tournament entries!</p>
        </div>
      `,
    },
    {
      id: "tournament_cancelled",
      title: "Tournament was cancelled - What about my money?",
      category: "Tournament",
      icon: "❌",
      solution: `
        <h3 class="solution-heading">Tournament Cancellation & Refund</h3>
        <div class="solution-body-text">
          <p><strong>If Admin Cancels Tournament:</strong></p>
          <div class="solution-alert success">
            <strong>✅ Full Automatic Refund</strong>
            <ul class="sub-list">
              <li><strong>100% refund</strong> - No deductions</li>
              <li><strong>Instant credit</strong> to your wallet</li>
              <li><strong>Email notification</strong> sent immediately</li>
              <li>You can use refunded amount for other tournaments</li>
            </ul>
          </div>

          <p><strong>If You Want to Cancel Registration:</strong></p>
          <div class="solution-alert warning">
            <strong>⏰ Time-Based Refund Policy:</strong>
            <ul class="sub-list">
              <li><strong>24+ hours before:</strong> 100% refund</li>
              <li><strong>Within 24 hours:</strong> 95% refund (5% processing fee)</li>
              <li><strong>After tournament starts:</strong> No refund</li>
            </ul>
          </div>

          <p><strong>How to Cancel Your Registration:</strong></p>
          <ol class="solution-list">
            <li>Go to <strong>Dashboard → My Tournaments</strong></li>
            <li>Find the tournament you want to cancel</li>
            <li>Click <strong>"Cancel Registration"</strong></li>
            <li>Confirm cancellation</li>
            <li>Refund processed instantly to wallet</li>
          </ol>

          <p><strong>Refund Processing Time:</strong></p>
          <ul class="sub-list">
            <li><strong>To Wallet:</strong> Instant</li>
            <li><strong>To Bank:</strong> 5-7 business days (if you paid via UPI/Card)</li>
          </ul>

          <p class="solution-tip"><strong>💡 Tip:</strong> Cancel early to get full refund if your plans change!</p>
        </div>
      `,
    },
    {
      id: "technical_issue",
      title: "App/Website not working properly",
      category: "Technical",
      icon: "🔧",
      solution: `
        <h3 class="solution-heading">Technical Troubleshooting</h3>
        <div class="solution-body-text">
          <p><strong>Quick Fixes (Try these first):</strong></p>
          
          <div class="solution-alert info">
            <strong>🌐 Website Issues:</strong>
            <ol class="solution-list">
              <li><strong>Clear Cache & Cookies:</strong> Press <code class="code-tag">Ctrl + Shift + Delete</code> (Win) or <code class="code-tag">Cmd + Shift + Delete</code> (Mac)</li>
              <li><strong>Try Different Browser:</strong> Chrome, Firefox, or Edge (latest version)</li>
              <li><strong>Disable Ad-Blockers:</strong> Some extensions block website features</li>
              <li><strong>Try Incognito Mode:</strong> <code class="code-tag">Ctrl + Shift + N</code></li>
            </ol>
          </div>

          <div class="solution-alert success">
            <strong>📱 Mobile App Issues:</strong>
            <ol class="solution-list">
              <li><strong>Force Close & Reopen</strong> the app</li>
              <li><strong>Clear App Cache:</strong> Settings → Apps → PLAYZONE → Storage → Clear Cache</li>
              <li><strong>Update App</strong> to latest version</li>
              <li><strong>Check Internet Connection:</strong> Use WiFi or strong mobile data</li>
            </ol>
          </div>

          <div class="solution-alert danger">
            <strong>🚨 During Live Tournament:</strong>
            <p>If you face issues during an active tournament:</p>
            <ol class="solution-list">
              <li>Take screenshot of the error</li>
              <li>Note exact time of issue</li>
              <li>Contact us immediately via form below with "URGENT - Live Tournament Issue"</li>
            </ol>
          </div>
        </div>
      `,
    },
    {
      id: "game_rules",
      title: "What are the tournament rules?",
      category: "Tournament",
      icon: "📜",
      solution: `
        <h3 class="solution-heading">Tournament Rules & Guidelines</h3>
        <div class="solution-body-text">
          <div class="solution-alert warning">
            <strong>⚠️ General Rules (All Tournaments):</strong>
            <ol class="solution-list">
              <li><strong>Punctuality:</strong> Be online 10 minutes before start time</li>
              <li><strong>Late Entry:</strong> NOT allowed - you'll lose entry fee</li>
              <li><strong>Room Credentials:</strong> Sent 30 minutes before via email</li>
              <li><strong>Fair Play:</strong> Absolutely NO cheating, hacking, or exploits</li>
            </ol>
          </div>

          <p><strong>Allowed:</strong></p>
          <ul class="sub-list" style="color: #28a745;">
            <li>✅ Official game version from Play Store/App Store</li>
            <li>✅ In-game purchased skins/characters</li>
            <li>✅ Voice chat with teammates (squad mode)</li>
          </ul>

          <p><strong>Strictly Prohibited:</strong></p>
          <ul class="sub-list" style="color: #ff4c4c;">
            <li>❌ Mod APK or hacked versions</li>
            <li>❌ Emulators (unless specifically allowed)</li>
            <li>❌ Aimbot, wallhack, speed hack, or any cheats</li>
            <li>❌ Teaming with opponents (in solo mode)</li>
          </ul>

          <div class="solution-alert danger">
            <strong>🚫 Violations & Penalties:</strong>
            <ul class="sub-list">
              <li><strong>First Offense:</strong> Disqualification from tournament</li>
              <li><strong>Second Offense:</strong> Account suspension (30 days)</li>
              <li><strong>Third Offense:</strong> Permanent ban from platform</li>
            </ul>
          </div>
        </div>
      `,
    },
    {
      id: "other",
      title: "My problem is not listed here",
      category: "Other",
      icon: "❓",
      solution: `
        <h3 class="solution-heading">We're Here to Help!</h3>
        <div class="solution-body-text">
          <p>Looks like your issue is unique. No worries - our support team is ready to assist you personally!</p>
          
          <div class="solution-alert info">
            <strong>📧 Contact Support:</strong>
            <p>Use the contact form below and provide:</p>
            <ul class="sub-list">
              <li>Detailed description of your issue</li>
              <li>Screenshots if applicable</li>
              <li>Tournament ID or Transaction ID</li>
            </ul>
          </div>

          <p><strong>📞 Alternative Contact Methods:</strong> Email: {process.env.REACT_APP_EMAIL} (Response within 24-48 hours)</p>
        </div>
      `,
    },
  ];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/contact/submit`, formData);
      toast.success(response.data.message);
      setFormData({ name: "", email: "", subject: "", message: "" });
      setShowContactForm(false);
      setSelectedProblem("");
    } catch (error) {
      console.error("Contact form error:", error);
      toast.error(error.response?.data?.message || "Failed to send message. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleProblemSelect = (problemId) => {
    setSelectedProblem(selectedProblem === problemId ? "" : problemId);
  };

  const getCategoryColor = (category) => {
    const colors = {
      Tournament: "#FFA500",
      Payment: "#28a745",
      Account: "#0077ff",
      Technical: "#dc3545",
      Other: "#6c757d",
    };
    return colors[category] || "#6c757d";
  };

  return (
    <div className="contact-page-container">
      <Toaster position="top-right" reverseOrder={false} />

      <div className="contact-content-wrapper">
        {/* Header */}
        <div className="contact-header-card">
          <h1 className="contact-main-title">Help & Support Center</h1>
          <p className="contact-main-subtitle">
            Find instant solutions to common problems or contact our support team
          </p>
        </div>

        {/* Quick Solutions Section */}
        <div className="contact-card-section">
          <h2 className="contact-section-title">🔍 Find Your Solution Instantly</h2>
          <p className="contact-desc-text">
            Select your problem below to get immediate help. Most issues can be resolved in seconds!
          </p>

          <div className="problems-grid-layout">
            {commonProblems.map((problem) => (
              <div key={problem.id} className="problem-item-wrapper">
                <div
                  className={`support-problem-card ${selectedProblem === problem.id ? "active" : ""}`}
                  onClick={() => handleProblemSelect(problem.id)}
                >
                  <div className="problem-icon-box">{problem.icon}</div>
                  <div className="problem-title-box">
                    <span className="support-problem-title">
                      {problem.title}
                    </span>
                    <span
                      className="support-category-badge"
                      style={{ background: getCategoryColor(problem.category) }}
                    >
                      {problem.category}
                    </span>
                  </div>
                  <div className="problem-arrow">
                    {selectedProblem === problem.id ? "▼" : "▶"}
                  </div>
                </div>

                {/* Solution Display */}
                {selectedProblem === problem.id && (
                  <div className="support-solution-box">
                    <div dangerouslySetInnerHTML={{ __html: problem.solution }} />
                    
                    {problem.id === "other" && (
                      <button
                        onClick={() => setShowContactForm(true)}
                        className="auth-btn"
                        style={{ marginTop: "20px", width: "100%" }}
                      >
                        📧 Open Contact Form
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Contact Info Section */}
        <div className="contact-card-section">
          <h2 className="contact-section-title">📞 Contact Information</h2>
          <p className="contact-desc-text">
            Still need help? We're available 24/7 for tournament-related emergencies.
          </p>

          <div className="contact-info-grid">
            <div className="contact-info-row">
              <span className="contact-label">📧 Email:</span>
              <a href={`mailto:${process.env.REACT_APP_EMAIL}`} className="contact-val-link">
                {process.env.REACT_APP_EMAIL}
              </a>
            </div>
            <div className="contact-info-row">
              <span className="contact-label">⏰ Tournament Support:</span>
              <span className="contact-val">24/7 Real-time assistance</span>
            </div>
            <div className="contact-info-row">
              <span className="contact-label">📬 General Inquiries:</span>
              <span className="contact-val">Response within 24-48 hours</span>
            </div>
            <div className="contact-info-row">
              <span className="contact-label">🚨 Payment Issues:</span>
              <span className="contact-val">Priority response within 12 hours</span>
            </div>
            <div className="contact-info-row">
              <span className="contact-label">📍 Location:</span>
              <span className="contact-val">{process.env.REACT_APP_LOCATION}</span>
            </div>
          </div>
        </div>

        {/* Contact Form Section - Collapsible */}
        {!showContactForm ? (
          <div className="contact-card-section" style={{ textAlign: "center" }}>
            <h2 className="contact-section-title">💬 Still Need Help?</h2>
            <p className="contact-desc-text" style={{ marginBottom: "20px" }}>
              If the solutions above didn't help, click below to contact our support team directly.
            </p>
            <button
              onClick={() => setShowContactForm(true)}
              className="auth-btn"
              style={{ width: "100%", maxWidth: "350px", margin: "0 auto" }}
            >
              📧 Contact Support Team
            </button>
          </div>
        ) : (
          <div className="contact-card-section">
            <div className="form-top-row">
              <h2 className="contact-section-title" style={{ marginBottom: 0 }}>Send Us a Message</h2>
              <button
                onClick={() => setShowContactForm(false)}
                className="close-form-trigger"
              >
                ✖ Close Form
              </button>
            </div>
            <p className="contact-desc-text">
              Fill out the form below and we'll get back to you as soon as possible.
            </p>
            <form className="ticket-form-layout" onSubmit={handleSubmit}>
              <div className="form-row-dual">
                <input
                  className="auth-input"
                  type="text"
                  name="name"
                  placeholder="Your Name *"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
                <input
                  className="auth-input"
                  type="email"
                  name="email"
                  placeholder="Your Email *"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
              <select
                className="auth-input"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                required
              >
                <option value="">-- Select Issue Type *</option>
                <option value="Tournament Registration">Tournament Registration</option>
                <option value="Payment Issue">Payment Issue</option>
                <option value="Account Access">Account Access</option>
                <option value="Room Credentials Missing">Room Credentials Missing</option>
                <option value="Wallet Deposit/Withdrawal">Wallet Deposit/Withdrawal</option>
                <option value="Tournament Cancelled">Tournament Cancelled</option>
                <option value="Technical Problem">Technical Problem</option>
                <option value="Prize Distribution">Prize Distribution</option>
                <option value="Rules Clarification">Rules Clarification</option>
                <option value="URGENT - Live Tournament Issue">🚨 URGENT - Live Tournament Issue</option>
                <option value="Other">Other</option>
              </select>
              <textarea
                className="auth-input"
                name="message"
                placeholder="Describe your issue in detail. Include Tournament ID, Transaction ID, error messages, or any relevant information *"
                value={formData.message}
                onChange={handleChange}
                rows={5}
                required
                style={{ resize: "vertical" }}
              />
              <div className="form-tip-banner">
                💡 <strong>Tip:</strong> The more details you provide (screenshots, IDs, exact error messages), 
                the faster we can resolve your issue!
              </div>
              <button className="auth-btn" type="submit" disabled={loading}>
                {loading ? "Sending..." : "📨 Send Message"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Contact;