"""
Rate limiting middleware
Simple in-memory rate limiter for API endpoints
"""

from fastapi import HTTPException, Request, status
from collections import defaultdict
from datetime import datetime, timedelta
from typing import Dict, Tuple
import asyncio


class RateLimiter:
    """
    Simple in-memory rate limiter
    Tracks requests by IP address or user_id
    """
    
    def __init__(self):
        # Format: {key: [(timestamp, count)]}
        self.requests: Dict[str, list[Tuple[datetime, int]]] = defaultdict(list)
        self.lock = asyncio.Lock()
    
    async def check_rate_limit(
        self,
        key: str,
        max_requests: int,
        window_seconds: int
    ) -> bool:
        """
        Check if request is within rate limit
        
        Args:
            key: Identifier (IP or user_id)
            max_requests: Maximum requests allowed
            window_seconds: Time window in seconds
        
        Returns:
            True if allowed, raises HTTPException if exceeded
        """
        async with self.lock:
            now = datetime.now()
            cutoff = now - timedelta(seconds=window_seconds)
            
            # Clean old requests
            self.requests[key] = [
                (ts, count) for ts, count in self.requests[key]
                if ts > cutoff
            ]
            
            # Count requests in window
            total_requests = sum(count for _, count in self.requests[key])
            
            if total_requests >= max_requests:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=f"Rate limit exceeded. Max {max_requests} requests per {window_seconds}s"
                )
            
            # Add current request
            self.requests[key].append((now, 1))
            
            return True


# Global rate limiter instance
rate_limiter = RateLimiter()


async def rate_limit_by_ip(request: Request, max_requests: int = 60, window: int = 60):
    """
    Rate limit by IP address
    Default: 60 requests per minute
    """
    client_ip = request.client.host if request.client else "unknown"
    await rate_limiter.check_rate_limit(
        f"ip:{client_ip}",
        max_requests,
        window
    )


async def rate_limit_by_user(user_id: str, max_requests: int = 60, window: int = 60):
    """
    Rate limit by user ID
    Default: 60 requests per minute
    """
    await rate_limiter.check_rate_limit(
        f"user:{user_id}",
        max_requests,
        window
    )


async def rate_limit_import(user_id: str):
    """
    Strict rate limit for import operations
    10 requests per hour
    """
    await rate_limiter.check_rate_limit(
        f"import:{user_id}",
        max_requests=10,
        window_seconds=3600  # 1 hour
    )
