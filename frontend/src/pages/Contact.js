import React, { useState } from "react";
import theme from "../theme";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";

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

  // ✅ COMMON PROBLEMS WITH INSTANT SOLUTIONS
  const commonProblems = [
    {
      id: "registration",
      title: "How do I register for a tournament?",
      category: "Tournament",
      icon: "🏆",
      solution: `
        <h3 style="color: #00ffcc; margin-bottom: 1rem;">Tournament Registration Guide</h3>
        <div style="line-height: 1.8;">
          <p><strong>Step-by-step process:</strong></p>
          <ol style="padding-left: 1.5rem; margin: 1rem 0;">
            <li>Log in to your PLAYZONE account</li>
            <li>Navigate to <strong>Tournaments</strong> section from the menu</li>
            <li>Browse available tournaments or use filters (Game, Date, Entry Fee)</li>
            <li>Click on the tournament you want to join</li>
            <li>Click <strong>"Register"</strong> button</li>
            <li>Enter your <strong>Team Name</strong></li>
            <li>Choose payment method:
              <ul style="margin: 0.5rem 0;">
                <li><strong>Wallet</strong> - Instant registration (if sufficient balance)</li>
                <li><strong>UPI/QR Code</strong> - Pay via payment gateway</li>
              </ul>
            </li>
            <li>Confirm registration</li>
            <li>You'll receive confirmation email with tournament details</li>
          </ol>
          
          <div style="background: rgba(255,165,0,0.1); border-left: 3px solid #FFA500; padding: 1rem; margin: 1rem 0; border-radius: 4px;">
            <strong>⚠️ Important:</strong>
            <ul style="margin: 0.5rem 0; padding-left: 1.5rem;">
              <li>Registration closes when slots are full or 30 minutes before tournament starts</li>
              <li>Ensure you have sufficient wallet balance or valid payment method</li>
              <li>Room ID and Password will be sent 30 minutes before tournament time</li>
            </ul>
          </div>

          <p style="margin-top: 1rem;"><strong>💡 Pro Tip:</strong> Add funds to your wallet beforehand for instant registration!</p>
        </div>
      `,
    },
    {
      id: "payment_failed",
      title: "My payment failed but money was deducted",
      category: "Payment",
      icon: "💳",
      solution: `
        <h3 style="color: #00ffcc; margin-bottom: 1rem;">Payment Failure Resolution</h3>
        <div style="line-height: 1.8;">
          <p><strong>Don't worry! Here's what happens:</strong></p>
          
          <div style="background: rgba(40,167,69,0.1); border-left: 3px solid #28a745; padding: 1rem; margin: 1rem 0; border-radius: 4px;">
            <strong>✅ Automatic Refund Process:</strong>
            <ul style="margin: 0.5rem 0; padding-left: 1.5rem;">
              <li><strong>Bank Hold:</strong> Your bank temporarily holds the amount</li>
              <li><strong>Auto-Release:</strong> If payment fails, bank releases it within 24-48 hours</li>
              <li><strong>Direct Refund:</strong> Money returns to your original payment source</li>
            </ul>
          </div>

          <p><strong>Check your payment status:</strong></p>
          <ol style="padding-left: 1.5rem; margin: 1rem 0;">
            <li>Go to <strong>Dashboard → Wallet</strong></li>
            <li>Click <strong>Transaction History</strong></li>
            <li>Look for the failed transaction</li>
            <li>Status will show "Failed" or "Pending Refund"</li>
          </ol>

          <p><strong>If money not refunded after 48 hours:</strong></p>
          <ol style="padding-left: 1.5rem; margin: 1rem 0;">
            <li>Take screenshot of bank deduction</li>
            <li>Note the Transaction ID</li>
            <li>Contact us via form below with:
              <ul style="margin: 0.5rem 0;">
                <li>Transaction ID</li>
                <li>Amount deducted</li>
                <li>Date & time of transaction</li>
                <li>Screenshot of bank statement</li>
              </ul>
            </li>
          </ol>

          <div style="background: rgba(0,119,255,0.1); border-left: 3px solid #0077ff; padding: 1rem; margin: 1rem 0; border-radius: 4px;">
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
        <h3 style="color: #00ffcc; margin-bottom: 1rem;">Room Credentials Not Received</h3>
        <div style="line-height: 1.8;">
          <p><strong>Room ID and Password are sent 30 minutes before tournament starts.</strong></p>

          <p><strong>Quick Checks:</strong></p>
          <ol style="padding-left: 1.5rem; margin: 1rem 0;">
            <li><strong>Check Spam/Junk Folder</strong> - Emails might be filtered</li>
            <li><strong>Verify Email Address:</strong>
              <ul style="margin: 0.5rem 0;">
                <li>Go to Profile → Settings</li>
                <li>Check if email is correct</li>
                <li>Update if needed</li>
              </ul>
            </li>
            <li><strong>Check Tournament Status:</strong>
              <ul style="margin: 0.5rem 0;">
                <li>Go to Dashboard → My Tournaments</li>
                <li>Verify payment status is "Paid"</li>
                <li>Check if tournament is still "Upcoming"</li>
              </ul>
            </li>
            <li><strong>Timing:</strong> Credentials are sent exactly 30 minutes before start time</li>
          </ol>

          <div style="background: rgba(255,165,0,0.1); border-left: 3px solid #FFA500; padding: 1rem; margin: 1rem 0; border-radius: 4px;">
            <strong>⏰ Still Not Received?</strong>
            <p style="margin: 0.5rem 0;">If you don't receive credentials 15 minutes before tournament:</p>
            <ol style="padding-left: 1.5rem; margin: 0.5rem 0;">
              <li>Use the contact form below</li>
              <li>Select subject: "Urgent - Room Credentials Missing"</li>
              <li>Provide Tournament ID</li>
              <li>We'll send them immediately via WhatsApp/Email</li>
            </ol>
          </div>

          <p><strong>💡 Pro Tip:</strong> Add <code style="background: rgba(0,0,0,0.3); padding: 2px 6px; border-radius: 3px;">omgtms2529@gmail.com</code> to your contacts to prevent spam filtering!</p>
        </div>
      `,
    },
    {
      id: "forgot_password",
      title: "I forgot my password / Can't login",
      category: "Account",
      icon: "🔐",
      solution: `
        <h3 style="color: #00ffcc; margin-bottom: 1rem;">Password Reset & Login Help</h3>
        <div style="line-height: 1.8;">
          <p><strong>Reset Your Password:</strong></p>
          <ol style="padding-left: 1.5rem; margin: 1rem 0;">
            <li>Go to <strong>Login Page</strong></li>
            <li>Click <strong>"Forgot Password?"</strong> link</li>
            <li>Enter your registered <strong>Email Address</strong></li>
            <li>Click <strong>"Send OTP"</strong></li>
            <li>Check your email for 6-digit OTP (check spam folder too)</li>
            <li>Enter OTP on the verification page</li>
            <li>Create a <strong>new password</strong> (minimum 6 characters)</li>
            <li>Login with your new password</li>
          </ol>

          <div style="background: rgba(255,0,0,0.1); border-left: 3px solid #dc3545; padding: 1rem; margin: 1rem 0; border-radius: 4px;">
            <strong>⚠️ Common Login Issues:</strong>
            <ul style="padding-left: 1.5rem; margin: 0.5rem 0;">
              <li><strong>Wrong Email/Username:</strong> Use the exact email/username you registered with</li>
              <li><strong>Case Sensitive:</strong> Password is case-sensitive (check Caps Lock)</li>
              <li><strong>Browser Cache:</strong> Clear cookies and try again</li>
              <li><strong>Multiple Accounts:</strong> If you have multiple accounts, try other email addresses</li>
            </ul>
          </div>

          <p><strong>Still Can't Access Your Account?</strong></p>
          <p style="margin: 0.5rem 0;">Contact us with:</p>
          <ul style="padding-left: 1.5rem; margin: 0.5rem 0;">
            <li>Registered email address</li>
            <li>Username (if you remember)</li>
            <li>Approximate registration date</li>
            <li>Last successful login date</li>
          </ul>

          <p style="margin-top: 1rem;"><strong>💡 Security Tip:</strong> Use a password manager to remember strong passwords!</p>
        </div>
      `,
    },
    {
      id: "wallet_deposit",
      title: "How do I add money to my wallet?",
      category: "Payment",
      icon: "💰",
      solution: `
        <h3 style="color: #00ffcc; margin-bottom: 1rem;">Wallet Deposit Guide</h3>
        <div style="line-height: 1.8;">
          <p><strong>Adding Money to Your Wallet:</strong></p>
          <ol style="padding-left: 1.5rem; margin: 1rem 0;">
            <li>Login to your account</li>
            <li>Go to <strong>Dashboard → Wallet</strong></li>
            <li>Click <strong>"Add Money"</strong> or <strong>"Deposit"</strong> button</li>
            <li>Enter the amount you want to add (minimum ₹10)</li>
            <li>Choose payment method:
              <ul style="margin: 0.5rem 0;">
                <li><strong>UPI</strong> - PhonePe, Google Pay, Paytm, etc.</li>
                <li><strong>QR Code</strong> - Scan and pay</li>
                <li><strong>Net Banking</strong> - Direct bank transfer</li>
              </ul>
            </li>
            <li>Complete the payment</li>
            <li>Money will be <strong>instantly credited</strong> to your wallet</li>
          </ol>

          <div style="background: rgba(40,167,69,0.1); border-left: 3px solid #28a745; padding: 1rem; margin: 1rem 0; border-radius: 4px;">
            <strong>✅ Benefits of Using Wallet:</strong>
            <ul style="padding-left: 1.5rem; margin: 0.5rem 0;">
              <li><strong>Instant Registration:</strong> No payment delays during tournament signup</li>
              <li><strong>Quick Withdrawals:</strong> Withdraw winnings anytime</li>
              <li><strong>No Repeated Payments:</strong> Add once, use for multiple tournaments</li>
              <li><strong>Secure:</strong> Your money is safely stored in your account</li>
            </ul>
          </div>

          <p><strong>Checking Wallet Balance:</strong></p>
          <ul style="padding-left: 1.5rem; margin: 0.5rem 0;">
            <li>Visible on Dashboard (top right)</li>
            <li>Check Transaction History for all deposits/withdrawals</li>
          </ul>

          <p style="margin-top: 1rem;"><strong>💡 Smart Tip:</strong> Add ₹500-1000 to participate in multiple tournaments without repeated payments!</p>
        </div>
      `,
    },
    {
      id: "withdraw_winnings",
      title: "How do I withdraw my winnings?",
      category: "Payment",
      icon: "🏆",
      solution: `
        <h3 style="color: #00ffcc; margin-bottom: 1rem;">Withdraw Your Winnings</h3>
        <div style="line-height: 1.8;">
          <p><strong>Prize Distribution Process:</strong></p>
          <ol style="padding-left: 1.5rem; margin: 1rem 0;">
            <li><strong>Tournament Ends</strong> - Admin verifies results (24 hours)</li>
            <li><strong>Results Published</strong> - Winners announced</li>
            <li><strong>Auto-Credit</strong> - Prize money automatically added to your wallet</li>
            <li><strong>Email Notification</strong> - You receive confirmation email</li>
          </ol>

          <p><strong>Withdrawing Money from Wallet:</strong></p>
          <ol style="padding-left: 1.5rem; margin: 1rem 0;">
            <li>Go to <strong>Dashboard → Wallet</strong></li>
            <li>Click <strong>"Withdraw"</strong> button</li>
            <li>Enter withdrawal amount:
              <ul style="margin: 0.5rem 0;">
                <li><strong>Minimum:</strong> ₹100</li>
                <li><strong>Maximum:</strong> Your available balance</li>
              </ul>
            </li>
            <li>Provide bank account details:
              <ul style="margin: 0.5rem 0;">
                <li>Account Holder Name</li>
                <li>Account Number</li>
                <li>IFSC Code</li>
                <li>Bank Name</li>
              </ul>
            </li>
            <li>Submit withdrawal request</li>
            <li>Money transferred within <strong>24-48 hours</strong></li>
          </ol>

          <div style="background: rgba(0,119,255,0.1); border-left: 3px solid #0077ff; padding: 1rem; margin: 1rem 0; border-radius: 4px;">
            <strong>💵 Withdrawal Timeline:</strong>
            <ul style="padding-left: 1.5rem; margin: 0.5rem 0;">
              <li><strong>Working Days:</strong> 24-48 hours</li>
              <li><strong>Weekends/Holidays:</strong> May take up to 72 hours</li>
              <li><strong>First Withdrawal:</strong> May require KYC verification</li>
            </ul>
          </div>

          <p><strong>Track Withdrawal Status:</strong></p>
          <p style="margin: 0.5rem 0;">Dashboard → Wallet → Transaction History → Look for "Withdraw" entries</p>

          <p style="margin-top: 1rem;"><strong>💡 Note:</strong> Keep some balance in wallet for future tournament entries!</p>
        </div>
      `,
    },
    {
      id: "tournament_cancelled",
      title: "Tournament was cancelled - What about my money?",
      category: "Tournament",
      icon: "❌",
      solution: `
        <h3 style="color: #00ffcc; margin-bottom: 1rem;">Tournament Cancellation & Refund</h3>
        <div style="line-height: 1.8;">
          <p><strong>If Admin Cancels Tournament:</strong></p>
          <div style="background: rgba(40,167,69,0.1); border-left: 3px solid #28a745; padding: 1rem; margin: 1rem 0; border-radius: 4px;">
            <strong>✅ Full Automatic Refund</strong>
            <ul style="padding-left: 1.5rem; margin: 0.5rem 0;">
              <li><strong>100% refund</strong> - No deductions</li>
              <li><strong>Instant credit</strong> to your wallet</li>
              <li><strong>Email notification</strong> sent immediately</li>
              <li>You can use refunded amount for other tournaments</li>
            </ul>
          </div>

          <p><strong>If You Want to Cancel Registration:</strong></p>
          <div style="background: rgba(255,165,0,0.1); border-left: 3px solid #FFA500; padding: 1rem; margin: 1rem 0; border-radius: 4px;">
            <strong>⏰ Time-Based Refund Policy:</strong>
            <ul style="padding-left: 1.5rem; margin: 0.5rem 0;">
              <li><strong>24+ hours before:</strong> 100% refund</li>
              <li><strong>Within 24 hours:</strong> 95% refund (5% processing fee)</li>
              <li><strong>After tournament starts:</strong> No refund</li>
            </ul>
          </div>

          <p><strong>How to Cancel Your Registration:</strong></p>
          <ol style="padding-left: 1.5rem; margin: 1rem 0;">
            <li>Go to <strong>Dashboard → My Tournaments</strong></li>
            <li>Find the tournament you want to cancel</li>
            <li>Click <strong>"Cancel Registration"</strong></li>
            <li>Confirm cancellation</li>
            <li>Refund processed instantly to wallet</li>
          </ol>

          <p><strong>Refund Processing Time:</strong></p>
          <ul style="padding-left: 1.5rem; margin: 0.5rem 0;">
            <li><strong>To Wallet:</strong> Instant</li>
            <li><strong>To Bank:</strong> 5-7 business days (if you paid via UPI/Card)</li>
          </ul>

          <p style="margin-top: 1rem;"><strong>💡 Tip:</strong> Cancel early to get full refund if your plans change!</p>
        </div>
      `,
    },
    {
      id: "technical_issue",
      title: "App/Website not working properly",
      category: "Technical",
      icon: "🔧",
      solution: `
        <h3 style="color: #00ffcc; margin-bottom: 1rem;">Technical Troubleshooting</h3>
        <div style="line-height: 1.8;">
          <p><strong>Quick Fixes (Try these first):</strong></p>
          
          <div style="background: rgba(0,119,255,0.1); border-left: 3px solid #0077ff; padding: 1rem; margin: 1rem 0; border-radius: 4px;">
            <strong>🌐 Website Issues:</strong>
            <ol style="padding-left: 1.5rem; margin: 0.5rem 0;">
              <li><strong>Clear Cache & Cookies:</strong>
                <ul style="margin: 0.3rem 0;">
                  <li>Press <code style="background: rgba(0,0,0,0.3); padding: 2px 6px; border-radius: 3px;">Ctrl + Shift + Delete</code> (Windows)</li>
                  <li>Press <code style="background: rgba(0,0,0,0.3); padding: 2px 6px; border-radius: 3px;">Cmd + Shift + Delete</code> (Mac)</li>
                  <li>Select "Cookies" and "Cached images"</li>
                  <li>Click "Clear Data"</li>
                </ul>
              </li>
              <li><strong>Try Different Browser:</strong> Chrome, Firefox, or Edge (latest version)</li>
              <li><strong>Disable Ad-Blockers:</strong> Some extensions block website features</li>
              <li><strong>Update Browser:</strong> Use the latest version</li>
              <li><strong>Try Incognito Mode:</strong> <code style="background: rgba(0,0,0,0.3); padding: 2px 6px; border-radius: 3px;">Ctrl + Shift + N</code></li>
            </ol>
          </div>

          <div style="background: rgba(40,167,69,0.1); border-left: 3px solid #28a745; padding: 1rem; margin: 1rem 0; border-radius: 4px;">
            <strong>📱 Mobile App Issues:</strong>
            <ol style="padding-left: 1.5rem; margin: 0.5rem 0;">
              <li><strong>Force Close & Reopen</strong> the app</li>
              <li><strong>Clear App Cache:</strong>
                <ul style="margin: 0.3rem 0;">
                  <li>Settings → Apps → PLAYZONE → Storage → Clear Cache</li>
                </ul>
              </li>
              <li><strong>Update App</strong> to latest version (Play Store/App Store)</li>
              <li><strong>Reinstall App</strong> if issue persists</li>
              <li><strong>Check Internet Connection:</strong> Use WiFi or strong mobile data</li>
            </ol>
          </div>

          <p><strong>Common Error Solutions:</strong></p>
          <ul style="padding-left: 1.5rem; margin: 0.5rem 0;">
            <li><strong>"Page Not Loading":</strong> Check internet connection, refresh page</li>
            <li><strong>"Login Failed":</strong> Clear cookies, reset password</li>
            <li><strong>"Payment Not Working":</strong> Try different payment method</li>
            <li><strong>"Image Not Loading":</strong> Clear cache, check network speed</li>
          </ul>

          <div style="background: rgba(255,0,0,0.1); border-left: 3px solid #dc3545; padding: 1rem; margin: 1rem 0; border-radius: 4px;">
            <strong>🚨 During Live Tournament:</strong>
            <p style="margin: 0.5rem 0;">If you face issues during an active tournament:</p>
            <ol style="padding-left: 1.5rem; margin: 0.5rem 0;">
              <li>Take screenshot of the error</li>
              <li>Note exact time of issue</li>
              <li>Contact us immediately via form below</li>
              <li>Select "URGENT - Live Tournament Issue"</li>
              <li>We'll assist you in real-time</li>
            </ol>
          </div>

          <p style="margin-top: 1rem;"><strong>💡 Still Not Working?</strong> Contact us with:
            <ul style="padding-left: 1.5rem; margin: 0.5rem 0;">
              <li>Device type (Phone/PC)</li>
              <li>Browser/App version</li>
              <li>Screenshot of error</li>
              <li>What you were trying to do</li>
            </ul>
          </p>
        </div>
      `,
    },
    {
      id: "game_rules",
      title: "What are the tournament rules?",
      category: "Tournament",
      icon: "📜",
      solution: `
        <h3 style="color: #00ffcc; margin-bottom: 1rem;">Tournament Rules & Guidelines</h3>
        <div style="line-height: 1.8;">
          <div style="background: rgba(255,165,0,0.1); border-left: 3px solid #FFA500; padding: 1rem; margin: 1rem 0; border-radius: 4px;">
            <strong>⚠️ General Rules (All Tournaments):</strong>
            <ol style="padding-left: 1.5rem; margin: 0.5rem 0;">
              <li><strong>Punctuality:</strong> Be online 10 minutes before start time</li>
              <li><strong>Late Entry:</strong> NOT allowed - you'll lose entry fee</li>
              <li><strong>Room Credentials:</strong> Sent 30 minutes before via email</li>
              <li><strong>Fair Play:</strong> Absolutely NO cheating, hacking, or exploits</li>
              <li><strong>Verification:</strong> May require screenshots/screen recording</li>
              <li><strong>Results:</strong> Published within 24 hours after tournament</li>
            </ol>
          </div>

          <p><strong>Allowed:</strong></p>
          <ul style="padding-left: 1.5rem; margin: 0.5rem 0; color: #28a745;">
            <li>✅ Official game version from Play Store/App Store</li>
            <li>✅ In-game purchased skins/characters</li>
            <li>✅ Voice chat with teammates (squad mode)</li>
            <li>✅ Screen recording for proof</li>
          </ul>

          <p><strong>Strictly Prohibited:</strong></p>
          <ul style="padding-left: 1.5rem; margin: 0.5rem 0; color: #dc3545;">
            <li>❌ Mod APK or hacked versions</li>
            <li>❌ Emulators (unless specifically allowed)</li>
            <li>❌ Aimbot, wallhack, speed hack, or any cheats</li>
            <li>❌ Teaming with opponents (in solo mode)</li>
            <li>❌ Abusive language or harassment</li>
            <li>❌ Multiple accounts in same tournament</li>
          </ul>

          <div style="background: rgba(220,53,69,0.1); border-left: 3px solid #dc3545; padding: 1rem; margin: 1rem 0; border-radius: 4px;">
            <strong>🚫 Violations & Penalties:</strong>
            <ul style="padding-left: 1.5rem; margin: 0.5rem 0;">
              <li><strong>First Offense:</strong> Disqualification from tournament</li>
              <li><strong>Second Offense:</strong> Account suspension (30 days)</li>
              <li><strong>Third Offense:</strong> Permanent ban from platform</li>
              <li><strong>Serious Violations:</strong> Immediate permanent ban + legal action</li>
            </ul>
          </div>

          <p><strong>Game-Specific Rules:</strong></p>
          <p style="margin: 0.5rem 0;">Each tournament page shows specific rules like:</p>
          <ul style="padding-left: 1.5rem; margin: 0.5rem 0;">
            <li>Allowed maps</li>
            <li>Game mode (Solo/Duo/Squad)</li>
            <li>Server region</li>
            <li>TPP or FPP mode</li>
            <li>Weapons restrictions (if any)</li>
          </ul>

          <div style="background: rgba(40,167,69,0.1); border-left: 3px solid #28a745; padding: 1rem; margin: 1rem 0; border-radius: 4px;">
            <strong>🏆 Winning Criteria:</strong>
            <ul style="padding-left: 1.5rem; margin: 0.5rem 0;">
              <li><strong>Battle Royale:</strong> Based on final rank + kills</li>
              <li><strong>TDM:</strong> Highest kills in match duration</li>
              <li><strong>Tiebreaker:</strong> Most kills, then survival time</li>
            </ul>
          </div>

          <p style="margin-top: 1rem;"><strong>💡 Pro Tip:</strong> Always read tournament-specific rules on the tournament detail page before registering!</p>
        </div>
      `,
    },
    {
      id: "other",
      title: "My problem is not listed here",
      category: "Other",
      icon: "❓",
      solution: `
        <h3 style="color: #00ffcc; margin-bottom: 1rem;">We're Here to Help!</h3>
        <div style="line-height: 1.8;">
          <p>Looks like your issue is unique. No worries - our support team is ready to assist you personally!</p>
          
          <div style="background: rgba(0,119,255,0.1); border-left: 3px solid #0077ff; padding: 1rem; margin: 1rem 0; border-radius: 4px;">
            <strong>📧 Contact Support:</strong>
            <p style="margin: 0.5rem 0;">Use the contact form below and provide:</p>
            <ul style="padding-left: 1.5rem; margin: 0.5rem 0;">
              <li><strong>Detailed description</strong> of your issue</li>
              <li><strong>Screenshots</strong> if applicable</li>
              <li><strong>Tournament ID</strong> (if tournament-related)</li>
              <li><strong>Transaction ID</strong> (if payment-related)</li>
              <li><strong>Error messages</strong> (exact text)</li>
              <li><strong>Device/Browser</strong> information</li>
            </ul>
          </div>

          <p><strong>📞 Alternative Contact Methods:</strong></p>
          <ul style="padding-left: 1.5rem; margin: 0.5rem 0;">
            <li><strong>Email:</strong> omgtms2529@gmail.com</li>
            <li><strong>Response Time:</strong> Within 24-48 hours</li>
            <li><strong>Urgent Issues:</strong> Mark subject as "URGENT - [Your Issue]"</li>
          </ul>

          <div style="background: rgba(40,167,69,0.1); border-left: 3px solid #28a745; padding: 1rem; margin: 1rem 0; border-radius: 4px;">
            <strong>⚡ Priority Support For:</strong>
            <ul style="padding-left: 1.5rem; margin: 0.5rem 0;">
              <li>Live tournament issues (handled immediately)</li>
              <li>Payment failures (within 12 hours)</li>
              <li>Account security concerns (within 6 hours)</li>
            </ul>
          </div>

          <p style="margin-top: 1.5rem;"><strong>👇 Scroll down to fill the contact form</strong></p>
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
      const response = await axios.post("http://localhost:5000/contact/submit", formData);

      toast.success(response.data.message);

      // Reset form
      setFormData({
        name: "",
        email: "",
        subject: "",
        message: "",
      });
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

  const styles = {
    container: {
      position: "relative",
      minHeight: "100vh",
      background: theme.gradients.background,
      color: theme.colors.white,
      fontFamily: theme.fonts.primary,
      paddingBottom: "50px",
      transition: theme.animations.transition,
    },
    contentContainer: {
      maxWidth: "1200px",
      margin: "0 auto",
      padding: theme.spacing.sectionPadding,
    },
    header: {
      background: theme.gradients.secondaryButton,
      padding: "20px",
      borderRadius: "12px",
      marginBottom: "30px",
      boxShadow: theme.shadows.card,
      border: theme.borders.card,
    },
    title: {
      color: theme.colors.primary,
      textAlign: "center",
      fontSize: theme.sizes.sectionTitleFontSize,
      marginBottom: "10px",
      textShadow: theme.shadows.text,
    },
    section: {
      background: theme.gradients.secondaryButton,
      padding: "25px",
      borderRadius: "12px",
      marginBottom: "25px",
      boxShadow: theme.shadows.card,
      border: theme.borders.card,
    },
    sectionTitle: {
      color: theme.colors.secondary,
      marginBottom: "15px",
      fontSize: "1.5rem",
      textShadow: theme.shadows.text,
      fontFamily: theme.fonts.secondary,
    },
    text: {
      color: theme.colors.lightGray,
      lineHeight: "1.7",
      marginBottom: "15px",
      fontFamily: theme.fonts.secondary,
    },
    problemCard: {
      background: "rgba(0,0,0,0.3)",
      padding: "15px",
      borderRadius: "8px",
      marginBottom: "15px",
      cursor: "pointer",
      transition: "all 0.3s ease",
      border: "2px solid transparent",
      display: "flex",
      alignItems: "center",
      gap: "15px",
    },
    problemCardActive: {
      background: "rgba(0, 255, 204, 0.1)",
      border: `2px solid ${theme.colors.primary}`,
      boxShadow: `0 0 15px ${theme.colors.primary}40`,
    },
    categoryBadge: {
      display: "inline-block",
      padding: "3px 10px",
      borderRadius: "12px",
      fontSize: "0.75rem",
      fontWeight: "bold",
      marginLeft: "10px",
    },
    solutionBox: {
      background: "rgba(0,0,0,0.5)",
      padding: "20px",
      borderRadius: "8px",
      marginTop: "15px",
      border: `1px solid ${theme.colors.primary}`,
      animation: "fadeIn 0.3s ease-in",
    },
    contactInfo: {
      display: "flex",
      flexDirection: "column",
      gap: "15px",
      marginTop: "10px",
    },
    contactItem: {
      display: "flex",
      alignItems: "center",
      gap: "10px",
    },
    link: {
      color: theme.colors.primary,
      textDecoration: "none",
      transition: theme.animations.transition,
    },
    form: {
      display: "flex",
      flexDirection: "column",
      gap: "15px",
    },
    input: {
      padding: "12px",
      borderRadius: "8px",
      border: `1px solid ${theme.colors.border}`,
      background: theme.colors.cardBg,
      color: theme.colors.white,
      fontSize: "1rem",
      fontFamily: theme.fonts.secondary,
      outline: "none",
      transition: theme.animations.transition,
    },
    textarea: {
      padding: "12px",
      borderRadius: "8px",
      border: `1px solid ${theme.colors.border}`,
      background: theme.colors.cardBg,
      color: theme.colors.white,
      minHeight: "150px",
      fontSize: "1rem",
      fontFamily: theme.fonts.secondary,
      outline: "none",
      resize: "vertical",
      transition: theme.animations.transition,
    },
    button: {
      padding: "12px",
      borderRadius: "8px",
      border: "none",
      background: loading ? "#666" : theme.gradients.primaryButton,
      color: theme.colors.white,
      cursor: loading ? "not-allowed" : "pointer",
      fontWeight: "bold",
      textTransform: "uppercase",
      fontFamily: theme.fonts.primary,
      boxShadow: theme.shadows.button,
      transition: theme.animations.transition,
      opacity: loading ? 0.7 : 1,
    },
  };

  // Category colors
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
    <div style={styles.container}>
      <Toaster position="top-right" reverseOrder={false} />

      <div style={styles.contentContainer}>
        {/* Header */}
        <div style={styles.header}>
          <h1 style={styles.title}>Help & Support Center</h1>
          <p style={{ ...styles.text, textAlign: "center", marginBottom: 0 }}>
            Find instant solutions to common problems or contact our support team
          </p>
        </div>

        {/* Quick Solutions Section */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>🔍 Find Your Solution Instantly</h2>
          <p style={styles.text}>
            Select your problem below to get immediate help. Most issues can be resolved in seconds!
          </p>

          {/* Problems List */}
          <div style={{ marginTop: "20px" }}>
            {commonProblems.map((problem) => (
              <div key={problem.id}>
                <div
                  style={{
                    ...styles.problemCard,
                    ...(selectedProblem === problem.id ? styles.problemCardActive : {}),
                  }}
                  onClick={() => handleProblemSelect(problem.id)}
                >
                  <div style={{ fontSize: "2rem" }}>{problem.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: "bold", fontSize: "1.1rem", marginBottom: "5px" }}>
                      {problem.title}
                      <span
                        style={{
                          ...styles.categoryBadge,
                          background: getCategoryColor(problem.category),
                        }}
                      >
                        {problem.category}
                      </span>
                    </div>
                  </div>
                  <div style={{ fontSize: "1.5rem", color: theme.colors.primary }}>
                    {selectedProblem === problem.id ? "▼" : "▶"}
                  </div>
                </div>

                {/* Solution Display */}
                {selectedProblem === problem.id && (
                  <div style={styles.solutionBox}>
                    <div dangerouslySetInnerHTML={{ __html: problem.solution }} />
                    
                    {problem.id === "other" && (
                      <button
                        onClick={() => setShowContactForm(true)}
                        style={{
                          ...styles.button,
                          marginTop: "20px",
                          width: "100%",
                        }}
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
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>📞 Contact Information</h2>
          <p style={styles.text}>
            Still need help? We're available 24/7 for tournament-related emergencies.
          </p>

          <div style={styles.contactInfo}>
            <div style={styles.contactItem}>
              <span style={styles.text}>📧 Email:</span>
              <a href="mailto:omgtms2529@gmail.com" style={styles.link}>
                omgtms2529@gmail.com
              </a>
            </div>
            <div style={styles.contactItem}>
              <span style={styles.text}>⏰ Tournament Support:</span>
              <span style={styles.text}>24/7 Real-time assistance</span>
            </div>
            <div style={styles.contactItem}>
              <span style={styles.text}>📬 General Inquiries:</span>
              <span style={styles.text}>Response within 24-48 hours</span>
            </div>
            <div style={styles.contactItem}>
              <span style={styles.text}>🚨 Payment Issues:</span>
              <span style={styles.text}>Priority response within 12 hours</span>
            </div>
            <div style={styles.contactItem}>
              <span style={styles.text}>📍 Location:</span>
              <span style={styles.text}>Mumbai, India</span>
            </div>
          </div>
        </div>

        {/* Contact Form Section - Collapsible */}
        {!showContactForm ? (
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>💬 Still Need Help?</h2>
            <p style={styles.text}>
              If the solutions above didn't help, click below to contact our support team directly.
            </p>
            <button
              onClick={() => setShowContactForm(true)}
              style={{
                ...styles.button,
                width: "100%",
              }}
            >
              📧 Contact Support Team
            </button>
          </div>
        ) : (
          <div style={styles.section}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
              <h2 style={{ ...styles.sectionTitle, marginBottom: 0 }}>Send Us a Message</h2>
              <button
                onClick={() => setShowContactForm(false)}
                style={{
                  background: "transparent",
                  border: `1px solid ${theme.colors.primary}`,
                  color: theme.colors.primary,
                  padding: "8px 16px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                ✖ Close Form
              </button>
            </div>
            <p style={styles.text}>
              Fill out the form below and we'll get back to you as soon as possible.
            </p>
            <form style={styles.form} onSubmit={handleSubmit}>
              <input
                style={styles.input}
                type="text"
                name="name"
                placeholder="Your Name *"
                value={formData.name}
                onChange={handleChange}
                required
              />
              <input
                style={styles.input}
                type="email"
                name="email"
                placeholder="Your Email *"
                value={formData.email}
                onChange={handleChange}
                required
              />
              <select
                style={styles.input}
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
                style={styles.textarea}
                name="message"
                placeholder="Describe your issue in detail. Include Tournament ID, Transaction ID, error messages, or any relevant information *"
                value={formData.message}
                onChange={handleChange}
                required
              />
              <div style={{
                background: "rgba(0,119,255,0.1)",
                padding: "12px",
                borderRadius: "6px",
                fontSize: "0.9rem",
                color: theme.colors.lightGray,
              }}>
                💡 <strong>Tip:</strong> The more details you provide (screenshots, IDs, exact error messages), 
                the faster we can resolve your issue!
              </div>
              <button style={styles.button} type="submit" disabled={loading}>
                {loading ? "Sending..." : "📨 Send Message"}
              </button>
            </form>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default Contact;
