import React, { useState, useEffect } from 'react';
import { api } from '../api/client';

export default function HealthStats({ onOpenCalculator }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Data Entry State
  const [entryHeight, setEntryHeight] = useState('');
  const [entryWeight, setEntryWeight] = useState('');
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const fetchStats = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getHealthStats();
      setStats(data);
      if (data.latest_weight && !entryWeight) {
        setEntryWeight(data.latest_weight);
      }
      if (data.latest_weight && data.bmi && !entryHeight) {
        const heightM = Math.sqrt(data.latest_weight / data.bmi);
        setEntryHeight(Math.round(heightM * 100));
      }
    } catch (err) {
      if (err.status === 404) {
        setError('No height set for your account. Enter your height and weight below to activate your health stats!');
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

  const handleSaveEntry = async (e) => {
    e.preventDefault();
    if (!entryWeight || isNaN(entryWeight) || Number(entryWeight) <= 0) {
      setMessage({ type: 'error', text: 'Please enter a valid weight in kg.' });
      return;
    }

    setSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      const payload = {
        weight_kg: parseFloat(entryWeight),
        log_date: entryDate || new Date().toISOString().split('T')[0],
      };
      if (entryHeight && !isNaN(entryHeight)) {
        payload.height_cm = parseFloat(entryHeight);
      }

      const updated = await api.logHealthStats(payload);
      setStats(updated);
      setError('');
      setMessage({ type: 'success', text: 'Weight logged and BMI updated successfully!' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to record entry' });
    } finally {
      setSubmitting(false);
    }
  };

  const getBmiCategory = (bmi) => {
    if (!bmi) return { label: 'N/A', color: 'neutral' };
    if (bmi < 18.5) return { label: 'Underweight', color: 'blue' };
    if (bmi < 25.0) return { label: 'Normal weight', color: 'green' };
    if (bmi < 30.0) return { label: 'Overweight', color: 'orange' };
    return { label: 'Obese', color: 'red' };
  };

  const bmiCategory = stats ? getBmiCategory(stats.bmi) : null;

  // On-the-fly preview calculation in data entry form
  const previewHeightM = Number(entryHeight) > 0 ? Number(entryHeight) / 100 : null;
  const previewWeightKg = Number(entryWeight) > 0 ? Number(entryWeight) : null;
  const livePreviewBmi =
    previewHeightM && previewWeightKg ? (previewWeightKg / (previewHeightM * previewHeightM)).toFixed(1) : null;
  const livePreviewCategory = livePreviewBmi ? getBmiCategory(parseFloat(livePreviewBmi)) : null;

  // Prepare chart data (chronological order)
  const historyAsc = stats?.weight_history
    ? [...stats.weight_history].sort((a, b) => new Date(a.log_date) - new Date(b.log_date))
    : [];

  return (
    <div className="section-container">
      <div className="section-header">
        <div>
          <h2>Health Statistics</h2>
          <p className="section-subtitle">Monitor your Body Mass Index (BMI), log your weight, and track progress over time.</p>
        </div>
        <div className="btn-group">
          {onOpenCalculator && (
            <button onClick={onOpenCalculator} className="btn-secondary btn-sm">
              🧮 Full BMI Calculator
            </button>
          )}
          <button onClick={fetchStats} className="btn-secondary btn-sm">
            Refresh
          </button>
        </div>
      </div>

      {message.text && (
        <div className={`alert alert-${message.type}`}>
          {message.text}
        </div>
      )}

      {/* Top Metrics Cards (when stats available) */}
      {stats && (
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
                <span className="metric-sub">Calculated from latest weight</span>
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
      )}

      {/* Main Content Grid: Data Entry Form + Chart */}
      <div className="health-stats-layout">
        {/* Data Entry Card */}
        <div className="card">
          <div className="card-header flex-between">
            <h3>📝 Log Weight & Update Height</h3>
            <span className="badge badge-neutral">Quick Entry</span>
          </div>

          <form onSubmit={handleSaveEntry} className="card-body form-stack">
            {error && (
              <div className="alert alert-error">
                {error}
              </div>
            )}

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="entryHeight">Height (cm)</label>
                <input
                  id="entryHeight"
                  type="number"
                  step="0.1"
                  placeholder="e.g. 175"
                  value={entryHeight}
                  onChange={(e) => setEntryHeight(e.target.value)}
                  required={!stats?.bmi}
                />
                <small className="form-hint">Required for BMI calculation</small>
              </div>

              <div className="form-group">
                <label htmlFor="entryWeight">Weight (kg) *</label>
                <input
                  id="entryWeight"
                  type="number"
                  step="0.1"
                  placeholder="e.g. 72.5"
                  value={entryWeight}
                  onChange={(e) => setEntryWeight(e.target.value)}
                  required
                />
                <small className="form-hint">Enter your current weight</small>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="entryDate">Log Date *</label>
              <input
                id="entryDate"
                type="date"
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
                required
              />
            </div>

            {/* Live Calculation Preview */}
            {livePreviewBmi && (
              <div className="live-preview-box">
                <span className="preview-label">Live Calculation:</span>
                <span className="preview-val">BMI <strong>{livePreviewBmi}</strong></span>
                <span className={`badge badge-${livePreviewCategory.color}`}>
                  {livePreviewCategory.label}
                </span>
              </div>
            )}

            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save & Calculate BMI'}
            </button>
          </form>
        </div>

        {/* Weight History Chart Card */}
        <div className="card chart-card">
          <div className="card-header flex-between">
            <h3>📈 Weight Evolution Chart</h3>
            <span className="badge badge-neutral">Trend Line</span>
          </div>
          <div className="card-body">
            {historyAsc.length < 2 ? (
              <div className="empty-state">
                <p>Not enough data to plot a trend line yet.</p>
                <small>Log at least 2 weight entries using the form to visualize your evolution over time.</small>
              </div>
            ) : (
              <WeightChart data={historyAsc} />
            )}
          </div>
        </div>
      </div>

      {/* Weight History Table */}
      {historyAsc.length > 0 && (
        <div className="card">
          <div className="card-header flex-between">
            <h3>Weight Log History</h3>
            <span className="badge badge-neutral">{historyAsc.length} entries</span>
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
              <text x={padding.left - 10} y={y + 4} textAnchor="end" fontSize="11" fill="var(--text-muted)">
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
            <circle cx={pt.x} cy={pt.y} r="5" fill="var(--bg-card)" stroke="#3b82f6" strokeWidth="2.5" />
            <text x={pt.x} y={pt.y - 10} textAnchor="middle" fontSize="11" fontWeight="600" fill="var(--text-main)">
              {pt.weight_kg}
            </text>
            <text x={pt.x} y={height - 15} textAnchor="middle" fontSize="10" fill="var(--text-muted)">
              {pt.log_date.slice(5)}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
