const path = require('path');
const express = require('express');
const app = require('./app');
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

app.listen(PORT, () => {
  console.log(`Fitness-Log server listening on port ${PORT}`);
});
