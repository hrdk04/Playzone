import React from "react";
import { Link } from "react-router-dom";
import "./About.css";

export default function About() {
  return (
    <div className="about-page-container">
      {/* Hero Section */}
      <div className="about-hero">
        <span className="about-badge">⚡ About Playzone</span>
        <h1 className="about-title">
          DOMINATE THE <span>ARENA</span>
        </h1>
        <p className="about-subtitle">
          India's premier e-sports tournament platform. Built by gamers, for champions who demand excellence.
        </p>
      </div>

      {/* Stats Section */}
      <div className="about-stats-grid">
        <div className="stat-card">
          <div className="stat-icon">🎮</div>
          <div className="stat-number">50K+</div>
          <div className="stat-label">Active Gamers</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🏆</div>
          <div className="stat-number">2,500+</div>
          <div className="stat-label">Tournaments Hosted</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-number">₹50L+</div>
          <div className="stat-label">Prize Pool Distributed</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⚡</div>
          <div className="stat-number">24/7</div>
          <div className="stat-label">Support Available</div>
        </div>
      </div>

      {/* Mission Section */}
      <div className="about-section">
        <div className="section-header">
          <h2 className="section-title">Our Mission</h2>
          <div className="section-underline"></div>
        </div>
        <div className="about-content">
          <p className="about-text">
            Playzone is India's most competitive gaming tournament platform, designed to transform casual mobile gaming into a professional e-sports career. We provide a secure, fair, and rewarding environment where gamers can compete in BGMI, PUBG Mobile, Call of Duty, and Free Fire tournaments with real cash prizes.
          </p>
          <p className="about-text">
            Our mission is to democratize e-sports in India by providing every gamer—from beginners to professionals—with the opportunity to showcase their skills, build their reputation, and earn real money doing what they love. We believe that every match counts, every victory matters, and every gamer deserves a chance to become a champion.
          </p>
        </div>
      </div>

      {/* Supported Games Section */}
      <div className="about-section">
        <div className="section-header">
          <h2 className="section-title">Supported Games</h2>
          <div className="section-underline"></div>
        </div>
        <div className="games-grid">
          {[
            { name: "BGMI", icon: "🎯", desc: "Battlegrounds Mobile India - The ultimate battle royale experience", color: "var(--accent-cyan)" },
            { name: "PUBG Mobile", icon: "🪖", desc: "The original battle royale that started it all", color: "var(--accent-orange)" },
            { name: "Call of Duty", icon: "💥", desc: "Fast-paced tactical shooter action", color: "var(--accent-pink)" },
            { name: "Free Fire", icon: "🔥", desc: "Ultimate survival shooter with intense gameplay", color: "var(--accent-purple)" },
          ].map((game, index) => (
            <div key={index} className="game-card" style={{ borderColor: game.color }}>
              <div className="game-icon" style={{ color: game.color }}>{game.icon}</div>
              <h3 className="game-name">{game.name}</h3>
              <p className="game-desc">{game.desc}</p>
              <Link to="/tournaments" className="game-link">
                View Tournaments →
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Why Choose Us Section */}
      <div className="about-section">
        <div className="section-header">
          <h2 className="section-title">Why Choose Playzone?</h2>
          <div className="section-underline"></div>
        </div>
        <div className="features-grid">
          {[
            { icon: "🏆", title: "Pro-Level Tournaments", desc: "Structured brackets, fair-play enforcement, and automated room ID delivery. No delays, no disputes." },
            { icon: "⚡", title: "Instant Wallet Payouts", desc: "Winnings credited automatically to your dashboard within minutes. Zero withdrawal hassles, 24/7 support." },
            { icon: "🔒", title: "Secure & Fair Gaming", desc: "Anti-cheat measures, verified payments, and transparent tournament results. Your gaming experience, protected." },
            { icon: "📊", title: "Performance Analytics", desc: "Track your gaming stats, win rate, and tournament history. Build your e-sports portfolio." },
            { icon: "💬", title: "Squad Social Hub", desc: "Connect with fellow gamers, build your team reputation, track rivalries, and find your perfect squad." },
            { icon: "🎁", title: "Daily Rewards & Bonuses", desc: "Earn bonus credits, referral rewards, and special tournament entries. More ways to boost your gaming bankroll." },
          ].map((feature, index) => (
            <div key={index} className="feature-card">
              <div className="feature-icon">{feature.icon}</div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-desc">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tournament Types Section */}
      <div className="about-section">
        <div className="section-header">
          <h2 className="section-title">Tournament Types</h2>
          <div className="section-underline"></div>
        </div>
        <div className="tournament-types">
          {[
            { tier: "Elite", prize: "₹10,000+", entry: "₹500+", desc: "For professional gamers with high skill levels" },
            { tier: "Challenger", prize: "₹5,000 - ₹10,000", entry: "₹200 - ₹500", desc: "For experienced players looking to level up" },
            { tier: "Starter", prize: "₹500 - ₹5,000", entry: "₹50 - ₹200", desc: "Perfect for beginners to start their journey" },
          ].map((type, index) => (
            <div key={index} className="tournament-type-card">
              <div className="tier-badge">{type.tier}</div>
              <h3 className="tier-prize">{type.prize}</h3>
              <p className="tier-entry">Entry: {type.entry}</p>
              <p className="tier-desc">{type.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="about-cta">
        <h2 className="cta-title">Ready to Start Your Journey?</h2>
        <p className="cta-subtitle">
          Join thousands of competitive gamers already battling on Playzone. Create your free account and start your journey to e-sports glory today.
        </p>
        <div className="cta-buttons">
          <Link to="/signup" className="btn-primary-gaming">
            <span>🚀</span> Join Now
          </Link>
          <Link to="/tournaments" className="btn-secondary-gaming">
            <span>🎮</span> Browse Tournaments
          </Link>
        </div>
      </div>
    </div>
  );
}