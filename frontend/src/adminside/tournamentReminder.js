import cron from "node-cron"
import nodemailer from "nodemailer"
import axios from "axios"
import API_BASE_URL from "../config/apiConfig";

// ==========================
// EMAIL SETUP
// ==========================
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
})

const sendEmail = (to, subject, text) => {
  transporter.sendMail({ from: process.env.EMAIL_USER, to, subject, text }, (err, info) => {
    if (err) console.error("Playzone Email error:", err)
    else console.log("Playzone Email sent:", info.response)
  })
}

// ==========================
// Helper: convert t_date + t_time to local Date
// ==========================
function getTournamentStartTime(t_date, t_time) {
  const date = new Date(t_date) // UTC
  const [hours, minutes] = t_time.split(":").map(Number)

  // Build local Date object
  return new Date(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    hours,
    minutes,
    0,
    0
  )
}

// ==========================
// Tournament Status Updater
// ==========================
const updateTournamentStatuses = async () => {
  try {
    console.log("Playzone Running tournament status update...")

    const { data: tournaments } = await axios.get(`${API_BASE_URL}/admin/tournaments`)
    if (!tournaments || tournaments.length === 0) {
      console.log("Playzone No tournaments found")
      return
    }

    const now = new Date()
    let updatedCount = 0

    for (const tournament of tournaments) {
      try {
        // Skip if already completed and published
        if (tournament.t_status === "completed" && tournament.result_published) continue

        const startTime = getTournamentStartTime(tournament.t_date, tournament.t_time || "00:00")
        const endTime = new Date(startTime.getTime() + 40 * 60 * 1000) // 40 mins duration

        let newStatus = tournament.t_status

        if (now >= startTime && now < endTime) newStatus = "running"
        else if (now >= endTime) newStatus = "completed"
        else if (now < startTime) newStatus = "pending"

        if (newStatus !== tournament.t_status) {
          console.log(`Playzone Updating tournament ${tournament.t_id} from ${tournament.t_status} → ${newStatus}`)
          await axios.put(`${API_BASE_URL}/admin/tournaments/${tournament.t_id}`, {
            t_status: newStatus,
          })
          updatedCount++
        }
      } catch (error) {
        console.error(`Playzone Error updating tournament ${tournament.t_id}:`, error.message)
      }
    }

    console.log(`Playzone Tournament status update complete. Updated ${updatedCount} tournaments.`)
  } catch (err) {
    console.error("Playzone Error in updateTournamentStatuses:", err.message)
  }
}

// ==========================
// Cron: every minute
// ==========================
cron.schedule("* * * * *", async () => {
  await updateTournamentStatuses()
})

// ==========================
// Cron: reminders every 15 minutes
// ==========================
cron.schedule("*/15 * * * *", async () => {
  try {
    const { data: tournaments } = await axios.get(`${API_BASE_URL}/admin/upcoming-tournaments`)
    const now = new Date()

    tournaments.forEach((tour) => {
      const startTime = getTournamentStartTime(tour.t_date, tour.t_time || "00:00")
      const diffMinutes = (startTime - now) / 1000 / 60

      // 24 hours reminder
      if (diffMinutes > 1435 && diffMinutes < 1445) {
        sendEmail(
          process.env.ADMIN_EMAIL,
          `Tournament '${tour.game}' starts in 24 hours`,
          `Tournament '${tour.game}' (${tour.t_id}) will start at ${startTime.toLocaleString()}. Prepare rooms and resources.`,
        )
      }

      // 30 minutes reminder
      if (diffMinutes > 25 && diffMinutes < 35) {
        sendEmail(
          process.env.ADMIN_EMAIL,
          `Tournament '${tour.game}' starts in 30 minutes`,
          `Tournament '${tour.game}' (${tour.t_id}) will start at ${startTime.toLocaleString()}. Prepare rooms immediately.`,
        )
      }
    })
  } catch (err) {
    console.error("Playzone Error in reminder cron job:", err.message)
  }
})

console.log("Playzone Tournament automation cron jobs started!")
