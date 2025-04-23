from fastapi import Request, HTTPException, Depends
from app.auth.client import auth_client

async def verify_token(request: Request):
    """Verify JWT token from request"""
    token = request.cookies.get("access_token") or request.headers.get("Authorization", "").replace("Bearer ", "")
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    session = await auth_client.validate_token(token)
    if not session:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    request.state.user = session.user
    return session
