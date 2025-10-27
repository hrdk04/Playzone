"use client";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import theme from "../theme";

const FinalResults = () => {
  const navigate = useNavigate();
  
    const handleBack = () => {
      navigate(-1);
    };
  const { id } = useParams();
  const [tournament, setTournament] = useState(null);
  const [userData,setUserData] =useState(null)
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const emailOrUsername = localStorage.getItem("userName");
  useEffect(() => {
    const fetchTournamentResults = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/admin/tournaments/${id}`);
        setTournament(response.data);
        if (emailOrUsername) {
          const userRes = await axios.get(`http://localhost:5000/user/${emailOrUsername}`);
          setUserData(userRes.data);
        } else {
          setUserData(null);
        }
        // console.log("UserName: ",userData.data.fullName)
      } catch (err) {
        console.error("Error fetching tournament results:", err);
        setError("Failed to load tournament results");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchTournamentResults();
  }, [id]);

  const shareResults = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Tournament Results - ${tournament?.game}`,
          text: `Check out the results of ${tournament?.game} tournament!`,
          url: window.location.href,
        });
      } catch (error) {
        console.error("Error sharing:", error);
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        alert("Tournament results URL copied to clipboard!");
      } catch (error) {
        console.error("Error copying to clipboard:", error);
      }
    }
  };

  if (loading) {
    return (
      
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          background: theme.gradients.background,
          color: theme.colors.lightGray,
          fontFamily: theme.fonts.primary,
        }}
      >
        
        Loading tournament results...
      </div>
    );
  }

  if (error || !tournament) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "2rem",
          background: theme.gradients.background,
          color: theme.colors.lightGray,
          minHeight: "100vh",
        }}
      >
        <h2>Tournament Results Not Found</h2>
        <p>The tournament results you're looking for could not be found.</p>
      </div>
    );
  }

  if (!tournament.result_published) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "2rem",
          background: theme.gradients.background,
          color: theme.colors.lightGray,
          minHeight: "100vh",
        }}
      >
        <h2>Results Not Published Yet</h2>
        <p>The tournament results have not been published yet. Please check back later.</p>
      </div>
    );
  }

  const winners = tournament.participants
    .filter((p) => p.rank > 0)
    .sort((a, b) => a.rank - b.rank)
    .map((p) => ({
      position: p.rank,
      name: p.user_id?.fullName || p.user_id?.username || "Unknown",
      team: p.team_name || "Solo",
      prize:
        p.rank === 1
          ? tournament.rewards?.first || 0
          : p.rank === 2
          ? tournament.rewards?.second || 0
          : p.rank === 3
          ? tournament.rewards?.third || 0
          : 0,
    }));

 

  return (
    <>
       {<style>
{`
  @keyframes prizeSmallBig {
    from { font-size: 2.5rem; transform: rotateY(0deg); }
    to {font-size: 3rem; transform: rotateY(360deg);}
  }
  @keyframes winnerUser{
  from{box-shadow:inset 1px 2px 100px #d13a3aff; tranform: rotateY(0deg);}
  to{box-shadow:inset 1px 2px 100px #d61fbdff; tranform: rotate(360deg)}
  }
`}
</style>
}

      <div
        style={{
          backgroundImage:" url('https://st4.depositphotos.com/24297044/27344/v/450/depositphotos_273440920-stock-illustration-blue-background-gradient-abstract-texture.jpg')",
        backgroundRepeat:'no-repeat',
        backgroundSize:"cover",
        backgroundPosition:'center',
        backgroundAttachment:'fixed',
          minHeight: "100vh",
          width: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
          padding: "80px 0",
          overflowX: "hidden",
        }}
        
      >
        <div
          style={{
            background:' rgba(0,0,0,0.2)',
            border: "2px solid darkblue",
            borderRadius: "14px",
            boxShadow: theme.shadows.cardShadow,
            padding: "2rem",
            width: "90%",
            maxWidth: "900px",
            color: theme.colors.white,
            fontFamily: theme.fonts.primary,
          }}
        
        >
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <button onClick={handleBack} style={styles.backButton} onMouseEnter={(e)=>{
              e.target.style.border="1px solid darkcyan";
            }}
            onMouseLeave={(e)=>{
              e.target.style.border="none";
            }}
            >
              ← Back
            </button>
            <h1
              style={{
                fontSize: "2rem",
                color: theme.colors.primary,
                textShadow: theme.shadows.titleGlow,
                marginBottom: "1rem",
              }}
            >
              🏆 TOURNAMENT RESULTS 🏆
            </h1>

            <h2
              style={{
                fontSize: "1.5rem",
                color: theme.colors.secondary,
                marginBottom: "0.5rem",
              }}
            >
              {tournament.name || `Tournament ${tournament.t_id}`}
            </h2>

            <p style={{ color: theme.colors.lightGray, fontSize: "1.1rem" }}>
              {tournament.game.toUpperCase()} • {tournament.map}
            </p>

            <p style={{ color: theme.colors.lightGray }}>
              {new Date(tournament.t_date).toLocaleDateString()} • {tournament.t_time}
            </p>
          </div>

          {/* Winners */}
          {winners.length > 0 ? (
            <div style={{ marginBottom: "2rem" }}>
              <h3
                style={{
                  color: theme.colors.secondary,
                  textAlign: "center",
                  marginBottom: "1.5rem",
                  fontSize: "1.3rem",
                  textShadow: theme.shadows.subtitleGlow,
                }}
              >
                WINNERS
              </h3>

              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {winners.map((winner) => (
                  <div
                    key={winner.position}
                    style={{
                      background:
                        winner.position === 1
                          ? "linear-gradient(45deg, #FFD700, #FFA500)"
                          : winner.position === 2
                          ? "linear-gradient(45deg, #C0C0C0, #808080)"
                          : "linear-gradient(45deg, #CD7F32, #8B4513)",
                      borderRadius: "10px",
                      padding: "1.5rem",
                      textAlign: "center",
                      color: "#000",
                      fontWeight: "bold",
                      animation: userData?.fullName ===winner.name? "winnerUser 2s infinite alternate": 'none',
                      boxShadow: theme.shadows.card,
                    }}
                  >
                    
                    
                    <div style={{ fontSize: "2rem", marginBottom: "0.5rem", animation: userData?.fullName === winner.name ? "prizeSmallBig 2s infinite alternate" : ''
 }}                    
                    >
                      {winner.position === 1 
                        ? "🥇"
                        : winner.position === 2
                        ? "🥈"
                        : "🥉"}
                    </div>

                    <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>
                      {winner.position === 1
                        ? "1st PLACE"
                        : winner.position === 2
                        ? "2nd PLACE"
                        : "3rd PLACE"}
                    </div>

                    <div style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>
                      {winner.name}
                    </div>

                    <div style={{ fontSize: "1rem", opacity: 0.8 }}>Team: {winner.team}</div>

                    {winner.prize > 0 && (
                      <div
                        style={{
                          fontSize: "1.1rem",
                          marginTop: "0.5rem",
                          background: "rgba(0,0,0,0.2)",
                          padding: "0.5rem",
                          borderRadius: "4px",
                        }}
                      >
                        Prize: ₹{winner.prize}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "2rem", color: theme.colors.lightGray }}>
              <h3>No Winners Announced</h3>
              <p>Winner information is not available yet.</p>
            </div>
          )}

          {/* Tournament Info */}
          <div
            style={{
              background: "rgba(0, 255, 200, 0.05)",
              border: `1px solid ${theme.colors.secondary}`,
              borderRadius: "10px",
              padding: "1.5rem",
              marginBottom: "2rem",
            }}
          >
            <h4 style={{ color: theme.colors.secondary, marginBottom: "1rem" }}>
              Tournament Details
            </h4>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div>
                <strong style={{ color: theme.colors.white }}>Game:</strong>
                <span style={{ color: theme.colors.lightGray, marginLeft: "0.5rem" }}>
                  {tournament.game.toUpperCase()}
                </span>
              </div>
              <div>
                <strong style={{ color: theme.colors.white }}>Map:</strong>
                <span style={{ color: theme.colors.lightGray, marginLeft: "0.5rem" }}>
                  {tournament.map}
                </span>
              </div>
              <div>
                <strong style={{ color: theme.colors.white }}>Mode:</strong>
                <span style={{ color: theme.colors.lightGray, marginLeft: "0.5rem" }}>
                  {tournament.mode_type?.toUpperCase() || "SOLO"}
                </span>
              </div>
              <div>
                <strong style={{ color: theme.colors.white }}>Entry Fee:</strong>
                <span style={{ color: theme.colors.lightGray, marginLeft: "0.5rem" }}>
                  ₹{tournament.entry_fee}
                </span>
              </div>
              <div>
                <strong style={{ color: theme.colors.white }}>Total Participants:</strong>
                <span style={{ color: theme.colors.lightGray, marginLeft: "0.5rem" }}>
                  {tournament.participants?.length || 0}
                </span>
              </div>
              <div>
                <strong style={{ color: theme.colors.white }}>Prize Pool:</strong>
                <span style={{ color: theme.colors.lightGray, marginLeft: "0.5rem" }}>
                  ₹
                  {(tournament.rewards?.first || 0) +
                    (tournament.rewards?.second || 0) +
                    (tournament.rewards?.third || 0)}
                </span>
              </div>
            </div>
          </div>

          {/* Share Button */}
          <div style={{ textAlign: "center" }}>
            <button
              onClick={shareResults}
              style={{
                padding: theme.spacing.buttonPadding,
                borderRadius: "8px",
                border: "none",
                background: theme.gradients.primaryButton,
                color: theme.colors.white,
                cursor: "pointer",
                fontWeight: 600,
                fontSize: "1rem",
                boxShadow: theme.shadows.button,
                transition: theme.animations.transition,
              }}
            >
              📤 Share Results
            </button>
          </div>

          {/* Footer */}
          <div
            style={{
              textAlign: "center",
              marginTop: "2rem",
              paddingTop: "1rem",
              borderTop: theme.borders.navbarBottom,
              color: theme.colors.lightGray,
              fontSize: "0.9rem",
            }}
          >
            <p>
              Powered by <strong style={{ color: theme.colors.primary }}>PLAYZONE</strong> 🎯
            </p>
            <p style={{ fontSize: "0.8rem", opacity: 0.7 }}>
              "Where every gamer becomes a legend."
            </p>
          </div>
        </div>
      </div>
    </>
  );
};
const styles = {
  backButton: {
    position: "fixed",
    top: "10%",
    right: "15%",
    zIndex: 9999,
    padding: "10px 20px",
    borderRadius: "8px",
    background: theme.gradients.secondaryButton,
    color: theme.colors.white,
    border: "none",
    fontFamily: theme.fonts.primary,
    fontSize: "1rem",
    cursor: "pointer",
    boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
    transition: "all 0.3s ease",
  },
};

export default FinalResults;
