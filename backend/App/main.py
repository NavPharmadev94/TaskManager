from contextlib import asynccontextmanager
from fastapi import FastAPI

from database import engine, Base
from routers import tasks


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(lifespan=lifespan)

app.include_router(tasks.router)
