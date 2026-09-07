import React, { useState, useEffect } from 'react';
import { api } from '../api/client';

export default function BmiCalculator() {
  const [height, setHeight] = useState(175);
  const [weight, setWeight] = useState(70);
  const [unit, setUnit] = useState('metric'); // 'metric' (cm, kg) or 'imperial' (in, lbs)

  // For imperial mode inputs
  const [feet, setFeet] = useState(5);
  const [inches, setInches] = useState(9);
  const [weightLbs, setWeightLbs] = useState(154);

  const [loadingProfile, setLoadingProfile] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);

  // Load user profile stats if available
  const loadProfileStats = async () => {
    setLoadingProfile(true);
    try {
      const stats = await api.getHealthStats();
      if (stats.latest_weight) {
        setWeight(stats.latest_weight);
        setWeightLbs(Math.round(stats.latest_weight * 2.20462));
      }
      // Calculate height from BMI & latest_weight if available: height_m = sqrt(weight / bmi)
      if (stats.latest_weight && stats.bmi) {
        const heightM = Math.sqrt(stats.latest_weight / stats.bmi);
        const heightCm = Math.round(heightM * 100);
        setHeight(heightCm);
        const totalInches = Math.round(heightCm / 2.54);
        setFeet(Math.floor(totalInches / 12));
        setInches(totalInches % 12);
      }
      setProfileLoaded(true);
    } catch (err) {
      // It's okay if stats aren't set yet
      console.log('No existing profile stats found');
    } finally {
      setLoadingProfile(false);
    }
  };

  useEffect(() => {
    loadProfileStats();
  }, []);

  // Compute active height in cm and weight in kg
  const activeHeightCm = unit === 'metric' ? Number(height) : (Number(feet) * 12 + Number(inches)) * 2.54;
  const activeWeightKg = unit === 'metric' ? Number(weight) : Number(weightLbs) / 2.20462;

  // Calculate BMI: weight / (height / 100)^2
  const heightM = activeHeightCm / 100;
  const bmi = heightM > 0 && activeWeightKg > 0 ? (activeWeightKg / (heightM * heightM)).toFixed(1) : null;
  const bmiNumber = bmi ? parseFloat(bmi) : null;

  // Ideal weight range for height (BMI 18.5 - 24.9)
  const minHealthyWeightKg = heightM > 0 ? (18.5 * heightM * heightM).toFixed(1) : 0;
  const maxHealthyWeightKg = heightM > 0 ? (24.9 * heightM * heightM).toFixed(1) : 0;

  // Category determination
  const getBmiDetails = (val) => {
    if (!val || isNaN(val)) return { category: 'Enter values', color: '#64748b', badge: 'neutral', advice: '' };
    if (val < 18.5) {
      const diff = (minHealthyWeightKg - activeWeightKg).toFixed(1);
      return {
        category: 'Underweight',
        color: '#3b82f6',
        badge: 'blue',
        advice: `You are about ${diff} kg below the recommended normal range. A balanced calorie-dense diet can help reach a healthy weight.`,
      };
    }
    if (val < 25.0) {
      return {
        category: 'Normal weight',
        color: '#10b981',
        badge: 'green',
        advice: 'Great job! Your BMI is in the healthy range. Maintain your active lifestyle and balanced nutrition.',
      };
    }
    if (val < 30.0) {
      const diff = (activeWeightKg - maxHealthyWeightKg).toFixed(1);
      return {
        category: 'Overweight',
        color: '#f59e0b',
        badge: 'orange',
        advice: `You are approximately ${diff} kg above the normal range. Regular cardio workouts and strength training can assist in managing your weight.`,
      };
    }
    const diff = (activeWeightKg - maxHealthyWeightKg).toFixed(1);
    return {
      category: 'Obese',
      color: '#ef4444',
      badge: 'red',
      advice: `You are approximately ${diff} kg above the normal range. Consider speaking with a healthcare professional or trainer for a guided exercise and nutrition plan.`,
    };
  };

  const bmiDetails = getBmiDetails(bmiNumber);

  // Position on gauge (15 to 40 scale)
  const gaugePercent = bmiNumber ? Math.min(Math.max(((bmiNumber - 15) / (38 - 15)) * 100, 2), 98) : 50;

  return (
    <div className="section-container">
      <div className="section-header">
        <div>
          <h2>BMI Calculator</h2>
          <p className="section-subtitle">
            Calculate your Body Mass Index (BMI) and discover your ideal healthy weight range.
          </p>
        </div>

        <div className="btn-group">
          <button
            type="button"
            className="btn-secondary btn-sm"
            onClick={loadProfileStats}
            disabled={loadingProfile}
          >
            {loadingProfile ? 'Loading...' : '🔄 Load My Profile Data'}
          </button>
        </div>
      </div>

      <div className="bmi-grid">
        {/* Left Card: Input Controls */}
        <div className="card">
          <div className="card-header flex-between">
            <h3>Enter Your Measurements</h3>
            <div className="unit-toggle">
              <button
                type="button"
                className={`toggle-btn btn-sm ${unit === 'metric' ? 'active' : ''}`}
                onClick={() => setUnit('metric')}
              >
                Metric (cm / kg)
              </button>
              <button
                type="button"
                className={`toggle-btn btn-sm ${unit === 'imperial' ? 'active' : ''}`}
                onClick={() => setUnit('imperial')}
              >
                Imperial (ft / lbs)
              </button>
            </div>
          </div>

          <div className="card-body form-stack">
            {unit === 'metric' ? (
              <>
                {/* Height Input (Metric) */}
                <div className="form-group">
                  <div className="flex-between">
                    <label htmlFor="height">Height (cm)</label>
                    <span className="metric-badge">{height} cm</span>
                  </div>
                  <input
                    id="height"
                    type="range"
                    min="100"
                    max="230"
                    step="1"
                    value={height}
                    onChange={(e) => setHeight(Number(e.target.value))}
                    className="slider"
                  />
                  <input
                    type="number"
                    min="50"
                    max="260"
                    value={height}
                    onChange={(e) => setHeight(Number(e.target.value))}
                  />
                </div>

                {/* Weight Input (Metric) */}
                <div className="form-group">
                  <div className="flex-between">
                    <label htmlFor="weight">Weight (kg)</label>
                    <span className="metric-badge">{weight} kg</span>
                  </div>
                  <input
                    id="weight"
                    type="range"
                    min="30"
                    max="180"
                    step="0.5"
                    value={weight}
                    onChange={(e) => setWeight(Number(e.target.value))}
                    className="slider"
                  />
                  <input
                    type="number"
                    min="20"
                    max="300"
                    step="0.1"
                    value={weight}
                    onChange={(e) => setWeight(Number(e.target.value))}
                  />
                </div>
              </>
            ) : (
              <>
                {/* Height Input (Imperial) */}
                <div className="form-group">
                  <label>Height (Feet & Inches)</label>
                  <div className="form-row">
                    <div>
                      <input
                        type="number"
                        min="3"
                        max="7"
                        value={feet}
                        onChange={(e) => setFeet(Number(e.target.value))}
                        placeholder="Feet"
                      />
                      <small className="form-hint">Feet</small>
                    </div>
                    <div>
                      <input
                        type="number"
                        min="0"
                        max="11"
                        value={inches}
                        onChange={(e) => setInches(Number(e.target.value))}
                        placeholder="Inches"
                      />
                      <small className="form-hint">Inches</small>
                    </div>
                  </div>
                </div>

                {/* Weight Input (Imperial) */}
                <div className="form-group">
                  <div className="flex-between">
                    <label htmlFor="weightLbs">Weight (lbs)</label>
                    <span className="metric-badge">{weightLbs} lbs</span>
                  </div>
                  <input
                    id="weightLbs"
                    type="range"
                    min="66"
                    max="400"
                    value={weightLbs}
                    onChange={(e) => setWeightLbs(Number(e.target.value))}
                    className="slider"
                  />
                  <input
                    type="number"
                    min="40"
                    max="600"
                    value={weightLbs}
                    onChange={(e) => setWeightLbs(Number(e.target.value))}
                  />
                </div>
              </>
            )}

            <div className="bmi-formula-note">
              <small>
                Formula: <strong>weight (kg) / [height (m)]²</strong>
              </small>
            </div>
          </div>
        </div>

        {/* Right Card: Result & Analysis */}
        <div className="card bmi-result-card">
          <div className="card-header">
            <h3>Your Calculated BMI</h3>
          </div>

          <div className="card-body">
            <div className="bmi-display-box">
              <div className="bmi-number" style={{ color: bmiDetails.color }}>
                {bmiNumber !== null ? bmiNumber : '—'}
              </div>
              <div className="bmi-category">
                <span className={`badge badge-${bmiDetails.badge}`} style={{ fontSize: '1rem', padding: '0.35rem 0.85rem' }}>
                  {bmiDetails.category}
                </span>
              </div>
            </div>

            {/* Visual Color Spectrum Bar */}
            <div className="bmi-gauge-wrapper">
              <div className="bmi-gauge-labels">
                <span>18.5</span>
                <span>25.0</span>
                <span>30.0</span>
              </div>
              <div className="bmi-gauge-bar">
                <div className="gauge-segment seg-blue" title="Underweight (&lt;18.5)"></div>
                <div className="gauge-segment seg-green" title="Normal (18.5 - 24.9)"></div>
                <div className="gauge-segment seg-orange" title="Overweight (25 - 29.9)"></div>
                <div className="gauge-segment seg-red" title="Obese (&ge;30)"></div>
                {bmiNumber && (
                  <div
                    className="gauge-pointer"
                    style={{ left: `${gaugePercent}%` }}
                    title={`Current BMI: ${bmiNumber}`}
                  >
                    ▼
                  </div>
                )}
              </div>
              <div className="bmi-gauge-category-labels">
                <span className="cat-blue">Underweight</span>
                <span className="cat-green">Normal</span>
                <span className="cat-orange">Overweight</span>
                <span className="cat-red">Obese</span>
              </div>
            </div>

            {/* Healthy Weight Range Callout */}
            <div className="healthy-weight-box">
              <div className="healthy-icon">🎯</div>
              <div>
                <strong>Healthy Weight for Your Height:</strong>
                <div>
                  {unit === 'metric' ? (
                    <span>{minHealthyWeightKg} kg – {maxHealthyWeightKg} kg</span>
                  ) : (
                    <span>
                      {Math.round(minHealthyWeightKg * 2.20462)} lbs – {Math.round(maxHealthyWeightKg * 2.20462)} lbs
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Personalized Advice */}
            {bmiDetails.advice && (
              <div className="bmi-advice-box">
                <p>{bmiDetails.advice}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* WHO Classification Table */}
      <div className="card">
        <div className="card-header">
          <h3>WHO BMI Classification Reference</h3>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>BMI Range (kg/m²)</th>
                  <th>Health Risk Profile</th>
                </tr>
              </thead>
              <tbody>
                <tr className={bmiNumber && bmiNumber < 18.5 ? 'highlight-row' : ''}>
                  <td><span className="badge badge-blue">Underweight</span></td>
                  <td>&lt; 18.5</td>
                  <td>Nutritional deficiency, lower bone density</td>
                </tr>
                <tr className={bmiNumber && bmiNumber >= 18.5 && bmiNumber < 25 ? 'highlight-row' : ''}>
                  <td><span className="badge badge-green">Normal Weight</span></td>
                  <td>18.5 – 24.9</td>
                  <td>Lowest clinical health risk</td>
                </tr>
                <tr className={bmiNumber && bmiNumber >= 25 && bmiNumber < 30 ? 'highlight-row' : ''}>
                  <td><span className="badge badge-orange">Overweight</span></td>
                  <td>25.0 – 29.9</td>
                  <td>Moderate risk of cardiovascular strain</td>
                </tr>
                <tr className={bmiNumber && bmiNumber >= 30 ? 'highlight-row' : ''}>
                  <td><span className="badge badge-red">Obese</span></td>
                  <td>&ge; 30.0</td>
                  <td>High risk of hypertension, metabolic disorders</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
