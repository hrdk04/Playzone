// src/App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";

// // General Pages
import Home from "./pages/Home";
import About from "./pages/About";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Contact from "./pages/Contact";

// // Auth Pages
import Login from "./authPages/Login";
import Signup from "./authPages/Signup";
import ForgetPassword from "./authPages/ForgetPassword.js";

// User Pages
import DashBoard from "./userSide/DashBoard";
import Tournaments from "./userSide/Tournaments";
import History from "./userSide/History";
import Profile from "./userSide/Profile";
import PaymentPage from "./userSide/PaymentPage";
import FinalResults from "./userSide/FinalResults.js";
import ChatPage from "./pages/ChatPage";

// Admin Layout
import AdminLayout from "./adminside/AdminLayout";

// Import ChatPopup
import ChatPopup from "./components/ChatPopup";

// Wrapper component to conditionally render Navbar and Footer
const AppLayout = ({ children }) => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <>
      {!isAdminRoute && <Navbar />}
      {children}
      {!isAdminRoute && <Footer />}
      {!isAdminRoute && <ChatPopup />}
    </>
  );
};

function App() {
  return (
    <Router>
      <AppLayout>
        <Routes>
          {/* General */}
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/contact" element={<Contact />} />

          {/* Auth */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forget-password" element={<ForgetPassword />} />

          {/* User */}
          <Route path="/DashBoard" element={<DashBoard />} />
          <Route path="/dashboard/*" element={<DashBoard />} />
          <Route path="/tournaments" element={<Tournaments />} />
          <Route path="/tournaments/results/:id" element={<FinalResults />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/history" element={<History />} />
          <Route path="/payments" element={<PaymentPage />} />
          <Route path="/chat" element={<ChatPage />} />

          {/* Admin Section with its own layout */}
          <Route path="/admin/*" element={<AdminLayout />} />
          {/* <Route path="/admin/add-tournament" element={<AddTournament />} /> */}
        {/* <Route path="/admin/start-tournament" element={<StartTournament />} /> */}
        {/* <Route path="/admin/player-detail" element={<PlayerDetail />} /> */}
        {/* <Route path="/admin/publish-result" element={<PublishResult />} /> */}
        {/* <Route path="/admin/update-tournament" element={<UpdateTournament />} /> */}
        </Routes>
      </AppLayout>
    </Router>
  );
}

export default App;
