import React from "react";
import theme from "../theme";

const Contact = () => {
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
      maxWidth: "1100px",
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
    linkHover: {
      color: theme.colors.hover,
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
      transition: theme.animations.transition,
    },
    button: {
      padding: "12px",
      borderRadius: "8px",
      border: "none",
      background: theme.gradients.primaryButton,
      color: theme.colors.white,
      cursor: "pointer",
      fontWeight: "bold",
      textTransform: "uppercase",
      fontFamily: theme.fonts.primary,
      boxShadow: theme.shadows.button,
      transition: theme.animations.transition,
    },
    buttonHover: {
      boxShadow: theme.shadows.hover,
      transform: "translateY(-2px)",
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.contentContainer}>
        {/* Header */}
        <div style={styles.header}>
          <h1 style={styles.title}>Contact Us</h1>
        </div>

        {/* Contact Info Section */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Get in Touch</h2>
          <p style={styles.text}>
            Have questions about tournaments, technical issues, or business inquiries?
            We’re always happy to help!
          </p>

          <div style={styles.contactInfo}>
            <div style={styles.contactItem}>
              <span style={styles.text}>📧 Email:</span>
              <a
                href="mailto:omgtms2529@gmail.com"
                style={styles.link}
              >
                omgtms2529@gmail.com
              </a>
            </div>
            <div style={styles.contactItem}>
              <span style={styles.text}>⏰ Support Hours:</span>
              <span style={styles.text}>24/7 for tournament-related issues</span>
            </div>
            <div style={styles.contactItem}>
              <span style={styles.text}>📍 Location:</span>
              <span style={styles.text}>Mumbai, India</span>
            </div>
          </div>
        </div>

        {/* Contact Form Section */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Send Us a Message</h2>
          <form style={styles.form}>
            <input style={styles.input} type="text" placeholder="Your Name" required />
            <input style={styles.input} type="email" placeholder="Your Email" required />
            <input style={styles.input} type="text" placeholder="Subject" required />
            <textarea style={styles.textarea} placeholder="Your Message" required />
            <button style={styles.button} type="submit">
              Send Message
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Contact;
