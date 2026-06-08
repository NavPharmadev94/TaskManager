# Task Manager App

A full-stack task management application with a FastAPI backend and Next.js frontend. Users register, log in, and manage their own private task lists.

## Live Deployment

| Layer | Platform | URL |
|---|---|---|
| **Frontend** | Vercel | https://task-manager-swart-five-38.vercel.app |
| **Backend** | Render | https://taskmanager-18p8.onrender.com |
| **Database** | Render PostgreSQL | — |

## Tech Stack

**Backend**
- FastAPI
- SQLAlchemy (ORM)
- PostgreSQL (hosted on [Render](https://render.com))
- `psycopg2-binary` — PostgreSQL driver
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
        ├── middleware.ts         # passthrough (auth handled inside pages)
        ├── lib/
        │   └── api.ts            # typed fetch client with auto token refresh (register, login, logout, getMe, getTasks, createTask, updateTask, deleteTask)
        └── app/
            ├── layout.tsx
            ├── page.tsx          # redirects / → /login
            ├── providers.tsx     # ChakraProvider
            ├── login/
            │   └── page.tsx      # sign in form
            ├── register/
            │   └── page.tsx      # register form
            └── dashboard/
                └── page.tsx      # task list + add/edit/delete/toggle task + logout
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
   DATABASE_URL=postgresql://<user>:<password>@<host>.oregon-postgres.render.com/<dbname>
   SECRET_KEY=your-strong-random-secret-key
   FRONTEND_ORIGIN=http://localhost:3000
   COOKIE_SECURE=false
   ```
   > **Important:** Set `DATABASE_URL` to your Render PostgreSQL connection string. Set a strong random `SECRET_KEY` — never use the default in production.

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
   # Production: https://taskmanager-18p8.onrender.com
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

   App: `http://localhost:3000`

## Dashboard Features

The dashboard (`/dashboard`) provides full task management:

| Feature | Description |
|---|---|
| **Add task** | Type a title and press Add — appears instantly at the top of the list |
| **Toggle complete** | Click the checkbox to mark a task done/undone (calls `PUT /tasks/{id}`) |
| **Inline edit** | Click ✏️ to edit the title in place; press Enter or Save to commit, Escape or Cancel to discard |
| **Delete** | Click 🗑️ to permanently remove a task (calls `DELETE /tasks/{id}`) |
| **Pending badge** | Header shows a count of incomplete tasks |

Each action calls the backend immediately and updates the UI optimistically on success.

---

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

**Frontend** — `src/middleware.ts` is a passthrough (no cookie checks at the edge — cross-origin cookies cannot be read there). Auth is enforced inside the page:
- `dashboard/page.tsx` calls `GET /auth/me` on mount; if it fails the user is redirected to `/login`
- This works correctly across domains (Vercel frontend → Render backend)

### CORS

The backend reads `FRONTEND_ORIGIN` from `.env` and uses it in `allow_origins`. The default is `http://localhost:3000` (Next.js dev port). In production this is set to the Vercel URL via Render's environment variables. All Vercel preview URLs are also allowed via `allow_origin_regex`.

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

## Database

The app uses **PostgreSQL hosted on Render**. Set `DATABASE_URL` in `backend/.env` to your Render connection string:
```env
DATABASE_URL=postgresql://<user>:<password>@<host>.oregon-postgres.render.com/<dbname>
```
The `psycopg2-binary` driver is included in `requirements.txt`. Tables are created automatically on startup via SQLAlchemy's `Base.metadata.create_all()`.

### Inspecting the Database with DBeaver

[DBeaver](https://dbeaver.io) is used to connect to the Render PostgreSQL database and inspect tables and data directly.

**Setup:**
1. Open DBeaver and create a new connection → select **PostgreSQL**
2. Fill in the connection details from your Render dashboard (host, port `5432`, database name, username, password)
3. Enable **SSL** (Render requires it) — set SSL mode to `require` under the SSL tab
4. Click **Test Connection**, then **Finish**

**Useful queries:**

View all users:
```sql
SELECT * FROM users;
```

View all tasks:
```sql
SELECT * FROM tasks;
```

View tasks with their owner's email:
```sql
SELECT t.id, t.title, t.completed, u.email
FROM tasks t
JOIN users u ON t.user_id = u.id
ORDER BY u.email, t.id;
```

## Production Notes

- Set `SECRET_KEY` to a long random string: `openssl rand -hex 32`
- Set `COOKIE_SECURE=true` on Render (backend runs over HTTPS)
- Set `FRONTEND_ORIGIN=https://task-manager-swart-five-38.vercel.app` in Render's environment
- Set `NEXT_PUBLIC_API_URL=https://taskmanager-18p8.onrender.com` in Vercel's environment variables
- The Render PostgreSQL `DATABASE_URL` is set automatically if you link the database to the service
- Cookies are set with `SameSite=None; Secure` to support cross-origin requests between Vercel and Render