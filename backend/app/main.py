from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import router
from app.config import CORS_ORIGINS

app = FastAPI(title="Wind Intelligence API", version="1.0.0",
              description="January 2026 UK wind-generation forecast accuracy analysis.")
app.add_middleware(CORSMiddleware, allow_origins=CORS_ORIGINS, allow_credentials=False,
                   allow_methods=["GET"], allow_headers=["*"])
app.include_router(router)

@app.get("/")
def root():
    return {"name": "Wind Intelligence API", "docs": "/docs", "health": "/api/health"}
