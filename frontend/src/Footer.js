import React from "react";
import { Link } from "react-router-dom";
import theme from "./theme";

export default function Footer() {
  const styles = {
    footer: {
      width: "100%",
      background: theme.gradients.navbarAlt1,
      color: theme.colors.white,
      padding: "40px 0 20px",
      fontFamily: theme.fonts.primary,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      boxShadow: theme.shadows.sectionTitleGlow,
      borderTop: `2px solid ${theme.colors.primary}`,
      zIndex: 10,
    },

    container: {
      maxWidth: "1200px",
      width: "100%",
      margin: "0 auto",
      padding: "0 20px",
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
      gap: "30px",
    },

    section: {
      marginBottom: "20px",
    },

    sectionTitle: {
      color: theme.colors.primaryGold,
      fontSize: "1.2em",
      marginBottom: "15px",
      fontWeight: "bold",
      textShadow: theme.shadows.textGlow,
    },

    link: {
      color: theme.colors.white,
      textDecoration: "none",
      display: "block",
      marginBottom: "10px",
      transition: "all 0.3s ease",
    },

    linkHover: {
      color: theme.colors.primaryGold,
    },

    email: {
      color: theme.colors.primaryGreen,
      textDecoration: "none",
    },

    text: {
      color: theme.colors.white,
      marginBottom: "10px",
      lineHeight: "1.6",
    },

    copyright: {
      textAlign: "center",
      marginTop: "30px",
      paddingTop: "20px",
      borderTop: `1px solid ${theme.colors.primaryGold}`,
      color: theme.colors.primaryGreen,
      fontSize: "0.9em",
    },
  };

  // Inline hover effect using event handlers to avoid style conflicts
  const handleHover = (e, isHover) => {
    e.target.style.color = isHover
      ? theme.colors.primaryGold
      : theme.colors.white;
  };

  return (
    <footer style={styles.footer}>
      <div style={styles.container}>
        {/* About */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>About PLAYZONE</h3>
          <p style={styles.text}>
            Your premier destination for mobile gaming tournaments. <br />
            Compete, win, and become a champion in your favorite games.
          </p>
        </div>

        {/* Quick Links */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Quick Links</h3>
          {["About", "Terms", "Privacy", "Contact"].map((item) => (
            <Link
              key={item}
              to={`/${item.toLowerCase()}`}
              style={styles.link}
              onMouseEnter={(e) => handleHover(e, true)}
              onMouseLeave={(e) => handleHover(e, false)}
            >
              {item}
            </Link>
          ))}
        </div>

        {/* Contact Info */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Contact Info</h3>
          <p style={styles.text}>
            Mumbai, India <br />
            Email:{" "}
            <a href="mailto:omgtms2529@gmail.com" style={styles.email}>
              omgtms2529@gmail.com
            </a>
            <br />
            Support: 24/7 Available
          </p>
        </div>

        {/* Tournament Support */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Tournament Support</h3>
          <Link
            to="/tournaments"
            style={styles.link}
            onMouseEnter={(e) => handleHover(e, true)}
            onMouseLeave={(e) => handleHover(e, false)}
          >
            Active Tournaments
          </Link>
          <Link
            to="/contact"
            style={styles.link}
            onMouseEnter={(e) => handleHover(e, true)}
            onMouseLeave={(e) => handleHover(e, false)}
          >
            Report an Issue
          </Link>
          <p style={styles.text}>
            Emergency Support: Available 24/7
            <br />
            Response Time: Within 30 minutes
          </p>
        </div>
      </div>

      <div style={styles.copyright}>
        <p>© {new Date().getFullYear()} PLAYZONE. All rights reserved.</p>
      </div>
    </footer>
  );
}
