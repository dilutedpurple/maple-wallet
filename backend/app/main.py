from fastapi import FastAPI


app = FastAPI(title="Maple Wallet API")


@app.get("/")
async def root() -> dict[str, str]:
    return {"service": "Maple Wallet API", "status": "ok"}


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "healthy"}
