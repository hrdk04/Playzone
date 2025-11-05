import React, { useState, useEffect } from "react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import theme from "../theme";

const ManageContacts = ({ isMobile = false }) => {
  const [contacts, setContacts] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, resolved: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedContact, setSelectedContact] = useState(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [suggestedTemplates, setSuggestedTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [manualSelection, setManualSelection] = useState("");
  
  // ✅ NEW: Pagination & UI Controls
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedContact, setExpandedContact] = useState(null);
  const [showAISuggestions, setShowAISuggestions] = useState(true);
  const [showManualSelect, setShowManualSelect] = useState(false);
  const contactsPerPage = 10;

  // Problem categories and templates (keeping your existing logic)
  const problemCategories = [
    {
      category: "Tournament Issues",
      problems: [
        { id: "registration", name: "🏆 Tournament Registration Help", icon: "🏆" },
        { id: "room_credentials", name: "🔑 Room ID/Password Missing", icon: "🔑" },
        { id: "tournament_cancelled", name: "❌ Tournament Cancellation/Refund", icon: "❌" },
        { id: "tournament_rules", name: "📜 Tournament Rules & Guidelines", icon: "📜" },
        { id: "urgent_live", name: "🚨 URGENT - Live Tournament Issue", icon: "🚨" },
      ]
    },
    {
      category: "Payment & Wallet",
      problems: [
        { id: "payment_failed", name: "💳 Payment Failed/Money Deducted", icon: "💳" },
        { id: "wallet_deposit", name: "💰 Add Money to Wallet", icon: "💰" },
        { id: "withdraw_winnings", name: "🏆 Withdraw Winnings/Prize", icon: "🏆" },
      ]
    },
    {
      category: "Account Issues",
      problems: [
        { id: "forgot_password", name: "🔐 Forgot Password/Can't Login", icon: "🔐" },
      ]
    },
    {
      category: "Technical Support",
      problems: [
        { id: "technical_issue", name: "🔧 Technical Problem/Bug", icon: "🔧" },
      ]
    },
    {
      category: "General",
      problems: [
        { id: "general_inquiry", name: "💬 General Inquiry", icon: "💬" },
      ]
    }
  ];

  const replyTemplates = {
    registration: {
      keywords: ["register", "registration", "join", "signup", "sign up", "how to participate", "enter tournament"],
      priority: 1,
      template: {
        title: "🏆 Tournament Registration Help",
        content: `Hello {userName},

Thank you for your interest in joining our tournaments!

**Tournament Registration Steps:**
1. Log in to your PLAYZONE account
2. Go to Tournaments section
3. Browse and select your desired tournament
4. Click "Register" button
5. Enter your Team Name
6. Choose payment method (Wallet/UPI)
7. Confirm registration

**Important Notes:**
• Registration closes when slots are full
• Room ID and Password sent 30 minutes before tournament
• Ensure sufficient wallet balance for instant registration

{tournamentInfo}

Need help with a specific tournament? Please share the Tournament ID and I'll assist you immediately!

Best regards,
PLAYZONE Support Team`,
      },
    },
    payment_failed: {
      keywords: ["payment failed", "money deducted", "not credited", "payment issue", "transaction failed", "payment problem", "double charged"],
      priority: 1,
      template: {
        title: "💳 Payment Issue Resolution",
        content: `Hello {userName},

I understand you're experiencing a payment issue. Let me help you resolve this.

**Your Issue:** Payment processed but registration not completed

**What Happens Next:**
• If payment failed, your bank holds the amount temporarily
• Automatic refund within 24-48 hours to original source
• No action needed from your side

**Check Payment Status:**
1. Go to Dashboard → Wallet → Transaction History
2. Look for your transaction
3. Status will show "Failed" or "Pending Refund"

**If money not refunded after 48 hours:**
Please reply with:
• Transaction ID
• Amount deducted
• Date & time of transaction
• Screenshot of bank statement

We'll process an immediate manual refund.

{paymentInfo}

I'm here to help resolve this quickly!

Best regards,
PLAYZONE Support Team`,
      },
    },
    room_credentials: {
      keywords: ["room id", "password", "credentials", "didn't receive", "not received", "room details", "game id"],
      priority: 1,
      template: {
        title: "🔑 Room Credentials Assistance",
        content: `Hello {userName},

I'll help you get your tournament room credentials immediately.

**Room Credentials Timing:**
• Sent 30 minutes before tournament starts
• Delivered via email to your registered address

**Quick Checks:**
1. Check Spam/Junk folder
2. Verify email in Profile → Settings
3. Confirm payment status is "Paid"
4. Check tournament hasn't been cancelled

{tournamentInfo}

**Urgent Assistance:**
If your tournament starts in less than 30 minutes and you haven't received credentials, I'll send them to you right now via this email.

Please confirm:
• Tournament ID: {tournamentId}
• Your registered email: {userEmail}

I'll prioritize this and get you the details immediately!

Best regards,
PLAYZONE Support Team`,
      },
    },
    forgot_password: {
      keywords: ["forgot password", "can't login", "reset password", "login issue", "account access", "locked out", "password reset"],
      priority: 1,
      template: {
        title: "🔐 Account Access & Password Reset",
        content: `Hello {userName},

Let me help you regain access to your account.

**Password Reset Steps:**
1. Go to Login Page
2. Click "Forgot Password?"
3. Enter your registered email: {userEmail}
4. Click "Send OTP"
5. Check email for 6-digit OTP (check spam too)
6. Enter OTP and create new password

**Still Having Issues?**
Common solutions:
• Clear browser cache and cookies
• Try different browser
• Check Caps Lock is off
• Verify you're using correct email/username

**Account Recovery:**
If you can't remember your registered email, I can help verify your account using:
• Username
• Phone number
• Approximate registration date
• Last tournament participated

Please provide these details and I'll assist in recovering your account.

Best regards,
PLAYZONE Support Team`,
      },
    },
    wallet_deposit: {
      keywords: ["add money", "deposit", "wallet", "top up", "recharge", "add funds", "how to pay"],
      priority: 1,
      template: {
        title: "💰 Wallet Deposit Guide",
        content: `Hello {userName},

Happy to help you add funds to your wallet!

**Adding Money Steps:**
1. Login to your account
2. Go to Dashboard → Wallet
3. Click "Add Money" or "Deposit"
4. Enter amount (minimum ₹10)
5. Choose payment method:
   • UPI (PhonePe, Google Pay, Paytm)
   • QR Code
   • Net Banking
6. Complete payment
7. Money instantly credited!

**Wallet Benefits:**
✅ Instant tournament registration
✅ No payment delays
✅ Quick withdrawals
✅ Secure storage

{paymentInfo}

**Pro Tip:** Add ₹500-1000 to participate in multiple tournaments without repeated payments!

Need help with a specific payment method? Let me know!

Best regards,
PLAYZONE Support Team`,
      },
    },
    withdraw_winnings: {
      keywords: ["withdraw", "withdrawal", "prize", "winnings", "cash out", "transfer money", "bank transfer"],
      priority: 1,
      template: {
        title: "🏆 Withdraw Your Winnings",
        content: `Hello {userName},

Congratulations on your winnings! Let me help you withdraw your money.

**Prize Distribution Process:**
1. Tournament ends → Results verified (24 hours)
2. Winners announced
3. Prize auto-credited to wallet
4. Email notification sent

**Withdrawal Steps:**
1. Go to Dashboard → Wallet
2. Click "Withdraw"
3. Enter amount (Min: ₹100)
4. Provide bank details:
   • Account Holder Name
   • Account Number
   • IFSC Code
   • Bank Name
5. Submit request
6. Money transferred in 24-48 hours

**Current Wallet Balance:** Check in Dashboard

{paymentInfo}

**Timeline:**
• Working days: 24-48 hours
• Weekends: Up to 72 hours
• First withdrawal may require KYC

Need help with the withdrawal process? I'm here to assist!

Best regards,
PLAYZONE Support Team`,
      },
    },
    tournament_cancelled: {
      keywords: ["cancelled", "canceled", "refund", "tournament cancelled", "event cancelled", "postponed"],
      priority: 1,
      template: {
        title: "❌ Tournament Cancellation & Refund",
        content: `Hello {userName},

I understand your concern about the tournament cancellation.

**If Admin Cancelled Tournament:**
✅ 100% automatic refund
✅ Instant credit to wallet
✅ Email notification sent
✅ No deductions

**If You Want to Cancel:**
Refund Policy:
• 24+ hours before: 100% refund
• Within 24 hours: 95% refund (5% processing fee)
• After start: No refund

**Cancel Registration:**
1. Dashboard → My Tournaments
2. Find tournament
3. Click "Cancel Registration"
4. Confirm
5. Instant wallet refund

{tournamentInfo}

**Refund Timeline:**
• To Wallet: Instant
• To Bank: 5-7 business days

Your refund has been/will be processed automatically. Check your wallet balance or transaction history.

Best regards,
PLAYZONE Support Team`,
      },
    },
    technical_issue: {
      keywords: ["not working", "error", "bug", "crash", "technical", "website down", "app not loading", "loading issue"],
      priority: 1,
      template: {
        title: "🔧 Technical Support",
        content: `Hello {userName},

I'm sorry you're experiencing technical difficulties. Let me help you troubleshoot.

**Quick Fixes:**

**For Website:**
1. Clear cache & cookies (Ctrl+Shift+Delete)
2. Try different browser (Chrome recommended)
3. Disable ad-blockers
4. Try Incognito mode (Ctrl+Shift+N)

**For Mobile App:**
1. Force close and reopen
2. Clear app cache (Settings → Apps → Storage)
3. Update to latest version
4. Reinstall if needed

**Common Issues:**
• Page not loading → Check internet, refresh
• Login failed → Clear cookies, reset password
• Payment not working → Try different method
• Images not loading → Clear cache

{technicalInfo}

**Still Not Working?**
Please provide:
• Device type (Phone/PC)
• Browser/App version
• Screenshot of error
• What you were trying to do

I'll investigate and resolve this immediately!

Best regards,
PLAYZONE Support Team`,
      },
    },
    tournament_rules: {
      keywords: ["rules", "guidelines", "how to play", "regulations", "fair play", "cheating", "allowed", "not allowed"],
      priority: 2,
      template: {
        title: "📜 Tournament Rules & Guidelines",
        content: `Hello {userName},

Happy to clarify our tournament rules!

**General Rules:**
✅ Be online 10 minutes before start
✅ Room credentials sent 30 minutes before
✅ Fair play mandatory
✅ Screenshots may be required

**Allowed:**
• Official game from Play Store
• In-game purchased items
• Voice chat with teammates
• Screen recording

**Prohibited:**
❌ Mod APK or hacks
❌ Emulators (unless specified)
❌ Aimbot, wallhack, speed hack
❌ Teaming in solo mode
❌ Multiple accounts
❌ Abusive behavior

**Penalties:**
1st offense: Disqualification
2nd offense: 30-day ban
3rd offense: Permanent ban

{tournamentInfo}

**Specific Tournament Rules:**
Check tournament detail page for:
• Map restrictions
• Mode (Solo/Duo/Squad)
• Server region
• Weapons allowed

Any specific rule clarification needed? I'm here to help!

Best regards,
PLAYZONE Support Team`,
      },
    },
    general_inquiry: {
      keywords: ["how", "what", "when", "where", "why", "question", "info", "information"],
      priority: 3,
      template: {
        title: "💬 General Inquiry Response",
        content: `Hello {userName},

Thank you for reaching out to PLAYZONE!

I'm here to help with any questions about:
• Tournament registration & participation
• Payment and wallet management
• Account settings & security
• Prize distribution & withdrawals
• Technical issues
• Rules & guidelines

**Quick Resources:**
• Tournament Schedule: Check upcoming events
• FAQ Section: Common questions answered
• Rules Page: Fair play policies
• Support: 24/7 for tournaments

{generalInfo}

**Response Times:**
• Tournament issues: 24/7 real-time
• General queries: Within 24-48 hours
• Payment issues: Within 12 hours

Could you please provide more details about your specific question? I'll give you a detailed answer immediately!

Best regards,
PLAYZONE Support Team`,
      },
    },
    urgent_live: {
      keywords: ["urgent", "emergency", "live tournament", "right now", "immediately", "asap", "help now"],
      priority: 0,
      template: {
        title: "🚨 URGENT - Live Tournament Assistance",
        content: `Hello {userName},

I understand this is urgent and you need immediate assistance!

**Live Tournament Support:**
I'm prioritizing your request right now.

{tournamentInfo}

**Immediate Actions:**
1. What specific issue are you facing?
2. Tournament ID: {tournamentId}
3. Current time: Check if tournament has started

**Common Urgent Solutions:**
• Room ID missing: Check spam, I'll resend now
• Payment stuck: Refresh page, verify wallet
• Can't join: Check game version, room details
• Technical error: Screenshot needed

**Direct Support:**
For real-time assistance during live tournaments, I'm monitoring this closely.

Please respond with:
• Exact issue
• Tournament ID
• Screenshot (if applicable)

I'll resolve this IMMEDIATELY!

Best regards,
PLAYZONE Priority Support`,
      },
    },
  };

  const detectQueryType = (contact) => {
    const searchText = `${contact.subject} ${contact.message}`.toLowerCase();
    const matches = [];

    Object.entries(replyTemplates).forEach(([key, template]) => {
      let score = 0;
      template.keywords.forEach((keyword) => {
        if (searchText.includes(keyword.toLowerCase())) {
          score += 1;
        }
      });

      if (score > 0) {
        matches.push({
          type: key,
          score,
          priority: template.priority,
          template: template.template,
        });
      }
    });

    matches.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.priority - b.priority;
    });

    return matches;
  };

  const generateReply = (template, contact) => {
    let reply = template.content;
    reply = reply.replace(/{userName}/g, contact.name);
    reply = reply.replace(/{userEmail}/g, contact.email);

    const tournamentMatch = contact.message.match(/T-?\d+|tournament\s+id[:\s]+([A-Z0-9-]+)/i);
    const tournamentId = tournamentMatch ? tournamentMatch[0] : "[Please provide Tournament ID]";

    if (reply.includes("{tournamentId}")) {
      reply = reply.replace(/{tournamentId}/g, tournamentId);
    }

    if (reply.includes("{tournamentInfo}")) {
      const tournamentInfo =
        contact.subject.toLowerCase().includes("tournament") || contact.message.toLowerCase().includes("tournament")
          ? `\n**Tournament Reference:** ${tournamentId}\n**Your Query:** ${contact.subject}\n`
          : "";
      reply = reply.replace(/{tournamentInfo}/g, tournamentInfo);
    }

    if (reply.includes("{paymentInfo}")) {
      const paymentInfo =
        contact.subject.toLowerCase().includes("payment") || contact.message.toLowerCase().includes("payment")
          ? `\n**Payment Support:** If you need urgent payment assistance, please provide your Transaction ID for faster resolution.\n`
          : "";
      reply = reply.replace(/{paymentInfo}/g, paymentInfo);
    }

    if (reply.includes("{technicalInfo}")) {
      const technicalInfo = `\n**Your reported issue:** ${contact.subject}\n**Device:** [Please specify if needed]\n`;
      reply = reply.replace(/{technicalInfo}/g, technicalInfo);
    }

    if (reply.includes("{generalInfo}")) {
      reply = reply.replace(/{generalInfo}/g, "");
    }

    return reply;
  };

  useEffect(() => {
    fetchContacts();
  }, [filter, search]);

  useEffect(() => {
    if (selectedContact) {
      const matches = detectQueryType(selectedContact);
      setSuggestedTemplates(matches);

      if (matches.length > 0) {
        const bestMatch = matches[0];
        const personalizedReply = generateReply(bestMatch.template, selectedContact);
        setReplyMessage(personalizedReply);
        setSelectedTemplate(bestMatch.type);
        setManualSelection(bestMatch.type);
        setShowAISuggestions(true);
        setShowManualSelect(false);
      } else {
        const generalTemplate = replyTemplates.general_inquiry.template;
        const personalizedReply = generateReply(generalTemplate, selectedContact);
        setReplyMessage(personalizedReply);
        setSelectedTemplate("general_inquiry");
        setManualSelection("general_inquiry");
        setShowAISuggestions(false);
        setShowManualSelect(true);
      }
    } else {
      setSuggestedTemplates([]);
      setSelectedTemplate(null);
      setReplyMessage("");
      setManualSelection("");
      setShowAISuggestions(true);
      setShowManualSelect(false);
    }
  }, [selectedContact]);

  const fetchContacts = async () => {
    try {
      const params = new URLSearchParams();
      if (filter !== "all") params.append("status", filter);
      if (search) params.append("search", search);

      const { data } = await axios.get(`http://localhost:5000/admin/contacts?${params.toString()}`);

      setContacts(data.contacts);
      setStats(data.stats);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching contacts:", error);
      toast.error("Failed to load contacts");
      setLoading(false);
    }
  };

  const handleResolve = async (id) => {
    try {
      await axios.put(`http://localhost:5000/admin/contacts/${id}/resolve`);
      toast.success("Contact marked as resolved");
      fetchContacts();
    } catch (error) {
      console.error("Error resolving contact:", error);
      toast.error("Failed to resolve contact");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this contact?")) return;

    try {
      await axios.delete(`http://localhost:5000/admin/contacts/${id}`);
      toast.success("Contact deleted successfully");
      fetchContacts();
    } catch (error) {
      console.error("Error deleting contact:", error);
      toast.error("Failed to delete contact");
    }
  };

  const handleSendReply = async () => {
    if (!replyMessage.trim()) {
      return toast.error("Please enter a reply message");
    }

    setSendingReply(true);
    try {
      await axios.post(`http://localhost:5000/admin/contacts/${selectedContact._id}/reply`, { reply: replyMessage });

      toast.success("Reply sent successfully");
      setSelectedContact(null);
      setReplyMessage("");
      setSelectedTemplate(null);
      setSuggestedTemplates([]);
      setManualSelection("");
      fetchContacts();
    } catch (error) {
      console.error("Error sending reply:", error);
      toast.error("Failed to send reply");
    } finally {
      setSendingReply(false);
    }
  };

  const handleTemplateSwitch = (templateType) => {
    const template = replyTemplates[templateType].template;
    const personalizedReply = generateReply(template, selectedContact);
    setReplyMessage(personalizedReply);
    setSelectedTemplate(templateType);
    setManualSelection(templateType);
  };

  const handleManualSelection = (e) => {
    const templateType = e.target.value;
    setManualSelection(templateType);

    if (templateType && replyTemplates[templateType]) {
      const template = replyTemplates[templateType].template;
      const personalizedReply = generateReply(template, selectedContact);
      setReplyMessage(personalizedReply);
      setSelectedTemplate(templateType);
      toast.success(`Template loaded: ${template.title}`);
    }
  };

  // ✅ TRUNCATE TEXT HELPER
  const truncateText = (text, maxLength = 150) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  // ✅ PAGINATION
  const indexOfLastContact = currentPage * contactsPerPage;
  const indexOfFirstContact = indexOfLastContact - contactsPerPage;
  const currentContacts = contacts.slice(indexOfFirstContact, indexOfLastContact);
  const totalPages = Math.ceil(contacts.length / contactsPerPage);

  const quickReplies = [
    {
      label: "✅ Resolved",
      text: "Your issue has been resolved. If you need further assistance, feel free to contact us again!",
    },
    {
      label: "🔍 Need More Info",
      text: "To assist you better, could you please provide:\n• Tournament ID (if applicable)\n• Transaction ID (if payment related)\n• Screenshot of the issue\n• Exact error message\n\nThis will help me resolve your issue quickly!",
    },
    {
      label: "⏳ Processing",
      text: "Thank you for your patience! We're currently processing your request and will update you within 24 hours. For urgent matters, please mark your subject as 'URGENT'.",
    },
  ];

  if (loading) {
    return (
      <div style={{ 
        padding: "2rem", 
        textAlign: "center", 
        color: theme.colors.white,
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}>
        <div>
          <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>⏳</div>
          <p>Loading contacts...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: isMobile ? "1rem" : "2rem",
        color: theme.colors.white,
        fontFamily: theme.fonts.primary,
        maxWidth: "1400px",
        margin: "0 auto",
      }}
    >
      <Toaster position="top-right" reverseOrder={false} />

      {/* ✅ CLEAN HEADER */}
      <div style={{ marginBottom: "2rem" }}>
        <h1
          style={{
            color: theme.colors.primary,
            marginBottom: "0.5rem",
            fontSize: isMobile ? "1.5rem" : "2rem",
          }}
        >
          📧 Contact Management
        </h1>
        <p style={{ color: theme.colors.lightGray, fontSize: "0.95rem" }}>
          AI-powered support system • Manage customer inquiries efficiently
        </p>
      </div>

      {/* ✅ COMPACT STATS - Single Row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "repeat(3, 1fr)" : "repeat(3, 1fr)",
          gap: isMobile ? "0.5rem" : "1rem",
          marginBottom: "1.5rem",
        }}
      >
        <div
          style={{
            background: theme.gradients.navbarAlt1,
            padding: isMobile ? "1rem" : "1.25rem",
            borderRadius: "10px",
            border: `1px solid ${theme.colors.primary}`,
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: isMobile ? "1.5rem" : "1.75rem", color: theme.colors.primary, fontWeight: "bold" }}>
            {stats.total}
          </div>
          <div style={{ color: theme.colors.lightGray, marginTop: "0.25rem", fontSize: isMobile ? "0.75rem" : "0.85rem" }}>
            Total
          </div>
        </div>

        <div
          style={{
            background: theme.gradients.navbarAlt1,
            padding: isMobile ? "1rem" : "1.25rem",
            borderRadius: "10px",
            border: `1px solid #FFA500`,
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: isMobile ? "1.5rem" : "1.75rem", color: "#FFA500", fontWeight: "bold" }}>
            {stats.pending}
          </div>
          <div style={{ color: theme.colors.lightGray, marginTop: "0.25rem", fontSize: isMobile ? "0.75rem" : "0.85rem" }}>
            Pending
          </div>
        </div>

        <div
          style={{
            background: theme.gradients.navbarAlt1,
            padding: isMobile ? "1rem" : "1.25rem",
            borderRadius: "10px",
            border: `1px solid #28a745`,
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: isMobile ? "1.5rem" : "1.75rem", color: "#28a745", fontWeight: "bold" }}>
            {stats.resolved}
          </div>
          <div style={{ color: theme.colors.lightGray, marginTop: "0.25rem", fontSize: isMobile ? "0.75rem" : "0.85rem" }}>
            Resolved
          </div>
        </div>
      </div>

      {/* ✅ COMPACT FILTERS */}
      <div
        style={{
          background: theme.gradients.navbarAlt1,
          padding: isMobile ? "1rem" : "1.25rem",
          borderRadius: "10px",
          border: `1px solid ${theme.colors.primary}`,
          marginBottom: "1.5rem",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            gap: "1rem",
            alignItems: isMobile ? "stretch" : "center",
          }}
        >
          {/* Filter Buttons */}
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {["all", "pending", "resolved"].map((status) => (
              <button
                key={status}
                onClick={() => {
                  setFilter(status);
                  setCurrentPage(1);
                }}
                style={{
                  padding: "0.5rem 1rem",
                  background: filter === status ? theme.colors.primary : "rgba(0,0,0,0.3)",
                  color: filter === status ? "#fff" : theme.colors.lightGray,
                  border: `1px solid ${filter === status ? theme.colors.primary : "#333"}`,
                  borderRadius: "6px",
                  cursor: "pointer",
                  textTransform: "capitalize",
                  fontSize: "0.9rem",
                  fontWeight: filter === status ? "bold" : "normal",
                  transition: "all 0.2s ease",
                }}
              >
                {status}
              </button>
            ))}
          </div>

          {/* Search */}
          <input
            type="text"
            placeholder="🔍 Search..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            style={{
              flex: isMobile ? "1" : "0 0 300px",
              padding: "0.5rem 1rem",
              borderRadius: "6px",
              border: "1px solid #333",
              background: "rgba(0,0,0,0.3)",
              color: theme.colors.white,
              fontSize: "0.9rem",
            }}
          />
        </div>
      </div>

      {/* ✅ CLEAN CONTACTS LIST */}
      {currentContacts.length === 0 ? (
        <div
          style={{
            background: theme.gradients.navbarAlt1,
            padding: "3rem",
            borderRadius: "10px",
            textAlign: "center",
            color: theme.colors.lightGray,
            border: "1px dashed #333",
          }}
        >
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📭</div>
          <p>No contacts found</p>
        </div>
      ) : (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {currentContacts.map((contact) => (
              <div
                key={contact._id}
                style={{
                  background: theme.gradients.navbarAlt1,
                  padding: "1.25rem",
                  borderRadius: "10px",
                  border: `1px solid ${contact.status === "resolved" ? "#28a745" : "#FFA500"}`,
                  transition: "all 0.2s ease",
                }}
              >
                {/* ✅ COMPACT HEADER */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: "0.75rem",
                    flexWrap: "wrap",
                    gap: "0.5rem",
                  }}
                >
                  <div style={{ flex: 1, minWidth: "200px" }}>
                    <h3
                      style={{
                        color: theme.colors.secondary,
                        marginBottom: "0.5rem",
                        fontSize: isMobile ? "1rem" : "1.1rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                      }}
                    >
                      {contact.subject}
                      {contact.message.toLowerCase().includes("urgent") && (
                        <span style={{ fontSize: "1rem" }}>🚨</span>
                      )}
                    </h3>
                    <div
                      style={{
                        color: theme.colors.lightGray,
                        fontSize: "0.85rem",
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "0.75rem",
                      }}
                    >
                      <span>👤 {contact.name}</span>
                      <span>📧 {contact.email}</span>
                      <span>📅 {new Date(contact.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div
                    style={{
                      padding: "0.35rem 0.75rem",
                      borderRadius: "20px",
                      background: contact.status === "resolved" ? "#28a745" : "#FFA500",
                      color: "#fff",
                      fontSize: "0.75rem",
                      fontWeight: "bold",
                      textTransform: "uppercase",
                    }}
                  >
                    {contact.status}
                  </div>
                </div>

                {/* ✅ MESSAGE PREVIEW/FULL */}
                <div
                  style={{
                    background: "rgba(0,0,0,0.3)",
                    padding: "0.75rem",
                    borderRadius: "6px",
                    marginBottom: "0.75rem",
                    color: theme.colors.lightGray,
                    fontSize: "0.9rem",
                    lineHeight: "1.5",
                  }}
                >
                  {expandedContact === contact._id ? contact.message : truncateText(contact.message, 120)}
                  {contact.message.length > 120 && (
                    <button
                      onClick={() => setExpandedContact(expandedContact === contact._id ? null : contact._id)}
                      style={{
                        background: "none",
                        border: "none",
                        color: theme.colors.primary,
                        cursor: "pointer",
                        marginLeft: "0.5rem",
                        fontSize: "0.85rem",
                        textDecoration: "underline",
                      }}
                    >
                      {expandedContact === contact._id ? "Show less" : "Read more"}
                    </button>
                  )}
                </div>

                {/* ✅ ADMIN REPLY (Collapsed by default) */}
                {contact.adminReply && (
                  <div
                    style={{
                      background: "rgba(0, 119, 255, 0.1)",
                      border: "1px solid rgba(0, 119, 255, 0.3)",
                      padding: "0.75rem",
                      borderRadius: "6px",
                      marginBottom: "0.75rem",
                    }}
                  >
                    <div
                      style={{
                        color: "#0077ff",
                        fontWeight: "bold",
                        marginBottom: "0.5rem",
                        fontSize: "0.85rem",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span>✅ Admin Reply Sent</span>
                      <span style={{ fontSize: "0.75rem", fontWeight: "normal" }}>
                        {new Date(contact.repliedAt).toLocaleDateString()}
                      </span>
                    </div>
                    {expandedContact === contact._id && (
                      <div style={{ color: theme.colors.lightGray, fontSize: "0.85rem", whiteSpace: "pre-wrap" }}>
                        {contact.adminReply}
                      </div>
                    )}
                  </div>
                )}

                {/* ✅ ACTION BUTTONS */}
                <div
                  style={{
                    display: "flex",
                    gap: "0.5rem",
                    flexWrap: "wrap",
                  }}
                >
                  <button
                    onClick={() => setSelectedContact(contact)}
                    style={{
                      padding: "0.5rem 1rem",
                      background: theme.colors.secondary,
                      border: "none",
                      borderRadius: "6px",
                      color: "#fff",
                      cursor: "pointer",
                      fontSize: "0.85rem",
                      fontWeight: "500",
                    }}
                  >
                    💬 Reply
                  </button>

                  {contact.status === "pending" && (
                    <button
                      onClick={() => handleResolve(contact._id)}
                      style={{
                        padding: "0.5rem 1rem",
                        background: "#28a745",
                        border: "none",
                        borderRadius: "6px",
                        color: "#fff",
                        cursor: "pointer",
                        fontSize: "0.85rem",
                        fontWeight: "500",
                      }}
                    >
                      ✓ Resolve
                    </button>
                  )}

                  <button
                    onClick={() => handleDelete(contact._id)}
                    style={{
                      padding: "0.5rem 1rem",
                      background: "#dc3545",
                      border: "none",
                      borderRadius: "6px",
                      color: "#fff",
                      cursor: "pointer",
                      fontSize: "0.85rem",
                      fontWeight: "500",
                    }}
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* ✅ PAGINATION */}
          {totalPages > 1 && (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: "0.5rem",
                marginTop: "2rem",
                flexWrap: "wrap",
              }}
            >
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                style={{
                  padding: "0.5rem 1rem",
                  background: currentPage === 1 ? "#333" : theme.colors.primary,
                  border: "none",
                  borderRadius: "6px",
                  color: "#fff",
                  cursor: currentPage === 1 ? "not-allowed" : "pointer",
                  fontSize: "0.9rem",
                }}
              >
                ← Prev
              </button>

              <div style={{ color: theme.colors.lightGray, fontSize: "0.9rem" }}>
                Page {currentPage} of {totalPages}
              </div>

              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                style={{
                  padding: "0.5rem 1rem",
                  background: currentPage === totalPages ? "#333" : theme.colors.primary,
                  border: "none",
                  borderRadius: "6px",
                  color: "#fff",
                  cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                  fontSize: "0.9rem",
                }}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}

      {/* ✅ SIMPLIFIED REPLY MODAL */}
      {selectedContact && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.95)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "1rem",
            overflow: "auto",
          }}
          onClick={() => {
            setSelectedContact(null);
            setReplyMessage("");
            setSelectedTemplate(null);
            setSuggestedTemplates([]);
            setManualSelection("");
          }}
        >
          <div
            style={{
              background: theme.gradients.navbarAlt1,
              padding: isMobile ? "1.5rem" : "2rem",
              borderRadius: "12px",
              border: `2px solid ${theme.colors.primary}`,
              maxWidth: "800px",
              width: "95%",
              maxHeight: "90vh",
              overflow: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ marginBottom: "1.5rem", borderBottom: "1px solid #333", paddingBottom: "1rem" }}>
              <h2 style={{ color: theme.colors.secondary, marginBottom: "0.5rem", fontSize: isMobile ? "1.25rem" : "1.5rem" }}>
                🤖 Smart Reply System
              </h2>
              <p style={{ color: theme.colors.lightGray, fontSize: "0.9rem" }}>
                To: <strong>{selectedContact.name}</strong> ({selectedContact.email})
              </p>
            </div>

            {/* Original Message - Compact */}
            <div
              style={{
                background: "rgba(0,0,0,0.4)",
                padding: "1rem",
                borderRadius: "8px",
                marginBottom: "1.5rem",
                borderLeft: `3px solid ${theme.colors.primary}`,
              }}
            >
              <div style={{ fontSize: "0.85rem", color: theme.colors.lightGray, marginBottom: "0.5rem" }}>
                <strong>Subject:</strong> {selectedContact.subject}
              </div>
              <div style={{ fontSize: "0.85rem", color: theme.colors.lightGray }}>
                <strong>Message:</strong> {selectedContact.message}
              </div>
            </div>

            {/* ✅ AI Detection - Collapsible */}
            {suggestedTemplates.length > 0 && (
              <div
                style={{
                  background: "rgba(0, 255, 204, 0.05)",
                  border: "1px solid rgba(0, 255, 204, 0.3)",
                  borderRadius: "8px",
                  marginBottom: "1rem",
                  overflow: "hidden",
                }}
              >
                <button
                  onClick={() => setShowAISuggestions(!showAISuggestions)}
                  style={{
                    width: "100%",
                    padding: "0.75rem 1rem",
                    background: "rgba(0, 255, 204, 0.1)",
                    border: "none",
                    color: theme.colors.primary,
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: "0.9rem",
                    fontWeight: "bold",
                  }}
                >
                  <span>🤖 AI Detected: {replyTemplates[suggestedTemplates[0].type].template.title}</span>
                  <span>{showAISuggestions ? "▼" : "▶"}</span>
                </button>

                {showAISuggestions && (
                  <div style={{ padding: "1rem" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      {suggestedTemplates.slice(0, 3).map((match, index) => (
                        <button
                          key={match.type}
                          onClick={() => handleTemplateSwitch(match.type)}
                          style={{
                            padding: "0.75rem",
                            background: selectedTemplate === match.type ? "rgba(0, 255, 204, 0.2)" : "rgba(0,0,0,0.3)",
                            border: `1px solid ${selectedTemplate === match.type ? theme.colors.primary : "#333"}`,
                            borderRadius: "6px",
                            color: theme.colors.white,
                            cursor: "pointer",
                            textAlign: "left",
                            fontSize: "0.85rem",
                            transition: "all 0.2s ease",
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span>
                              {index === 0 && "🥇 "}
                              {index === 1 && "🥈 "}
                              {index === 2 && "🥉 "}
                              {match.template.title}
                            </span>
                            {selectedTemplate === match.type && <span>✓</span>}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ✅ Manual Selection - Collapsible */}
            <div
              style={{
                background: "rgba(255, 165, 0, 0.05)",
                border: "1px solid rgba(255, 165, 0, 0.3)",
                borderRadius: "8px",
                marginBottom: "1rem",
                overflow: "hidden",
              }}
            >
              <button
                onClick={() => setShowManualSelect(!showManualSelect)}
                style={{
                  width: "100%",
                  padding: "0.75rem 1rem",
                  background: "rgba(255, 165, 0, 0.1)",
                  border: "none",
                  color: "#FFA500",
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: "0.9rem",
                  fontWeight: "bold",
                }}
              >
                <span>🎯 Manual Template Selection</span>
                <span>{showManualSelect ? "▼" : "▶"}</span>
              </button>

              {showManualSelect && (
                <div style={{ padding: "1rem" }}>
                  <select
                    value={manualSelection}
                    onChange={handleManualSelection}
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      borderRadius: "6px",
                      border: "1px solid #333",
                      background: "#1a1a1a",
                      color: theme.colors.white,
                      fontSize: "0.9rem",
                      cursor: "pointer",
                    }}
                  >
                    <option value="">-- Select Problem Type --</option>
                    {problemCategories.map((category) => (
                      <optgroup key={category.category} label={category.category}>
                        {category.problems.map((problem) => (
                          <option key={problem.id} value={problem.id}>
                            {problem.name}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Quick Replies */}
            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", marginBottom: "0.5rem", color: theme.colors.lightGray, fontSize: "0.85rem" }}>
                ⚡ Quick Replies:
              </label>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                {quickReplies.map((quick) => (
                  <button
                    key={quick.label}
                    onClick={() => setReplyMessage(quick.text)}
                    style={{
                      padding: "0.4rem 0.75rem",
                      background: "rgba(0,0,0,0.3)",
                      border: "1px solid #333",
                      borderRadius: "6px",
                      color: theme.colors.white,
                      cursor: "pointer",
                      fontSize: "0.8rem",
                      transition: "all 0.2s ease",
                    }}
                  >
                    {quick.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Reply Textarea */}
            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", marginBottom: "0.5rem", color: theme.colors.lightGray, fontSize: "0.85rem" }}>
                📝 Your Reply:
              </label>
              <textarea
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder="Type your reply here..."
                style={{
                  width: "100%",
                  minHeight: "200px",
                  padding: "1rem",
                  borderRadius: "8px",
                  border: "1px solid #333",
                  background: "#1a1a1a",
                  color: theme.colors.white,
                  resize: "vertical",
                  fontFamily: theme.fonts.secondary,
                  fontSize: "0.9rem",
                  lineHeight: "1.6",
                }}
              />
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button
                onClick={handleSendReply}
                disabled={sendingReply}
                style={{
                  flex: 1,
                  padding: "0.75rem",
                  background: sendingReply ? "#666" : theme.colors.secondary,
                  border: "none",
                  borderRadius: "8px",
                  color: "#fff",
                  cursor: sendingReply ? "not-allowed" : "pointer",
                  fontSize: "1rem",
                  fontWeight: "bold",
                }}
              >
                {sendingReply ? "Sending..." : "📨 Send Reply"}
              </button>

              <button
                onClick={() => {
                  setSelectedContact(null);
                  setReplyMessage("");
                  setSelectedTemplate(null);
                  setSuggestedTemplates([]);
                  setManualSelection("");
                }}
                style={{
                  flex: 1,
                  padding: "0.75rem",
                  background: "#666",
                  border: "none",
                  borderRadius: "8px",
                  color: "#fff",
                  cursor: "pointer",
                  fontSize: "1rem",
                  fontWeight: "bold",
                }}
              >
                ✕ Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageContacts;