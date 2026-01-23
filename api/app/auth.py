"""
Authentication middleware for FastAPI
Validates Supabase JWT tokens and extracts user information
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from app.config import settings
from typing import Optional
import requests


security = HTTPBearer()


class AuthUser:
    """Authenticated user information"""
    def __init__(self, user_id: str, email: Optional[str] = None):
        self.user_id = user_id
        self.email = email


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> AuthUser:
    """
    Dependency to get current authenticated user from JWT token
    
    Validates Supabase JWT token and extracts user_id
    """
    token = credentials.credentials
    
    try:
        # Decode JWT without verification first to get the header
        unverified_header = jwt.get_unverified_header(token)
        
        # Get Supabase JWT secret from environment
        # For Supabase, we can verify using the SUPABASE_JWT_SECRET
        # or validate against Supabase API
        
        # Option 1: Decode with Supabase JWT secret (if available)
        if settings.SUPABASE_SERVICE_ROLE_KEY:
            payload = jwt.decode(
                token,
                settings.SUPABASE_SERVICE_ROLE_KEY,
                algorithms=[settings.JWT_ALGORITHM],
                options={"verify_aud": False}  # Supabase doesn't use aud
            )
        else:
            # Option 2: Validate against Supabase API
            response = requests.get(
                f"{settings.SUPABASE_URL}/auth/v1/user",
                headers={"Authorization": f"Bearer {token}"}
            )
            
            if response.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid authentication credentials",
                    headers={"WWW-Authenticate": "Bearer"},
                )
            
            user_data = response.json()
            return AuthUser(
                user_id=user_data["id"],
                email=user_data.get("email")
            )
        
        # Extract user_id from payload
        user_id = payload.get("sub")
        email = payload.get("email")
        
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        return AuthUser(user_id=user_id, email=email)
        
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Could not validate credentials: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False))
) -> Optional[AuthUser]:
    """
    Optional authentication - returns None if no token provided
    Useful for endpoints that work both authenticated and unauthenticated
    """
    if not credentials:
        return None
    
    return await get_current_user(credentials)
