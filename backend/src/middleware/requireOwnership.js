const { query } = require('../config/db');

/**
 * Middleware factory: ensures the logged-in user owns the resource
 * identified by req.params[idParamName] in the given table.
 *
 * Usage:
 *   router.patch('/:id', authenticateToken, requireOwnership('Workout'), handler);
 *   router.delete('/:id', authenticateToken, requireOwnership('Workout'), handler);
 *
 * Must run AFTER authenticateToken, since it reads req.user.UserID.
 */
function requireOwnership(tableName, idParamName = 'id') {
  const pkColumn = `${tableName}ID`; // e.g. "WorkoutID", "GoalID"

  return async (req, res, next) => {
    const resourceId = req.params[idParamName];

    try {
      const result = await query(
        `SELECT "UserID" FROM "${tableName}" WHERE "${pkColumn}" = $1`,
        [resourceId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: `${tableName} not found` });
      }

      if (result.rows[0].UserID !== req.user.UserID) {
        return res.status(403).json({ error: 'You are not authorized to modify this resource' });
      }

      next();
    } catch (err) {
      console.error(`Ownership check error (${tableName}):`, err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };
}

module.exports = requireOwnership;
