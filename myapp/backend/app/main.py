from fastapi import FastAPI, HTTPException, Depends, Cookie, Body
from fastapi.middleware.cors import CORSMiddleware
import psycopg2
import os
import datetime
import uuid
import bcrypt
from pydantic import BaseModel, EmailStr
from typing import Dict, Any, Optional

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_URL", "http://localhost:3001")],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

# Models
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: Optional[str] = None

@app.get("/health")
def health():
    try:
        conn = psycopg2.connect(os.getenv("DATABASE_URL"))
        conn.close()
    except Exception:
        raise HTTPException(500, "Database unreachable")
    return {"status": "OK"}

def get_current_user(better_auth_token: str = Cookie(default=None, alias="better-auth.session_token")):
    if not better_auth_token:
        raise HTTPException(401, "Not authenticated")
    
    conn = psycopg2.connect(os.getenv("DATABASE_URL"))
    cur = conn.cursor()
    cur.execute("SELECT user_id, expires_at FROM sessions WHERE id=%s", (better_auth_token,))
    rec = cur.fetchone()
    cur.close()
    conn.close()
    
    if not rec or rec[1] < datetime.datetime.utcnow():
        raise HTTPException(401, "Invalid or expired session")
    
    user_id = rec[0]
    
    conn = psycopg2.connect(os.getenv("DATABASE_URL"))
    cur = conn.cursor()
    cur.execute("SELECT id, email FROM users WHERE id=%s", (user_id,))
    u = cur.fetchone()
    cur.close()
    conn.close()
    
    return {"id": u[0], "email": u[1]}

@app.get("/profile")
def profile(user: Dict[str, Any] = Depends(get_current_user)):
    return {"email": user["email"]}

@app.get("/api/protected")
def protected_route(user: Dict[str, Any] = Depends(get_current_user)):
    return {
        "message": "This is a protected route",
        "user_id": user["id"],
        "email": user["email"]
    }

@app.get("/api/user")
def get_user(user: Dict[str, Any] = Depends(get_current_user)):
    conn = psycopg2.connect(os.getenv("DATABASE_URL"))
    cur = conn.cursor()
    
    try:
        cur.execute("SELECT id, email, name, email_verified FROM users WHERE id=%s", (user["id"],))
        user_data = cur.fetchone()
        
        if not user_data:
            raise HTTPException(404, "User not found")
            
        return {
            "id": user_data[0],
            "email": user_data[1],
            "name": user_data[2],
            "email_verified": user_data[3]
        }
    except Exception as e:
        raise HTTPException(500, f"Database error: {str(e)}")
    finally:
        cur.close()
        conn.close()