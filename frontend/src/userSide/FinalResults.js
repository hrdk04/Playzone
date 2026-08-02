"use client";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./FinalResults.css";
import API_BASE_URL from "../config/apiConfig";

const FinalResults = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [tournament, setTournament] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const emailOrUsername = localStorage.getItem("userName");

  useEffect(() => {
    const fetchTournamentResults = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/admin/tournaments/${id}`);
        setTournament(response.data);
        if (emailOrUsername) {
          const userRes = await axios.get(`${API_BASE_URL}/user/${emailOrUsername}`);
          setUserData(userRes.data);
        } else {
          setUserData(null);
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

  const handleBack = () => navigate(-1);

  const shareResults = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Tournament Results - ${tournament?.game}`,
          text: `Check out the results of ${tournament?.game} tournament!`,
          url: window.location.href,
        });
      } catch (shareError) {
        console.error("Error sharing:", shareError);
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        alert("Tournament results URL copied to clipboard!");
      } catch (clipError) {
        console.error("Error copying to clipboard:", clipError);
      }
    }
  };

  if (loading) {
    return (
      <div className="final-results-loading">
        <div className="final-results-spinner" />
        <p className="final-results-loading-text">Loading tournament results...</p>
      </div>
    );
  }

  if (error || !tournament) {
    return (
      <div className="final-results-error">
        <h2>Tournament Results Not Found</h2>
        <p>The tournament results you're looking for could not be found.</p>
      </div>
    );
  }

  if (!tournament.result_published) {
    return (
      <div className="final-results-unpublished">
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

  const getPlaceClass = (position) => {
    if (position === 1) return "place-first";
    if (position === 2) return "place-second";
    return "place-third";
  };

  const isCurrentUser = (name) => {
    return userData?.fullName === name || userData?.username === name;
  };

  const getRankLabel = (position) => {
    if (position === 1) return "CHAMPION";
    if (position === 2) return "RUNNER UP";
    return "THIRD PLACE";
  };

  const prizePool =
    (tournament.rewards?.first || 0) +
    (tournament.rewards?.second || 0) +
    (tournament.rewards?.third || 0);

  const champion = winners.find(w => w.position === 1);
  const secondPlace = winners.find(w => w.position === 2);
  const thirdPlace = winners.find(w => w.position === 3);

  const renderWinnerCard = (winner) => (
    <div
      key={winner.position}
      className={`final-results-winner-card ${getPlaceClass(winner.position)} ${isCurrentUser(winner.name) ? "is-current-user" : ""}`}
    >
      {isCurrentUser(winner.name) && (
        <div className="you-badge">⭐ YOU ⭐</div>
      )}
        1
      <div className="winner-medal-icon">
        {winner.position === 1 && <div className="trophy-icon">🏆</div>}
        {winner.position === 2 && <div className="medal-silver">◆</div>}
        {winner.position === 3 && <div className="medal-bronze">●</div>}
      </div>
      
      <div className="winner-rank">{getRankLabel(winner.position)}</div>
      <div className="winner-name">{winner.name}</div>
      <div className="winner-team">Team: {winner.team}</div>
      
      {winner.prize > 0 && (
        <div className="winner-prize">₹{winner.prize}</div>
      )}
    </div>
  );

  const StatCard = ({ icon, label, value }) => (
    <div className="stat-card">
      <div className="stat-icon">{icon}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );

  return (
    <div className="final-results-page">
      <div className="background-particles">
        {[...Array(20)].map((_, i) => (
          <div key={i} className="particle" style={{ animationDelay: `${i * 0.2}s` }} />
        ))}
      </div>

      <button type="button" onClick={handleBack} className="final-results-back-btn">
        ← Back
      </button>

      <div className="final-results-container">
        <div className="final-results-card">
          <header className="final-results-header">
            <div className="header-spotlight" />
            <h1 className="final-results-title">TOURNAMENT RESULTS</h1>
            <h2 className="final-results-tournament-name">
              {tournament.name || `Tournament ${tournament.t_id}`}
            </h2>
            {/* <div className="tournament-meta-row">
              <p className="final-results-meta">{tournament.game.toUpperCase()}</p>
              <p className="final-results-meta">•</p>
              <p className="final-results-meta">{tournament.map}</p>
            </div>
            <div className="tournament-meta-row">
              <p className="final-results-meta">{new Date(tournament.t_date).toLocaleDateString()}</p>
              <p className="final-results-meta">•</p>
              <p className="final-results-meta">{tournament.t_time}</p>
            </div>
            <div className="prize-pool-display">
              <span className="prize-label">PRIZE POOL</span>
              <span className="prize-value">₹{prizePool}</span>
            </div> */}
          </header>

          {winners.length > 0 ? (
            <section className="final-results-winners-section">
              {champion && (
                <div className="champion-section">
                  <div className="crown-icon">👑</div>
                  {renderWinnerCard(champion)}
                </div>
              )}

              <div className="podium-lower">
                {secondPlace && renderWinnerCard(secondPlace)}
                {thirdPlace && renderWinnerCard(thirdPlace)}
              </div>
            </section>
          ) : (
            <div className="final-results-no-winners">
              <h3>No Winners Announced</h3>
              <p>Winner information is not available yet.</p>
            </div>
          )}

          <section className="final-results-details">
            <h4 className="final-results-details-title">TOURNAMENT STATISTICS</h4>
            <div className="final-results-details-grid">
              <StatCard icon="🎮" label="Game" value={tournament.game.toUpperCase()} />
              <StatCard icon="🗺️" label="Map" value={tournament.map} />
              <StatCard icon="⚔️" label="Mode" value={tournament.mode_type?.toUpperCase() || "SOLO"} />
              <StatCard icon="👥" label="Players" value={tournament.participants?.length || 0} />
              <StatCard icon="💵" label="Entry Fee" value={`₹${tournament.entry_fee}`} />
              <StatCard icon="🏆" label="Prize Pool" value={`₹${prizePool}`} />
            </div>
          </section>

          <div className="final-results-share-section">
            <button type="button" onClick={shareResults} className="final-results-share-btn">
              SHARE RESULTS
            </button>
          </div>

          <footer className="final-results-footer">
            <p className="footer-congrats">🎉 Congratulations to all participants!</p>
            <p className="footer-thanks">Thank you for competing. See you in the next tournament!</p>
            <p className="footer-powered">
              Powered by <strong>PLAYZONE</strong>
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default FinalResults;