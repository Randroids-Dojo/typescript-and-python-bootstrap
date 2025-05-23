# Code Quality Improvements Guide

## Overview
This guide provides specific code quality improvements for each service, focusing on maintainability, readability, and best practices.

---

## 🎯 Frontend (React/TypeScript)

### 1. Fix TypeScript Type Safety Issues

#### ❌ Current Issues:
```typescript
// Using 'any' type
} catch (error: any) {
  setError(error.message || 'An error occurred');
}

// Missing return types
const handleSubmit = async (data: LoginInput) => {
  // no return type specified
}
```

#### ✅ Improvements:
```typescript
// Define proper error types
interface ApiError {
  message: string;
  code?: string;
  details?: Record<string, any>;
}

// Use type guards
function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error
  );
}

// Proper error handling
try {
  const result = await api.login(data);
  return result;
} catch (error) {
  if (isApiError(error)) {
    setError(error.message);
  } else {
    setError('An unexpected error occurred');
  }
}

// Add return types
const handleSubmit = async (data: LoginInput): Promise<void> => {
  // implementation
}
```

### 2. Implement Error Boundaries

#### ❌ Missing Error Boundaries
```typescript
// No error boundaries in the application
```

#### ✅ Add Error Boundary Component:
```typescript
// components/ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    // Send to error reporting service
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="error-fallback">
          <h2>Something went wrong</h2>
          <button onClick={() => this.setState({ hasError: false })}>
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Usage in App.tsx
<ErrorBoundary>
  <Routes>
    {/* routes */}
  </Routes>
</ErrorBoundary>
```

### 3. Extract Custom Hooks

#### ❌ Repeated Logic:
```typescript
// Multiple components have similar auth logic
const { user } = useAuth();
const navigate = useNavigate();

useEffect(() => {
  if (!user) {
    navigate('/login');
  }
}, [user, navigate]);
```

#### ✅ Custom Hook:
```typescript
// hooks/useRequireAuth.ts
export function useRequireAuth(redirectTo = '/login') {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate(redirectTo);
    }
  }, [user, loading, navigate, redirectTo]);

  return { user, loading };
}

// Usage
function Dashboard() {
  const { user, loading } = useRequireAuth();
  
  if (loading) return <LoadingSpinner />;
  
  return <div>Welcome {user.name}</div>;
}
```

### 4. Implement Proper Loading States

#### ❌ Text-only Loading:
```typescript
if (isLoading) return <div>Loading...</div>;
```

#### ✅ Skeleton Screens:
```typescript
// components/skeletons/ProfileSkeleton.tsx
export function ProfileSkeleton() {
  return (
    <Card className="w-full max-w-md animate-pulse">
      <CardHeader>
        <div className="h-8 bg-gray-200 rounded w-3/4 mb-2" />
        <div className="h-4 bg-gray-200 rounded w-1/2" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded" />
          <div className="h-4 bg-gray-200 rounded" />
          <div className="h-4 bg-gray-200 rounded w-5/6" />
        </div>
      </CardContent>
    </Card>
  );
}

// Usage
if (isLoading) return <ProfileSkeleton />;
```

---

## 🐍 Backend (FastAPI/Python)

### 1. Implement Proper Logging

#### ❌ Current Issues:
```python
print(f"User not found for ID: {user_id}")
print(f"Error: {e}")
```

#### ✅ Structured Logging:
```python
# app/core/logging.py
import logging
import json
from pythonjsonlogger import jsonlogger

def setup_logging():
    logHandler = logging.StreamHandler()
    formatter = jsonlogger.JsonFormatter()
    logHandler.setFormatter(formatter)
    
    logger = logging.getLogger()
    logger.addHandler(logHandler)
    logger.setLevel(logging.INFO)
    
    return logger

logger = setup_logging()

# Usage in routers
from app.core.logging import logger

@router.get("/profile")
async def get_profile(user: dict = Depends(get_current_user)):
    logger.info("Profile requested", extra={
        "user_id": user["id"],
        "endpoint": "/profile"
    })
    
    try:
        profile = get_user_profile(user["id"])
        return profile
    except Exception as e:
        logger.error("Profile fetch failed", extra={
            "user_id": user["id"],
            "error": str(e)
        }, exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")
```

### 2. Add Comprehensive Input Validation

#### ❌ Missing Validation:
```python
class UserProfileUpdate(BaseModel):
    display_name: str | None = None
    bio: str | None = None
```

#### ✅ Proper Validation:
```python
from pydantic import BaseModel, Field, validator
from typing import Optional

class UserProfileUpdate(BaseModel):
    display_name: Optional[str] = Field(
        None, 
        min_length=1, 
        max_length=50,
        description="Display name for the user"
    )
    bio: Optional[str] = Field(
        None, 
        max_length=500,
        description="User biography"
    )
    
    @validator('display_name')
    def validate_display_name(cls, v):
        if v is not None:
            # Remove extra whitespace
            v = ' '.join(v.split())
            # Check for prohibited characters
            if not v.replace(' ', '').isalnum():
                raise ValueError('Display name must be alphanumeric')
        return v
    
    @validator('bio')
    def validate_bio(cls, v):
        if v is not None:
            # Basic XSS prevention
            prohibited = ['<script', '<iframe', 'javascript:']
            if any(p in v.lower() for p in prohibited):
                raise ValueError('Bio contains prohibited content')
        return v
    
    class Config:
        schema_extra = {
            "example": {
                "display_name": "John Doe",
                "bio": "Software developer and coffee enthusiast"
            }
        }
```

### 3. Implement Service Layer Pattern

#### ❌ Business Logic in Routes:
```python
@router.get("/profile")
async def get_profile(user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    user_profile = db.query(UserProfile).filter(UserProfile.user_id == user["id"]).first()
    if not user_profile:
        user_profile = UserProfile(user_id=user["id"])
        db.add(user_profile)
        db.commit()
    return user_profile
```

#### ✅ Service Layer:
```python
# app/services/user_service.py
from typing import Optional
from sqlalchemy.orm import Session
from app.models.user_profile import UserProfile
from app.core.logging import logger

class UserService:
    def __init__(self, db: Session):
        self.db = db
    
    def get_or_create_profile(self, user_id: str) -> UserProfile:
        """Get existing profile or create new one."""
        profile = self.db.query(UserProfile).filter(
            UserProfile.user_id == user_id
        ).first()
        
        if not profile:
            logger.info(f"Creating new profile for user {user_id}")
            profile = UserProfile(user_id=user_id)
            self.db.add(profile)
            self.db.commit()
            self.db.refresh(profile)
        
        return profile
    
    def update_profile(
        self, 
        user_id: str, 
        updates: dict
    ) -> UserProfile:
        """Update user profile with validation."""
        profile = self.get_or_create_profile(user_id)
        
        for key, value in updates.items():
            if hasattr(profile, key) and value is not None:
                setattr(profile, key, value)
        
        self.db.commit()
        self.db.refresh(profile)
        
        logger.info(f"Profile updated for user {user_id}")
        return profile

# Updated router
@router.get("/profile")
async def get_profile(
    user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = UserService(db)
    return service.get_or_create_profile(user["id"])
```

### 4. Add Async Database Operations

#### ❌ Synchronous Database:
```python
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
```

#### ✅ Async Database:
```python
# app/database.py
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

# Use async PostgreSQL driver
DATABASE_URL = "postgresql+asyncpg://user:pass@localhost/db"

engine = create_async_engine(DATABASE_URL, echo=False)
async_session_maker = sessionmaker(
    engine, 
    class_=AsyncSession, 
    expire_on_commit=False
)

async def get_async_db():
    async with async_session_maker() as session:
        yield session

# Usage in routes
@router.get("/profile")
async def get_profile(
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    result = await db.execute(
        select(UserProfile).where(UserProfile.user_id == user["id"])
    )
    profile = result.scalar_one_or_none()
    return profile
```

---

## 🔐 Auth Service (Node.js/TypeScript)

### 1. Add Request Validation Schemas

#### ❌ No Validation:
```typescript
app.post("/api/validate-token", async (req, res) => {
  const token = req.cookies["better-auth.session_token"];
  // No validation
});
```

#### ✅ With Validation:
```typescript
// validation/schemas.ts
import { z } from 'zod';

export const validateTokenSchema = z.object({
  cookies: z.object({
    'better-auth.session_token': z.string().min(1)
  })
});

// middleware/validate.ts
import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
        cookies: req.cookies
      });
      next();
    } catch (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.errors
      });
    }
  };
}

// Usage
app.post(
  "/api/validate-token",
  validate(validateTokenSchema),
  async (req, res) => {
    // Token is guaranteed to exist
  }
);
```

### 2. Implement Proper Error Handling

#### ❌ Generic Errors:
```typescript
} catch (error) {
  console.error("Error:", error);
  res.status(500).json({ error: "Internal server error" });
}
```

#### ✅ Structured Error Handling:
```typescript
// errors/AppError.ts
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
}

// errors/errorHandler.ts
import { Request, Response, NextFunction } from 'express';
import { AppError } from './AppError';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: {
        message: err.message,
        code: err.code,
        details: err.details
      }
    });
  }
  
  // Log unexpected errors
  console.error('Unexpected error:', err);
  
  return res.status(500).json({
    error: {
      message: 'Internal server error',
      code: 'INTERNAL_ERROR'
    }
  });
}

// Usage
app.post("/api/validate-token", async (req, res, next) => {
  try {
    const token = req.cookies["better-auth.session_token"];
    if (!token) {
      throw new AppError(401, 'No token provided', 'NO_TOKEN');
    }
    // ... rest of logic
  } catch (error) {
    next(error);
  }
});

// Register error handler last
app.use(errorHandler);
```

### 3. Add Health Checks

#### ✅ Health Check Endpoint:
```typescript
// health/healthCheck.ts
interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  services: {
    database: boolean;
    redis?: boolean;
  };
  version: string;
}

app.get('/health', async (req, res) => {
  const health: HealthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      database: false,
      redis: false
    },
    version: process.env.npm_package_version || 'unknown'
  };
  
  try {
    // Check database
    await auth.api.getSession({ headers: req.headers });
    health.services.database = true;
  } catch (error) {
    health.status = 'unhealthy';
  }
  
  const statusCode = health.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(health);
});
```

---

## 🧪 Testing Strategy

### Frontend Testing Setup
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
  },
});

// Example test
describe('LoginForm', () => {
  it('should show validation errors', async () => {
    render(<LoginForm />);
    
    const submitButton = screen.getByRole('button', { name: /login/i });
    await userEvent.click(submitButton);
    
    expect(screen.getByText(/email is required/i)).toBeInTheDocument();
  });
});
```

### Backend Testing Setup
```python
# tests/conftest.py
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.database import Base, get_db

# Test database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL)
TestingSessionLocal = sessionmaker(bind=engine)

@pytest.fixture
def client():
    Base.metadata.create_all(bind=engine)
    
    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()
    
    app.dependency_overrides[get_db] = override_get_db
    
    with TestClient(app) as c:
        yield c
    
    Base.metadata.drop_all(bind=engine)

# Example test
def test_get_profile_unauthenticated(client):
    response = client.get("/api/user/profile")
    assert response.status_code == 401
```

---

## 📋 Code Quality Checklist

### Immediate Actions
- [ ] Remove all `console.log` and `print` statements
- [ ] Add proper TypeScript types (no `any`)
- [ ] Implement error boundaries in React
- [ ] Add input validation for all endpoints

### Short-term (1 week)
- [ ] Set up structured logging
- [ ] Extract business logic to service layer
- [ ] Add comprehensive error handling
- [ ] Create reusable custom hooks

### Long-term (1 month)
- [ ] Add comprehensive test suites
- [ ] Implement CI/CD with quality gates
- [ ] Add API documentation
- [ ] Set up code coverage reporting