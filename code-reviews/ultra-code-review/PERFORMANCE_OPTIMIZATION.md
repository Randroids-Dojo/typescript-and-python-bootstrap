# Performance Optimization Guide

## Performance Issues & Solutions

### 🔴 Critical Performance Issues

#### 1. Frontend Polling Without Optimization
**Problem**: GlobalCounter polls every 5 seconds regardless of user activity
```typescript
// frontend/src/components/features/GlobalCounter.tsx
refetchInterval: 5000, // Polls every 5 seconds
```

**Impact**: 
- Unnecessary network requests (17,280/day per user)
- Battery drain on mobile devices
- Server load increases linearly with users

**Solutions**:
```typescript
// Option 1: WebSocket for real-time updates
const useCounterWebSocket = () => {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    const ws = new WebSocket('ws://localhost/ws/counter');
    ws.onmessage = (event) => setCount(JSON.parse(event.data).count);
    return () => ws.close();
  }, []);
  
  return count;
};

// Option 2: Exponential backoff polling
refetchInterval: (data) => {
  const timeSinceLastChange = Date.now() - data?.lastUpdated;
  return Math.min(timeSinceLastChange * 2, 60000); // Max 1 minute
}

// Option 3: Visibility-based polling
refetchInterval: document.hidden ? false : 5000
```

#### 2. Synchronous Auth Validation on Every Request
**Problem**: Backend makes blocking HTTP call for each request
```python
# backend/app/core/auth.py:20-30
response = httpx.get(
    f"{AUTH_SERVICE_URL}/api/validate-token",
    cookies={"better-auth.session_token": token}
)
```

**Impact**:
- Adds 50-200ms latency per request
- No connection pooling
- No caching of valid sessions

**Solutions**:
```python
# Solution 1: Async with connection pooling
class AuthService:
    def __init__(self):
        self.client = httpx.AsyncClient(
            base_url=AUTH_SERVICE_URL,
            limits=httpx.Limits(max_connections=100)
        )
    
    async def validate_token(self, token: str) -> dict:
        # Add caching layer
        cached = await redis.get(f"session:{token}")
        if cached:
            return json.loads(cached)
        
        response = await self.client.get(
            "/api/validate-token",
            cookies={"better-auth.session_token": token}
        )
        
        if response.status_code == 200:
            # Cache for 5 minutes
            await redis.setex(
                f"session:{token}", 
                300, 
                response.text
            )
        
        return response.json()

# Solution 2: JWT verification locally
# Verify JWT signature without HTTP call
```

#### 3. Missing Database Connection Pooling
**Problem**: Default SQLAlchemy settings may not be optimal
```python
# backend/app/database.py
engine = create_engine(settings.DATABASE_URL, echo=True)
```

**Solutions**:
```python
engine = create_engine(
    settings.DATABASE_URL,
    echo=False,  # Disable in production
    pool_size=20,  # Connection pool size
    max_overflow=40,  # Maximum overflow connections
    pool_pre_ping=True,  # Verify connections before use
    pool_recycle=3600,  # Recycle connections after 1 hour
)
```

---

### 🟡 High Priority Optimizations

#### 4. No Redis Caching Implementation
**Problem**: Redis configured but not used
```python
# backend/app/core/config.py
REDIS_URL: str = "redis://redis:6379"
# But no Redis client initialized
```

**Solution**:
```python
# backend/app/core/cache.py
import redis.asyncio as redis
from functools import wraps
import json

redis_client = redis.from_url(settings.REDIS_URL)

def cache(expire=300):
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Create cache key from function name and args
            cache_key = f"{func.__name__}:{str(args)}:{str(kwargs)}"
            
            # Try to get from cache
            cached = await redis_client.get(cache_key)
            if cached:
                return json.loads(cached)
            
            # Call function and cache result
            result = await func(*args, **kwargs)
            await redis_client.setex(
                cache_key, 
                expire, 
                json.dumps(result)
            )
            return result
        return wrapper
    return decorator

# Usage:
@cache(expire=60)
async def get_counter_value():
    # Expensive database query
    return await db.fetch_counter()
```

#### 5. Frontend Bundle Size Optimization
**Problem**: No code splitting or lazy loading

**Solution**:
```typescript
// Implement route-based code splitting
import { lazy, Suspense } from 'react';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const UserProfile = lazy(() => import('./pages/UserProfile'));

// In App.tsx
<Suspense fallback={<LoadingSpinner />}>
  <Routes>
    <Route path="/dashboard" element={<Dashboard />} />
    <Route path="/profile" element={<UserProfile />} />
  </Routes>
</Suspense>

// Optimize imports
// Before:
import { Button, Card, Input, Label } from '@/components/ui';

// After:
import Button from '@/components/ui/button';
import Card from '@/components/ui/card';
```

#### 6. N+1 Query Prevention
**Problem**: Profile creation in GET request
```python
# backend/app/routers/user.py:40-44
if not user_profile:
    user_profile = UserProfile(
        user_id=user["id"],
        display_name=user.get("name", ""),
    )
```

**Solution**:
```python
# Use get_or_create pattern
async def get_or_create_profile(user_id: str, session: Session):
    # Use SELECT ... FOR UPDATE to prevent race conditions
    profile = session.query(UserProfile).filter_by(
        user_id=user_id
    ).with_for_update().first()
    
    if not profile:
        profile = UserProfile(user_id=user_id)
        session.add(profile)
        session.commit()
    
    return profile

# Or use upsert
from sqlalchemy.dialects.postgresql import insert

stmt = insert(UserProfile).values(
    user_id=user_id,
    display_name=display_name
)
stmt = stmt.on_conflict_do_update(
    index_elements=['user_id'],
    set_=dict(updated_at=func.now())
)
```

---

### 🟢 Medium Priority Optimizations

#### 7. Image Optimization
```typescript
// Add lazy loading for images
<img 
  src={profileImage} 
  loading="lazy"
  decoding="async"
  alt="Profile"
/>

// Use next-gen formats
<picture>
  <source srcset="profile.webp" type="image/webp" />
  <source srcset="profile.jpg" type="image/jpeg" />
  <img src="profile.jpg" alt="Profile" />
</picture>
```

#### 8. API Response Compression
```nginx
# nginx/nginx.conf additions
gzip on;
gzip_vary on;
gzip_types text/plain text/css application/json application/javascript;
gzip_min_length 1000;
gzip_comp_level 6;

# Brotli compression (better than gzip)
brotli on;
brotli_types text/plain text/css application/json application/javascript;
brotli_comp_level 6;
```

#### 9. Database Query Optimization
```python
# Add database indexes
class UserProfile(Base):
    __tablename__ = "user_profiles"
    
    # Add indexes for frequently queried columns
    __table_args__ = (
        Index('idx_user_id', 'user_id'),
        Index('idx_created_at', 'created_at'),
    )

# Use select_related for joins
# Before:
profiles = session.query(UserProfile).all()
for profile in profiles:
    user = get_user(profile.user_id)  # N+1 problem

# After:
profiles = session.query(UserProfile).options(
    joinedload(UserProfile.user)
).all()
```

---

## Performance Monitoring Setup

### 1. Frontend Monitoring
```typescript
// Add Web Vitals monitoring
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

function sendToAnalytics(metric) {
  // Send to your analytics endpoint
  fetch('/api/analytics', {
    method: 'POST',
    body: JSON.stringify(metric),
  });
}

getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);
```

### 2. Backend Monitoring
```python
# Add request timing middleware
import time
from fastapi import Request

@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    
    # Log slow requests
    if process_time > 1.0:
        logger.warning(f"Slow request: {request.url} took {process_time}s")
    
    return response
```

### 3. Database Query Monitoring
```python
# Add query logging for slow queries
import logging
from sqlalchemy import event
from sqlalchemy.engine import Engine

logging.basicConfig()
logger = logging.getLogger("sqlalchemy.engine")

@event.listens_for(Engine, "before_cursor_execute")
def before_cursor_execute(conn, cursor, statement, parameters, context, executemany):
    conn.info.setdefault('query_start_time', []).append(time.time())

@event.listens_for(Engine, "after_cursor_execute")
def after_cursor_execute(conn, cursor, statement, parameters, context, executemany):
    total = time.time() - conn.info['query_start_time'].pop(-1)
    if total > 0.5:  # Log queries taking more than 500ms
        logger.warning(f"Slow query ({total:.2f}s): {statement[:100]}...")
```

---

## Performance Checklist

### Immediate Actions
- [ ] Implement Redis caching for auth validation
- [ ] Add connection pooling for HTTP clients
- [ ] Disable SQL echo in production
- [ ] Remove unnecessary console.log statements

### Short-term (1 week)
- [ ] Replace polling with WebSockets for real-time features
- [ ] Implement code splitting for frontend routes
- [ ] Add database connection pooling
- [ ] Enable gzip/brotli compression

### Long-term (1 month)
- [ ] Implement CDN for static assets
- [ ] Add database query optimization and indexes
- [ ] Set up performance monitoring
- [ ] Implement service worker for offline support

---

## Expected Performance Improvements

| Optimization | Current | Expected | Improvement |
|--------------|---------|----------|-------------|
| Auth validation latency | 100-200ms | 5-10ms | 95% reduction |
| Counter updates | 17k requests/day/user | 100 requests/day/user | 99% reduction |
| Initial page load | 3-5s | 1-2s | 60% reduction |
| API response time | 200-500ms | 50-150ms | 70% reduction |
| Database queries | No caching | 90% cache hit rate | 10x faster |

---

## Tools for Performance Testing

1. **Frontend**:
   - Lighthouse CI
   - WebPageTest
   - Chrome DevTools Performance tab

2. **Backend**:
   - Apache Bench (ab)
   - Locust for load testing
   - py-spy for Python profiling

3. **Database**:
   - pgBadger for PostgreSQL analysis
   - EXPLAIN ANALYZE for query optimization