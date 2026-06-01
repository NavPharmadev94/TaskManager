# Task Manager App

A full-stack task management application with a FastAPI backend and Next.js frontend. Users register, log in, and manage their own private task lists.

## Tech Stack

**Backend**
- FastAPI
- SQLAlchemy (ORM)
- SQLite (default) / configurable via `DATABASE_URL`
- Uvicorn (ASGI server)
- `python-jose` — JWT token generation & validation
- `bcrypt` — password hashing
- `httpOnly` cookies — secure token storage

**Frontend**
- Next.js 16 (App Router)
- React 19
- Chakra UI
- TypeScript

## Project Structure

```
App/
├── backend/
│   ├── requirements.txt
│   ├── .env                 # secrets (not committed)
│   ├── .gitignore
│   ├── venv/                # virtual environment (not committed)
│   └── App/
│       ├── main.py          # FastAPI app, CORS middleware
│       ├── database.py      # DB engine, session, get_db
│       ├── models.py        # User + Task SQLAlchemy models
│       ├── schemas.py       # Pydantic request/response schemas
│       ├── auth.py          # JWT utils, bcrypt, get_current_user
│       └── routers/
│           ├── auth.py      # /auth/register, /login, /logout
│           └── tasks.py     # /tasks CRUD (protected)
└── frontend/
    ├── package.json
    └── src/
        └── app/
            ├── layout.tsx
            ├── page.tsx
            └── providers.tsx
```

## Getting Started

### Backend

1. Navigate to the backend directory:
   ```powershell
   cd backend
   ```

2. Create and activate a virtual environment:
   ```powershell
   python -m venv venv
   .\venv\Scripts\Activate.ps1   # Windows PowerShell
   ```

3. Install dependencies:
   ```powershell
   pip install -r requirements.txt
   ```

4. Create a `.env` file in `backend/`:
   ```env
   DATABASE_URL=sqlite:///./tasks.db
   SECRET_KEY=your-strong-random-secret-key
   FRONTEND_ORIGIN=http://localhost:3000
   ```
   > **Important:** Set a strong random `SECRET_KEY` — never use the default in production.

5. Start the server:
   ```powershell
   cd App
   ..\venv\Scripts\uvicorn.exe main:app --reload
   ```

   API: `http://localhost:8000`  
   Interactive docs: `http://localhost:8000/docs`

### Frontend

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

   App: `http://localhost:3000`

## Authentication

Authentication uses **JWT tokens stored in `httpOnly` cookies** — the token is never exposed to JavaScript, protecting against XSS attacks.

### Flow
1. `POST /auth/register` — create an account
2. `POST /auth/login` — receive a cookie with the JWT (30 min expiry)
3. All `/tasks` requests automatically include the cookie
4. `POST /auth/logout` — clears the cookie

### Frontend fetch calls
All requests must include `credentials: "include"` so the browser sends the cookie:
```ts
// Login
await fetch("http://localhost:8000/auth/login", {
  method: "POST",
  credentials: "include",
  body: new URLSearchParams({ username: email, password }),
})

// Protected request — cookie sent automatically
await fetch("http://localhost:8000/tasks", { credentials: "include" })

// Logout
await fetch("http://localhost:8000/auth/logout", {
  method: "POST",
  credentials: "include",
})
```

## API Endpoints

### Auth

| Method | Endpoint          | Description             | Auth required |
|--------|-------------------|-------------------------|---------------|
| POST   | `/auth/register`  | Register a new user     | No            |
| POST   | `/auth/login`     | Login, sets cookie      | No            |
| POST   | `/auth/logout`    | Logout, clears cookie   | No            |

### Tasks

All task endpoints require a valid `access_token` cookie (set by login). Each user only sees their own tasks.

| Method | Endpoint         | Description        |
|--------|------------------|--------------------|
| POST   | `/tasks`         | Create a task      |
| GET    | `/tasks`         | List all tasks     |
| GET    | `/tasks/{id}`    | Get a task by ID   |
| PUT    | `/tasks/{id}`    | Update a task      |
| DELETE | `/tasks/{id}`    | Delete a task      |

## Schemas

**Register / Login request:**
```json
{ "email": "user@example.com", "password": "yourpassword" }
```

**User response:**
```json
{ "id": 1, "email": "user@example.com" }
```

**Task response:**
```json
{ "id": 1, "title": "Buy groceries", "completed": false }
```

## Production Notes

- Set `SECRET_KEY` to a long random string (e.g. `openssl rand -hex 32`)
- Set `secure=True` on the cookie (requires HTTPS)
- Switch `DATABASE_URL` to PostgreSQL for concurrent workloads
- Add rate limiting on `/auth/login` to prevent brute force attacks

