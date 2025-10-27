// src/theme.js
const theme = {
  colors: {
    // primary palette (your updated colors)
    primary: "#007bff",          // Standard PlayZone blue
    secondary: "#00c9a7",        // Teal accent
    accent: "#ff4081",           // light pink
    backgroundColor: "#0d1117",
    white: "#ffffff",
    lightGray: "#d1d5db",
    midGray: "#9ca3af",
    darkGray: "#1f2937",
    navbarDark: "#101828",
    navbarLight: "#16213e",
    footerBg: "#0d1117",
    success: "#28a745",
    warning: "#ffc107",
    danger: "#dc3545",
    hover: "#00bcd4",
    border: "rgba(255,255,255,0.08)",
    cardBg: "#151b26",
    activeBg: "#182235",

    // Compatibility aliases used across older components
    primaryGold: "#ffbf00",      // used in some older pages for headings
    primaryGreen: "#00c9a7",     // alias (same as secondary)
    // small extras
    subtleAccent: "#0af5d3",
  },

  gradients: {
    navbar: "linear-gradient(90deg, #0d1117, #16213e)",
    primaryButton: "linear-gradient(90deg, #007bff, #00c9a7)",
    secondaryButton: "linear-gradient(90deg, #16213e, #1f2937)",
    footer: "linear-gradient(180deg, #101828, #0d1117)",
    background: "radial-gradient(circle at top left, #101828, #0d1117 70%)",

    // compatibility aliases
    homeBackground: "radial-gradient(circle at 50% 0%, #101828 0%, #0d1117 100%)",
    navbarAlt1: "linear-gradient(90deg, #16213e, #0f1220)",
    navbarAlt2: "linear-gradient(90deg, #0f1220, #16213e)",
  },

  shadows: {
    button: "0 0 12px rgba(0, 123, 255, 0.3)",
    card: "0 4px 20px rgba(0,0,0,0.25)",
    hover: "0 0 8px rgba(0,201,167,0.3)",
    text: "0 0 4px rgba(255,255,255,0.2)",

    // compatibility glow names used in project
    sectionTitleGlow: "0 0 6px rgba(0,201,167,0.14), 0 0 12px rgba(0,123,255,0.08)",
    titleGlow: "0 0 8px rgba(0,123,255,0.12), 0 0 16px rgba(255,64,129,0.06)",
    subtitleGlow: "0 0 6px rgba(0,201,167,0.08)",
    textGlow: "0 0 6px rgba(0,123,255,0.06)",
    cardShadow: "0 8px 30px rgba(0,0,0,0.45)",
  },

  fonts: {
    primary: "'Poppins', sans-serif",
    secondary: "'Inter', sans-serif",
  },

  sizes: {
    titleFontSize: "2.5rem",
    subtitleFontSize: "1.2rem",
    sectionTitleFontSize: "1.75rem",
    linkFontSize: "1rem",
    logoFontSize: "1.4rem",
    navFontSize: "0.95rem",
    footerFontSize: "0.85rem",
  },

  spacing: {
    navbarPadding: "10px 22px",
    buttonPadding: "10px 20px",
    buttonMargin: "0 8px",
    cardPadding: "18px",
    sectionPadding: "50px 18px",
    footerPadding: "22px",
  },

  borders: {
    navbarBottom: "1px solid rgba(255, 255, 255, 0.08)",
    activeLink: "2px solid #00c9a7",
    footerTop: "1px solid rgba(255,255,255,0.05)",
    card: "1px solid rgba(255,255,255,0.05)",
  },

  animations: {
    glowPulse: "glowPulse 2.5s infinite alternate",
    transition: "all 0.25s ease-in-out",
  },

  cssVariables: {
    "--primary-color": "#007bff",
    "--secondary-color": "#00c9a7",
    "--accent-color": "#ff4081",
    "--background-color": "#0d1117",
    "--text-color": "#ffffff",
    "--hover-color": "#00bcd4",
    "--transition": "all 0.25s ease",
  },
};

// Also export named compatibility object to avoid breakage in code expecting top-level keys
theme.homeBackground = theme.gradients.homeBackground;
theme.navbarAlt1 = theme.gradients.navbarAlt1;
theme.navbarAlt2 = theme.gradients.navbarAlt2;
theme.primaryGold = theme.colors.primaryGold;
theme.primaryGreen = theme.colors.primaryGreen;
theme.sectionTitleGlow = theme.shadows.sectionTitleGlow;
theme.cardShadow = theme.shadows.cardShadow;
theme.titleGlow = theme.shadows.titleGlow;
theme.subtitleGlow = theme.shadows.subtitleGlow;
theme.textGlow = theme.shadows.textGlow;

export default theme;
