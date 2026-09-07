import React, { useState, useEffect } from 'react';
import { api } from '../api/client';

export default function Workouts() {
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Add Workout form state
  const [formData, setFormData] = useState({
    exercise_type: '',
    duration_min: '',
    sets: '',
    reps: '',
    calories_burned: '',
    workout_date: new Date().toISOString().split('T')[0],
  });

  // Filter state
  const [filters, setFilters] = useState({
    date_from: '',
    date_to: '',
  });

  const fetchWorkouts = async (activeFilters = filters) => {
    setLoading(true);
    try {
      const data = await api.getWorkouts(activeFilters);
      setWorkouts(data);
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: err.message || 'Failed to load workouts' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkouts();
  }, []);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value,
    });
  };

  const handleApplyFilter = (e) => {
    e.preventDefault();
    fetchWorkouts(filters);
  };

  const handleResetFilter = () => {
    const emptyFilters = { date_from: '', date_to: '' };
    setFilters(emptyFilters);
    fetchWorkouts(emptyFilters);
  };

  const handleSubmitWorkout = async (e) => {
    e.preventDefault();
    if (!formData.exercise_type.trim()) {
      setMessage({ type: 'error', text: 'Exercise type is required' });
      return;
    }

    setSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      const payload = {
        exercise_type: formData.exercise_type.trim(),
        workout_date: formData.workout_date,
      };
      if (formData.duration_min !== '') payload.duration_min = parseInt(formData.duration_min, 10);
      if (formData.sets !== '') payload.sets = parseInt(formData.sets, 10);
      if (formData.reps !== '') payload.reps = parseInt(formData.reps, 10);
      if (formData.calories_burned !== '') payload.calories_burned = parseInt(formData.calories_burned, 10);

      await api.createWorkout(payload);
      setMessage({ type: 'success', text: 'Workout recorded successfully!' });

      // Reset form
      setFormData({
        exercise_type: '',
        duration_min: '',
        sets: '',
        reps: '',
        calories_burned: '',
        workout_date: new Date().toISOString().split('T')[0],
      });

      // Refresh list
      fetchWorkouts();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to record workout' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="section-container">
      <div className="section-header">
        <div>
          <h2>Workouts</h2>
          <p className="section-subtitle">Log your daily fitness activities and review your workout history.</p>
        </div>
      </div>

      {message.text && (
        <div className={`alert alert-${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="workouts-grid">
        {/* Add Workout Form Card */}
        <div className="card">
          <div className="card-header">
            <h3>Log a Workout</h3>
          </div>
          <form onSubmit={handleSubmitWorkout} className="card-body form-stack">
            <div className="form-group">
              <label htmlFor="exercise_type">Exercise Type *</label>
              <input
                id="exercise_type"
                name="exercise_type"
                type="text"
                required
                placeholder="e.g. Running, Bench Press, Cycling"
                value={formData.exercise_type}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="duration_min">Duration (min)</label>
                <input
                  id="duration_min"
                  name="duration_min"
                  type="number"
                  min="1"
                  placeholder="30"
                  value={formData.duration_min}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="calories_burned">Calories Burned</label>
                <input
                  id="calories_burned"
                  name="calories_burned"
                  type="number"
                  min="0"
                  placeholder="250"
                  value={formData.calories_burned}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="sets">Sets</label>
                <input
                  id="sets"
                  name="sets"
                  type="number"
                  min="1"
                  placeholder="3"
                  value={formData.sets}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="reps">Reps</label>
                <input
                  id="reps"
                  name="reps"
                  type="number"
                  min="1"
                  placeholder="12"
                  value={formData.reps}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="workout_date">Workout Date *</label>
              <input
                id="workout_date"
                name="workout_date"
                type="date"
                required
                value={formData.workout_date}
                onChange={handleInputChange}
              />
            </div>

            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : 'Add Workout'}
            </button>
          </form>
        </div>

        {/* Workout History List Card */}
        <div className="card">
          <div className="card-header flex-between">
            <h3>Workout History</h3>
            <span className="badge badge-neutral">{workouts.length} entries</span>
          </div>

          <div className="card-body">
            {/* Filter controls */}
            <form onSubmit={handleApplyFilter} className="filter-bar">
              <div className="filter-inputs">
                <div className="filter-field">
                  <label>From:</label>
                  <input
                    type="date"
                    name="date_from"
                    value={filters.date_from}
                    onChange={handleFilterChange}
                  />
                </div>
                <div className="filter-field">
                  <label>To:</label>
                  <input
                    type="date"
                    name="date_to"
                    value={filters.date_to}
                    onChange={handleFilterChange}
                  />
                </div>
              </div>
              <div className="filter-actions">
                <button type="submit" className="btn-secondary btn-sm">Apply</button>
                {(filters.date_from || filters.date_to) && (
                  <button type="button" onClick={handleResetFilter} className="btn-ghost btn-sm">Clear</button>
                )}
              </div>
            </form>

            {loading ? (
              <div className="loading-spinner">Loading workouts...</div>
            ) : workouts.length === 0 ? (
              <div className="empty-state">
                <p>No workouts recorded yet.</p>
                <small>Log your first workout using the form.</small>
              </div>
            ) : (
              <div className="workout-list">
                {workouts.map((w) => (
                  <div key={w.WorkoutID} className="workout-item">
                    <div className="workout-info">
                      <div className="workout-title">{w.exercise_type}</div>
                      <div className="workout-date">{w.workout_date}</div>
                    </div>
                    <div className="workout-metrics">
                      {w.duration_min !== null && (
                        <span className="metric-pill">⏱️ {w.duration_min} min</span>
                      )}
                      {w.calories_burned !== null && (
                        <span className="metric-pill">🔥 {w.calories_burned} kcal</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
