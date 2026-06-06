from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from routers.chapters import router as chapters_router
from routers.convert import router as convert_router
from routers.export import router as export_router

app = FastAPI(title="Novel2Scripts", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chapters_router)
app.include_router(convert_router)
app.include_router(export_router)


@app.get("/api/health")
async def health():
    return {"status": "ok"}
