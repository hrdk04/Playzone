// src/pages/About.js
import React from "react";
import theme from "../theme";

export default function About() {
  const styles = {
    container: {
      minHeight: "100vh",
      backgroundImage: "url('https://st4.depositphotos.com/24297044/27344/v/450/depositphotos_273440920-stock-illustration-blue-background-gradient-abstract-texture.jpg')",
      backgroundRepeat: 'no-repeat',
      backgroundSize: "cover",
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
      color: theme.colors.white,
      fontFamily: theme.fonts.primary,
      padding: theme.spacing.sectionPadding,
      transition: theme.animations.transition,
    },
    contentWrapper: {
      maxWidth: "1200px",
      margin: "0 auto",
    },
    title: {
      fontSize: theme.sizes.titleFontSize,
      textShadow: theme.shadows.text,
      marginBottom: "10px",
      textAlign: "center",
    },
    subtitle: {
      fontSize: theme.sizes.subtitleFontSize,
      color: theme.colors.lightGray,
      textShadow: theme.shadows.text,
      marginBottom: "50px",
      textAlign: "center",
    },
    section: {
      margin: "40px auto",
      padding: theme.spacing.cardPadding,
      maxWidth: "1000px",
      border: theme.borders.card,
      borderRadius: "12px",
      background: 'rgba(0,0,0,0.5)',
      boxShadow: theme.shadows.card,
      backdropFilter: "blur(10px)",
    },
    sectionTitle: {
      fontSize: theme.sizes.sectionTitleFontSize,
      textShadow: theme.shadows.text,
      color: theme.colors.primary,
      marginBottom: "20px",
      textAlign: "left",
    },
    paragraph: {
      fontSize: "1.05rem",
      lineHeight: "1.8",
      color: theme.colors.lightGray,
      fontFamily: theme.fonts.secondary,
      marginBottom: "15px",
      textAlign: "left",
    },
    gridContainer: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
      gap: "20px",
      marginTop: "30px",
    },
    card: {
      padding: "20px",
      background: "rgba(0, 255, 204, 0.05)",
      border: `1px solid ${theme.colors.primary}`,
      borderRadius: "10px",
      transition: "all 0.3s ease",
      textAlign: "center",
    },
    cardIcon: {
      fontSize: "3rem",
      marginBottom: "15px",
    },
    cardTitle: {
      fontSize: "1.2rem",
      color: theme.colors.secondary,
      fontWeight: "bold",
      marginBottom: "10px",
    },
    cardText: {
      fontSize: "0.95rem",
      color: theme.colors.lightGray,
      lineHeight: "1.6",
    },
    processContainer: {
      display: "flex",
      flexDirection: "column",
      gap: "20px",
      marginTop: "30px",
    },
    processStep: {
      display: "flex",
      alignItems: "flex-start",
      gap: "20px",
      padding: "20px",
      background: "rgba(0,0,0,0.3)",
      borderRadius: "10px",
      borderLeft: `4px solid ${theme.colors.primary}`,
    },
    stepNumber: {
      fontSize: "2rem",
      fontWeight: "bold",
      color: theme.colors.primary,
      minWidth: "50px",
    },
    stepContent: {
      flex: 1,
    },
    stepTitle: {
      fontSize: "1.2rem",
      color: theme.colors.secondary,
      fontWeight: "bold",
      marginBottom: "8px",
    },
    stepText: {
      fontSize: "0.95rem",
      color: theme.colors.lightGray,
      lineHeight: "1.6",
    },
    statsContainer: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
      gap: "20px",
      marginTop: "30px",
    },
    statBox: {
      padding: "25px",
      background: theme.gradients.navbarAlt1,
      border: `2px solid ${theme.colors.primary}`,
      borderRadius: "12px",
      textAlign: "center",
    },
    statNumber: {
      fontSize: "2.5rem",
      fontWeight: "bold",
      color: theme.colors.primary,
      marginBottom: "10px",
    },
    statLabel: {
      fontSize: "1rem",
      color: theme.colors.lightGray,
    },
    featureList: {
      listStyle: "none",
      padding: 0,
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
      gap: "15px",
      marginTop: "20px",
    },
    featureItem: {
      padding: "15px",
      background: "rgba(0,0,0,0.3)",
      borderRadius: "8px",
      borderLeft: `3px solid ${theme.colors.secondary}`,
      fontSize: "1rem",
      color: theme.colors.lightGray,
      display: "flex",
      alignItems: "center",
      gap: "10px",
    },
    spanPrimary: { color: theme.colors.primary, fontWeight: "bold" },
    spanSecondary: { color: theme.colors.secondary, fontWeight: "bold" },
    spanAccent: { color: theme.colors.accent, fontWeight: "bold" },
  };

  return (
    <div style={styles.container}>
      <div style={styles.contentWrapper}>
        {/* Header */}
        <h1 style={styles.title}>
          About <span style={styles.spanPrimary}>PLAYZONE</span>
        </h1>
        <h3 style={styles.subtitle}>
          India's Premier Online Gaming Tournament Platform
        </h3>

        {/* What is Playzone */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>🎮 What is PLAYZONE?</h2>
          <p style={styles.paragraph}>
            <span style={styles.spanPrimary}>PLAYZONE</span> is a comprehensive online tournament management platform designed specifically for mobile gaming enthusiasts in India. We organize and manage competitive tournaments for popular games like <span style={styles.spanSecondary}>BGMI, Free Fire, PUBG Mobile, and Call of Duty Mobile</span>.
          </p>
          <p style={styles.paragraph}>
            Our platform connects passionate gamers with exciting tournament opportunities, enabling them to compete, win prizes, and build their gaming careers—all from their smartphones.
          </p>
        </div>

        {/* Platform Stats */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>📊 Platform Overview</h2>
          <div style={styles.statsContainer}>
            <div style={styles.statBox}>
              <div style={styles.statNumber}>1000+</div>
              <div style={styles.statLabel}>Active Players</div>
            </div>
            <div style={styles.statBox}>
              <div style={styles.statNumber}>500+</div>
              <div style={styles.statLabel}>Tournaments Hosted</div>
            </div>
            <div style={styles.statBox}>
              <div style={styles.statNumber}>₹5L+</div>
              <div style={styles.statLabel}>Prize Money Distributed</div>
            </div>
            <div style={styles.statBox}>
              <div style={styles.statNumber}>24/7</div>
              <div style={styles.statLabel}>Support Available</div>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>⚙️ How PLAYZONE Works</h2>
          <p style={styles.paragraph}>
            Our platform is designed to be simple and user-friendly. Here's how you can start your gaming journey:
          </p>
          <div style={styles.processContainer}>
            <div style={styles.processStep}>
              <div style={styles.stepNumber}>1</div>
              <div style={styles.stepContent}>
                <div style={styles.stepTitle}>📝 Create Your Account</div>
                <div style={styles.stepText}>
                  Sign up with your email, username, and basic details. It's quick, free, and secure. Your account gives you access to all tournaments and features. 
                </div>
              </div>
            </div>

            <div style={styles.processStep}>
              <div style={styles.stepNumber}>2</div>
              <div style={styles.stepContent}>
                <div style={styles.stepTitle}>💰 Add Money to Wallet</div>
                <div style={styles.stepText}>
                  Load your wallet using UPI, QR codes, or Net Banking. Your wallet balance is used to register for tournaments. Minimum deposit: ₹10. All transactions are secure and instant.
                </div>
              </div>
            </div>

            <div style={styles.processStep}>
              <div style={styles.stepNumber}>3</div>
              <div style={styles.stepContent}>
                <div style={styles.stepTitle}>🎯 Browse & Join Tournaments</div>
                <div style={styles.stepText}>
                  Explore upcoming tournaments filtered by game, entry fee, and date. Register with your team name and pay the entry fee from your wallet. You'll receive room details 30 minutes before the tournament starts.
                </div>
              </div>
            </div>

            <div style={styles.processStep}>
              <div style={styles.stepNumber}>4</div>
              <div style={styles.stepContent}>
                <div style={styles.stepTitle}>🏆 Compete & Win</div>
                <div style={styles.stepText}>
                  Join the game at the scheduled time using the room ID and password sent to your email. Play fair, follow rules, and aim for the top! Winners are announced within 24 hours.
                </div>
              </div>
            </div>

            <div style={styles.processStep}>
              <div style={styles.stepNumber}>5</div>
              <div style={styles.stepContent}>
                <div style={styles.stepTitle}>💸 Claim Your Rewards</div>
                <div style={styles.stepText}>
                  Prize money is automatically credited to your wallet after results are published. Withdraw anytime to your bank account (min ₹100). Withdrawals processed in 24-48 hours.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Key Features */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>✨ Key Features</h2>
          <ul style={styles.featureList}>
            <li style={styles.featureItem}>
              <span>🎮</span>
              <span>Support for BGMI, Free Fire, PUBG, COD Mobile</span>
            </li>
            <li style={styles.featureItem}>
              <span>💳</span>
              <span>Secure wallet system for deposits & withdrawals (Currently Dummy!)</span>
            </li>
            <li style={styles.featureItem}>
              <span>📧</span>
              <span>Automated email notifications for tournaments</span>
            </li>
            <li style={styles.featureItem}>
              <span>🏅</span>
              <span>Real-time tournament tracking & history</span>
            </li>
            <li style={styles.featureItem}>
              <span>💰</span>
              <span>Prize distribution to winners within 24h before</span>
            </li>
            <li style={styles.featureItem}>
              <span>🔒</span>
              <span>Fair play enforcement & anti-cheat measures</span>
            </li>
            <li style={styles.featureItem}>
              <span>📊</span>
              <span>Personal performance analytics & stats</span>
            </li>
            <li style={styles.featureItem}>
              <span>💬</span>
              <span>24/7 customer support via contact form</span>
            </li>
            <li style={styles.featureItem}>
              <span>🔄</span>
              <span>Flexible cancellation & refund policy</span>
            </li>
            <li style={styles.featureItem}>
              <span>📱</span>
              <span>Mobile-friendly responsive design</span>
            </li>
          </ul>
        </div>

        {/* Why Choose Playzone */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>🌟 Why Choose PLAYZONE?</h2>
          <div style={styles.gridContainer}>
            <div style={styles.card}>
              <div style={styles.cardIcon}>🔒</div>
              <div style={styles.cardTitle}>100% Secure</div>
              <div style={styles.cardText}>
                Your money and data are protected with bank-grade security. All transactions are encrypted and verified.
              </div>
            </div>

            <div style={styles.card}>
              <div style={styles.cardIcon}>⚡</div>
              <div style={styles.cardTitle}>Instant Payouts</div>
              <div style={styles.cardText}>
                Winners receive prize money directly in their wallet within 24 hours. Fast bank withdrawals guaranteed.
              </div>
            </div>

            <div style={styles.card}>
              <div style={styles.cardIcon}>🎯</div>
              <div style={styles.cardTitle}>Fair Play</div>
              <div style={styles.cardText}>
                Strict anti-cheat policies and manual verification ensure every tournament is fair and competitive.
              </div>
            </div>

            <div style={styles.card}>
              <div style={styles.cardIcon}>🏆</div>
              <div style={styles.cardTitle}>Big Prizes</div>
              <div style={styles.cardText}>
                70% of entry fees go directly to prize pool. Top 3 players win guaranteed cash rewards every tournament.
              </div>
            </div>

            <div style={styles.card}>
              <div style={styles.cardIcon}>📱</div>
              <div style={styles.cardTitle}>Easy to Use</div>
              <div style={styles.cardText}>
                Simple registration, clear instructions, and user-friendly interface. No technical knowledge required.
              </div>
            </div>

            <div style={styles.card}>
              <div style={styles.cardIcon}>💬</div>
              <div style={styles.cardTitle}>Great Support</div>
              <div style={styles.cardText}>
                Dedicated support team available 24/7 for any questions, issues, or assistance you need.
              </div>
            </div>
          </div>
        </div>

        {/* Our Mission */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>🎯 Our Mission</h2>
          <p style={styles.paragraph}>
            At <span style={styles.spanPrimary}>PLAYZONE</span>, our mission is to democratize competitive gaming in India. We believe that every gamer, regardless of their background, should have the opportunity to showcase their skills, compete at a professional level, and earn rewards for their talent.
          </p>
          <p style={styles.paragraph}>
            We're building a platform where <span style={styles.spanSecondary}>passion meets opportunity</span>, and where gaming is recognized as a legitimate career path. Through transparent operations, fair tournaments, and community engagement, we're shaping the future of Indian e-sports.
          </p>
        </div>

        {/* Who Can Join */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>👥 Who Can Join?</h2>
          <div style={styles.gridContainer}>
            <div style={styles.card}>
              <div style={styles.cardIcon}>🎮</div>
              <div style={styles.cardTitle}>Casual Gamers</div>
              <div style={styles.cardText}>
                Play for fun, test your skills, and win some extra cash on weekends.
              </div>
            </div>

            <div style={styles.card}>
              <div style={styles.cardIcon}>🏅</div>
              <div style={styles.cardTitle}>Competitive Players</div>
              <div style={styles.cardText}>
                Serious gamers looking to prove themselves and climb the leaderboards.
              </div>
            </div>

            <div style={styles.card}>
              <div style={styles.cardIcon}>⭐</div>
              <div style={styles.cardTitle}>Aspiring Professionals</div>
              <div style={styles.cardText}>
                Build your gaming profile, gain experience, and start your e-sports career.
              </div>
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div style={{
          ...styles.section,
          background: theme.gradients.primaryButton,
          textAlign: "center",
          padding: "40px",
        }}>
          <h2 style={{ ...styles.sectionTitle, color: "#fff", textAlign: "center" }}>
            🚀 Ready to Start Your Gaming Journey?
          </h2>
          <p style={{ ...styles.paragraph, textAlign: "center", color: "#fff", fontSize: "1.1rem" }}>
            Join thousands of players competing daily on PLAYZONE. Register now and get started in minutes!
          </p>
          <button
            onClick={() => window.location.href = "/signup"}
            style={{
              marginTop: "20px",
              padding: "15px 40px",
              fontSize: "1.2rem",
              fontWeight: "bold",
              background: "#fff",
              color: theme.colors.primary,
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
              transition: "transform 0.3s ease",
            }}
            onMouseEnter={(e) => e.target.style.transform = "scale(1.05)"}
            onMouseLeave={(e) => e.target.style.transform = "scale(1)"}
          >
            Sign Up Now - It's Free! 🎮
          </button>
        </div>
      </div>
    </div>
  );
}