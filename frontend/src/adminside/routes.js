import { Routes, Route } from "react-router-dom"
import AdminLayout from "./AdminLayout"
import AdminDashboard from "./AdminDashboard"
import ManagePlayers from "./ManagePlayers"
import ManageTournaments from "./ManageTournaments"
import TournamentStart from "./TournamentStart"
import TournamentForm from "./TournamentForm"
import TournamentResults from "./TournamentResults"
import AdminNotificationSettings from "./components/AdminNotificationSettings"


export default function AdminRoutes() {
  return (
    <Routes>
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="players" element={<ManagePlayers />} />
        <Route path="tournaments" element={<ManageTournaments />} />
        <Route path="tournaments/new" element={<TournamentForm mode="create" />} />
        <Route path="tournaments/:id/update" element={<TournamentForm mode="update" />} />
        <Route path="tournaments/:id/start" element={<TournamentStart />} />
        <Route path="tournaments/:id/results" element={<TournamentResults />} />
        {
          // Pass normalized admin username (stored admin may be JSON)
        }
        <Route
          path="notifications"
          element={
            <AdminNotificationSettings
              username={(() => {
                // Prefer adminName explicitly stored; fall back to parsed admin.username only if it looks like a username
                const explicit = localStorage.getItem("adminName")
                if (explicit) return explicit
                const raw = localStorage.getItem("admin")
                try {
                  if (!raw) return null
                  const parsed = JSON.parse(raw)
                  if (parsed?.username && !parsed.username.includes("@")) return parsed.username
                  if (typeof raw === "string" && !raw.includes("@")) return raw
                  return null
                } catch (e) {
                  if (raw && !raw.includes("@")) return raw
                  return null
                }
              })()}
            />
          }
        />
      </Route>
    </Routes>
  )
}
