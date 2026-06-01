# Task Manager App

A full-stack task management application with a FastAPI backend and Next.js frontend.

## Tech Stack

**Backend**
- FastAPI
- SQLAlchemy (ORM)
- SQLite (default) / configurable via `DATABASE_URL`
- Uvicorn (ASGI server)

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
│   └── App/
│       ├── main.py          # FastAPI app entry point
│       ├── database.py      # DB engine and session setup
│       ├── models.py        # SQLAlchemy models
│       ├── schemas.py       # Pydantic schemas
│       └── routers/
│           └── tasks.py     # Task CRUD endpoints
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
   ```bash
   cd backend
   ```

2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   venv\Scripts\activate   # Windows
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. (Optional) Create a `.env` file in `backend/` to configure the database:
   ```env
   DATABASE_URL=sqlite:///./tasks.db
   ```

5. Start the server:
   ```bash
   cd App
   uvicorn main:app --reload
   ```

   The API will be available at `http://localhost:8000`.  
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

   The app will be available at `http://localhost:3000`.

## API Endpoints

| Method | Endpoint         | Description        |
|--------|------------------|--------------------|
| POST   | `/tasks`         | Create a task      |
| GET    | `/tasks`         | List all tasks     |
| GET    | `/tasks/{id}`    | Get a task by ID   |
| PUT    | `/tasks/{id}`    | Update a task      |
| DELETE | `/tasks/{id}`    | Delete a task      |

## Task Schema

```json
{
  "id": 1,
  "title": "Buy groceries",
  "completed": false
}
```
