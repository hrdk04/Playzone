import React from 'react';
import theme from '../theme';

const Privacy = () => {
  const styles = {
    container: {
      minHeight: '80vh',
      background: theme.gradients.background,
      color: theme.colors.white,
      fontFamily: theme.fonts.primary,
      paddingBottom: theme.spacing.footerPadding,
    },
    contentContainer: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '40px 20px',
    },
    header: {
      background: theme.gradients.navbar,
      padding: '20px',
      borderRadius: '12px',
      marginBottom: '20px',
      boxShadow: theme.shadows.card,
    },
    title: {
      color: theme.colors.primary,
      textAlign: 'center',
      fontSize: theme.sizes.sectionTitleFontSize,
      marginBottom: '10px',
      textShadow: theme.shadows.text,
    },
    section: {
      background: theme.colors.cardBg,
      padding: '20px',
      borderRadius: '12px',
      marginBottom: '20px',
      boxShadow: theme.shadows.card,
      border: theme.borders.card,
    },
    sectionTitle: {
      color: theme.colors.secondary,
      marginBottom: '15px',
      fontSize: '1.5em',
      textShadow: theme.shadows.text,
    },
    text: {
      color: theme.colors.white,
      lineHeight: '1.6',
      marginBottom: '15px',
    },
    list: {
      color: theme.colors.white,
      lineHeight: '1.6',
      marginLeft: '20px',
      marginBottom: '15px',
    },
    listItem: {
      marginBottom: '10px',
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.contentContainer}>
        <div style={styles.header}>
          <h1 style={styles.title}>Privacy Policy</h1>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Data Collection and Usage</h2>
          <p style={styles.text}>We collect and process the following information to provide our gaming tournament services:</p>
          <ul style={styles.list}>
            <li style={styles.listItem}>Account information (username, email, date of birth)</li>
            <li style={styles.listItem}>Gaming statistics and tournament participation history</li>
            <li style={styles.listItem}>Payment information for tournament entries and winnings</li>
            <li style={styles.listItem}>Device and connection information for security purposes</li>
          </ul>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Data Protection</h2>
          <p style={styles.text}>We implement robust security measures to protect your personal information:</p>
          <ul style={styles.list}>
            <li style={styles.listItem}>End-to-end encryption for payment transactions</li>
            <li style={styles.listItem}>Secure storage of personal data</li>
            <li style={styles.listItem}>Regular security audits and updates</li>
            <li style={styles.listItem}>Strict access controls for staff members</li>
          </ul>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Data Usage</h2>
          <p style={styles.text}>Your data is used for:</p>
          <ul style={styles.list}>
            <li style={styles.listItem}>Tournament organization and management</li>
            <li style={styles.listItem}>Processing payments and winnings</li>
            <li style={styles.listItem}>Improving our services and user experience</li>
            <li style={styles.listItem}>Communication about tournaments and important updates</li>
          </ul>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Your Rights</h2>
          <p style={styles.text}>You have the right to:</p>
          <ul style={styles.list}>
            <li style={styles.listItem}>Access your personal data</li>
            <li style={styles.listItem}>Request data correction or deletion</li>
            <li style={styles.listItem}>Opt-out of marketing communications</li>
            <li style={styles.listItem}>Export your data in a portable format</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
