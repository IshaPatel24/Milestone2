from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional, Union
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError, VerificationError, InvalidHash
from jose import JWTError, jwt
from app.core.config import settings

# Initialize Argon2id hasher with secure parameters
ph = PasswordHasher(
    time_cost=2,        # 2 iterations
    memory_cost=65536,  # 64 MiB
    parallelism=1,      # 1 lane
    hash_len=32,        # 32-byte digest
    salt_len=16         # 16-byte random salt
)

def hash_password(password: str) -> str:
    """Hashes a password using Argon2id."""
    return ph.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plain password against an Argon2id hash."""
    try:
        return ph.verify(hashed_password, plain_password)
    except (VerifyMismatchError, VerificationError, InvalidHash):
        return False

def check_needs_rehash(hashed_password: str) -> bool:
    """Checks if password hash needs to be updated to newer parameters."""
    try:
        return ph.check_needs_rehash(hashed_password)
    except Exception:
        return False

def create_access_token(
    subject: Union[str, Any],
    email: str,
    expires_delta: Optional[timedelta] = None,
    remember_me: bool = False
) -> str:
    """Creates a signed JWT access token."""
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    elif remember_me:
        expire = now + timedelta(days=settings.REMEMBER_ME_EXPIRE_DAYS)
    else:
        expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode: Dict[str, Any] = {
        "sub": str(subject),
        "email": email,
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
        "type": "access"
    }
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """Decodes and validates a JWT access token."""
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        return payload
    except JWTError:
        return None
