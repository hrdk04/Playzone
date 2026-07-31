import React from 'react';
import './Terms.css';

const Terms = () => {
  return (
    <div className="terms-page-container">
      <div className="terms-content">
        {/* Header */}
        <div className="terms-header">
          <span className="terms-badge">⚡ Legal Terms</span>
          <h1 className="terms-title">Terms & Conditions</h1>
          <p className="terms-subtitle">Last Updated: July 2026</p>
        </div>

        {/* Introduction */}
        <div className="terms-section">
          <h2 className="section-title">1. Acceptance of Terms</h2>
          <p className="terms-text">
            Welcome to PLAYZONE, India's premier e-sports tournament platform (the "Service"). By accessing or using our Service, you agree to comply with and be bound by these Terms and Conditions. Please read them carefully before participating in any tournaments.
          </p>
          <p className="terms-text">
            By using our Service, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions. If you do not agree to these terms, you must not use our Service.
          </p>
        </div>

        {/* Eligibility */}
        <div className="terms-section">
          <h2 className="section-title">2. Eligibility Requirements</h2>
          <p className="terms-text">
            You must be at least <strong>18 years old</strong> to use our Service. By using the Service, you represent and warrant that you meet this eligibility requirement. If you are using the Service on behalf of a company or organization, you represent that you have the authority to bind that entity to these Terms.
          </p>
          <p className="terms-text">
            <strong>Additional Requirements:</strong>
          </p>
          <ul className="terms-list">
            <li>Valid government-issued ID may be required for prize withdrawals</li>
            <li>Indian residents only (for prize distribution compliance)</li>
            <li>Valid email address and mobile number for account verification</li>
          </ul>
        </div>

        {/* User Accounts */}
        <div className="terms-section">
          <h2 className="section-title">3. User Accounts & Security</h2>
          <p className="terms-text">
            To participate in tournaments, you must create an account. You agree to provide accurate, current, and complete information during registration. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
          </p>
          <p className="terms-text">
            <strong>Account Responsibilities:</strong>
          </p>
          <ul className="terms-list">
            <li>Keep your password secure and do not share it with anyone</li>
            <li>Notify us immediately if you suspect unauthorized access</li>
            <li>You are liable for all activities under your account</li>
            <li>One account per person - multiple accounts will be banned</li>
          </ul>
        </div>

        {/* Tournament Participation */}
        <div className="terms-section">
          <h2 className="section-title">4. Tournament Participation Rules</h2>
          <p className="terms-text">
            <strong>Registration & Entry Fees:</strong>
          </p>
          <ul className="terms-list">
            <li>Entry fees must be paid before tournament start time</li>
            <li>Registration closes when slots are full or 30 minutes before start</li>
            <li>Entry fees are non-refundable unless tournament is cancelled by admin</li>
            <li>Team names must not contain offensive or inappropriate content</li>
          </ul>
          <p className="terms-text">
            <strong>Room Credentials:</strong>
          </p>
          <ul className="terms-list">
            <li>Room ID and Password are sent 30 minutes before tournament via email</li>
            <li>Check spam/junk folder if credentials not received</li>
            <li>Sharing credentials with non-registered players is prohibited</li>
          </ul>
        </div>

        {/* Prize Distribution */}
        <div className="terms-section">
          <h2 className="section-title">5. Prize Distribution & Withdrawals</h2>
          <p className="terms-text">
            <strong>Prize Calculation:</strong>
          </p>
          <ul className="terms-list">
            <li>Prizes are based on tournament performance and official rankings</li>
            <li>Prize distribution structure is clearly stated in tournament details</li>
            <li>Admin decisions on rankings are final and binding</li>
          </ul>
          <p className="terms-text">
            <strong>Withdrawal Process:</strong>
          </p>
          <ul className="terms-list">
            <li>Minimum withdrawal amount: ₹100</li>
            <li>Processing time: 24-48 hours (working days)</li>
            <li>Valid bank account details required for withdrawals</li>
            <li>KYC verification may be required for first withdrawal</li>
          </ul>
        </div>

        {/* Fair Play & Anti-Cheat */}
        <div className="terms-section">
          <h2 className="section-title">6. Fair Play & Anti-Cheat Policy</h2>
          <p className="terms-text">
            <strong>Strictly Prohibited:</strong>
          </p>
          <ul className="terms-list">
            <li>Using mod APKs, hacked versions, or any cheating software</li>
            <li>Emulators (unless specifically allowed in tournament rules)</li>
            <li>Aimbot, wallhack, speed hack, or any game exploits</li>
            <li>Teaming with opponents in solo mode</li>
            <li>Smurfing (playing on alternate accounts to manipulate rankings)</li>
            <li>Account sharing or letting others play on your account</li>
          </ul>
          <p className="terms-text">
            <strong>Penalties for Violations:</strong>
          </p>
          <ul className="terms-list">
            <li><strong>First Offense:</strong> Disqualification from tournament + account warning</li>
            <li><strong>Second Offense:</strong> Account suspension (30 days) + prize forfeiture</li>
            <li><strong>Third Offense:</strong> Permanent ban from platform + legal action</li>
          </ul>
        </div>

        {/* Code of Conduct */}
        <div className="terms-section">
          <h2 className="section-title">7. Code of Conduct</h2>
          <p className="terms-text">
            You agree to use the Service in a manner that is lawful and respectful. You will not:
          </p>
          <ul className="terms-list">
            <li>Harass, threaten, or intimidate other players or staff</li>
            <li>Use offensive, racist, or inappropriate language in chat or communications</li>
            <li>Attempt to gain unauthorized access to the Service or other users' accounts</li>
            <li>Engage in fraudulent activities or payment scams</li>
            <li>Spread false information about the platform or tournaments</li>
          </ul>
        </div>

        {/* Intellectual Property */}
        <div className="terms-section">
          <h2 className="section-title">8. Intellectual Property</h2>
          <p className="terms-text">
            All content, trademarks, and intellectual property associated with PLAYZONE are our property or that of our licensors. This includes but is not limited to:
          </p>
          <ul className="terms-list">
            <li>Platform design, logos, and branding</li>
            <li>Tournament formats and rules</li>
            <li>Website content and code</li>
            <li>User-generated content (you grant us license to use it)</li>
          </ul>
          <p className="terms-text">
            Game titles (BGMI, PUBG Mobile, COD, Free Fire) are trademarks of their respective publishers. We are not affiliated with or endorsed by these companies.
          </p>
        </div>

        {/* Limitation of Liability */}
        <div className="terms-section">
          <h2 className="section-title">9. Limitation of Liability</h2>
          <p className="terms-text">
            To the fullest extent permitted by law, PLAYZONE shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Service, including but not limited to:
          </p>
          <ul className="terms-list">
            <li>Loss of tournament entry fees due to disconnection or technical issues</li>
            <li>Loss of potential winnings</li>
            <li>Game server issues or publisher-side problems</li>
            <li>Third-party payment gateway failures</li>
          </ul>
        </div>

        {/* Refund Policy */}
        <div className="terms-section">
          <h2 className="section-title">10. Refund Policy</h2>
          <p className="terms-text">
            <strong>Automatic Refunds:</strong>
          </p>
          <ul className="terms-list">
            <li>If PLAYZONE cancels a tournament: 100% refund to wallet</li>
            <li>If game server issues prevent tournament: Full refund</li>
          </ul>
          <p className="terms-text">
            <strong>User-Initiated Cancellations:</strong>
          </p>
          <ul className="terms-list">
            <li>24+ hours before tournament: 100% refund</li>
            <li>Within 24 hours: 95% refund (5% processing fee)</li>
            <li>After tournament starts: No refund</li>
          </ul>
        </div>

        {/* Modifications */}
        <div className="terms-section">
          <h2 className="section-title">11. Modifications to Terms</h2>
          <p className="terms-text">
            We reserve the right to modify these Terms and Conditions at any time. We will notify you of significant changes by posting the updated Terms on our website and via email. Your continued use of the Service after any changes constitutes your acceptance of the new Terms.
          </p>
        </div>

        {/* Governing Law */}
        <div className="terms-section">
          <h2 className="section-title">12. Governing Law & Jurisdiction</h2>
          <p className="terms-text">
            These Terms and Conditions shall be governed by and construed in accordance with the laws of the Government of India. Any disputes arising from these terms shall be subject to the exclusive jurisdiction of the courts in Mumbai, Maharashtra, India.
          </p>
        </div>

        {/* Contact */}
        <div className="terms-section">
          <h2 className="section-title">13. Contact Information</h2>
          <p className="terms-text">
            If you have any questions about these Terms and Conditions, please contact us at:
          </p>
          <p className="terms-text">
            <strong>Email:</strong> <a href={`mailto:${process.env.REACT_APP_EMAIL}`} className="terms-link">{process.env.REACT_APP_EMAIL}</a>
          </p>
          <p className="terms-text">
            <strong>Location:</strong> {process.env.REACT_APP_LOCATION}
          </p>
        </div>

        {/* Footer */}
        <div className="terms-footer">
          <p>&copy; 2026 PLAYZONE. All rights reserved. | Built for Champions</p>
        </div>
      </div>
    </div>
  );
};

export default Terms;