import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from database import engine, Base
from limiter import limiter
from routers import tasks, auth


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(lifespan=lifespan)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:3001")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3001",  # local dev
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",  # allow ALL vercel domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(auth.router)
app.include_router(tasks.router)
