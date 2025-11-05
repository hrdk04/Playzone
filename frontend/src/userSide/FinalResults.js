"use client";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import theme from "../theme";

const FinalResults = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [tournament, setTournament] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const emailOrUsername = localStorage.getItem("userName");

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const fetchTournamentResults = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/admin/tournaments/${id}`);
        setTournament(response.data);
        
        if (emailOrUsername) {
          const userRes = await axios.get(`http://localhost:5000/user/${emailOrUsername}`);
          setUserData(userRes.data);
        }
      } catch (err) {
        console.error("Error fetching tournament results:", err);
        setError("Failed to load tournament results");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchTournamentResults();
  }, [id, emailOrUsername]);

  const shareResults = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Tournament Results - ${tournament?.game}`,
          text: `Check out the results!`,
          url: url,
        });
      } catch (error) {
        navigator.clipboard.writeText(url);
        alert("Link copied!");
      }
    } else {
      navigator.clipboard.writeText(url);
      alert("Link copied!");
    }
  };

  if (loading) {
    return (
      <div style={styles.centerScreen}>
        <div style={styles.spinner}></div>
        <p style={{ marginTop: "1rem", color: "#999" }}>Loading...</p>
      </div>
    );
  }

  if (error || !tournament) {
    return (
      <div style={styles.centerScreen}>
        <h2 style={{ color: "#fff", marginBottom: "1rem" }}>Results Not Found</h2>
        <button onClick={() => navigate(-1)} style={styles.btn}>Go Back</button>
      </div>
    );
  }

  if (!tournament.result_published) {
    return (
      <div style={styles.centerScreen}>
        <h2 style={{ color: "#fff", marginBottom: "1rem" }}>Results Not Published Yet</h2>
        <button onClick={() => navigate(-1)} style={styles.btn}>Go Back</button>
      </div>
    );
  }

  const winners = tournament.participants
    .filter((p) => p.rank > 0)
    .sort((a, b) => a.rank - b.rank)
    .map((p) => ({
      rank: p.rank,
      name: p.user_id?.fullName || p.user_id?.username || "Unknown",
      team: p.team_name || "Solo",
      prize: p.rank === 1 ? tournament.rewards?.first || 0
           : p.rank === 2 ? tournament.rewards?.second || 0
           : p.rank === 3 ? tournament.rewards?.third || 0
           : 0,
    }));

  const isWinner = winners.some(w => w.name === userData?.fullName);

  return (
    <>
      <style>
        {`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          
          @keyframes pulse {
            0%, 100% { opacity: 0.8; }
            50% { opacity: 1; }
          }

          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }

          .winner-card {
            transition: transform 0.3s ease, box-shadow 0.3s ease;
          }

          .winner-card:hover {
            transform: translateY(-8px);
            box-shadow: 0 15px 40px rgba(0, 255, 204, 0.2);
          }

          .fade-in {
            animation: fadeIn 0.6s ease-out forwards;
          }

          .glow-effect {
            position: relative;
          }

          .glow-effect::before {
            content: '';
            position: absolute;
            top: -2px;
            left: -2px;
            right: -2px;
            bottom: -2px;
            background: linear-gradient(45deg, #00FFCC, #0077FF, #00FFCC);
            border-radius: 18px;
            opacity: 0;
            transition: opacity 0.3s ease;
            z-index: -1;
          }

          .glow-effect:hover::before {
            opacity: 0.3;
          }
        `}
      </style>

      <div style={styles.container}>
        {/* Animated Background Gradient Point */}
        <div style={styles.backgroundGradient}></div>
        <div style={styles.backgroundGradient2}></div>
        
        <div style={styles.wrapper}>
          {/* Header */}

          
          {/* Tournament Title */}
          <div style={styles.titleSection} className="fade-in">
            <div style={styles.badge}>{tournament.game}</div>
            <h1 style={styles.title}>{tournament.name || `Tournament ${tournament.t_id}`}</h1>
            <p style={styles.subtitle}>
              {tournament.map} • {new Date(tournament.t_date).toLocaleDateString()}
            </p>
          </div>

          <div style={styles.header} className="fade-in">
            <button onClick={() => navigate(-1)} style={styles.backButton}>
              ← Back
            </button>
            <button onClick={shareResults} style={styles.shareButton}>
              Share ↗
            </button>
          </div>

          {/* Winner Announcement */}
          {isWinner && (
            <div style={styles.congratsCard} className="fade-in glow-effect">
              <div style={styles.congratsIcon}>🎉</div>
              <p style={{ margin: "0.5rem 0 0 0", fontSize: "1.2rem", fontWeight: "700" }}>
                Congratulations!
              </p>
              <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.95rem", opacity: 0.9 }}>
                You're a winner!
              </p>
            </div>
          )}

          {/* Winners Cards */}
          {winners.length > 0 ? (
            <div style={styles.winnersGrid}>
              {winners.map((winner, index) => (
                <div
                  key={winner.rank}
                  className="winner-card fade-in"
                  style={{
                    ...styles.winnerCard,
                    ...(winner.name === userData?.fullName ? styles.userCard : {}),
                    animationDelay: `${index * 0.1}s`,
                  }}
                >
                  {/* Rank Badge */}
                  <div style={{
                    ...styles.rankBadge,
                    background: winner.rank === 1 ? 'linear-gradient(135deg, #FFD700, #FFA500)'
                              : winner.rank === 2 ? 'linear-gradient(135deg, #C0C0C0, #A8A8A8)'
                              : 'linear-gradient(135deg, #CD7F32, #B8860B)',
                  }}>
                    <span style={{ fontSize: "1.8rem" }}>
                      {winner.rank === 1 ? "🥇" : winner.rank === 2 ? "🥈" : "🥉"}
                    </span>
                  </div>
                  
                  <div style={styles.cardContent}>
                    <div style={styles.rankText}>
                      {winner.rank === 1 ? "CHAMPION" 
                     : winner.rank === 2 ? "RUNNER-UP" 
                     : "2ND RUNNER-UP"}
                    </div>
                    <h3 style={styles.winnerName}>{winner.name}</h3>
                    <p style={styles.winnerTeam}>Team: {winner.team}</p>
                    
                    {winner.prize > 0 && (
                      <div style={styles.prizeContainer}>
                        <div style={styles.prizeLabel}>Prize Money</div>
                        <div style={styles.prizeTag}>
                          ₹{winner.prize.toLocaleString()}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={styles.noResults} className="fade-in">
              <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🏆</div>
              <p>No winners announced yet</p>
            </div>
          )}

          {/* Tournament Info */}
          <div style={styles.infoSection} className="fade-in">
            <h3 style={styles.infoTitle}>
              <span style={{ marginRight: "0.5rem" }}>📊</span>
              Tournament Info
            </h3>
            
            <div style={styles.infoGrid}>
              <InfoItem icon="💰" label="Entry Fee" value={`₹${tournament.entry_fee}`} />
              <InfoItem icon="🎮" label="Mode" value={tournament.mode_type || "Solo"} />
              <InfoItem icon="👥" label="Players" value={tournament.participants?.length || 0} />
              <InfoItem 
                icon="💎" 
                label="Prize Pool" 
                value={`₹${(tournament.rewards?.first || 0) + (tournament.rewards?.second || 0) + (tournament.rewards?.third || 0)}`} 
              />
            </div>
          </div>

          {/* Prize Breakdown */}
          {winners.length > 0 && (
            <div style={styles.prizeBreakdown} className="fade-in">
              <h3 style={styles.infoTitle}>
                <span style={{ marginRight: "0.5rem" }}>💸</span>
                Prize Distribution
              </h3>
              
              <div style={styles.prizeList}>
                {winners.map((winner) => (
                  <div key={winner.rank} style={styles.prizeItem}>
                    <div style={styles.prizeItemLeft}>
                      <span style={{ fontSize: "1.5rem", marginRight: "1rem" }}>
                        {winner.rank === 1 ? "🥇" : winner.rank === 2 ? "🥈" : "🥉"}
                      </span>
                      <div>
                        <div style={styles.prizeItemName}>{winner.name}</div>
                        <div style={styles.prizeItemRank}>
                          {winner.rank === 1 ? "1st Place" 
                         : winner.rank === 2 ? "2nd Place" 
                         : "3rd Place"}
                        </div>
                      </div>
                    </div>
                    <div style={styles.prizeItemAmount}>
                      ₹{winner.prize.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div style={styles.footer}>
            <p style={{ margin: 0 }}>
              Powered by <strong style={{ color: "#00FFCC" }}>PLAYZONE</strong>
            </p>
            <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.85rem", opacity: 0.6 }}>
              Where every gamer becomes a legend
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

const InfoItem = ({ icon, label, value }) => (
  <div style={styles.infoItem}>
    <div style={styles.infoIcon}>{icon}</div>
    <div>
      <span style={styles.infoLabel}>{label}</span>
      <span style={styles.infoValue}>{value}</span>
    </div>
  </div>
);

const styles = {
  container: {
    minHeight: "100vh",
    background: "#0a0a0a",
    backgroundImage: "url('https://st4.depositphotos.com/24297044/27344/v/450/depositphotos_273440920-stock-illustration-blue-background-gradient-abstract-texture.jpg')",
      backgroundRepeat: 'no-repeat',
      backgroundSize: "cover",
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
    padding: "20px",
    fontFamily: theme.fonts.primary,
    position: "relative",
    overflow: "hidden",
  },
  // ✅ RADIAL GRADIENT BACKGROUND EFFECT FROM TOP CENTER
  backgroundGradient: {
    position: "fixed",
    top: "-20%",
    left: "50%",
    transform: "translateX(-50%)",
    width: "80%",
    height: "60%",
    background: "radial-gradient(ellipse at center, rgba(0, 119, 255, 0.15) 0%, rgba(0, 119, 255, 0.08) 30%, transparent 70%)",
    borderRadius: "50%",
    filter: "blur(60px)",
    pointerEvents: "none",
    zIndex: 0,
    animation: "pulse 8s ease-in-out infinite",
  },
  backgroundGradient2: {
    position: "fixed",
    top: "-10%",
    left: "50%",
    transform: "translateX(-50%)",
    width: "60%",
    height: "50%",
    background: "radial-gradient(ellipse at center, rgba(0, 255, 204, 0.1) 0%, rgba(0, 255, 204, 0.05) 40%, transparent 70%)",
    borderRadius: "50%",
    filter: "blur(80px)",
    pointerEvents: "none",
    zIndex: 0,
    animation: "pulse 10s ease-in-out infinite reverse",
  },
  wrapper: {
    maxWidth: "900px",
    margin: "0 auto",
    paddingTop: "60px",
    paddingBottom: "40px",
    position: "relative",
    zIndex: 1,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "2rem",
    gap: "1rem",
    flexWrap: "wrap",
  },
  backButton: {
    padding: "12px 24px",
    background: "rgba(30, 30, 30, 0.8)",
    backdropFilter: "blur(10px)",
    border: "1px solid #333",
    borderRadius: "10px",
    color: "#fff",
    cursor: "pointer",
    fontSize: "0.95rem",
    fontWeight: "500",
    transition: "all 0.3s ease",
  },
  shareButton: {
    padding: "12px 24px",
    background: "linear-gradient(135deg, #00FFCC, #0077FF)",
    border: "none",
    borderRadius: "10px",
    color: "#fff",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "0.95rem",
    boxShadow: "0 4px 15px rgba(0, 255, 204, 0.3)",
    transition: "all 0.3s ease",
  },
  titleSection: {
    textAlign: "center",
    marginBottom: "3rem",
  },
  badge: {
    display: "inline-block",
    padding: "8px 20px",
    background: "rgba(0, 255, 204, 0.1)",
    border: "1px solid rgba(0, 255, 204, 0.3)",
    borderRadius: "25px",
    color: "#00FFCC",
    fontSize: "0.9rem",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: "1px",
    marginBottom: "1rem",
  },
  title: {
    fontSize: "2.5rem",
    fontWeight: "800",
    color: "#fff",
    margin: "0 0 0.75rem 0",
    textShadow: "0 2px 10px rgba(0, 255, 204, 0.3)",
  },
  subtitle: {
    color: "#888",
    fontSize: "1.1rem",
    margin: 0,
  },
  congratsCard: {
    background: "linear-gradient(135deg, rgba(0, 255, 204, 0.15), rgba(0, 119, 255, 0.15))",
    border: "2px solid rgba(0, 255, 204, 0.5)",
    borderRadius: "16px",
    padding: "2rem",
    textAlign: "center",
    marginBottom: "3rem",
    color: "#00FFCC",
    position: "relative",
    overflow: "hidden",
  },
  congratsIcon: {
    fontSize: "3rem",
    marginBottom: "0.5rem",
    animation: "pulse 2s ease-in-out infinite",
  },
  winnersGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "2rem",
    marginBottom: "3rem",
  },
  winnerCard: {
    background: "rgba(30, 30, 30, 0.8)",
    backdropFilter: "blur(10px)",
    border: "1px solid #333",
    borderRadius: "20px",
    padding: "2.5rem 2rem",
    textAlign: "center",
    position: "relative",
    opacity: 0,
  },
  userCard: {
    border: "2px solid #00FFCC",
    background: "rgba(0, 255, 204, 0.08)",
    boxShadow: "0 8px 32px rgba(0, 255, 204, 0.25)",
  },
  rankBadge: {
    width: "100px",
    height: "100px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 1.5rem auto",
    boxShadow: "0 8px 20px rgba(0, 0, 0, 0.3)",
  },
  cardContent: {
    
  },
  rankText: {
    fontSize: "0.75rem",
    fontWeight: "700",
    color: "#00FFCC",
    letterSpacing: "2px",
    marginBottom: "0.75rem",
  },
  winnerName: {
    fontSize: "1.5rem",
    fontWeight: "700",
    color: "#fff",
    margin: "0 0 0.5rem 0",
  },
  winnerTeam: {
    fontSize: "1rem",
    color: "#888",
    margin: "0 0 1.5rem 0",
  },
  prizeContainer: {
    background: "rgba(0, 0, 0, 0.3)",
    borderRadius: "12px",
    padding: "1rem",
  },
  prizeLabel: {
    fontSize: "0.8rem",
    color: "#888",
    marginBottom: "0.5rem",
    textTransform: "uppercase",
    letterSpacing: "1px",
  },
  prizeTag: {
    fontSize: "1.5rem",
    fontWeight: "800",
    color: "#FFD700",
    textShadow: "0 2px 10px rgba(255, 215, 0, 0.3)",
  },
  noResults: {
    textAlign: "center",
    padding: "4rem 2rem",
    color: "#666",
    fontSize: "1.2rem",
    background: "rgba(30, 30, 30, 0.5)",
    borderRadius: "16px",
    border: "1px dashed #333",
  },
  infoSection: {
    background: "rgba(30, 30, 30, 0.6)",
    backdropFilter: "blur(10px)",
    border: "1px solid #333",
    borderRadius: "20px",
    padding: "2rem",
    marginBottom: "2rem",
  },
  infoTitle: {
    fontSize: "1.4rem",
    fontWeight: "700",
    color: "#fff",
    margin: "0 0 1.5rem 0",
    display: "flex",
    alignItems: "center",
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "1.5rem",
  },
  infoItem: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    padding: "1rem",
    background: "rgba(0, 0, 0, 0.2)",
    borderRadius: "12px",
    transition: "transform 0.3s ease",
  },
  infoIcon: {
    fontSize: "2rem",
  },
  infoLabel: {
    display: "block",
    fontSize: "0.85rem",
    color: "#888",
    marginBottom: "0.25rem",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  infoValue: {
    display: "block",
    fontSize: "1.2rem",
    fontWeight: "700",
    color: "#fff",
  },
  prizeBreakdown: {
    background: "rgba(30, 30, 30, 0.6)",
    backdropFilter: "blur(10px)",
    border: "1px solid #333",
    borderRadius: "20px",
    padding: "2rem",
    marginBottom: "2rem",
  },
  prizeList: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  prizeItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "1.25rem",
    background: "rgba(0, 0, 0, 0.2)",
    borderRadius: "12px",
    borderLeft: "4px solid #00FFCC",
  },
  prizeItemLeft: {
    display: "flex",
    alignItems: "center",
  },
  prizeItemName: {
    fontSize: "1.1rem",
    fontWeight: "600",
    color: "#fff",
    marginBottom: "0.25rem",
  },
  prizeItemRank: {
    fontSize: "0.85rem",
    color: "#888",
  },
  prizeItemAmount: {
    fontSize: "1.5rem",
    fontWeight: "800",
    color: "#FFD700",
  },
  footer: {
    textAlign: "center",
    padding: "2rem 0 1rem 0",
    borderTop: "1px solid rgba(255, 255, 255, 0.1)",
    color: "#666",
    fontSize: "0.95rem",
  },
  centerScreen: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    background: "#0a0a0a",
    color: "#fff",
    textAlign: "center",
    position: "relative",
  },
  spinner: {
    width: "50px",
    height: "50px",
    border: "4px solid #333",
    borderTop: "4px solid #00FFCC",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  btn: {
    padding: "14px 32px",
    background: "linear-gradient(135deg, #00FFCC, #0077FF)",
    border: "none",
    borderRadius: "10px",
    color: "#fff",
    cursor: "pointer",
    fontWeight: "700",
    fontSize: "1rem",
    boxShadow: "0 4px 15px rgba(0, 255, 204, 0.3)",
  },
};

export default FinalResults;