import models  # noqa: F401  # registers ORM tables on Base.metadata
from database import Base, engine
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from middleware.logging import RequestLogMiddleware, setup_logging
from routers.auth import router as google_auth_router
from routers.users import router as users_router

setup_logging()
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Porchlight API", description="API for the Porchlight project")

app.add_middleware(RequestLogMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)

app.mount("/static", StaticFiles(directory="static"), name="static")
app.include_router(users_router)
app.include_router(google_auth_router)


@app.get("/health")
def health():
    return {"status": "ok"}
