# main.py — Entry point for the Stock Ranking Pipeline API

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routes.pipeline import router as pipeline_router

app = FastAPI(title="Stock Ranking Pipeline API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(pipeline_router)
