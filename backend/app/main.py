from fastapi import FastAPI

from app.api.characters import router as characters_router


app = FastAPI(title="Maple Wallet API")
app.include_router(characters_router)


@app.get("/")
async def root() -> dict[str, str]:
    return {"service": "Maple Wallet API", "status": "ok"}


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "healthy"}
