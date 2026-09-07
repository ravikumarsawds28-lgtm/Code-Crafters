const path = require('path');
const express = require('express');
const app = require('./app');
const { runMigrations } = require('./db/migrate');
require('dotenv').config();

const PORT = process.env.PORT || 5001;

// Serve static frontend files if production build exists
const frontendBuildPath = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendBuildPath));

// For SPA routing, redirect unknown routes to index.html if frontend is built
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/auth') || req.path.startsWith('/workouts') ||
      req.path.startsWith('/goals') || req.path.startsWith('/health-stats') ||
      req.path.startsWith('/reports')) {
    return next();
  }
  const indexPath = path.join(frontendBuildPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      next();
    }
  });
});

// Bind immediately to 0.0.0.0 so Render detects open port without timeout
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Fitness-Log server listening on 0.0.0.0:${PORT}`);

  // Run migrations asynchronously once port is bound
  runMigrations()
    .then(() => console.log('Database ready.'))
    .catch((err) => console.error('Database migration note:', err.message));
});
