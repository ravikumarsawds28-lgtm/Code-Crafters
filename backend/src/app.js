const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const workoutRoutes = require('./routes/workouts');
const goalRoutes = require('./routes/goals');
const healthStatsRoutes = require('./routes/healthStats');
const reportsRoutes = require('./routes/reports');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/workouts', workoutRoutes);
app.use('/goals', goalRoutes);
app.use('/health-stats', healthStatsRoutes);
app.use('/reports', reportsRoutes);

module.exports = app;
