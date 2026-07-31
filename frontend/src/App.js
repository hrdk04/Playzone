import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from "react-router-dom";

// General Pages
import Home from "./pages/Home";
import About from "./pages/About";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Contact from "./pages/Contact";

// Auth Pages
import Login from "./authPages/Login";
import Signup from "./authPages/Signup";
import ForgetPassword from "./authPages/ForgetPassword.js";

// User Pages
import DashBoard from "./userSide/DashBoard";
import Tournaments from "./userSide/Tournaments";
import TournamentDetail from "./userSide/TournamentDetail";
import History from "./userSide/History";
import Profile from "./userSide/Profile";
import PaymentPage from "./userSide/PaymentPage";
import FinalResults from "./userSide/FinalResults.js";
import ChatPage from "./userSide/ChatPage";

// Import GlobalLayout for consistent layout and theme management
import GlobalLayout from "./components/GlobalLayout";
// Admin Layout
import AdminLayout from "./adminside/AdminLayout";

// Import ChatPopup
import ChatPopup from "./components/ChatPopup";

// Create an inner component to safely use the useLocation hook
const MainApp = () => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    const admin = JSON.parse(localStorage.getItem("admin"));
    setIsLoggedIn(!!(user || admin));
  }, [location.pathname]);

  // Auto scroll to top on every route change
  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth'
    });
  }, [location.pathname]);

  return (
    <GlobalLayout isAdminRoute={isAdminRoute}>
      <Routes>
        {/* General */}
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/contact" element={<Contact />} />

        {/* Auth - redirect to dashboard if already logged in */}
        <Route path="/login" element={isLoggedIn ? <Navigate to="/dashboard" replace /> : <Login />} />
        <Route path="/signup" element={isLoggedIn ? <Navigate to="/dashboard" replace /> : <Signup />} />
        <Route path="/forget-password" element={isLoggedIn ? <Navigate to="/dashboard" replace /> : <ForgetPassword />} />

        {/* User */}
        <Route path="/DashBoard" element={<DashBoard />} />
        <Route path="/dashboard/*" element={<DashBoard />} />
        <Route path="/tournaments" element={<Tournaments />} />
        <Route path="/tournament/:id" element={<TournamentDetail />} />
        <Route path="/tournaments/results/:id" element={<FinalResults />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/history" element={<History />} />
        <Route path="/payments" element={<PaymentPage />} />
        <Route path="/chat" element={<ChatPage />} />

        {/* Admin Section with its own layout */}
        <Route path="/admin/*" element={<AdminLayout />} />
      </Routes>
      
      {/* Ensure ChatPopup is still rendered for regular users */}
      {!isAdminRoute && <ChatPopup />}
    </GlobalLayout>
  );
};

function App() {
  return (
    <Router>
      <MainApp />
    </Router>
  );
}

export default App;