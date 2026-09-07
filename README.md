# Fitness-Log Full-Stack Web Application

A full-stack fitness tracking web application built to exact specifications using Node.js, Express, PostgreSQL, and React.

---

## Tech Stack
- **Backend:** Node.js + Express
- **Database:** PostgreSQL
- **Frontend:** React + Vite
- **Authentication:** JWT (Bearer token)
- **Deployment Target:** Render (Free Tier)
- **CI/CD:** GitHub Actions

---

## Database Schema (PostgreSQL)

### `User` Table
| Column | Type | Constraints | Description |
|---|---|---|---|
| `UserID` | SERIAL | PRIMARY KEY | Unique user ID |
| `name` | VARCHAR | NOT NULL | User's full name |
| `email` | VARCHAR | UNIQUE, NOT NULL | User's login email |
| `password_hash` | VARCHAR | NOT NULL | Bcrypt hashed password |
| `height_cm` | DECIMAL | NULL | Height in centimeters (used for BMI) |
| `date_of_birth` | DATE | NULL | User's date of birth |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Account creation timestamp |

### `Workout` Table
| Column | Type | Constraints | Description |
|---|---|---|---|
| `WorkoutID` | SERIAL | PRIMARY KEY | Unique workout ID |
| `UserID` | INTEGER | NOT NULL, FK -> `User.UserID` | Owning user |
| `exercise_type` | VARCHAR | NOT NULL | Name or type of exercise |
| `duration_min` | INTEGER | NULL | Duration in minutes |
| `sets` | INTEGER | NULL | Number of sets |
| `reps` | INTEGER | NULL | Repetitions per set |
| `calories_burned` | INTEGER | NULL | Estimated energy expenditure |
| `workout_date` | DATE | NOT NULL | Date workout took place |

### `WeightLog` Table
| Column | Type | Constraints | Description |
|---|---|---|---|
| `WeightLogID` | SERIAL | PRIMARY KEY | Unique weight log ID |
| `UserID` | INTEGER | NOT NULL, FK -> `User.UserID` | Owning user |
| `weight_kg` | DECIMAL | NOT NULL | Body weight in kilograms |
| `log_date` | DATE | NOT NULL | Date logged |

### `Goal` Table
| Column | Type | Constraints | Description |
|---|---|---|---|
| `GoalID` | SERIAL | PRIMARY KEY | Unique goal ID |
| `UserID` | INTEGER | NOT NULL, FK -> `User.UserID` | Owning user |
| `goal_type` | VARCHAR | NOT NULL | `'weight_loss'`, `'muscle_gain'`, `'daily_exercise'` |
| `target_value` | DECIMAL | NULL | Numerical target (kg, minutes, etc.) |
| `current_value` | DECIMAL | NULL | Current progress value |
| `start_date` | DATE | DEFAULT CURRENT_DATE | Starting date |
| `target_date` | DATE | NULL | Deadline date |
| `status` | VARCHAR | NOT NULL, DEFAULT `'active'` | `'active'`, `'achieved'`, `'abandoned'` |

### `Reminder` Table
| Column | Type | Constraints | Description |
|---|---|---|---|
| `ReminderID` | SERIAL | PRIMARY KEY | Unique reminder ID |
| `UserID` | INTEGER | NOT NULL, FK -> `User.UserID` | Owning user |
| `reminder_type` | VARCHAR | NOT NULL | `'workout'`, `'hydration'`, `'goal'` |
| `scheduled_time` | TIMESTAMP | NOT NULL | Timestamp when reminder fires |
| `message` | TEXT | NULL | Reminder text |
| `status` | VARCHAR | NOT NULL, DEFAULT `'pending'` | `'pending'`, `'sent'`, `'dismissed'` |

> **Note on BMI:** BMI is **not** stored in the database. It is calculated dynamically on the fly as:
> $$\text{BMI} = \frac{\text{weight\_kg}}{(\text{height\_cm} / 100)^2}$$
> using `User.height_cm` and the most recent `WeightLog` record.

---

## API Contract

| # | Method | Endpoint | Auth Required | Request Body / Query | Success Response | Error Responses |
|---|---|---|---|---|---|---|
| 1 | `POST` | `/auth/register` | No | `{name, email, password, [height_cm, date_of_birth]}` | `201 {UserID, token}` | `409` if email exists, `400` if missing fields |
| 2 | `POST` | `/auth/login` | No | `{email, password}` | `200 {token}` | `401` invalid credentials |
| 3 | `POST` | `/workouts` | Yes (Bearer) | `{exercise_type, duration_min, sets, reps, calories_burned, workout_date}` | `201 {WorkoutID}` | `400` if exercise_type missing, `401` unauthorized |
| 4 | `GET` | `/workouts` | Yes (Bearer) | Query: `?date_from=YYYY-MM-DD&date_to=YYYY-MM-DD` | `200 [{WorkoutID, exercise_type, duration_min, calories_burned, workout_date}]` | `401` unauthorized |
| 5 | `POST` | `/goals` | Yes (Bearer) | `{goal_type, target_value, target_date}` | `201 {GoalID}` | `400` invalid goal_type, `401` unauthorized |
| 6 | `PATCH` | `/goals/:id` | Yes (Bearer, Owner) | `{current_value, status}` | `200` updated goal | `404` not found, `403` not owner, `401` unauthorized |
| 7 | `GET` | `/health-stats` | Yes (Bearer, Owner) | None | `200 {bmi, latest_weight, weight_history: [...]}` | `404` if no height set, `401` unauthorized |
| 8 | `GET` | `/reports` | Yes (Bearer, Owner) | Query: `?period=weekly\|monthly` | `200 {total_workouts, total_calories, start_date, end_date}` | `400` invalid period, `401` unauthorized |

---

## Local Setup & Run Instructions

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [PostgreSQL](https://www.postgresql.org/) (v14 or higher)

### 1. Clone & Install Dependencies
```bash
# Install backend and frontend dependencies
npm run install:all
```
Alternatively:
```bash
cd backend && npm install
cd ../frontend && npm install
```

### 2. Configure Database & Environment
Create the local PostgreSQL database:
```bash
createdb fitness_log
createdb fitness_log_test
```

Configure `backend/.env` (or copy from `backend/.env.example`):
```env
PORT=5001
DATABASE_URL=postgresql://localhost:5432/fitness_log
JWT_SECRET=super_secret_jwt_key_fitness_log
NODE_ENV=development
```

### 3. Run Database Migrations
```bash
npm run migrate
```
Or directly from `backend/`:
```bash
cd backend
npm run migrate
```

### 4. Run Contract Tests (TDD Verification)
All 8 endpoints have contract tests implemented with Jest and Supertest:
```bash
npm test
```
Or:
```bash
cd backend
npm test
```

### 5. Start the Application Locally

#### Option A: Running Full Stack in Production Mode
```bash
# Build frontend
npm run build

# Start backend server (serves both API and frontend on port 5001)
npm start
```
Open [http://localhost:5001](http://localhost:5001) in your browser.

#### Option B: Running in Development Mode
In one terminal, start the backend:
```bash
npm run dev:backend
```
In a second terminal, start the Vite frontend development server:
```bash
npm run dev:frontend
```
Open [http://localhost:3000](http://localhost:3000) in your browser. API requests will be proxied automatically to `http://localhost:5001`.

---

## Frontend Screens Overview
1. **Register / Login:** Secure authentication with JWT token persistence. Optional height & date of birth during registration so health statistics and BMI calculation are enabled immediately.
2. **Add Workout Form & Workout History:** Form for logging exercise type, duration, sets, reps, calories burned, and date, coupled with a date-filterable history view.
3. **Set Goal Form & Goals List:** Create goals by type (`weight_loss`, `muscle_gain`, `daily_exercise`), track progress bars, and update values/status (`active`, `achieved`, `abandoned`).
4. **Health Statistics:** Displays computed Body Mass Index (BMI) with clinical health category badges, latest weight, and an interactive SVG chart plotting historical weight entries.
5. **Weekly & Monthly Reports:** Aggregated activity report card featuring workout frequency, total caloric burn, and average calories per workout session over 7-day and 30-day windows.

---

## CI/CD Pipeline
A GitHub Actions workflow is located at `.github/workflows/ci.yml`. On every `push` and `pull_request` to `main`:
1. Spawns an automated PostgreSQL 16 service container.
2. Runs database migrations against the container.
3. Executes the full Jest test suite across all 8 endpoints.
4. Verifies the React frontend production build.

---

## Render Deployment (Free Tier)
A `render.yaml` Blueprint specification is included at the root of the repository:
1. Connect your repository to [Render](https://render.com/).
2. Select **New Blueprint Instance** and pick this repository.
3. Render will provision:
   - A free PostgreSQL database (`fitness-log-db`).
   - A free Node.js Web Service (`fitness-log-web`) that installs dependencies, builds the frontend, runs migrations, and serves the full-stack application.
