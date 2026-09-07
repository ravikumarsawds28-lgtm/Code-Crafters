import React, { useState, useEffect } from 'react';
import { api } from '../api/client';

export default function Reports() {
  const [period, setPeriod] = useState('weekly');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchReport = async (selectedPeriod = period) => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getReports(selectedPeriod);
      setReport(data);
    } catch (err) {
      setError(err.message || 'Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport(period);
  }, [period]);

  return (
    <div className="section-container">
      <div className="section-header">
        <div>
          <h2>Fitness Reports</h2>
          <p className="section-subtitle">Aggregate summary of your workout frequency and caloric burn over time.</p>
        </div>

        {/* Period Selector Toggle */}
        <div className="period-toggle">
          <button
            type="button"
            className={`toggle-btn ${period === 'weekly' ? 'active' : ''}`}
            onClick={() => setPeriod('weekly')}
          >
            Weekly (7 Days)
          </button>
          <button
            type="button"
            className={`toggle-btn ${period === 'monthly' ? 'active' : ''}`}
            onClick={() => setPeriod('monthly')}
          >
            Monthly (30 Days)
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-spinner">Calculating fitness report...</div>
      ) : error ? (
        <div className="alert alert-error">{error}</div>
      ) : report ? (
        <div className="reports-grid">
          <div className="report-window-banner">
            <span className="banner-icon">📅</span>
            <span>
              Reporting Period: <strong>{report.start_date}</strong> to <strong>{report.end_date}</strong>
            </span>
          </div>

          <div className="metrics-row">
            {/* Total Workouts Card */}
            <div className="card metric-card">
              <div className="metric-header">
                <span className="metric-label">Total Workouts</span>
                <span className="metric-icon">🏋️</span>
              </div>
              <div className="metric-value">{report.total_workouts}</div>
              <div className="metric-footer">
                <span className="metric-sub">
                  Completed in the last {period === 'weekly' ? '7 days' : '30 days'}
                </span>
              </div>
            </div>

            {/* Total Calories Card */}
            <div className="card metric-card">
              <div className="metric-header">
                <span className="metric-label">Total Calories Burned</span>
                <span className="metric-icon">🔥</span>
              </div>
              <div className="metric-value">{report.total_calories.toLocaleString()} <span className="metric-unit">kcal</span></div>
              <div className="metric-footer">
                <span className="metric-sub">
                  Cumulative energy output
                </span>
              </div>
            </div>

            {/* Average Calories / Workout Card */}
            <div className="card metric-card">
              <div className="metric-header">
                <span className="metric-label">Avg. Calories / Workout</span>
                <span className="metric-icon">⚡</span>
              </div>
              <div className="metric-value">
                {report.total_workouts > 0
                  ? Math.round(report.total_calories / report.total_workouts)
                  : 0} <span className="metric-unit">kcal</span>
              </div>
              <div className="metric-footer">
                <span className="metric-sub">Average intensity per session</span>
              </div>
            </div>
          </div>

          {/* Performance Assessment Card */}
          <div className="card">
            <div className="card-header">
              <h3>Performance Insights</h3>
            </div>
            <div className="card-body">
              {report.total_workouts === 0 ? (
                <div className="empty-state">
                  <p>No workouts recorded for this {period} window.</p>
                  <small>Log your activities in the Workouts tab to see aggregate statistics here.</small>
                </div>
              ) : (
                <div className="insights-box">
                  <div className="insight-item">
                    <span className="insight-bullet">✅</span>
                    <div>
                      <strong>Consistency Check:</strong> You have logged {report.total_workouts} workout
                      {report.total_workouts > 1 ? 's' : ''} across this {period} window.
                      {period === 'weekly' && report.total_workouts >= 3 && ' Excellent consistency! You are hitting the recommended 3+ days/week.'}
                      {period === 'weekly' && report.total_workouts < 3 && ' Try adding one more session this week to build momentum.'}
                    </div>
                  </div>
                  <div className="insight-item">
                    <span className="insight-bullet">🔥</span>
                    <div>
                      <strong>Calorie Burn:</strong> Total of {report.total_calories} kcal burned.
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
