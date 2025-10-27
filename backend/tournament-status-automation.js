// Tournament Status Automation Service
// This service runs periodically to update tournament statuses based on current time

import axios from "axios"

const API_BASE_URL = "http://localhost:5000"

export async function updateTournamentStatuses() {
  try {
    console.log("[v0] Starting tournament status update...")

    // Fetch all tournaments
    const { data: tournaments } = await axios.get(`${API_BASE_URL}/admin/tournaments`)

    if (!tournaments || tournaments.length === 0) {
      console.log("[v0] No tournaments found")
      return
    }

    const now = new Date()
    let updatedCount = 0

    for (const tournament of tournaments) {
      try {
        // Skip if already completed and published
        if (tournament.t_status === "completed" && tournament.result_published) {
          continue
        }

        // Parse tournament start time
        const tournamentDate = new Date(tournament.t_date)
        const [hours, minutes] = (tournament.t_time || "00:00").split(":").map(Number)
        const startTime = new Date(
          tournamentDate.getFullYear(),
          tournamentDate.getMonth(),
          tournamentDate.getDate(),
          hours,
          minutes,
        )
        const endTime = new Date(startTime.getTime() + 40 * 60 * 1000) // 40 minutes after start

        let newStatus = tournament.t_status

        // Determine new status
        if (now >= startTime && now < endTime) {
          newStatus = "running"
        } else if (now >= endTime) {
          newStatus = "completed"
        } else if (now < startTime) {
          newStatus = "pending"
        }

        // Update if status changed
        if (newStatus !== tournament.t_status) {
          console.log(`[v0] Updating tournament ${tournament.t_id} from ${tournament.t_status} to ${newStatus}`)
          await axios.put(`${API_BASE_URL}/admin/tournaments/${tournament.t_id}`, {
            t_status: newStatus,
          })
          updatedCount++
        }
      } catch (error) {
        console.error(`[v0] Error updating tournament ${tournament.t_id}:`, error.message)
      }
    }

    console.log(`[v0] Tournament status update complete. Updated ${updatedCount} tournaments.`)
  } catch (error) {
    console.error("[v0] Error in updateTournamentStatuses:", error.message)
  }
}

// Start the automation service
export function startTournamentAutomation(intervalMs = 60000) {
  console.log(`[v0] Starting tournament automation with ${intervalMs}ms interval`)

  // Run immediately on start
  updateTournamentStatuses()

  // Then run at regular intervals
  const intervalId = setInterval(updateTournamentStatuses, intervalMs)

  return () => {
    clearInterval(intervalId)
    console.log("[v0] Tournament automation stopped")
  }
}
