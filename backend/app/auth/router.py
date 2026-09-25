"""FastAPI Authentication Router and Dependency Inversion for Quantum Lens AI."""

from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Header
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ..db.session import get_db
from ..db.models import User, LearnerProfile
from .security import hash_password, verify_password, create_access_token, decode_access_token

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


# --- Schemas ---

class UserSignup(BaseModel):
    email: str = Field(..., min_length=3, max_length=255, description="Learner or Instructor email")
    password: str = Field(..., min_length=6, max_length=72, description="Password")
    full_name: str = Field(..., min_length=1, max_length=255, description="Full Name")
    role: str = Field(default="student", description="'student' or 'instructor'")


class UserLogin(BaseModel):
    email: str
    password: str


from pydantic import BaseModel, Field, ConfigDict


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: str
    full_name: str
    role: str
    created_at: datetime



class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# --- Dependency for Authenticated User ---

async def get_current_user(
    authorization: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Extract and validate JWT Bearer token, returning the authenticated User."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or malformed Authorization header. Expected 'Bearer <token>'",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = authorization.split(" ")[1]
    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload["sub"]
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authenticated user no longer exists",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


def require_roles(allowed_roles: List[str]):
    """Enforce role-based access control (RBAC)."""
    async def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access forbidden: role '{current_user.role}' lacks required permissions ({allowed_roles})"
            )
        return current_user
    return role_checker


# --- Endpoints ---

@router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def signup(body: UserSignup, db: AsyncSession = Depends(get_db)):
    """Register a new student or instructor, initializing an honest zero-state profile."""
    # Validate role
    role = body.role.lower().strip()
    if role not in ["student", "instructor"]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Role must be 'student' or 'instructor'")

    # Check for existing user
    normalized_email = body.email.lower().strip()
    existing = await db.execute(select(User).where(User.email == normalized_email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email is already registered")

    # Create User
    new_user = User(
        email=normalized_email,
        hashed_password=hash_password(body.password),
        full_name=body.full_name.strip(),
        role=role,
    )
    db.add(new_user)
    await db.flush()  # assign new_user.id

    # Create associated LearnerProfile with honest zero-state
    profile = LearnerProfile(
        user_id=new_user.id,
        overall_mastery=0.0,
        circuits_count=0,
        total_time_minutes=0,
    )
    db.add(profile)
    await db.commit()
    await db.refresh(new_user)

    # Issue JWT token
    token = create_access_token({"sub": new_user.id, "email": new_user.email, "role": new_user.role})

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(new_user)
    )


@router.post("/login", response_model=TokenResponse)
async def login(body: UserLogin, db: AsyncSession = Depends(get_db)):
    """Authenticate with email and password, returning a JWT Bearer token."""
    normalized_email = body.email.lower().strip()
    result = await db.execute(select(User).where(User.email == normalized_email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = create_access_token({"sub": user.id, "email": user.email, "role": user.role})

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """Retrieve profile and role info for currently authenticated user."""
    return UserResponse.model_validate(current_user)
