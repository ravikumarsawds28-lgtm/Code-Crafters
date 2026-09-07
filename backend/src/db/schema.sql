-- Fitness-Log Database Schema

CREATE TABLE IF NOT EXISTS "User" (
  "UserID" SERIAL PRIMARY KEY,
  "name" VARCHAR(255) NOT NULL,
  "email" VARCHAR(255) UNIQUE NOT NULL,
  "password_hash" VARCHAR(255) NOT NULL,
  "height_cm" DECIMAL(5, 2),
  "date_of_birth" DATE,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Workout" (
  "WorkoutID" SERIAL PRIMARY KEY,
  "UserID" INTEGER NOT NULL REFERENCES "User"("UserID") ON DELETE CASCADE,
  "exercise_type" VARCHAR(255) NOT NULL,
  "duration_min" INTEGER,
  "sets" INTEGER,
  "reps" INTEGER,
  "calories_burned" INTEGER,
  "workout_date" DATE NOT NULL
);

CREATE TABLE IF NOT EXISTS "WeightLog" (
  "WeightLogID" SERIAL PRIMARY KEY,
  "UserID" INTEGER NOT NULL REFERENCES "User"("UserID") ON DELETE CASCADE,
  "weight_kg" DECIMAL(5, 2) NOT NULL,
  "log_date" DATE NOT NULL
);

CREATE TABLE IF NOT EXISTS "Goal" (
  "GoalID" SERIAL PRIMARY KEY,
  "UserID" INTEGER NOT NULL REFERENCES "User"("UserID") ON DELETE CASCADE,
  "goal_type" VARCHAR(50) NOT NULL CHECK ("goal_type" IN ('weight_loss', 'muscle_gain', 'daily_exercise')),
  "target_value" DECIMAL(10, 2),
  "current_value" DECIMAL(10, 2),
  "start_date" DATE DEFAULT CURRENT_DATE,
  "target_date" DATE,
  "status" VARCHAR(50) NOT NULL DEFAULT 'active' CHECK ("status" IN ('active', 'achieved', 'abandoned'))
);

CREATE TABLE IF NOT EXISTS "Reminder" (
  "ReminderID" SERIAL PRIMARY KEY,
  "UserID" INTEGER NOT NULL REFERENCES "User"("UserID") ON DELETE CASCADE,
  "reminder_type" VARCHAR(50) NOT NULL CHECK ("reminder_type" IN ('workout', 'hydration', 'goal')),
  "scheduled_time" TIMESTAMP NOT NULL,
  "message" TEXT,
  "status" VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK ("status" IN ('pending', 'sent', 'dismissed'))
);

CREATE INDEX IF NOT EXISTS "idx_workout_user_date" ON "Workout" ("UserID", "workout_date");
CREATE INDEX IF NOT EXISTS "idx_weightlog_user_date" ON "WeightLog" ("UserID", "log_date" DESC);
CREATE INDEX IF NOT EXISTS "idx_goal_user" ON "Goal" ("UserID");
