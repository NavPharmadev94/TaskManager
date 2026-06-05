# Task Manager App

A full-stack task management application with a FastAPI backend and Next.js frontend. Users register, log in, and manage their own private task lists.

## Tech Stack

**Backend**
- FastAPI
- SQLAlchemy (ORM)
- SQLite (default) / configurable via `DATABASE_URL`
- Uvicorn (ASGI server)
- `python-jose` — JWT access + refresh token generation & validation
- `bcrypt` — password hashing
- `slowapi` — rate limiting
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
│       ├── main.py               # FastAPI app, CORS, rate limit handler, lifespan
│       ├── database.py           # DB engine, session, get_db
│       ├── models.py             # User + Task SQLAlchemy models
│       ├── schemas.py            # Pydantic schemas with field validation
│       ├── security.py           # JWT utils, bcrypt, get_current_user, cookie config
│       ├── limiter.py            # slowapi limiter instance
│       ├── routers/
│       │   ├── auth.py           # /auth/register, /login, /logout, /me, /refresh
│       │   └── tasks.py          # /tasks CRUD (all protected)
│       └── services/
│           ├── auth_service.py   # user lookup, create, authenticate
│           └── task_service.py   # task CRUD business logic
└── frontend/
    ├── package.json
    ├── .env.local                # NEXT_PUBLIC_API_URL (not committed)
    └── src/
        ├── middleware.ts         # edge auth guard (redirects)
        ├── lib/
        │   └── api.ts            # typed fetch client with auto token refresh
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
   COOKIE_SECURE=false
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

Authentication uses **JWT tokens stored in `httpOnly` cookies** — tokens are never exposed to JavaScript, protecting against XSS attacks.

### Token Strategy

| Cookie | Expiry | Purpose |
|---|---|---|
| `access_token` | 30 minutes | Authorises API requests |
| `refresh_token` | 7 days | Silently issues new access tokens |

The frontend `fetchWithAuth()` wrapper automatically calls `POST /auth/refresh` when it receives a `401`, then retries the original request — users stay logged in transparently for up to 7 days without being interrupted.

### Flow
1. `POST /auth/register` — create an account (password min 8 chars)
2. `POST /auth/login` — sets both `access_token` and `refresh_token` httpOnly cookies
3. All subsequent requests include cookies automatically via `credentials: "include"`
4. On `401` — frontend silently refreshes the access token and retries
5. `GET /auth/me` — returns the current user (used to populate the dashboard header)
6. `POST /auth/logout` — clears both cookies

### Route Protection

**Frontend** — `src/middleware.ts` runs on the Next.js edge before any page renders:
- Unauthenticated requests to `/dashboard` → redirected to `/login`
- Authenticated requests to `/login` or `/register` → redirected to `/dashboard`

**Backend** — every `/tasks` endpoint uses `Depends(get_current_user)`:
- Validates JWT signature, expiry, and token type on every request
- Returns `401 Unauthorized` if cookie is missing, expired, or tampered

### Rate Limiting

`POST /auth/login` is limited to **5 requests per minute per IP** via `slowapi`.
Exceeding the limit returns `429 Too Many Requests`.

## Input Validation

| Field | Rule |
|---|---|
| `email` | Valid email format (Pydantic `EmailStr`) |
| `password` | 8–128 characters |
| `task title` | 1–200 characters (enforced backend + frontend `maxLength`) |

## API Endpoints

### Auth

| Method | Endpoint          | Description                        | Auth required | Rate limited |
|--------|-------------------|------------------------------------|---------------|--------------|
| POST   | `/auth/register`  | Register a new user                | No            | No           |
| POST   | `/auth/login`     | Login, sets access + refresh cookie| No            | 5/min        |
| POST   | `/auth/logout`    | Logout, clears both cookies        | No            | No           |
| GET    | `/auth/me`        | Returns current user from cookie   | Yes           | No           |
| POST   | `/auth/refresh`   | Issue new access token via refresh cookie | No     | No           |

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
- Set `COOKIE_SECURE=true` in `.env` (requires HTTPS)
- Set `FRONTEND_ORIGIN` to your deployed frontend URL
- Switch `DATABASE_URL` to PostgreSQL for production workloads