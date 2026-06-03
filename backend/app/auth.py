"""Auth router dependency — token verification with JWKS and symmetric key fallbacks."""

import base64
import json
import urllib.request
from fastapi import Header, HTTPException, status
from jose import jwt, jwk, JWTError, ExpiredSignatureError
from app.config import get_settings

_jwks_cache = None


def get_jwk_by_kid(jwks_url: str, kid: str):
    """Retrieve the public signing key matching the given Key ID (kid) from JWKS."""
    global _jwks_cache
    if _jwks_cache:
        for key in _jwks_cache.get("keys", []):
            if key.get("kid") == kid:
                return key

    # Fetch and cache keys
    try:
        with urllib.request.urlopen(jwks_url, timeout=5) as res:
            _jwks_cache = json.loads(res.read().decode("utf-8"))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Failed to fetch JWKS keys from Supabase: {e}",
            headers={"WWW-Authenticate": "Bearer"},
        )

    for key in _jwks_cache.get("keys", []):
        if key.get("kid") == kid:
            return key

    return None


async def get_current_user(authorization: str = Header(...)) -> str:
    """
    Extract and validate the Bearer JWT token from the Authorization header.
    Supports both HS256 (via local secret) and ES256/RS256 (via Supabase JWKS).
    Returns the user_id (the 'sub' claim from the JWT).
    """
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header. Must start with 'Bearer '.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = authorization.replace("Bearer ", "", 1)
    settings = get_settings()

    try:
        # Determine the signing algorithm and key ID
        header = jwt.get_unverified_header(token)
        alg = header.get("alg", "HS256")
        kid = header.get("kid")

        if alg == "HS256":
            # Symmetric signature verification using local secret
            try:
                secret = settings.supabase_jwt_secret
                secret_bytes = base64.b64decode(secret + "==" * ((4 - len(secret) % 4) % 4))
            except Exception:
                secret_bytes = settings.supabase_jwt_secret.encode("utf-8")

            payload = jwt.decode(
                token,
                secret_bytes,
                algorithms=["HS256"],
                options={"verify_aud": False},
            )
        else:
            # Asymmetric signature verification (ES256, RS256) using Supabase JWKS
            if not kid:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Token header missing 'kid' claim required for asymmetric verification.",
                    headers={"WWW-Authenticate": "Bearer"},
                )

            jwks_url = f"{settings.supabase_url.rstrip('/')}/auth/v1/.well-known/jwks.json"
            jwk_dict = get_jwk_by_kid(jwks_url, kid)

            if not jwk_dict:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail=f"Signing key with kid '{kid}' not found in Supabase JWKS.",
                    headers={"WWW-Authenticate": "Bearer"},
                )

            key_object = jwk.construct(jwk_dict)
            payload = jwt.decode(
                token,
                key_object,
                algorithms=[alg],
                options={"verify_aud": False},
            )

        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token missing 'sub' claim.",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return user_id

    except ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
