// src/theme.js - adaptive light/dark theme via CSS variables
const theme = {
  colors: {
    primary: "#007bff",
    secondary: "var(--accent-cyan)",
    accent: "var(--accent-pink)",
    backgroundColor: "var(--bg-primary)",
    white: "#ffffff",
    lightGray: "var(--text-secondary)",
    midGray: "var(--text-muted)",
    darkGray: "var(--text-primary)",
    navbarDark: "var(--bg-secondary)",
    navbarLight: "var(--bg-tertiary)",
    footerBg: "var(--bg-primary)",
    success: "#28a745",
    warning: "#ffc107",
    danger: "#dc3545",
    hover: "var(--accent-cyan)",
    border: "var(--border-color)",
    cardBg: "var(--bg-secondary)",
    activeBg: "var(--bg-tertiary)",
    primaryGold: "#ffbf00",
    primaryGreen: "var(--accent-cyan)",
    subtleAccent: "var(--accent-cyan)",
  },
  gradients: {
    navbar: "linear-gradient(90deg, var(--bg-secondary), var(--bg-tertiary))",
    primaryButton: "var(--gradient-primary)",
    secondaryButton: "linear-gradient(90deg, #4a5568, #2d3748)",
    footer: "linear-gradient(180deg, var(--bg-secondary), var(--bg-primary))",
    background: "radial-gradient(circle at top left, var(--bg-secondary), var(--bg-primary) 70%)",
    homeBackground: "radial-gradient(circle at 50% 0%, var(--bg-secondary) 0%, var(--bg-primary) 100%)",
    navbarAlt1: "linear-gradient(135deg, var(--bg-secondary), var(--bg-tertiary))",
    navbarAlt2: "linear-gradient(135deg, var(--bg-tertiary), var(--bg-secondary))",
  },
  shadows: {
    button: "0 0 12px rgba(0, 123, 255, 0.3)",
    card: "var(--card-shadow)",
    hover: "0 0 8px rgba(0,201,167,0.3)",
    text: "0 0 4px rgba(255,255,255,0.2)",
    sectionTitleGlow: "0 0 6px rgba(0,201,167,0.14), 0 0 12px rgba(0,123,255,0.08)",
    titleGlow: "0 0 8px rgba(0,123,255,0.12), 0 0 16px rgba(255,64,129,0.06)",
    subtitleGlow: "0 0 6px rgba(0,201,167,0.08)",
    textGlow: "0 0 6px rgba(0,123,255,0.06)",
    cardShadow: "var(--card-shadow-hover)",
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
    navbarBottom: "1px solid var(--border-color)",
    activeLink: "2px solid var(--accent-cyan)",
    footerTop: "1px solid var(--border-light)",
    card: "1px solid var(--border-color)",
  },
  animations: {
    glowPulse: "glowPulse 2.5s infinite alternate",
    transition: "all 0.25s ease-in-out",
  },
  cssVariables: {
    "--primary-color": "#007bff",
    "--secondary-color": "var(--accent-cyan)",
    "--accent-color": "var(--accent-pink)",
    "--background-color": "var(--bg-primary)",
    "--text-color": "var(--text-primary)",
    "--hover-color": "var(--accent-cyan)",
    "--transition": "all 0.25s ease",
  },
};

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