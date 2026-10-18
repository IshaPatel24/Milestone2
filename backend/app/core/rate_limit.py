import time
from collections import defaultdict
from typing import Dict, List, Tuple
from fastapi import Request, HTTPException, status
from backend.app.core.config import settings

class InMemoryRateLimiter:
    """
    Sliding window rate limiter for endpoint brute-force protection.
    Tracks client IP request timestamps.
    """
    def __init__(self, requests_per_minute: int = 30):
        self.requests_per_minute = requests_per_minute
        self.client_records: Dict[str, List[float]] = defaultdict(list)

    def is_rate_limited(self, client_ip: str) -> bool:
        now = time.time()
        window_start = now - 60.0

        # Filter out timestamps older than 60 seconds
        recent_timestamps = [ts for ts in self.client_records[client_ip] if ts > window_start]
        self.client_records[client_ip] = recent_timestamps

        if len(recent_timestamps) >= self.requests_per_minute:
            return True

        self.client_records[client_ip].append(now)
        return False

auth_rate_limiter = InMemoryRateLimiter(requests_per_minute=settings.AUTH_RATE_LIMIT_PER_MINUTE)

async def check_auth_rate_limit(request: Request):
    """Dependency to apply rate limiting on authentication routes."""
    # Obtain client IP, respecting X-Forwarded-For if behind a proxy
    client_ip = request.headers.get("x-forwarded-for")
    if client_ip:
        client_ip = client_ip.split(",")[0].strip()
    else:
        client_ip = request.client.host if request.client else "127.0.0.1"

    if auth_rate_limiter.is_rate_limited(client_ip):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many authentication attempts. Please slow down and try again later."
        )
