import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import Auth from './components/Auth';
import Workouts from './components/Workouts';
import Goals from './components/Goals';
import HealthStats from './components/HealthStats';
import BmiCalculator from './components/BmiCalculator';
import Reports from './components/Reports';
import './App.css';

function MainContent() {
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('workouts');

  if (!isAuthenticated) {
    return <Auth />;
  }

  return (
    <div className="app-layout">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="main-content">
        {activeTab === 'workouts' && <Workouts />}
        {activeTab === 'goals' && <Goals />}
        {activeTab === 'health-stats' && <HealthStats onOpenCalculator={() => setActiveTab('bmi-calculator')} />}
        {activeTab === 'bmi-calculator' && <BmiCalculator />}
        {activeTab === 'reports' && <Reports />}
      </main>
      <footer className="app-footer">
        <p>Fitness-Log &bull; Built with Node.js, Express, PostgreSQL & React</p>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
