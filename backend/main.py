import os
import time
from datetime import datetime
from typing import Any, Dict, Tuple, List

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, Depends, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

import models
from database import SessionLocal, engine
from models import User
from schemas import RegisterRequest, LoginRequest, TokenResponse
from auth import hash_password, verify_password, create_access_token, decode_token

load_dotenv()

COINGECKO_BASE_URL = os.getenv("COINGECKO_BASE_URL", "https://api.coingecko.com/api/v3")
CACHE_TTL_SECONDS = int(os.getenv("CACHE_TTL_SECONDS", "600"))
FREE_DAILY_LIMIT = 10

app = FastAPI(title="Mini Market Dashboard API", version="1.0.0")

# --- CORS (prod-ready) ---
FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:3000")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        FRONTEND_ORIGIN,
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

# SQLite tablolarını oluştur
models.Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


security = HTTPBearer()

# ---- In-memory cache (TTL) ----
_cache: Dict[str, Tuple[float, Any]] = {}


def cache_get(key: str):
    entry = _cache.get(key)
    if not entry:
        return None
    expires_at, data = entry
    if time.time() > expires_at:
        _cache.pop(key, None)
        return None
    return data


def cache_set(key: str, data: Any, ttl: int):
    _cache[key] = (time.time() + ttl, data)


@app.get("/health")
def health():
    return {"status": "ok"}


# ---- Auth helpers ----
def get_current_user(
    creds: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    token = creds.credentials
    subject = decode_token(token)
    if not subject:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    user = db.query(User).filter(User.email == subject).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return user


def apply_daily_rate_limit(user: User, db: Session):
    """
    Enforces per-user daily rate limiting.

    IMPORTANT (demo-stable behavior):
    - The daily counter increases ONLY when an upstream CoinGecko request is made.
    - Cache HITs do NOT increment the counter.
    - Free plan: limited number of upstream calls per day (e.g., 10/day).
    - Pro plan: unlimited (no daily cap).

    The counter resets when the calendar date changes (server local date).
    """
    today = datetime.utcnow().date()

    if user.last_request_date is None or user.last_request_date.date() != today:
        user.daily_request_count = 0

    if user.plan_type.lower() == "free" and user.daily_request_count >= FREE_DAILY_LIMIT:
        raise HTTPException(
            status_code=429,
            detail=f"Daily request limit reached (Free plan: {FREE_DAILY_LIMIT}/day)",
        )

    user.daily_request_count += 1
    user.last_request_date = datetime.utcnow()

    db.add(user)
    db.commit()
    db.refresh(user)


# ---- Auth endpoints ----
@app.post("/register", response_model=TokenResponse)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        email=payload.email,
        password_hash=hash_password(payload.password),
        plan_type="Free",
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(subject=user.email)
    return {"access_token": token, "token_type": "bearer"}


@app.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token(subject=user.email)
    return {"access_token": token, "token_type": "bearer"}


# ---- Protected proxy endpoint ----
@app.get("/api/coins/markets")
async def coins_markets(
    vs_currency: str = "usd",
    per_page: int = 20,
    page: int = 1,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
    response: Response = None,
) -> List[Dict[str, Any]]:

    if per_page < 1 or per_page > 250:
        raise HTTPException(status_code=400, detail="per_page must be between 1 and 250")

    key = f"markets:{vs_currency}:{per_page}:{page}"
    cached = cache_get(key)
    if cached is not None:
        print(f"CACHE HIT  -> {key}")
        return cached

    # sadece upstream'e giderken sayaç artar
    apply_daily_rate_limit(user, db)

    print(f"CACHE MISS -> {key} (calling CoinGecko)")

    url = f"{COINGECKO_BASE_URL}/coins/markets"
    params = {
        "vs_currency": vs_currency,
        "order": "market_cap_desc",
        "per_page": per_page,
        "page": page,
        "sparkline": "false",
        "price_change_percentage": "24h",
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            r = await client.get(url, params=params)

        if r.status_code == 429:
            if cached is not None:
                print("UPSTREAM 429 -> serving STALE cache")
                response.headers["X-Data-Stale"] = "true"
                response.headers["X-Upstream-Status"] = "429"
                return cached

            raise HTTPException(
                status_code=503,
                detail="CoinGecko rate limit (public API). Please try again in 30-60 seconds.",
            )

        if r.status_code != 200:
            if cached is not None:
                print(f"UPSTREAM {r.status_code} -> serving STALE cache")
                response.headers["X-Data-Stale"] = "true"
                response.headers["X-Upstream-Status"] = str(r.status_code)
                return cached

            raise HTTPException(status_code=502, detail=f"Upstream error: {r.status_code}")

        raw = r.json()

    except httpx.RequestError:
        if cached is not None:
            print("UPSTREAM NETWORK ERROR -> serving STALE cache")
            response.headers["X-Data-Stale"] = "true"
            response.headers["X-Upstream-Status"] = "network_error"
            return cached

        raise HTTPException(status_code=502, detail="Upstream request failed")

    data: List[Dict[str, Any]] = []
    for item in raw:
        data.append(
            {
                "id": item.get("id"),
                "symbol": item.get("symbol"),
                "name": item.get("name"),
                "image": item.get("image"),
                "current_price": item.get("current_price"),
                "price_change_percentage_24h": item.get("price_change_percentage_24h"),
                "market_cap_rank": item.get("market_cap_rank"),
            }
        )

    cache_set(key, data, CACHE_TTL_SECONDS)
    return data

# ---- Debug endpoint (sayaç kontrolü) ----
@app.get("/me")
def me(user: User = Depends(get_current_user)):
    return {
        "email": user.email,
        "plan_type": user.plan_type,
        "daily_request_count": user.daily_request_count,
        "last_request_date": user.last_request_date,
    }