import React, { useState, useEffect } from 'react';
import { api } from '../api/client';

export default function Goals() {
  const [goals, setGoals] = useState(() => {
    const saved = localStorage.getItem('fitness_log_local_goals');
    return saved ? JSON.parse(saved) : [];
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Set Goal form state
  const [formData, setFormData] = useState({
    goal_type: 'weight_loss',
    target_value: '',
    target_date: '',
  });

  // Editing state for PATCH /goals/:id
  const [editingGoalId, setEditingGoalId] = useState(null);
  const [editData, setEditData] = useState({ current_value: '', status: 'active' });

  useEffect(() => {
    localStorage.setItem('fitness_log_local_goals', JSON.stringify(goals));
  }, [goals]);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleCreateGoal = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      const payload = {
        goal_type: formData.goal_type,
      };
      if (formData.target_value !== '') payload.target_value = parseFloat(formData.target_value);
      if (formData.target_date) payload.target_date = formData.target_date;

      const res = await api.createGoal(payload);
      const newGoal = {
        GoalID: res.GoalID,
        goal_type: formData.goal_type,
        target_value: payload.target_value || null,
        current_value: 0,
        start_date: new Date().toISOString().split('T')[0],
        target_date: payload.target_date || null,
        status: 'active',
      };

      setGoals([newGoal, ...goals]);
      setMessage({ type: 'success', text: 'Goal set successfully!' });

      setFormData({
        goal_type: 'weight_loss',
        target_value: '',
        target_date: '',
      });
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to set goal' });
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (goal) => {
    setEditingGoalId(goal.GoalID);
    setEditData({
      current_value: goal.current_value !== null ? goal.current_value : '',
      status: goal.status || 'active',
    });
  };

  const handleSaveEdit = async (goalId) => {
    setMessage({ type: '', text: '' });
    try {
      const payload = {};
      if (editData.current_value !== '') payload.current_value = parseFloat(editData.current_value);
      if (editData.status) payload.status = editData.status;

      const updated = await api.patchGoal(goalId, payload);

      setGoals(goals.map((g) => (g.GoalID === goalId ? { ...g, ...updated } : g)));
      setEditingGoalId(null);
      setMessage({ type: 'success', text: 'Goal updated successfully!' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to update goal' });
    }
  };

  const getGoalTypeLabel = (type) => {
    switch (type) {
      case 'weight_loss':
        return { label: 'Weight Loss', icon: '⚖️', unit: 'kg' };
      case 'muscle_gain':
        return { label: 'Muscle Gain', icon: '💪', unit: 'kg' };
      case 'daily_exercise':
        return { label: 'Daily Exercise', icon: '🏃', unit: 'min' };
      default:
        return { label: type, icon: '🎯', unit: '' };
    }
  };

  const calculateProgress = (goal) => {
    if (!goal.target_value || goal.target_value === 0) return 0;
    const current = Number(goal.current_value) || 0;
    const target = Number(goal.target_value);
    const pct = Math.round((current / target) * 100);
    return Math.min(Math.max(pct, 0), 100);
  };

  return (
    <div className="section-container">
      <div className="section-header">
        <div>
          <h2>Fitness Goals</h2>
          <p className="section-subtitle">Set clear targets, track your progress, and celebrate achievements.</p>
        </div>
      </div>

      {message.text && (
        <div className={`alert alert-${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="goals-grid">
        {/* Set Goal Form Card */}
        <div className="card">
          <div className="card-header">
            <h3>Set a New Goal</h3>
          </div>
          <form onSubmit={handleCreateGoal} className="card-body form-stack">
            <div className="form-group">
              <label htmlFor="goal_type">Goal Type *</label>
              <select
                id="goal_type"
                name="goal_type"
                value={formData.goal_type}
                onChange={handleInputChange}
                required
              >
                <option value="weight_loss">⚖️ Weight Loss</option>
                <option value="muscle_gain">💪 Muscle Gain</option>
                <option value="daily_exercise">🏃 Daily Exercise</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="target_value">Target Value</label>
              <input
                id="target_value"
                name="target_value"
                type="number"
                step="0.1"
                placeholder={
                  formData.goal_type === 'daily_exercise'
                    ? 'Target minutes (e.g. 45)'
                    : 'Target kg (e.g. 70)'
                }
                value={formData.target_value}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="target_date">Target Date</label>
              <input
                id="target_date"
                name="target_date"
                type="date"
                value={formData.target_date}
                onChange={handleInputChange}
              />
            </div>

            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Setting Goal...' : 'Set Goal'}
            </button>
          </form>
        </div>

        {/* Goals List with Progress Card */}
        <div className="card">
          <div className="card-header flex-between">
            <h3>Active & Completed Goals</h3>
            <span className="badge badge-neutral">{goals.length} goals</span>
          </div>

          <div className="card-body">
            {goals.length === 0 ? (
              <div className="empty-state">
                <p>No goals set yet.</p>
                <small>Create a target above to start tracking your progress!</small>
              </div>
            ) : (
              <div className="goal-list">
                {goals.map((goal) => {
                  const meta = getGoalTypeLabel(goal.goal_type);
                  const progress = calculateProgress(goal);
                  const isEditing = editingGoalId === goal.GoalID;

                  return (
                    <div key={goal.GoalID} className={`goal-item status-${goal.status}`}>
                      <div className="goal-item-header">
                        <div className="goal-type">
                          <span className="goal-icon">{meta.icon}</span>
                          <div>
                            <strong>{meta.label}</strong>
                            <div className="goal-sub">Goal #{goal.GoalID}</div>
                          </div>
                        </div>

                        <span className={`badge badge-${goal.status}`}>
                          {goal.status}
                        </span>
                      </div>

                      <div className="goal-targets">
                        <div>
                          <small>Current:</small>{' '}
                          <strong>{goal.current_value ?? '—'} {meta.unit}</strong>
                        </div>
                        <div>
                          <small>Target:</small>{' '}
                          <strong>{goal.target_value ?? '—'} {meta.unit}</strong>
                        </div>
                        {goal.target_date && (
                          <div>
                            <small>By:</small> <span>{goal.target_date}</span>
                          </div>
                        )}
                      </div>

                      {/* Progress bar */}
                      <div className="progress-container">
                        <div className="progress-bar-bg">
                          <div
                            className="progress-bar-fill"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span className="progress-text">{progress}%</span>
                      </div>

                      {/* Update Goal Controls */}
                      {isEditing ? (
                        <div className="goal-edit-box">
                          <div className="form-row">
                            <div className="form-group">
                              <label>Current Value ({meta.unit})</label>
                              <input
                                type="number"
                                step="0.1"
                                value={editData.current_value}
                                onChange={(e) =>
                                  setEditData({ ...editData, current_value: e.target.value })
                                }
                              />
                            </div>
                            <div className="form-group">
                              <label>Status</label>
                              <select
                                value={editData.status}
                                onChange={(e) =>
                                  setEditData({ ...editData, status: e.target.value })
                                }
                              >
                                <option value="active">Active</option>
                                <option value="achieved">Achieved</option>
                                <option value="abandoned">Abandoned</option>
                              </select>
                            </div>
                          </div>
                          <div className="btn-group">
                            <button
                              type="button"
                              className="btn-primary btn-sm"
                              onClick={() => handleSaveEdit(goal.GoalID)}
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              className="btn-ghost btn-sm"
                              onClick={() => setEditingGoalId(null)}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="goal-actions">
                          <button
                            type="button"
                            className="btn-secondary btn-sm"
                            onClick={() => startEdit(goal)}
                          >
                            Update Progress
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
