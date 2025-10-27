// src/pages/About.js
import React from "react";
import theme from "../theme";

export default function About() {
  const styles = {
    container: {
      minHeight: "100vh",
      backgroundImage:" url('https://st4.depositphotos.com/24297044/27344/v/450/depositphotos_273440920-stock-illustration-blue-background-gradient-abstract-texture.jpg')",
        backgroundRepeat:'no-repeat',
        backgroundSize:"cover",
        backgroundPosition:'center',
        backgroundAttachment:'fixed',
      color: theme.colors.white,
      fontFamily: theme.fonts.primary,
      padding: theme.spacing.sectionPadding,
      textAlign: "center",
      transition: theme.animations.transition,
    },
    title: {
      fontSize: theme.sizes.titleFontSize,
      textShadow: theme.shadows.text,
      marginBottom: "20px",
    },
    subtitle: {
      fontSize: theme.sizes.subtitleFontSize,
      color: theme.colors.lightGray,
      textShadow: theme.shadows.text,
      marginBottom: "40px",
    },
    paragraph: {
      maxWidth: "850px",
      margin: "0 auto 30px auto",
      fontSize: "1.1rem",
      lineHeight: "1.8",
      color: theme.colors.midGray,
      fontFamily: theme.fonts.secondary,
    },
    highlightBox: {
      margin: "0 auto",
      padding: theme.spacing.cardPadding,
      maxWidth: "900px",
      border: theme.borders.card,
      borderRadius: "12px",
      background:' rgba(0,0,0,0.3)',
      boxShadow: theme.shadows.card,
      transition: theme.animations.transition,
    },
    highlightTitle: {
      fontSize: theme.sizes.sectionTitleFontSize,
      textShadow: theme.shadows.text,
      color: theme.colors.primary,
      marginBottom: "15px",
    },
    list: {
      listStyle: "none",
      padding: 0,
      fontSize: "1.05rem",
      lineHeight: "2",
      color: theme.colors.lightGray,
      fontFamily: theme.fonts.secondary,
    },
    spanPrimary: { color: theme.colors.primary },
    spanSecondary: { color: theme.colors.secondary },
    spanAccent: { color: theme.colors.accent },
  };

  return (
    <div style={styles.container}>
      {/* Title */}
      <h1 style={styles.title}>
        About <span style={styles.spanPrimary}>Playzone</span>
      </h1>

      {/* Subtitle */}
      <h3 style={styles.subtitle}>
        Your Gateway to Competitive Gaming & E-Sports
      </h3>

      {/* Paragraphs */}
      <p style={styles.paragraph}>
        Playzone is an online platform that manages{" "}
        <span style={styles.spanSecondary}>gaming tournaments</span>. We provide
        a competitive environment where gamers can
        <span style={styles.spanPrimary}> register</span>,{" "}
        <span style={styles.spanAccent}>compete</span>, and{" "}
        <span style={styles.spanSecondary}>track their progress</span>. Our
        mission is to help players sharpen their skills, showcase their talent,
        and even make a career in the ever-growing world of E-Sports.
      </p>

      <p style={styles.paragraph}>
        Whether you’re a casual player or a competitive professional, Playzone
        rewards you based on your performance, ensuring that{" "}
        <span style={styles.spanPrimary}>every match counts</span>. With
        real-time updates, secure tournament handling, and an
        <span style={styles.spanAccent}> engaging community</span>, Playzone is
        designed for gamers, by gamers.
      </p>

      {/* Highlight Section */}
      <div style={styles.highlightBox}>
        <h2 style={styles.highlightTitle}>Why Choose Playzone?</h2>
        <ul style={styles.list}>
          <li>🎮 Easy tournament registration & participation</li>
          <li>📊 Track your history & performance analytics</li>
          <li>🏆 Compete in a fair & secure environment</li>
          <li>💰 Rewards for achievements and victories</li>
          <li>🌐 Build your E-Sports career</li>
        </ul>
      </div>
    </div>
  );
}
