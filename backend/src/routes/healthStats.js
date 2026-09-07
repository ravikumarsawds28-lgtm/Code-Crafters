const express = require('express');
const { query } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// 7. GET /health-stats — auth required, owner only -> 200 {bmi, latest_weight, weight_history: [...]}; error: 404 if no height set
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userRes = await query(`SELECT "height_cm" FROM "User" WHERE "UserID" = $1`, [req.user.UserID]);

    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const height_cm = userRes.rows[0].height_cm;
    if (height_cm === null || height_cm === undefined) {
      return res.status(404).json({ error: 'No height set' });
    }

    const weightLogsRes = await query(
      `SELECT "WeightLogID", "weight_kg", TO_CHAR("log_date", 'YYYY-MM-DD') AS "log_date"
       FROM "WeightLog"
       WHERE "UserID" = $1
       ORDER BY "log_date" DESC, "WeightLogID" DESC`,
      [req.user.UserID]
    );

    const weight_history = weightLogsRes.rows.map((row) => ({
      WeightLogID: row.WeightLogID,
      weight_kg: parseFloat(row.weight_kg),
      log_date: row.log_date,
    }));

    let latest_weight = null;
    let bmi = null;

    if (weight_history.length > 0) {
      latest_weight = weight_history[0].weight_kg;
      const height_m = parseFloat(height_cm) / 100;
      bmi = parseFloat((latest_weight / (height_m * height_m)).toFixed(2));
    }

    return res.status(200).json({
      bmi,
      latest_weight,
      weight_history,
    });
  } catch (err) {
    console.error('Get health stats error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /health-stats — auth required — data entry for weight log & height update
router.post('/', authenticateToken, async (req, res) => {
  const { weight_kg, log_date, height_cm } = req.body;

  try {
    if (height_cm !== undefined && height_cm !== null && height_cm !== '') {
      await query(
        `UPDATE "User" SET "height_cm" = $1 WHERE "UserID" = $2`,
        [parseFloat(height_cm), req.user.UserID]
      );
    }

    if (weight_kg !== undefined && weight_kg !== null && weight_kg !== '') {
      const date = log_date || new Date().toISOString().split('T')[0];
      await query(
        `INSERT INTO "WeightLog" ("UserID", "weight_kg", "log_date")
         VALUES ($1, $2, $3)`,
        [req.user.UserID, parseFloat(weight_kg), date]
      );
    }

    const userRes = await query(`SELECT "height_cm" FROM "User" WHERE "UserID" = $1`, [req.user.UserID]);
    const currentHeight = userRes.rows.length > 0 ? userRes.rows[0].height_cm : null;

    const weightLogsRes = await query(
      `SELECT "WeightLogID", "weight_kg", TO_CHAR("log_date", 'YYYY-MM-DD') AS "log_date"
       FROM "WeightLog"
       WHERE "UserID" = $1
       ORDER BY "log_date" DESC, "WeightLogID" DESC`,
      [req.user.UserID]
    );

    const weight_history = weightLogsRes.rows.map((row) => ({
      WeightLogID: row.WeightLogID,
      weight_kg: parseFloat(row.weight_kg),
      log_date: row.log_date,
    }));

    let latest_weight = null;
    let bmi = null;

    if (weight_history.length > 0) {
      latest_weight = weight_history[0].weight_kg;
      if (currentHeight) {
        const height_m = parseFloat(currentHeight) / 100;
        bmi = parseFloat((latest_weight / (height_m * height_m)).toFixed(2));
      }
    }

    return res.status(200).json({
      height_cm: currentHeight ? parseFloat(currentHeight) : null,
      bmi,
      latest_weight,
      weight_history,
    });
  } catch (err) {
    console.error('Save health stats error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

module.exports = router;
