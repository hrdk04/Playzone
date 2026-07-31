import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";
import { SkeletonGrid } from "../components/Skeleton";
import "./Home.css";

const getGameThumbnail = (game) => {
  const thumbnails = {
    bgmi: "/bgmi-tournament-thumbnail.png",
    pubg: "/pubg-tournament-thumbnail.png",
    cod: "/call-of-duty-tournament-thumbnail.png",
    ff: "/free-fire-tournament-thumbnail.png",
    bgm: "/bgmi-tournament-thumbnail.png",
  };
  return thumbnails[game.toLowerCase()] || "/bgmi-tournament-thumbnail.png";
};

const getGameIcon = (game) => {
  const icons = {
    bgmi: "🎯",
    pubg: "🪖",
    cod: "💥",
    ff: "🔥",
    bgm: "🎯",
  };
  return icons[game.toLowerCase()] || "🎮";
};

export default function Home() {
  const navigate = useNavigate();
  const [featuredTournaments, setFeaturedTournaments] = useState([]);
  const [marqueeThumbnails, setMarqueeThumbnails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ tournamentsCount: 0, playersCount: 0, activePlayers: 0 });

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const response = await axios.get("http://localhost:5000/admin/tournaments");
        const tournaments = response.data;
        
        // Get Top 3 Upcoming Tournaments for the cards
        const upcoming = tournaments
          .filter((t) => t.t_status === "pending")
          .slice(0, 3);
        setFeaturedTournaments(upcoming);

        // Compute dynamic stats for the ticker
        const totalPrizePool = tournaments.reduce((acc, t) => 
          acc + (t.rewards?.first || 0) + (t.rewards?.second || 0) + (t.rewards?.third || 0), 0);
        
        setStats({
          tournamentsCount: tournaments.length,
          totalPrizePool: totalPrizePool,
          activePlayers: Math.floor(Math.random() * 500) + 1200 // Simulated active players
        });

        // Extract unique games/thumbnails for the scrolling marquee
        const uniqueGames = [];
        const seenGames = new Set();
        
        tournaments.forEach(t => {
          if (!seenGames.has(t.game)) {
            seenGames.add(t.game);
            uniqueGames.push({
              game: t.game,
              icon: getGameIcon(t.game),
              thumbnail: t.thumbnail || getGameThumbnail(t.game)
            });
          }
        });
        
        setMarqueeThumbnails([...uniqueGames, ...uniqueGames, ...uniqueGames]);
      } catch (error) {
        console.error("Error fetching home data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchHomeData();
  }, []);

  return (
    <div className="home-container">
      {/* Premium Hero Section */}
      <header className="home-hero">
        <span className="hero-badge">
          <span>⚡</span> Next-Gen E-Sports Platform
        </span>
        <h1 className="hero-title">
          DOMINATE THE <span>ARENA</span>
        </h1>
        <p className="hero-subtitle">
          India's most competitive gaming tournament platform. Battle in BGMI, PUBG, COD & Free Fire. 
          Register your squad, claim victory, and withdraw real cash prizes instantly.
        </p>
        <div className="btn-group">
          <Link to="/signup" className="btn-primary-gaming">
            <span>🚀</span> Join the Battle
          </Link>
          <Link to="/tournaments" className="btn-secondary-gaming">
            <span>🎮</span> Browse Tournaments
          </Link>
        </div>
      </header>

      {/* Live Stats Ticker Bar */}
      <div className="stats-ticker">
        <div className="stat-box">
          <div className="stat-number">
            {stats.activePlayers.toLocaleString()}+
          </div>
          <div className="stat-label">Active Gamers</div>
        </div>
        <div className="stat-box">
          <div className="stat-number">
            ₹{stats.totalPrizePool ? stats.totalPrizePool.toLocaleString() : "1,00,000+"}
          </div>
          <div className="stat-label">Prize Pool Distributed</div>
        </div>
        <div className="stat-box">
          <div className="stat-number">
            {stats.tournamentsCount}+
          </div>
          <div className="stat-label">Tournaments Hosted</div>
        </div>
        <div className="stat-box">
          <div className="stat-number">100%</div>
          <div className="stat-label">Instant Payouts</div>
        </div>
      </div>

      {/* Infinite Scrolling Games Marquee */}
      {!loading && marqueeThumbnails.length > 0 && (
        <div className="marquee-wrapper">
          <div className="marquee-content">
            {marqueeThumbnails.map((item, index) => (
              <div 
                key={index} 
                className="marquee-item"
                onClick={() => navigate("/tournaments")}
              >
                <img src={item.thumbnail} alt={item.game} />
                <div className="marquee-overlay">
                  <span>{item.icon}</span> {item.game.toUpperCase()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Featured Tournaments Section */}
      <section>
        <div className="section-header">
          <h2 className="section-title">🔥 Featured Tournaments</h2>
          <p className="section-subtitle">High-stakes battles with massive prize pools. Secure your slot now!</p>
        </div>

        {loading ? (
          <SkeletonGrid count={3} />
        ) : (
          <div className="grid-container">
            {featuredTournaments.length > 0 ? featuredTournaments.map((t) => (
              <div key={t._id} className="tournament-card" onClick={() => navigate("/tournaments")}>
                <div className="tournament-img-wrapper">
                  <img
                    src={t.thumbnail || getGameThumbnail(t.game)}
                    alt={t.game}
                    className="tournament-img"
                  />
                  <span className="status-badge">
                    <span>⚡</span> UPCOMING
                  </span>
                </div>
                <div className="tournament-info">
                  <h3>{t.t_id}</h3>
                  <p><span>{getGameIcon(t.game)}</span> <strong>Game:</strong> {t.game.toUpperCase()}</p>
                  <p><span>🗺️</span> <strong>Map:</strong> {t.map}</p>
                  <p><span>📅</span> <strong>Date:</strong> {new Date(t.t_date).toLocaleDateString()} • {t.t_time}</p>
                  <div className="tournament-prizes">
                    <span className="prize-entry">
                      <span>💳</span> Entry: ₹{t.entry_fee}
                    </span>
                    <span className="prize-pool">
                      <span>🏆</span> Pool: ₹{(t.rewards.first + t.rewards.second + t.rewards.third).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            )) : (
              <div style={{ 
                gridColumn: "1 / -1", 
                textAlign: "center", 
                padding: "60px 20px",
                color: "var(--text-secondary)",
                fontSize: "1.2rem"
              }}>
                <span style={{ fontSize: "3rem", display: "block", marginBottom: "20px" }}>🎮</span>
                No upcoming tournaments. Check back soon for new battles!
              </div>
            )}
          </div>
        )}
        
        {!loading && featuredTournaments.length > 0 && (
          <div style={{ textAlign: "center", marginTop: "50px" }}>
            <button onClick={() => navigate("/tournaments")} className="btn-primary-gaming">
              View All Tournaments <span>→</span>
            </button>
          </div>
        )}
      </section>

      {/* Why Choose Playzone Section */}
      <section>
        <div className="section-header">
          <h2 className="section-title">Why Choose Playzone?</h2>
          <p className="section-subtitle">Built by competitive gamers, for champions who demand excellence</p>
        </div>
        <div className="grid-container">
          {[
            { 
              icon: "🏆", 
              title: "Pro-Level Tournaments", 
              desc: "Structured brackets, fair-play enforcement, and automated room ID delivery. No delays, no disputes." 
            },
            { 
              icon: "⚡", 
              title: "Instant Wallet Payouts", 
              desc: "Winnings credited automatically to your dashboard within minutes. Zero withdrawal hassles, 24/7 support." 
            },
            { 
              icon: "💬", 
              title: "Squad Social Hub", 
              desc: "Connect with fellow gamers, build your team reputation, track rivalries, and find your perfect squad." 
            },
            { 
              icon: "🔒", 
              title: "Secure & Fair Gaming", 
              desc: "Anti-cheat measures, verified payments, and transparent tournament results. Your gaming experience, protected." 
            },
            { 
              icon: "📱", 
              title: "Mobile-First Experience", 
              desc: "Optimized for mobile gaming. Register, join matches, and track results from anywhere, anytime." 
            },
            { 
              icon: "🎁", 
              title: "Daily Rewards & Bonuses", 
              desc: "Earn bonus credits, referral rewards, and special tournament entries. More ways to boost your gaming bankroll." 
            },
          ].map((f, i) => (
            <div key={i} className="feature-card">
              <div className="card-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section style={{ textAlign: "center", padding: "60px 20px" }}>
        <div style={{
          background: "var(--bg-secondary)",
          border: "2px solid var(--accent-cyan)",
          borderRadius: "24px",
          padding: "60px 40px",
          maxWidth: "800px",
          margin: "0 auto",
          boxShadow: "var(--glow-cyan)"
        }}>
          <h2 style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: "clamp(2rem, 5vw, 3rem)",
            fontWeight: 800,
            color: "var(--text-primary)",
            marginBottom: "20px",
            textTransform: "uppercase",
            letterSpacing: "2px"
          }}>
            Ready to <span style={{ color: "var(--accent-cyan)" }}>Dominate</span>?
          </h2>
          <p style={{
            color: "var(--text-secondary)",
            fontSize: "1.15rem",
            marginBottom: "30px",
            lineHeight: "1.7"
          }}>
            Join thousands of competitive gamers already battling on Playzone. 
            Create your free account and start your journey to e-sports glory today.
          </p>
          <div className="btn-group" style={{ justifyContent: "center" }}>
            <Link to="/signup" className="btn-primary-gaming">
              <span>🎮</span> Start Playing Now
            </Link>
            <Link to="/about" className="btn-secondary-gaming">
              <span>ℹ️</span> Learn More
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}