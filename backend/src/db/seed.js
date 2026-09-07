const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');

async function seedData(targetPool = pool) {
  try {
    console.log('Seeding initial fitness log data...');

    // Check if demo user already exists
    const existing = await targetPool.query(`SELECT "UserID" FROM "User" WHERE "email" = $1`, ['demo@fitnesslog.com']);
    let userId;

    if (existing.rows.length === 0) {
      const password_hash = await bcrypt.hash('password123', 10);
      const userRes = await targetPool.query(
        `INSERT INTO "User" ("name", "email", "password_hash", "height_cm", "date_of_birth")
         VALUES ($1, $2, $3, $4, $5)
         RETURNING "UserID"`,
        ['Demo Athlete', 'demo@fitnesslog.com', password_hash, 178.0, '1996-05-15']
      );
      userId = userRes.rows[0].UserID;
    } else {
      userId = existing.rows[0].UserID;
    }

    // Workouts (across the last 30 days)
    const workoutCountRes = await targetPool.query(`SELECT COUNT(*)::int AS count FROM "Workout" WHERE "UserID" = $1`, [userId]);
    if (workoutCountRes.rows[0].count === 0) {
      const workouts = [
        { type: 'Morning Jog', duration: 35, sets: 1, reps: 1, cal: 320, daysAgo: 28 },
        { type: 'Upper Body Hypertrophy', duration: 50, sets: 16, reps: 12, cal: 420, daysAgo: 24 },
        { type: 'Cycling Hills', duration: 45, sets: 1, reps: 1, cal: 460, daysAgo: 20 },
        { type: 'Leg Day & Squats', duration: 60, sets: 18, reps: 10, cal: 520, daysAgo: 16 },
        { type: 'Interval Sprint HIIT', duration: 30, sets: 8, reps: 1, cal: 380, daysAgo: 12 },
        { type: 'Full Body Calisthenics', duration: 45, sets: 12, reps: 15, cal: 390, daysAgo: 8 },
        { type: 'Tempo Run', duration: 40, sets: 1, reps: 1, cal: 410, daysAgo: 4 },
        { type: 'Power Yoga & Core', duration: 45, sets: 1, reps: 1, cal: 240, daysAgo: 1 },
      ];

      for (const w of workouts) {
        await targetPool.query(
          `INSERT INTO "Workout" ("UserID", "exercise_type", "duration_min", "sets", "reps", "calories_burned", "workout_date")
           VALUES ($1, $2, $3, $4, $5, $6, CURRENT_DATE - ($7 || ' days')::interval)`,
          [userId, w.type, w.duration, w.sets, w.reps, w.cal, w.daysAgo]
        );
      }
    }

    // Weight Logs (across the last 6 weeks)
    const weightCountRes = await targetPool.query(`SELECT COUNT(*)::int AS count FROM "WeightLog" WHERE "UserID" = $1`, [userId]);
    if (weightCountRes.rows[0].count === 0) {
      const weights = [
        { weight: 82.0, daysAgo: 35 },
        { weight: 81.2, daysAgo: 28 },
        { weight: 80.5, daysAgo: 21 },
        { weight: 79.8, daysAgo: 14 },
        { weight: 78.9, daysAgo: 7 },
        { weight: 78.2, daysAgo: 0 },
      ];

      for (const wl of weights) {
        await targetPool.query(
          `INSERT INTO "WeightLog" ("UserID", "weight_kg", "log_date")
           VALUES ($1, $2, CURRENT_DATE - ($3 || ' days')::interval)`,
          [userId, wl.weight, wl.daysAgo]
        );
      }
    }

    // Goals
    const goalCountRes = await targetPool.query(`SELECT COUNT(*)::int AS count FROM "Goal" WHERE "UserID" = $1`, [userId]);
    if (goalCountRes.rows[0].count === 0) {
      await targetPool.query(
        `INSERT INTO "Goal" ("UserID", "goal_type", "target_value", "current_value", "target_date", "status") VALUES
         ($1, 'weight_loss', 75.0, 78.2, CURRENT_DATE + INTERVAL '60 days', 'active'),
         ($1, 'daily_exercise', 45.0, 40.0, CURRENT_DATE + INTERVAL '30 days', 'active'),
         ($1, 'muscle_gain', 80.0, 80.0, CURRENT_DATE - INTERVAL '10 days', 'achieved')`,
        [userId]
      );
    }

    console.log('Seed data successfully applied.');
  } catch (err) {
    console.error('Seed error:', err.message);
  }
}

if (require.main === module) {
  seedData()
    .then(() => pool.end())
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = { seedData };
