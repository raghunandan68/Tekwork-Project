"""Auth router — signup, login (via Supabase), and user info."""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from app.auth import get_current_user
from app.database import get_supabase
from app.config import get_settings

router = APIRouter(prefix="/auth", tags=["Auth"])


class SignupRequest(BaseModel):
    email: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


@router.post("/signup")
async def signup(body: SignupRequest):
    """Create a new user account via Supabase Auth."""
    settings = get_settings()
    from supabase import create_client
    # Use anon key for auth operations
    client = create_client(settings.supabase_url, settings.supabase_key)
    try:
        result = client.auth.sign_up({"email": body.email, "password": body.password})
        if result.user is None:
            raise HTTPException(status_code=400, detail="Signup failed. User may already exist.")
        return {
            "user_id": result.user.id,
            "email": result.user.email,
            "message": "Account created. Check email for verification if enabled.",
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/login")
async def login(body: LoginRequest):
    """Log in and return access/refresh tokens."""
    settings = get_settings()
    from supabase import create_client
    client = create_client(settings.supabase_url, settings.supabase_key)
    try:
        result = client.auth.sign_in_with_password({"email": body.email, "password": body.password})
        return {
            "access_token": result.session.access_token,
            "refresh_token": result.session.refresh_token,
            "user": {"id": result.user.id, "email": result.user.email},
        }
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid credentials.")


@router.get("/me")
async def get_me(user_id: str = Depends(get_current_user)):
    """Return current user info from Supabase."""
    db = get_supabase()
    try:
        result = db.auth.admin.get_user_by_id(user_id)
        return {"user_id": result.user.id, "email": result.user.email}
    except Exception:
        return {"user_id": user_id, "email": "unknown"}


@router.post("/seed-demo")
async def seed_demo(user_id: str = Depends(get_current_user)):
    """Populate demo products, transactions, rules, and shelf zones for the current user."""
    db = get_supabase()
    try:
        db.rpc("seed_demo_data", {"p_user_id": user_id}).execute()
        return {"message": "Demo data seeded successfully.", "user_id": user_id}
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Seed failed. Run database/seed/seed_data.sql in Supabase first. Error: {e}",
        )
