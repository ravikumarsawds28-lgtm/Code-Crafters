import React, { useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    height_cm: '',
    date_of_birth: '',
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const res = await api.login({
          email: formData.email,
          password: formData.password,
        });
        login(res.token, { email: formData.email });
      } else {
        const payload = {
          name: formData.name,
          email: formData.email,
          password: formData.password,
        };
        if (formData.height_cm) payload.height_cm = parseFloat(formData.height_cm);
        if (formData.date_of_birth) payload.date_of_birth = formData.date_of_birth;

        const res = await api.register(payload);
        login(res.token, { UserID: res.UserID, email: formData.email, name: formData.name });
      }
    } catch (err) {
      if (err.status === 409) {
        setError('An account with this email already exists.');
      } else if (err.status === 401) {
        setError('Invalid email or password.');
      } else {
        setError(err.message || 'Authentication failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await api.login({
        email: 'demo@fitnesslog.com',
        password: 'password123',
      });
      login(res.token, { email: 'demo@fitnesslog.com', name: 'Demo Athlete' });
    } catch (err) {
      setError(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="brand-logo">⚡</div>
          <h1>Fitness-Log</h1>
          <p className="auth-subtitle">
            {isLogin ? 'Sign in to track your workouts & goals' : 'Create an account to start your fitness journey'}
          </p>
        </div>

        <div className="auth-tabs">
          <button
            type="button"
            className={`tab-btn ${isLogin ? 'active' : ''}`}
            onClick={() => { setIsLogin(true); setError(''); }}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`tab-btn ${!isLogin ? 'active' : ''}`}
            onClick={() => { setIsLogin(false); setError(''); }}
          >
            Register
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          {!isLogin && (
            <div className="form-group">
              <label htmlFor="name">Full Name *</label>
              <input
                id="name"
                name="name"
                type="text"
                required
                placeholder="e.g. Alex Johnson"
                value={formData.name}
                onChange={handleChange}
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email Address *</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password *</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
            />
          </div>

          {!isLogin && (
            <>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="height_cm">Height (cm)</label>
                  <input
                    id="height_cm"
                    name="height_cm"
                    type="number"
                    step="0.1"
                    placeholder="e.g. 175"
                    value={formData.height_cm}
                    onChange={handleChange}
                  />
                  <small className="form-hint">Used to calculate BMI</small>
                </div>

                <div className="form-group">
                  <label htmlFor="date_of_birth">Date of Birth</label>
                  <input
                    id="date_of_birth"
                    name="date_of_birth"
                    type="date"
                    value={formData.date_of_birth}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </>
          )}

          <button type="submit" className="btn-primary btn-block" disabled={loading}>
            {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="demo-login-wrapper">
          <div className="divider-text">
            <span>OR</span>
          </div>
          <button
            type="button"
            className="btn-demo btn-block"
            onClick={handleDemoLogin}
            disabled={loading}
          >
            ⚡ Explore with Demo Data (Instant Login)
          </button>
        </div>
      </div>
    </div>
  );
}
