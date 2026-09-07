import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Navbar({ activeTab, setActiveTab }) {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const navItems = [
    { id: 'workouts', label: 'Workouts', icon: '🏋️‍♂️' },
    { id: 'goals', label: 'Goals', icon: '🎯' },
    { id: 'health-stats', label: 'Health Stats', icon: '📊' },
    { id: 'bmi-calculator', label: 'BMI Calculator', icon: '🧮' },
    { id: 'reports', label: 'Reports', icon: '📈' },
  ];

  return (
    <header className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <span className="brand-icon">⚡</span>
          <span className="brand-title">Fitness-Log</span>
        </div>

        <nav className="navbar-nav">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`nav-btn ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="navbar-user">
          {/* Theme Switcher Button */}
          <button
            className="btn-theme-toggle"
            onClick={toggleTheme}
            title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            aria-label="Toggle Theme"
          >
            {isDark ? '☀️ Light' : '🌙 Dark'}
          </button>

          <span className="user-email">{user?.email || 'Logged In'}</span>
          <button className="btn-logout" onClick={logout} title="Log Out">
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
