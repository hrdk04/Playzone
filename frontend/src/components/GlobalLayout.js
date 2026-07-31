import React, { useState, useEffect } from 'react';
import Navbar from '../Navbar'; // Adjust path if necessary
import Footer from '../Footer'; // Adjust path if necessary
import './GlobalLayout.css';

const GlobalLayout = ({ children, isAdminRoute }) => {
  // Initialize theme from localStorage or default to dark
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('playzone-theme') || 'dark';
  });

  // Apply the theme to the HTML document element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('playzone-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'dark' ? 'light' : 'dark'));
  };

  return (
    <div className="layout-container">
      {/* Conditionally render Navbar based on route */}
      {!isAdminRoute && <Navbar />}

      {/* Main page content gets injected here */}
      <main className="main-content">
        {children}
      </main>

      {/* Theme Toggle Button */}
      <button 
        className="theme-toggle-btn" 
        onClick={toggleTheme}
        aria-label="Toggle Theme"
      >
        {theme === 'dark' ? (
          <span className="theme-icon sun" aria-hidden="true" />
        ) : (
          <span className="theme-icon moon" aria-hidden="true" />
        )}
      </button>

      {/* Conditionally render Footer based on route */}
      {!isAdminRoute && <Footer />}
    </div>
  );
};

export default GlobalLayout;