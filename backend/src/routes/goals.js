const express = require('express');
const { query } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

const VALID_GOAL_TYPES = ['weight_loss', 'muscle_gain', 'daily_exercise'];
const VALID_STATUSES = ['active', 'achieved', 'abandoned'];

// 5. POST /goals — auth required — body: {goal_type, target_value, target_date} -> 201 {GoalID}; error: 400 invalid goal_type
router.post('/', authenticateToken, async (req, res) => {
  const { goal_type, target_value, target_date } = req.body;

  if (!goal_type || !VALID_GOAL_TYPES.includes(goal_type)) {
    return res.status(400).json({ error: 'Invalid or missing goal_type. Allowed: weight_loss, muscle_gain, daily_exercise' });
  }

  try {
    const result = await query(
      `INSERT INTO "Goal" ("UserID", "goal_type", "target_value", "target_date")
       VALUES ($1, $2, $3, $4)
       RETURNING "GoalID"`,
      [
        req.user.UserID,
        goal_type,
        target_value !== undefined ? target_value : null,
        target_date || null,
      ]
    );

    return res.status(201).json({ GoalID: result.rows[0].GoalID });
  } catch (err) {
    console.error('Create goal error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// 6. PATCH /goals/{id} — auth required, owner only — body: {current_value, status} -> 200 updated goal; error: 404 not found, 403 not owner
router.patch('/:id', authenticateToken, async (req, res) => {
  const goalId = parseInt(req.params.id, 10);
  const { current_value, status } = req.body;

  if (isNaN(goalId)) {
    return res.status(404).json({ error: 'Goal not found' });
  }

  if (status && !VALID_STATUSES.includes(status)) {
    return res.status(400).json({ error: 'Invalid status. Allowed: active, achieved, abandoned' });
  }

  try {
    const existing = await query(`SELECT * FROM "Goal" WHERE "GoalID" = $1`, [goalId]);

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    const goal = existing.rows[0];

    if (goal.UserID !== req.user.UserID) {
      return res.status(403).json({ error: 'Forbidden: Not the owner of this goal' });
    }

    const updates = [];
    const params = [];

    if (current_value !== undefined) {
      params.push(current_value);
      updates.push(`"current_value" = $${params.length}`);
    }

    if (status !== undefined) {
      params.push(status);
      updates.push(`"status" = $${params.length}`);
    }

    if (updates.length === 0) {
      return res.status(200).json(goal);
    }

    params.push(goalId);
    const updateSql = `
      UPDATE "Goal"
      SET ${updates.join(', ')}
      WHERE "GoalID" = $${params.length}
      RETURNING "GoalID", "UserID", "goal_type", "target_value", "current_value",
                TO_CHAR("start_date", 'YYYY-MM-DD') AS "start_date",
                TO_CHAR("target_date", 'YYYY-MM-DD') AS "target_date",
                "status"
    `;

    const result = await query(updateSql, params);
    return res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error('Update goal error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
