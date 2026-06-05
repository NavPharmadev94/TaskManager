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
- Chakra UI v3
- TypeScript

## Project Structure

```
App/
├── backend/
│   ├── requirements.txt
│   ├── .env                      # secrets (not committed)
│   ├── .gitignore
│   ├── venv/                     # virtual environment (not committed)
│   └── App/
│       ├── main.py               # FastAPI app, CORS middleware, lifespan
│       ├── database.py           # DB engine, session, get_db
│       ├── models.py             # User + Task SQLAlchemy models
│       ├── schemas.py            # Pydantic request/response schemas
│       ├── security.py           # JWT utils, bcrypt, get_current_user
│       ├── routers/
│       │   ├── auth.py           # /auth/register, /login, /logout, /me
│       │   └── tasks.py          # /tasks CRUD (all protected)
│       └── services/
│           ├── auth_service.py   # user lookup, create, authenticate
│           └── task_service.py   # task CRUD business logic
└── frontend/
    ├── package.json
    ├── .env.local                # NEXT_PUBLIC_API_URL
    └── src/
        ├── middleware.ts         # edge auth guard (redirects)
        ├── lib/
        │   └── api.ts            # typed fetch functions for all endpoints
        └── app/
            ├── layout.tsx
            ├── page.tsx          # redirects / → /login
            ├── providers.tsx     # ChakraProvider
            ├── login/
            │   └── page.tsx      # sign in form
            ├── register/
            │   └── page.tsx      # register form
            └── dashboard/
                └── page.tsx      # task list + add task + logout
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
   FRONTEND_ORIGIN=http://localhost:3001
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

3. Create `.env.local` in `frontend/`:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

4. Start the development server:
   ```bash
   npm run dev -- -p 3001
   ```

   App: `http://localhost:3001`

## Authentication

Authentication uses **JWT tokens stored in `httpOnly` cookies** — the token is never exposed to JavaScript, protecting against XSS attacks.

### Flow
1. `POST /auth/register` — create an account
2. `POST /auth/login` — sets an httpOnly cookie with the JWT (30 min expiry)
3. All subsequent requests automatically include the cookie via `credentials: "include"`
4. `GET /auth/me` — returns the current user from the cookie (used to populate the dashboard)
5. `POST /auth/logout` — clears the cookie

### Route Protection

**Frontend** — `src/middleware.ts` runs on the Next.js edge before any page renders:
- Unauthenticated requests to `/dashboard` → redirected to `/login`
- Authenticated requests to `/login` or `/register` → redirected to `/dashboard`

**Backend** — every `/tasks` endpoint uses `Depends(get_current_user)`:
- Validates the JWT signature and expiry on every request
- Returns `401 Unauthorized` if the cookie is missing, expired, or tampered

## API Endpoints

### Auth

| Method | Endpoint         | Description                      | Auth required |
|--------|------------------|----------------------------------|---------------|
| POST   | `/auth/register` | Register a new user              | No            |
| POST   | `/auth/login`    | Login, sets httpOnly cookie      | No            |
| POST   | `/auth/logout`   | Logout, clears cookie            | No            |
| GET    | `/auth/me`       | Returns current user from cookie | Yes           |

### Tasks

All task endpoints require a valid `access_token` cookie. Each user only sees their own tasks.

| Method | Endpoint      | Description      |
|--------|---------------|------------------|
| POST   | `/tasks`      | Create a task    |
| GET    | `/tasks`      | List all tasks   |
| GET    | `/tasks/{id}` | Get a task by ID |
| PUT    | `/tasks/{id}` | Update a task    |
| DELETE | `/tasks/{id}` | Delete a task    |

## Schemas

**Register request:**
```json
{ "email": "user@example.com", "password": "yourpassword" }
```

**Login request** (`application/x-www-form-urlencoded`):
```
username=user@example.com&password=yourpassword
```

**User response:**
```json
{ "id": 1, "email": "user@example.com" }
```

**Task response:**
```json
{ "id": 1, "title": "Buy groceries", "completed": false }
```

## Switching to a Real Database

Only one change needed — update `DATABASE_URL` in `backend/.env`:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/mydb
```
Then install the driver:
```bash
pip install psycopg2-binary
```
No code changes required — SQLAlchemy and the service layer handle the rest.

## Production Notes

- Set `SECRET_KEY` to a long random string: `openssl rand -hex 32`
- Set `secure=True` on the cookie in `routers/auth.py` (requires HTTPS)
- Set `FRONTEND_ORIGIN` to your deployed frontend URL
- Switch `DATABASE_URL` to PostgreSQL for production workloads
- Add rate limiting on `/auth/login` to prevent brute force attacks