"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testPool = void 0;
const pg_1 = require("pg");
// Test database connection
exports.testPool = new pg_1.Pool({
    connectionString: process.env.TEST_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/test_auth_db'
});
global.beforeAll(async () => {
    // Create test tables
    await exports.testPool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      email_verified BOOLEAN DEFAULT false,
      name TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
    await exports.testPool.query(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      expires_at TIMESTAMPTZ NOT NULL,
      ip_address TEXT,
      user_agent TEXT,
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE
    )
  `);
    await exports.testPool.query(`
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
    await exports.testPool.query('DROP TABLE IF EXISTS accounts CASCADE');
    await exports.testPool.query('DROP TABLE IF EXISTS sessions CASCADE');
    await exports.testPool.query('DROP TABLE IF EXISTS users CASCADE');
    await exports.testPool.end();
});
global.beforeEach(async () => {
    // Clear data between tests
    await exports.testPool.query('DELETE FROM accounts');
    await exports.testPool.query('DELETE FROM sessions');
    await exports.testPool.query('DELETE FROM users');
});
