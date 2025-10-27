import React from 'react';
import theme from '../theme';

const Terms = () => {
  const styles = {
    container: {
      position: 'relative',
      minHeight: '80vh',
      background: theme.gradients.homeBackground,
      color: theme.colors.white,
      fontFamily: theme.fonts.primary,
      paddingBottom: '50px'
    },
    termsContainer: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '40px 20px'
    },
    termsHeader: {
      background: theme.gradients.navbarAlt1,
      padding: '20px',
      borderRadius: '12px',
      marginBottom: '20px',
      boxShadow: theme.shadows.sectionTitleGlow
    },
    title: {
      color: theme.colors.primaryGold,
      textAlign: 'center',
      fontSize: theme.sizes.sectionTitleFontSize,
      marginBottom: '10px',
      textShadow: theme.shadows.titleGlow
    },
    section: {
      background: theme.gradients.navbarAlt1,
      padding: '20px',
      borderRadius: '12px',
      marginBottom: '20px',
      boxShadow: theme.shadows.cardShadow
    },
    sectionTitle: {
      color: theme.colors.primaryGold,
      marginBottom: '15px',
      fontSize: '1.5em',
      textShadow: theme.shadows.textGlow
    },
    text: {
      color: theme.colors.white,
      lineHeight: '1.6',
      marginBottom: '15px',
      textShadow: theme.shadows.textShadow
    },
    list: {
      color: theme.colors.white,
      lineHeight: '1.6',
      marginLeft: '20px',
      marginBottom: '15px'
    },
    listItem: {
      marginBottom: '10px'
    },
    link: {
      color: theme.colors.primaryGreen,
      textDecoration: 'none'
    },
    footer: {
      textAlign: 'center',
      color: theme.colors.primaryGreen,
      marginTop: '30px',
      fontSize: '0.9em',
      textShadow: theme.shadows.textGlow
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.termsContainer}>
        <div style={styles.termsHeader}>
          <h1 style={styles.title}>Terms and Conditions</h1>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Last Updated: [29-09-2025]</h2>
          <p style={styles.text}>Welcome to the Mobile Gaming Tournament Management System (the "Service"). By accessing or using our Service, you agree to comply with and be bound by the following terms and conditions. Please read them carefully.</p>
        
          <h2 style={styles.sectionTitle}>1. Acceptance of Terms</h2>
          <p style={styles.text}>By using our Service, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions. If you do not agree to these terms, you must not use our Service.</p>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>2. Eligibility</h2>
          <p style={styles.text}>You must be at least 18 years old to use our Service. By using the Service, you represent and warrant that you meet this eligibility requirement. If you are using the Service on behalf of a company or organization, you represent that you have the authority to bind that entity to these Terms.</p>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>3. User Accounts</h2>
          <p style={styles.text}>To participate in tournaments, you may be required to create an account. You agree to provide accurate, current, and complete information during the registration process and to update such information to keep it accurate, current, and complete. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.</p>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>4. Tournaments and Betting</h2>
          <p style={styles.text}><strong>Participation:</strong> Users can join tournaments by creating a room and placing a monetary bet.</p>
          <p style={styles.text}><strong>Winnings:</strong> Winnings are based on performance in the tournament. The distribution of winnings will be outlined in the specific tournament rules.</p>
          <p style={styles.text}><strong>Fees:</strong> We may charge fees for participation in certain tournaments. These fees will be clearly stated before you enter a tournament.</p>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>5. Code of Conduct</h2>
          <p style={styles.text}>You agree to use the Service in a manner that is lawful and respectful. You will not:</p>
          <ul style={styles.list}>
            <li style={styles.listItem}>Engage in any form of cheating, collusion, or fraudulent activity.</li>
            <li style={styles.listItem}>Harass, threaten, or intimidate other users.</li>
            <li style={styles.listItem}>Use offensive or inappropriate language.</li>
            <li style={styles.listItem}>Attempt to gain unauthorized access to the Service or other users' accounts.</li>
          </ul>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>6. Intellectual Property</h2>
          <p style={styles.text}>All content, trademarks, and other intellectual property associated with the Service are the property of PLAYZONE or its licensors. You may not use, reproduce, or distribute any content from the Service without our express written permission.</p>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>7. Limitation of Liability</h2>
          <p style={styles.text}>To the fullest extent permitted by law, PLAYZONE shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from or related to your use of the Service, including but not limited to loss of profits, data, or other intangible losses.</p>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>8. Indemnification</h2>
          <p style={styles.text}>You agree to indemnify and hold harmless PLAYZONE, its affiliates, and their respective officers, directors, employees, and agents from any claims, losses, liabilities, damages, costs, or expenses (including reasonable attorneys' fees) arising out of or related to your use of the Service, your violation of these Terms, or your violation of any rights of another party.</p>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>9. Modifications to Terms</h2>
          <p style={styles.text}>We reserve the right to modify these Terms and Conditions at any time. We will notify you of any changes by posting the new Terms on our website. Your continued use of the Service after any changes constitutes your acceptance of the new Terms.</p>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>10. Governing Law</h2>
          <p style={styles.text}>These Terms and Conditions shall be governed by and construed in accordance with the laws of Government of India, without regard to its conflict of law principles.</p>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>11. Contact Information</h2>
          <p style={styles.text}>If you have any questions about these Terms and Conditions, please contact us at <a href="mailto:omgtms2529@gmail.com" style={styles.link}>omgtms2529@gmail.com</a>.</p>
        </div>

        <div style={styles.footer}>
          <p>&copy; 2024-25 PLAYZONE. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default Terms;