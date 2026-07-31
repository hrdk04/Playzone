"use client";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./FinalResults.css";

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
        const response = await axios.get(`http://localhost:5000/admin/tournaments/${id}`);
        setTournament(response.data);
        if (emailOrUsername) {
          const userRes = await axios.get(`http://localhost:5000/user/${emailOrUsername}`);
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
        <p>The tournament results you&apos;re looking for could not be found.</p>
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

  const getMedal = (position) => {
    if (position === 1) return "🥇";
    if (position === 2) return "🥈";
    return "🥉";
  };

  const getRankLabel = (position) => {
    if (position === 1) return "1st Place";
    if (position === 2) return "2nd Place";
    return "3rd Place";
  };

  const prizePool =
    (tournament.rewards?.first || 0) +
    (tournament.rewards?.second || 0) +
    (tournament.rewards?.third || 0);

  return (
    <div className="final-results-page">
      <button type="button" onClick={handleBack} className="final-results-back-btn">
        ← Back
      </button>

      <div className="final-results-container">
        <div className="final-results-card">
          <header className="final-results-header">
            <h1 className="final-results-title">🏆 Tournament Results 🏆</h1>
            <h2 className="final-results-tournament-name">
              {tournament.name || `Tournament ${tournament.t_id}`}
            </h2>
            <p className="final-results-meta">
              {tournament.game.toUpperCase()} • {tournament.map}
            </p>
            <p className="final-results-meta">
              {new Date(tournament.t_date).toLocaleDateString()} • {tournament.t_time}
            </p>
          </header>

          {winners.length > 0 ? (
            <section className="final-results-winners-section">
              <h3 className="final-results-winners-title">Winners</h3>
              <div className="final-results-podium">
                {winners.map((winner) => {
                  const isCurrentUser = userData?.fullName === winner.name;
                  return (
                    <div
                      key={winner.position}
                      className={`final-results-winner-card ${getPlaceClass(winner.position)} ${isCurrentUser ? "is-current-user" : ""}`}
                    >
                      <div className="final-results-winner-medal">{getMedal(winner.position)}</div>
                      <div className="final-results-winner-rank">{getRankLabel(winner.position)}</div>
                      <div className="final-results-winner-name">{winner.name}</div>
                      <div className="final-results-winner-team">Team: {winner.team}</div>
                      {winner.prize > 0 && (
                        <div className="final-results-winner-prize">Prize: ₹{winner.prize}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          ) : (
            <div className="final-results-no-winners">
              <h3>No Winners Announced</h3>
              <p>Winner information is not available yet.</p>
            </div>
          )}

          <section className="final-results-details">
            <h4 className="final-results-details-title">Tournament Details</h4>
            <div className="final-results-details-grid">
              <div className="final-results-detail-item">
                <strong>Game:</strong>
                {tournament.game.toUpperCase()}
              </div>
              <div className="final-results-detail-item">
                <strong>Map:</strong>
                {tournament.map}
              </div>
              <div className="final-results-detail-item">
                <strong>Mode:</strong>
                {tournament.mode_type?.toUpperCase() || "SOLO"}
              </div>
              <div className="final-results-detail-item">
                <strong>Entry Fee:</strong>
                ₹{tournament.entry_fee}
              </div>
              <div className="final-results-detail-item">
                <strong>Total Participants:</strong>
                {tournament.participants?.length || 0}
              </div>
              <div className="final-results-detail-item">
                <strong>Prize Pool:</strong>
                ₹{prizePool}
              </div>
            </div>
          </section>

          <div className="final-results-share-section">
            <button type="button" onClick={shareResults} className="final-results-share-btn">
              📤 Share Results
            </button>
          </div>

          <footer className="final-results-footer">
            <p>
              Powered by <strong>PLAYZONE</strong> 🎯
            </p>
            <p className="final-results-footer-tagline">
              &quot;Where every gamer becomes a legend.&quot;
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default FinalResults;
