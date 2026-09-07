const express = require('express');
const { query } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// 3. POST /workouts — auth required — body: {exercise_type, duration_min, sets, reps, calories_burned, workout_date} -> 201 {WorkoutID}; error: 400 if exercise_type missing
router.post('/', authenticateToken, async (req, res) => {
  const { exercise_type, duration_min, sets, reps, calories_burned, workout_date } = req.body;

  if (!exercise_type || exercise_type.trim() === '') {
    return res.status(400).json({ error: 'exercise_type is required' });
  }

  const date = workout_date || new Date().toISOString().split('T')[0];

  try {
    const result = await query(
      `INSERT INTO "Workout" ("UserID", "exercise_type", "duration_min", "sets", "reps", "calories_burned", "workout_date")
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING "WorkoutID"`,
      [
        req.user.UserID,
        exercise_type.trim(),
        duration_min !== undefined ? duration_min : null,
        sets !== undefined ? sets : null,
        reps !== undefined ? reps : null,
        calories_burned !== undefined ? calories_burned : null,
        date,
      ]
    );

    return res.status(201).json({ WorkoutID: result.rows[0].WorkoutID });
  } catch (err) {
    console.error('Create workout error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// 4. GET /workouts — auth required — query: date_from, date_to -> 200 [{WorkoutID, exercise_type, duration_min, calories_burned, workout_date}]
router.get('/', authenticateToken, async (req, res) => {
  const { date_from, date_to } = req.query;

  try {
    const conditions = ['"UserID" = $1'];
    const params = [req.user.UserID];

    if (date_from) {
      params.push(date_from);
      conditions.push(`"workout_date" >= $${params.length}`);
    }

    if (date_to) {
      params.push(date_to);
      conditions.push(`"workout_date" <= $${params.length}`);
    }

    const sql = `
      SELECT "WorkoutID", "exercise_type", "duration_min", "calories_burned", TO_CHAR("workout_date", 'YYYY-MM-DD') AS "workout_date"
      FROM "Workout"
      WHERE ${conditions.join(' AND ')}
      ORDER BY "workout_date" DESC, "WorkoutID" DESC
    `;

    const result = await query(sql, params);
    return res.status(200).json(result.rows);
  } catch (err) {
    console.error('Get workouts error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
