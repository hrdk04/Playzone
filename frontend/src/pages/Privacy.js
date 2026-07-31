import React from 'react';
import './Privacy.css';

const Privacy = () => {
  return (
    <div className="privacy-page-container">
      <div className="privacy-content">
        {/* Header */}
        <div className="privacy-header">
          <span className="privacy-badge">🔒 Privacy Policy</span>
          <h1 className="privacy-title">Privacy & Data Protection</h1>
          <p className="privacy-subtitle">Last Updated: July 2026</p>
        </div>

        {/* Introduction */}
        <div className="privacy-section">
          <h2 className="section-title">1. Introduction</h2>
          <p className="privacy-text">
            At PLAYZONE, we take your privacy seriously. This Privacy Policy explains how we collect, use, protect, and share your personal information when you use our e-sports tournament platform. By using PLAYZONE, you agree to the practices described in this policy.
          </p>
          <p className="privacy-text">
            We are committed to protecting your privacy and ensuring the security of your personal data. This policy applies to all users of PLAYZONE, including tournament participants, spectators, and visitors to our platform.
          </p>
        </div>

        {/* Data Collection */}
        <div className="privacy-section">
          <h2 className="section-title">2. Information We Collect</h2>
          <p className="privacy-text">
            <strong>Account Information:</strong>
          </p>
          <ul className="privacy-list">
            <li>Username, display name, and profile information</li>
            <li>Email address and mobile number for verification</li>
            <li>Date of birth (age verification - must be 18+)</li>
            <li>Profile picture and gaming avatar</li>
            <li>Team name and squad information</li>
          </ul>
          <p className="privacy-text">
            <strong>Gaming & Tournament Data:</strong>
          </p>
          <ul className="privacy-list">
            <li>Tournament participation history and results</li>
            <li>Game statistics and performance metrics</li>
            <li>Win/loss records and rankings</li>
            <li>In-game usernames and IDs (BGMI, PUBG, COD, Free Fire)</li>
            <li>Room ID and password history (for dispute resolution)</li>
          </ul>
          <p className="privacy-text">
            <strong>Payment & Financial Information:</strong>
          </p>
          <ul className="privacy-list">
            <li>Wallet balance and transaction history</li>
            <li>Bank account details for withdrawals (encrypted)</li>
            <li>Payment method information (UPI, cards, etc.)</li>
            <li>Prize winnings and withdrawal records</li>
          </ul>
          <p className="privacy-text">
            <strong>Technical & Security Data:</strong>
          </p>
          <ul className="privacy-list">
            <li>IP address and device information</li>
            <li>Browser type and operating system</li>
            <li>Login timestamps and location data</li>
            <li>Cookies and usage analytics</li>
          </ul>
        </div>

        {/* Data Usage */}
        <div className="privacy-section">
          <h2 className="section-title">3. How We Use Your Information</h2>
          <p className="privacy-text">
            We use your personal information for the following purposes:
          </p>
          <ul className="privacy-list">
            <li><strong>Tournament Management:</strong> To register you for tournaments, send room credentials, and manage your participation</li>
            <li><strong>Payment Processing:</strong> To process tournament entry fees, prize distributions, and withdrawals</li>
            <li><strong>Account Security:</strong> To verify your identity, prevent fraud, and protect your account</li>
            <li><strong>Performance Tracking:</strong> To display your gaming statistics, rankings, and tournament history</li>
            <li><strong>Communication:</strong> To send tournament notifications, room credentials, and important updates</li>
            <li><strong>Platform Improvement:</strong> To analyze usage patterns and improve our services</li>
            <li><strong>Legal Compliance:</strong> To comply with applicable laws and prevent illegal activities</li>
          </ul>
        </div>

        {/* Data Protection */}
        <div className="privacy-section">
          <h2 className="section-title">4. Data Security & Protection</h2>
          <p className="privacy-text">
            We implement industry-standard security measures to protect your data:
          </p>
          <ul className="privacy-list">
            <li><strong>Encryption:</strong> All sensitive data is encrypted using AES-256 encryption</li>
            <li><strong>Secure Payments:</strong> Payment transactions use end-to-end encryption and PCI DSS compliance</li>
            <li><strong>Access Controls:</strong> Strict access controls limit data access to authorized personnel only</li>
            <li><strong>Regular Audits:</strong> We conduct regular security audits and vulnerability assessments</li>
            <li><strong>Secure Storage:</strong> Data is stored on secure servers with 24/7 monitoring</li>
            <li><strong>Two-Factor Authentication:</strong> Optional 2FA for enhanced account security</li>
          </ul>
          <p className="privacy-text">
            <strong>Important Note:</strong> While we take all reasonable measures to protect your data, no method of transmission over the internet is 100% secure. We cannot guarantee absolute security.
          </p>
        </div>

        {/* Data Sharing */}
        <div className="privacy-section">
          <h2 className="section-title">5. Information Sharing</h2>
          <p className="privacy-text">
            We do not sell your personal information. We may share your data only in the following circumstances:
          </p>
          <ul className="privacy-list">
            <li><strong>Payment Processors:</strong> With trusted payment gateways for processing transactions</li>
            <li><strong>Game Publishers:</strong> For tournament verification and dispute resolution (minimal data only)</li>
            <li><strong>Legal Requirements:</strong> When required by law, court order, or government authorities</li>
            <li><strong>Fraud Prevention:</strong> To prevent, detect, and investigate fraudulent activities</li>
            <li><strong>Business Transfer:</strong> In case of merger, acquisition, or sale of assets (with notice)</li>
          </ul>
          <p className="privacy-text">
            <strong>Public Information:</strong> Your username, gaming statistics, and tournament results are visible to other users on the platform. You can choose what to display in your profile.
          </p>
        </div>

        {/* User Rights */}
        <div className="privacy-section">
          <h2 className="section-title">6. Your Privacy Rights</h2>
          <p className="privacy-text">
            You have the following rights regarding your personal data:
          </p>
          <ul className="privacy-list">
            <li><strong>Access:</strong> Request a copy of your personal data</li>
            <li><strong>Correction:</strong> Request correction of inaccurate or incomplete data</li>
            <li><strong>Deletion:</strong> Request deletion of your personal data (subject to legal requirements)</li>
            <li><strong>Portability:</strong> Request your data in a portable, machine-readable format</li>
            <li><strong>Objection:</strong> Object to processing of your personal data</li>
            <li><strong>Restriction:</strong> Request restriction of data processing</li>
            <li><strong>Withdraw Consent:</strong> Withdraw consent for data processing (where applicable)</li>
          </ul>
          <p className="privacy-text">
            To exercise these rights, contact us at <a href={`mailto:${process.env.REACT_APP_EMAIL}`} className="privacy-link">{process.env.REACT_APP_EMAIL}</a>
          </p>{console.log(process.env.REACT_APP_LOCATION)}
        </div>

        {/* Data Retention */}
        <div className="privacy-section">
          <h2 className="section-title">7. Data Retention Policy</h2>
          <p className="privacy-text">
            We retain your personal data for as long as necessary to provide our services and comply with legal obligations:
          </p>
          <ul className="privacy-list">
            <li><strong>Account Data:</strong> Retained while your account is active</li>
            <li><strong>Tournament History:</strong> Retained for dispute resolution and analytics (minimum 2 years)</li>
            <li><strong>Financial Records:</strong> Retained for 7 years as per tax and legal requirements</li>
            <li><strong>Deleted Accounts:</strong> Data anonymized after 30 days of deletion request</li>
          </ul>
        </div>

        {/* Third-Party Services */}
        <div className="privacy-section">
          <h2 className="section-title">8. Third-Party Services</h2>
          <p className="privacy-text">
            Our platform integrates with third-party services:
          </p>
          <ul className="privacy-list">
            <li><strong>Payment Gateways:</strong> Razorpay, PhonePe, Google Pay, Paytm</li>
            <li><strong>Game APIs:</strong> BGMI, PUBG Mobile, COD, Free Fire (for tournament verification)</li>
            <li><strong>Analytics:</strong> Google Analytics (for platform improvement)</li>
            <li><strong>Email Services:</strong> For sending tournament notifications</li>
          </ul>
          <p className="privacy-text">
            These third parties have their own privacy policies. We encourage you to review them.
          </p>
        </div>

        {/* Children's Privacy */}
        <div className="privacy-section">
          <h2 className="section-title">9. Children's Privacy</h2>
          <p className="privacy-text">
            PLAYZONE is not intended for users under 18 years of age. We do not knowingly collect personal information from children under 18. If we discover that we have collected such information, we will immediately delete it.
          </p>
          <p className="privacy-text">
            Parents or guardians who believe their child has provided personal information should contact us immediately.
          </p>
        </div>

        {/* International Data Transfer */}
        <div className="privacy-section">
          <h2 className="section-title">10. International Data Transfers</h2>
          <p className="privacy-text">
            Your data is primarily stored and processed in India. We may transfer data to other countries for:
          </p>
          <ul className="privacy-list">
            <li>Cloud storage and backup services</li>
            <li>Payment processing</li>
            <li>Technical support and maintenance</li>
          </ul>
          <p className="privacy-text">
            We ensure appropriate safeguards are in place for international data transfers in compliance with applicable data protection laws.
          </p>
        </div>

        {/* Policy Updates */}
        <div className="privacy-section">
          <h2 className="section-title">11. Changes to This Policy</h2>
          <p className="privacy-text">
            We may update this Privacy Policy from time to time. We will notify you of significant changes by:
          </p>
          <ul className="privacy-list">
            <li>Posting the updated policy on our website</li>
            <li>Sending an email notification to registered users</li>
            <li>Displaying a prominent notice on the platform</li>
          </ul>
          <p className="privacy-text">
            Your continued use of PLAYZONE after any changes constitutes your acceptance of the updated policy.
          </p>
        </div>

        {/* Contact */}
        <div className="privacy-section">
          <h2 className="section-title">12. Contact Us</h2>
          <p className="privacy-text">
            If you have any questions about this Privacy Policy or our data practices, please contact us:
          </p>
          <p className="privacy-text">
            <strong>Email:</strong> <a href={`mailto:${process.env.REACT_APP_EMAIL}`} className="privacy-link">{process.env.REACT_APP_EMAIL}</a>
          </p>
          <p className="privacy-text">
            <strong>Location:</strong> {process.env.REACT_APP_LOCATION}
          </p>
          <p className="privacy-text">
            <strong>Response Time:</strong> We will respond to your privacy inquiries within 30 days.
          </p>
        </div>

        {/* Footer */}
        <div className="privacy-footer">
          <p>&copy; 2026 PLAYZONE. All rights reserved. | Your Privacy Matters</p>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
