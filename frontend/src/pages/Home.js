import { Link, useNavigate } from "react-router-dom"
import { useState, useEffect } from "react"
import axios from "axios"
import theme from "../theme"

export default function Home() {
  const navigate = useNavigate()
  const [featuredTournaments, setFeaturedTournaments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchFeaturedTournaments = async () => {
      try {
        const response = await axios.get("http://localhost:5000/admin/tournaments")
        const upcoming = response.data
          .filter(t => t.t_status === "pending")
          .slice(0, 5)
        setFeaturedTournaments(upcoming)
      } catch (error) {
        console.error("Error fetching tournaments:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchFeaturedTournaments()
  }, [])

  const handleViewTournaments = () => navigate("/tournaments")

  const handleCardHover = (e) => {
    e.currentTarget.style.transform = "translateY(-10px)"
    e.currentTarget.style.boxShadow = "0 20px 40px rgba(0,255,200,0.3)"
  }
  const handleCardLeave = (e) => {
    e.currentTarget.style.transform = "translateY(0)"
    e.currentTarget.style.boxShadow = "none"
  }


  return (
    <>
    {<style>
      {`
       @keyframes bgChange {
          0%, 16% {
            background-image: linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url('https://wallpaperaccess.com/full/8492774.jpg');
            }
            20%, 36% {
              background-image: linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url('https://i.ytimg.com/vi/BIBuam-qmcY/maxresdefault.jpg');
          }
          40%, 56% {
            background-image: linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url('https://wallpaperaccess.com/full/1786790.jpg');
          }
          60%, 76% {
            background-image: linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url('https://wallpapercave.com/wp/wp7539745.jpg');
          }
          80%, 100% {
              background-image: linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url('https://wallpapercave.com/wp/wp8730781.jpg');
          }
        }
      `}
      </style>}
    <div style={styles.container}>
      {/* Hero Section */}
      <header style={styles.hero}>
        <div style={styles.heroContent}>
          <h1 style={styles.heroTitle}>
            Welcome to <span style={styles.brandName}>Playzone</span>
          </h1>
          <p style={styles.heroSubtitle}>
            Your ultimate platform for competitive gaming tournaments. 
            Join thousands of players and win amazing prizes!
          </p>
          <div style={styles.heroButtons}>
            <Link to="/signup" style={{ ...styles.button, ...styles.primaryButton }}> Get Started</Link> {/*🚀*/}
            <Link to="/login" style={{ ...styles.button, ...styles.secondaryButton }}> Login</Link> {/*🔐 */}
          </div>
        </div>
      </header>

      {/* Featured Tournaments Section */}
      <section style={styles.tournamentsSection}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>🔥 Featured Tournaments</h2>
          <p style={styles.sectionSubtitle}>Join these upcoming tournaments</p>
        </div>
        {loading ? (
          <div style={styles.loadingContainer}>
            <div style={styles.loadingSpinner}></div>
            <p>Loading tournaments...</p>
          </div>
        ) : (
          <div style={styles.tournamentsGrid}>
            {featuredTournaments.map(t => (
              <div key={t._id} style={styles.tournamentCard} onMouseEnter={handleCardHover} onMouseLeave={handleCardLeave}>
                <div style={styles.tournamentImage}>
                  <img src={t.thumbnail || getGameThumbnail(t.game)} alt={t.game} style={styles.tournamentThumbnail}/>
                  <span style={styles.statusBadge}>UPCOMING</span>
                </div>
                <div style={styles.tournamentContent}>
                  <h3 style={styles.tournamentTitle}>{t.t_id}</h3>
                  <p style={styles.tournamentGame}>🎮 {t.game}</p>
                  <p style={styles.tournamentMap}>🗺️ {t.map}</p>
                  <p style={styles.tournamentDate}>📅 {new Date(t.t_date).toLocaleDateString()}</p>
                  <p style={styles.tournamentTime}>⏰ {t.t_time}</p>
                  <div style={styles.tournamentPrizes}>
                    <span style={styles.prizeAmount}>💰 Entry: ₹{t.entry_fee}</span>
                    <span style={styles.prizePool}>🏆 Pool: ₹{t.rewards.first + t.rewards.second + t.rewards.third}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        <div style={styles.viewAllContainer}>
          <button onClick={handleViewTournaments} style={styles.viewAllButton}>View All Tournaments →</button>
        </div>
      </section>

      {/* Features Section */}
      <section style={styles.featuresSection}>
        <h2 style={styles.sectionTitle}>Why Choose Playzone?</h2>
        <div style={styles.featuresGrid}>
          {[
            { icon: "🏆", title: "Competitive Gaming", desc: "Compete with skilled players worldwide." },
            { icon: "💰", title: "Real Money Prizes", desc: "Win cash and rewards for your skills." },
            { icon: "📊", title: "Track Your Progress", desc: "Monitor stats & tournament history." },
            { icon: "🌐", title: "Global Community", desc: "Connect with gamers everywhere." },
          ].map((f,i) => (
            <div key={i} style={styles.featureCard} onMouseEnter={e=>e.currentTarget.style.transform="translateY(-5px)"} onMouseLeave={e=>e.currentTarget.style.transform="translateY(0)"}>
              <div style={styles.featureIcon}>{f.icon}</div>
              <h3 style={styles.featureTitle}>{f.title}</h3>
              <p style={styles.featureDescription}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Games Section */}
      <section style={styles.gamesSection}>
        <h2 style={styles.sectionTitle}>Supported Games</h2>
        <div style={styles.gamesGrid}>
          {[
            { icon: "🎯", name: "BGMI", desc: "Battle Royale" },
            { icon: "🔫", name: "PUBG", desc: "Battle Royale" },
            { icon: "⚔️", name: "Call of Duty", desc: "FPS" },
            { icon: "🔥", name: "Free Fire", desc: "Battle Royale" },
          ].map((g,i) => (
            <div key={i} style={styles.gameCard} onMouseEnter={e=>e.currentTarget.style.transform="translateY(-5px)"} onMouseLeave={e=>e.currentTarget.style.transform="translateY(0)"}>
              <div style={styles.gameIcon}>{g.icon}</div>
              <h3 style={styles.gameName}>{g.name}</h3>
              <p style={styles.gameDescription}>{g.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section style={styles.ctaSection}>
        <div style={styles.ctaContent}>
          <h2 style={styles.ctaTitle}>Ready to Start Your Gaming Journey?</h2>
          <p style={styles.ctaSubtitle}>Join thousands of players and start winning today!</p>
          <div style={styles.ctaButtons}>
            <Link to="/signup" style={{...styles.button,...styles.primaryButton}}>🚀 Join Now</Link>
            <Link to="/tournaments" style={{...styles.button,...styles.secondaryButton}}>🎮 Browse Tournaments</Link>
          </div>
        </div>
      </section>
    </div>
    </>
  )
}

function getGameThumbnail(game){
  const thumbnails = {
    bgmi:"/bgmi-tournament-thumbnail.png",
    pubg:"/pubg-tournament-thumbnail.png",
    cod:"/call-of-duty-tournament-thumbnail.png",
    ff:"/free-fire-tournament-thumbnail.png"
  }
  return thumbnails[game.toLowerCase()] || "/bgmi-tournament-thumbnail.png"
}

const styles = {
  container:{ minHeight:"100vh", color:theme.colors.white, fontFamily:"'Poppins',sans-serif", background:"linear-gradient(135deg,#0b0c10,#1f2833)", overflowX:"hidden",

   },
  hero:{ padding:"230px 20px", textAlign:"center", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column",
          animation:"bgChange 20s infinite",
        backgroundRepeat:'no-repeat',
        backgroundSize:"cover",
        backgroundPosition:'center',
        textShadow: "0 0 8px rgba(0,201,167,0.6), 0 0 12px rgba(255,64,129,0.4)",

        backgroundAttachment:'fixed',
   },
  heroContent:{ maxWidth:"800px",background:"linear-gradient(rgba(255, 255, 255, 0.07), rgba(255, 255, 255, 0.05))", padding:"30px 10px", marginTop:'-5%' },
  heroTitle:{ fontSize:"3rem", fontWeight:"700", marginBottom:"20px", textShadow:"0 0 15px #00ff88" },
  brandName:{ color:theme.colors.primary,textShadow:'none' },
  heroSubtitle:{ fontSize:"1.3rem", color:"#ffffffff",textShadow:'0px 0px 3px #193fffff', marginBottom:"30px", lineHeight:"1.6" },
  heroButtons:{ display:"flex", gap:"20px", justifyContent:"center", flexWrap:"wrap" },

  tournamentsSection:{ padding:"80px 20px", backgroundColor:"rgba(0,0,0,0.25)",
     backgroundImage:" url('https://st4.depositphotos.com/24297044/27344/v/450/depositphotos_273440920-stock-illustration-blue-background-gradient-abstract-texture.jpg')",
        backgroundRepeat:'no-repeat',
        backgroundSize:"cover",
        backgroundPosition:'center',
        backgroundAttachment:'fixed',
   },
  sectionHeader:{ textAlign:"center", marginBottom:"50px" },
  sectionTitle:{ fontSize:"2.5rem", color:theme.colors.primary, marginBottom:"10px", textAlign:'center' },
  sectionSubtitle:{ color:"#b0b0b0" },
  tournamentsGrid:{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))", gap:"30px", maxWidth:"1200px", margin:"0 auto" },
  tournamentCard:{ background:"rgba(255,255,255,0.05)", borderRadius:"15px", overflow:"hidden", backdropFilter:"blur(10px)", border:"1px solid rgba(255,255,255,0.1)", transition:"all 0.3s ease", cursor:"pointer" },
  tournamentImage:{ position:"relative", height:"200px", overflow:"hidden" },
  tournamentThumbnail:{ width:"100%", height:"100%", objectFit:"cover" },
  statusBadge:{ position:"absolute", top:"15px", right:"15px", background:"linear-gradient(45deg,#00ff88,#00cc6a)", color:"white", padding:"5px 15px", borderRadius:"20px", fontSize:"0.8rem", fontWeight:"bold" },
  tournamentContent:{ padding:"20px" },
  tournamentTitle:{ fontSize:"1.3rem", fontWeight:"700", marginBottom:"10px", color:theme.colors.primary },
  tournamentGame:{ margin:"5px 0", color:"#b0b0b0" },
  tournamentMap:{ margin:"5px 0", color:"#b0b0b0" },
  tournamentDate:{ margin:"5px 0", color:"#b0b0b0" },
  tournamentTime:{ margin:"5px 0", color:"#b0b0b0" },
  tournamentPrizes:{ display:"flex", justifyContent:"space-between", marginTop:"15px", padding:"10px", background:"rgba(0,255,200,0.1)", borderRadius:"8px" },
  prizeAmount:{ color:theme.colors.secondary, fontWeight:"700" },
  prizePool:{ color:theme.colors.primary, fontWeight:"700" },
  viewAllContainer:{ textAlign:"center", marginTop:"40px" },
  viewAllButton:{ background:"linear-gradient(45deg,#00ff88,#00cc6a)", color:"white", border:"none", padding:"15px 30px", borderRadius:"25px", fontSize:"1.1rem", fontWeight:"700", cursor:"pointer", boxShadow:"0 4px 15px rgba(0,255,136,0.3)" },

  featuresSection:{ padding:"80px 20px",  
        backgroundImage:" url('https://st4.depositphotos.com/24297044/27344/v/450/depositphotos_273440920-stock-illustration-blue-background-gradient-abstract-texture.jpg')",
        backgroundRepeat:'no-repeat',
        backgroundSize:"cover",
        backgroundPosition:'center',
        backgroundAttachment:'fixed',
      },
      featuresGrid:{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(250px,1fr))", gap:"30px", maxWidth:"1100px", margin:"0 auto",
        padding:'5px 20px',
       },
  featureCard:{ background:"rgba(255,255,255,0.05)", padding:"30px", borderRadius:"15px", textAlign:"center", backdropFilter:"blur(10px)", border:"1px solid rgba(255,255,255,0.1)", transition:"all 0.3s ease", cursor:"pointer" },
  featureIcon:{ fontSize:"3rem", marginBottom:"20px" },
  featureTitle:{ fontSize:"1.4rem", fontWeight:"700", marginBottom:"10px", color:theme.colors.primary },
  featureDescription:{ color:"#b0b0b0", lineHeight:"1.6" },

  gamesSection:{ padding:"80px 20px", background:"rgba(0,0,0,0.25)",
     backgroundImage:" url('https://st4.depositphotos.com/24297044/27344/v/450/depositphotos_273440920-stock-illustration-blue-background-gradient-abstract-texture.jpg')",
        backgroundRepeat:'no-repeat',
        backgroundSize:"cover",
        backgroundPosition:'center',
        backgroundAttachment:'fixed',
   },
  gamesGrid:{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:"30px", maxWidth:"1100px", margin:"0 auto",
    padding:'5px 20px',
   },
  gameCard:{ background:"rgba(255,255,255,0.05)", padding:"30px", borderRadius:"15px", textAlign:"center", backdropFilter:"blur(10px)", border:"1px solid rgba(255,255,255,0.1)", transition:"all 0.3s ease", cursor:"pointer" },
  gameIcon:{ fontSize:"3rem", marginBottom:"15px" },
  gameName:{ fontSize:"1.3rem", fontWeight:"700", marginBottom:"10px", color:theme.colors.primary },
  gameDescription:{ color:"#b0b0b0" },

  ctaSection:{ padding:"80px 20px", background:"linear-gradient(135deg,#0b0c10,#1f2833)", textAlign:"center",
     backgroundImage:" url('https://st4.depositphotos.com/24297044/27344/v/450/depositphotos_273440920-stock-illustration-blue-background-gradient-abstract-texture.jpg')",
        backgroundRepeat:'no-repeat',
        backgroundSize:"cover",
        backgroundPosition:'center',
        backgroundAttachment:'fixed',
   },
  ctaContent:{ maxWidth:"600px", margin:"0 auto" },
  ctaTitle:{ fontSize:"2.5rem", fontWeight:"700", marginBottom:"20px", color:theme.colors.primary },
  ctaSubtitle:{ fontSize:"1.2rem", color:"#b0b0b0", marginBottom:"40px" },
  ctaButtons:{ display:"flex", gap:"20px", justifyContent:"center", flexWrap:"wrap" },

  loadingContainer:{ textAlign:"center", padding:"50px" },
  loadingSpinner:{ width:"40px", height:"40px", border:"4px solid rgba(255,255,255,0.3)", borderTop:"4px solid #00ff88", borderRadius:"50%", animation:"spin 1s linear infinite", margin:"0 auto 20px" },

  button:{ padding:"15px 30px", borderRadius:"25px", textDecoration:"none", display:"inline-block", fontWeight:"700", fontSize:"1.1rem", transition:"all 0.3s ease", cursor:"pointer", border:"none" },
  primaryButton:{ background:"linear-gradient(45deg,#00ff88,#00cc6a)", color:"white", boxShadow:"0 4px 15px rgba(0,255,136,0.3)" },
  secondaryButton:{ background:"linear-gradient(45deg,#ff6b6b,#ee5a24)", color:"white", boxShadow:"0 4px 15px rgba(255,107,107,0.3)" },
  
}
