import request from 'supertest';
import express from 'express';
import cors from 'cors';
import { betterAuth } from 'better-auth';
import { testPool } from './setup';

// Create test app
const app = express();
app.use(cors());
app.use(express.json());

// Initialize auth with test database
const auth = betterAuth({
  database: {
    provider: "pg",
    connectionString: process.env.TEST_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/test_auth_db'
  },
  emailAndPassword: {
    enabled: true,
  },
  trustedOrigins: ["http://localhost:3000", "http://localhost:5173"],
});

app.all("/auth/*", auth.handler);

describe('Auth Service', () => {
  describe('POST /auth/sign-up/email', () => {
    it('should create a new user with valid credentials', async () => {
      const response = await request(app)
        .post('/auth/sign-up/email')
        .send({
          email: 'test@example.com',
          password: 'password123',
          name: 'Test User'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe('test@example.com');
      expect(response.body.user.name).toBe('Test User');
      expect(response.body).toHaveProperty('session');
    });

    it('should reject duplicate email', async () => {
      // First signup
      await request(app)
        .post('/auth/sign-up/email')
        .send({
          email: 'duplicate@example.com',
          password: 'password123',
          name: 'First User'
        });

      // Attempt duplicate signup
      const response = await request(app)
        .post('/auth/sign-up/email')
        .send({
          email: 'duplicate@example.com',
          password: 'password456',
          name: 'Second User'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it('should reject weak password', async () => {
      const response = await request(app)
        .post('/auth/sign-up/email')
        .send({
          email: 'weak@example.com',
          password: '123',
          name: 'Weak Password User'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it('should reject invalid email', async () => {
      const response = await request(app)
        .post('/auth/sign-up/email')
        .send({
          email: 'not-an-email',
          password: 'password123',
          name: 'Invalid Email User'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('POST /auth/sign-in/email', () => {
    beforeEach(async () => {
      // Create a test user
      await request(app)
        .post('/auth/sign-up/email')
        .send({
          email: 'existing@example.com',
          password: 'correct-password',
          name: 'Existing User'
        });
    });

    it('should sign in with correct credentials', async () => {
      const response = await request(app)
        .post('/auth/sign-in/email')
        .send({
          email: 'existing@example.com',
          password: 'correct-password'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe('existing@example.com');
      expect(response.body).toHaveProperty('session');
    });

    it('should reject incorrect password', async () => {
      const response = await request(app)
        .post('/auth/sign-in/email')
        .send({
          email: 'existing@example.com',
          password: 'wrong-password'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it('should reject non-existent user', async () => {
      const response = await request(app)
        .post('/auth/sign-in/email')
        .send({
          email: 'nonexistent@example.com',
          password: 'any-password'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('POST /auth/sign-out', () => {
    let sessionToken: string;

    beforeEach(async () => {
      // Create and sign in a user
      const signupResponse = await request(app)
        .post('/auth/sign-up/email')
        .send({
          email: 'signout@example.com',
          password: 'password123',
          name: 'Signout User'
        });

      // Extract session cookie
      const cookies = signupResponse.headers['set-cookie'];
      if (cookies) {
        const sessionCookie = cookies.find((cookie: string) => cookie.startsWith('auth.session'));
        if (sessionCookie) {
          sessionToken = sessionCookie.split(';')[0];
        }
      }
    });

    it('should sign out authenticated user', async () => {
      const response = await request(app)
        .post('/auth/sign-out')
        .set('Cookie', sessionToken);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should handle sign out without session', async () => {
      const response = await request(app)
        .post('/auth/sign-out');

      // Should still succeed even without session
      expect(response.status).toBe(200);
    });
  });

  describe('GET /auth/session', () => {
    let sessionToken: string;

    beforeEach(async () => {
      // Create and sign in a user
      const signupResponse = await request(app)
        .post('/auth/sign-up/email')
        .send({
          email: 'session@example.com',
          password: 'password123',
          name: 'Session User'
        });

      // Extract session cookie
      const cookies = signupResponse.headers['set-cookie'];
      if (cookies) {
        const sessionCookie = cookies.find((cookie: string) => cookie.startsWith('auth.session'));
        if (sessionCookie) {
          sessionToken = sessionCookie.split(';')[0];
        }
      }
    });

    it('should return session for authenticated user', async () => {
      const response = await request(app)
        .get('/auth/session')
        .set('Cookie', sessionToken);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('session');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe('session@example.com');
    });

    it('should return null session for unauthenticated user', async () => {
      const response = await request(app)
        .get('/auth/session');

      expect(response.status).toBe(200);
      expect(response.body.session).toBeNull();
      expect(response.body.user).toBeNull();
    });
  });
});