import { Pool } from 'pg';

// Test database connection
export const testPool = new Pool({
  connectionString: process.env.TEST_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/test_auth_db'
});

global.beforeAll(async () => {
  // Create test tables
  await testPool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      email_verified BOOLEAN DEFAULT false,
      name TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await testPool.query(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      expires_at TIMESTAMPTZ NOT NULL,
      ip_address TEXT,
      user_agent TEXT,
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  await testPool.query(`
    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      account_id TEXT NOT NULL,
      provider_id TEXT NOT NULL,
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      access_token TEXT,
      refresh_token TEXT,
      expires_at TIMESTAMPTZ,
      password TEXT
    )
  `);
});

global.afterAll(async () => {
  // Clean up
  await testPool.query('DROP TABLE IF EXISTS accounts CASCADE');
  await testPool.query('DROP TABLE IF EXISTS sessions CASCADE');
  await testPool.query('DROP TABLE IF EXISTS users CASCADE');
  await testPool.end();
});

global.beforeEach(async () => {
  // Clear data between tests
  await testPool.query('DELETE FROM accounts');
  await testPool.query('DELETE FROM sessions');
  await testPool.query('DELETE FROM users');
});