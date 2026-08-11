from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.characters import router as characters_router


app = FastAPI(title="Maple Wallet API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=False,
    allow_methods=["GET"],
    allow_headers=["*"],
)
app.include_router(characters_router)


@app.get("/")
async def root() -> dict[str, str]:
    return {"service": "Maple Wallet API", "status": "ok"}


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "healthy"}
