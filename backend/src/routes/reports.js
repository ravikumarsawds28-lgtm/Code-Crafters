const express = require('express');
const { query } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// 8. GET /reports?period=weekly|monthly — auth required, owner only -> 200 {total_workouts, total_calories, start_date, end_date}; error: 400 invalid period
router.get('/', authenticateToken, async (req, res) => {
  const { period } = req.query;

  if (period !== 'weekly' && period !== 'monthly') {
    return res.status(400).json({ error: 'Invalid period. Must be weekly or monthly' });
  }

  const interval = period === 'weekly' ? '7 days' : '30 days';

  try {
    const datesRes = await query(
      `SELECT
        TO_CHAR(CURRENT_DATE - $1::interval, 'YYYY-MM-DD') AS start_date,
        TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD') AS end_date`,
      [interval]
    );

    const { start_date, end_date } = datesRes.rows[0];

    const statsRes = await query(
      `SELECT
        COUNT(*)::int AS total_workouts,
        COALESCE(SUM("calories_burned"), 0)::int AS total_calories
       FROM "Workout"
       WHERE "UserID" = $1
         AND "workout_date" >= $2::date
         AND "workout_date" <= $3::date`,
      [req.user.UserID, start_date, end_date]
    );

    const { total_workouts, total_calories } = statsRes.rows[0];

    return res.status(200).json({
      total_workouts,
      total_calories,
      start_date,
      end_date,
    });
  } catch (err) {
    console.error('Get reports error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
