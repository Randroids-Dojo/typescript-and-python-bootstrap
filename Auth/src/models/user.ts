import bcrypt from 'bcrypt';
import pool from '../utils/db';

export interface User {
  id: number;
  email: string;
  password: string;
  role: string;
  tokenVersion: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface NewUser {
  email: string;
  password: string;
  role?: string;
}

class UserModel {
  // Create user schema if it doesn't exist
  async createSchema(): Promise<void> {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          role VARCHAR(50) NOT NULL DEFAULT 'user',
          token_version INTEGER NOT NULL DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log('User schema initialized');
    } catch (error) {
      console.error('Error creating user schema:', error);
      throw error;
    }
  }

  // Create a new user
  async create(userData: NewUser): Promise<User | null> {
    try {
      // Hash the password with bcrypt
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(userData.password, saltRounds);
      
      const result = await pool.query(
        `INSERT INTO users (email, password, role) 
         VALUES ($1, $2, $3) 
         RETURNING id, email, password, role, token_version, created_at, updated_at`,
        [userData.email, hashedPassword, userData.role || 'user']
      );
      
      if (result.rows.length === 0) {
        return null;
      }
      
      // Convert snake_case to camelCase
      return {
        id: result.rows[0].id,
        email: result.rows[0].email,
        password: result.rows[0].password,
        role: result.rows[0].role,
        tokenVersion: result.rows[0].token_version,
        createdAt: result.rows[0].created_at,
        updatedAt: result.rows[0].updated_at
      };
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === '23505') { // Unique violation
        console.error('User with this email already exists');
        return null;
      }
      console.error('Error creating user:', error);
      throw error;
    }
  }

  // Find user by email
  async findByEmail(email: string): Promise<User | null> {
    try {
      const result = await pool.query(
        `SELECT id, email, password, role, token_version, created_at, updated_at 
         FROM users 
         WHERE email = $1`,
        [email]
      );
      
      if (result.rows.length === 0) {
        return null;
      }
      
      // Convert snake_case to camelCase
      return {
        id: result.rows[0].id,
        email: result.rows[0].email,
        password: result.rows[0].password,
        role: result.rows[0].role,
        tokenVersion: result.rows[0].token_version,
        createdAt: result.rows[0].created_at,
        updatedAt: result.rows[0].updated_at
      };
    } catch (error) {
      console.error('Error finding user by email:', error);
      throw error;
    }
  }

  // Find user by ID
  async findById(id: string): Promise<User | null> {
    try {
      const result = await pool.query(
        `SELECT id, email, password, role, token_version, created_at, updated_at 
         FROM users 
         WHERE id = $1`,
        [id]
      );
      
      if (result.rows.length === 0) {
        return null;
      }
      
      // Convert snake_case to camelCase
      return {
        id: result.rows[0].id,
        email: result.rows[0].email,
        password: result.rows[0].password,
        role: result.rows[0].role,
        tokenVersion: result.rows[0].token_version,
        createdAt: result.rows[0].created_at,
        updatedAt: result.rows[0].updated_at
      };
    } catch (error) {
      console.error('Error finding user by ID:', error);
      throw error;
    }
  }

  // Update user's token version (for token revocation)
  async incrementTokenVersion(userId: string): Promise<boolean> {
    try {
      const result = await pool.query(
        `UPDATE users 
         SET token_version = token_version + 1,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [userId]
      );
      
      return result.rowCount !== null && result.rowCount > 0;
    } catch (error) {
      console.error('Error incrementing token version:', error);
      throw error;
    }
  }
}

export default new UserModel();