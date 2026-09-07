import React, { useState, useEffect } from 'react';
import { api } from '../api/client';

export default function HealthStats({ onOpenCalculator }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getHealthStats();
      setStats(data);
    } catch (err) {
      if (err.status === 404) {
        setError('No height set for your account. BMI requires a recorded height.');
      } else {
        setError(err.message || 'Failed to load health stats');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const getBmiCategory = (bmi) => {
    if (!bmi) return { label: 'N/A', color: 'neutral' };
    if (bmi < 18.5) return { label: 'Underweight', color: 'blue' };
    if (bmi < 25.0) return { label: 'Normal weight', color: 'green' };
    if (bmi < 30.0) return { label: 'Overweight', color: 'orange' };
    return { label: 'Obese', color: 'red' };
  };

  const bmiCategory = stats ? getBmiCategory(stats.bmi) : null;

  // Prepare chart data (chronological order)
  const historyAsc = stats?.weight_history
    ? [...stats.weight_history].sort((a, b) => new Date(a.log_date) - new Date(b.log_date))
    : [];

  return (
    <div className="section-container">
      <div className="section-header">
        <div>
          <h2>Health Statistics</h2>
          <p className="section-subtitle">Monitor your Body Mass Index (BMI) and weight evolution over time.</p>
        </div>
        <div className="btn-group">
          {onOpenCalculator && (
            <button onClick={onOpenCalculator} className="btn-secondary btn-sm">
              🧮 BMI Calculator
            </button>
          )}
          <button onClick={fetchStats} className="btn-secondary btn-sm">
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-spinner">Loading health statistics...</div>
      ) : error ? (
        <div className="card">
          <div className="card-body empty-state">
            <span className="empty-icon">📏</span>
            <h3>Height Not Found</h3>
            <p>{error}</p>
            <small>Make sure your account was created with a valid height in centimeters.</small>
            {onOpenCalculator && (
              <div style={{ marginTop: '1.25rem' }}>
                <button onClick={onOpenCalculator} className="btn-primary btn-sm">
                  🧮 Open Interactive BMI Calculator
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="health-grid">
          {/* Top Metrics Cards */}
          <div className="metrics-row">
            <div className="card metric-card">
              <div className="metric-header">
                <span className="metric-label">Body Mass Index (BMI)</span>
                <span className="metric-icon">⚖️</span>
              </div>
              <div className="metric-value">
                {stats.bmi !== null ? stats.bmi : '—'}
              </div>
              {stats.bmi !== null && (
                <div className="metric-footer">
                  <span className={`badge badge-${bmiCategory.color}`}>
                    {bmiCategory.label}
                  </span>
                  <span className="metric-sub">Calculated from latest weight & height</span>
                </div>
              )}
            </div>

            <div className="card metric-card">
              <div className="metric-header">
                <span className="metric-label">Latest Weight</span>
                <span className="metric-icon">📊</span>
              </div>
              <div className="metric-value">
                {stats.latest_weight !== null ? `${stats.latest_weight} kg` : 'No logs'}
              </div>
              <div className="metric-footer">
                <span className="metric-sub">
                  {historyAsc.length > 0
                    ? `Last logged on ${historyAsc[historyAsc.length - 1].log_date}`
                    : 'No weight entries found'}
                </span>
              </div>
            </div>

            <div className="card metric-card">
              <div className="metric-header">
                <span className="metric-label">Weight Records</span>
                <span className="metric-icon">📋</span>
              </div>
              <div className="metric-value">
                {historyAsc.length}
              </div>
              <div className="metric-footer">
                <span className="metric-sub">Total recorded logs</span>
              </div>
            </div>
          </div>

          {/* Weight History Chart Card */}
          <div className="card chart-card">
            <div className="card-header flex-between">
              <h3>Weight History Chart</h3>
              <span className="badge badge-neutral">kg over time</span>
            </div>
            <div className="card-body">
              {historyAsc.length < 2 ? (
                <div className="empty-state">
                  <p>Not enough data to plot trend line.</p>
                  <small>Need at least 2 weight log entries to visualize the curve.</small>
                </div>
              ) : (
                <WeightChart data={historyAsc} />
              )}
            </div>
          </div>

          {/* Weight Log Table */}
          {historyAsc.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h3>Weight Log History</h3>
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Weight (kg)</th>
                        <th>Change</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historyAsc.map((log, idx) => {
                        const prev = idx > 0 ? historyAsc[idx - 1].weight_kg : null;
                        const diff = prev !== null ? (log.weight_kg - prev).toFixed(1) : null;
                        return (
                          <tr key={log.WeightLogID}>
                            <td>{log.log_date}</td>
                            <td><strong>{log.weight_kg} kg</strong></td>
                            <td>
                              {diff === null ? (
                                <span className="diff-neutral">—</span>
                              ) : diff > 0 ? (
                                <span className="diff-up">+{diff} kg</span>
                              ) : diff < 0 ? (
                                <span className="diff-down">{diff} kg</span>
                              ) : (
                                <span className="diff-neutral">0 kg</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Clean, zero-dependency Responsive SVG Weight Line Chart
function WeightChart({ data }) {
  const width = 600;
  const height = 240;
  const padding = { top: 30, right: 30, bottom: 40, left: 50 };

  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const weights = data.map((d) => Number(d.weight_kg));
  const minWeight = Math.floor(Math.min(...weights) - 2);
  const maxWeight = Math.ceil(Math.max(...weights) + 2);
  const weightRange = maxWeight - minWeight || 1;

  const points = data.map((d, index) => {
    const x = padding.left + (index / (data.length - 1)) * chartWidth;
    const y = padding.top + chartHeight - ((Number(d.weight_kg) - minWeight) / weightRange) * chartHeight;
    return { x, y, ...d };
  });

  const pathD = points.reduce((acc, pt, idx) => {
    return idx === 0 ? `M ${pt.x},${pt.y}` : `${acc} L ${pt.x},${pt.y}`;
  }, '');

  // Fill area under curve
  const areaD = `${pathD} L ${points[points.length - 1].x},${padding.top + chartHeight} L ${points[0].x},${padding.top + chartHeight} Z`;

  return (
    <div className="svg-chart-wrapper">
      <svg viewBox={`0 0 ${width} ${height}`} className="weight-svg-chart">
        <defs>
          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Grid horizontal lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = padding.top + chartHeight * ratio;
          const val = (maxWeight - ratio * weightRange).toFixed(0);
          return (
            <g key={ratio} className="grid-line">
              <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#e2e8f0" strokeDasharray="3 3" />
              <text x={padding.left - 10} y={y + 4} textAnchor="end" fontSize="11" fill="#64748b">
                {val}kg
              </text>
            </g>
          );
        })}

        {/* Area fill */}
        <path d={areaD} fill="url(#chartGradient)" />

        {/* Line */}
        <path d={pathD} fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

        {/* Data points */}
        {points.map((pt, idx) => (
          <g key={idx} className="chart-point-group">
            <circle cx={pt.x} cy={pt.y} r="5" fill="#ffffff" stroke="#3b82f6" strokeWidth="2.5" />
            <text x={pt.x} y={pt.y - 10} textAnchor="middle" fontSize="11" fontWeight="600" fill="#1e293b">
              {pt.weight_kg}
            </text>
            <text x={pt.x} y={height - 15} textAnchor="middle" fontSize="10" fill="#64748b">
              {pt.log_date.slice(5)}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
