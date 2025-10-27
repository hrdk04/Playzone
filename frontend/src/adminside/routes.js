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
        <Route path="notifications" element={<AdminNotificationSettings username={localStorage.getItem("admin")} />} />
      </Route>
    </Routes>
  )
}
