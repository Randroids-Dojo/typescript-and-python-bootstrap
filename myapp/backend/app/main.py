from fastapi import FastAPI, HTTPException, Depends, Cookie
from fastapi.middleware.cors import CORSMiddleware
import psycopg2, os, datetime

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_URL")],
    allow_credentials=True,
    allow_methods=["GET","POST","PUT","DELETE"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    try:
        conn = psycopg2.connect(os.getenv("DATABASE_URL"))
        conn.close()
    except Exception as e:
        raise HTTPException(500, f"Database unreachable: {str(e)}")
    return {"status":"OK"}

def get_current_user(
    session_token: str = Cookie(alias="better-auth.session_token")
):
    if not session_token:
        raise HTTPException(401, "Not authenticated")

    # Validate session
    conn = psycopg2.connect(os.getenv("DATABASE_URL"))
    cur = conn.cursor()
    cur.execute(
      "SELECT user_id, expires_at FROM sessions WHERE id=%s",
      (session_token,)
    )
    rec = cur.fetchone()
    cur.close(); conn.close()

    if not rec or rec[1] < datetime.datetime.utcnow():
        raise HTTPException(401, "Invalid or expired session")

    user_id = rec[0]
    # Fetch user
    conn = psycopg2.connect(os.getenv("DATABASE_URL"))
    cur = conn.cursor()
    cur.execute(
      "SELECT id, email FROM users WHERE id=%s", (user_id,)
    )
    u = cur.fetchone()
    cur.close(); conn.close()

    if not u:
        raise HTTPException(401, "User not found")

    return {"id": u[0], "email": u[1]}

@app.get("/profile")
def profile(user=Depends(get_current_user)):
    return {"email": user["email"]}

@app.get("/api/user")
def get_user(user=Depends(get_current_user)):
    # Additional user fields if needed
    return {"id": user["id"], "email": user["email"]}