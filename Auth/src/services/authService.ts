import bcrypt from 'bcrypt';
import UserModel, { NewUser, User } from '../models/user';
import { 
  generateAccessToken, 
  generateRefreshToken, 
  verifyRefreshToken, 
  revokeToken 
} from '../utils/jwt';

export interface AuthResult {
  success: boolean;
  message?: string;
  user?: Omit<User, 'password'>;
  tokens?: {
    accessToken: string;
    refreshToken: string;
  };
}

class AuthService {
  // Register a new user
  async register(userData: NewUser): Promise<AuthResult> {
    // Validate password complexity
    if (!this.validatePassword(userData.password)) {
      return {
        success: false,
        message: 'Password must be at least 8 characters long and include numbers and special characters'
      };
    }
    
    try {
      // Check if user already exists
      const existingUser = await UserModel.findByEmail(userData.email);
      
      if (existingUser) {
        return {
          success: false,
          message: 'User with this email already exists'
        };
      }
      
      // Create the new user
      const newUser = await UserModel.create(userData);
      
      if (!newUser) {
        return {
          success: false,
          message: 'Failed to create user'
        };
      }
      
      // Generate access and refresh tokens
      const accessToken = generateAccessToken(newUser);
      const refreshToken = await generateRefreshToken(newUser);
      
      // Return success with user info and tokens
      const { password, ...userWithoutPassword } = newUser;
      
      return {
        success: true,
        user: userWithoutPassword,
        tokens: {
          accessToken,
          refreshToken
        }
      };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        message: 'Registration failed. Please try again later.'
      };
    }
  }
  
  // Login a user
  async login(email: string, password: string): Promise<AuthResult> {
    try {
      // Find user by email
      const user = await UserModel.findByEmail(email);
      
      if (!user) {
        return {
          success: false,
          message: 'Invalid email or password'
        };
      }
      
      // Compare passwords
      const passwordMatch = await bcrypt.compare(password, user.password);
      
      if (!passwordMatch) {
        return {
          success: false,
          message: 'Invalid email or password'
        };
      }
      
      // Generate access and refresh tokens
      const accessToken = generateAccessToken(user);
      const refreshToken = await generateRefreshToken(user);
      
      // Return success with user info and tokens
      const { password: _, ...userWithoutPassword } = user;
      
      return {
        success: true,
        user: userWithoutPassword,
        tokens: {
          accessToken,
          refreshToken
        }
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: 'Login failed. Please try again later.'
      };
    }
  }
  
  // Refresh access token using refresh token
  async refreshToken(refreshToken: string): Promise<AuthResult> {
    try {
      // Verify the refresh token
      const tokenData = await verifyRefreshToken(refreshToken);
      
      if (!tokenData) {
        return {
          success: false,
          message: 'Invalid refresh token'
        };
      }
      
      // Get user data
      const user = await UserModel.findById(tokenData.userId);
      
      if (!user) {
        return {
          success: false,
          message: 'User not found'
        };
      }
      
      // Generate new tokens
      const accessToken = generateAccessToken(user);
      const newRefreshToken = await generateRefreshToken(user);
      
      return {
        success: true,
        tokens: {
          accessToken,
          refreshToken: newRefreshToken
        }
      };
    } catch (error) {
      console.error('Token refresh error:', error);
      return {
        success: false,
        message: 'Token refresh failed'
      };
    }
  }
  
  // Logout a user
  async logout(refreshToken: string, userId: string): Promise<AuthResult> {
    try {
      // Revoke the refresh token
      await revokeToken(refreshToken);
      
      // Increment the user's token version to invalidate all issued tokens
      await UserModel.incrementTokenVersion(userId);
      
      return {
        success: true,
        message: 'Logged out successfully'
      };
    } catch (error) {
      console.error('Logout error:', error);
      return {
        success: false,
        message: 'Logout failed'
      };
    }
  }
  
  // Get user profile
  async getUserProfile(userId: string): Promise<AuthResult> {
    try {
      const user = await UserModel.findById(userId);
      
      if (!user) {
        return {
          success: false,
          message: 'User not found'
        };
      }
      
      // Return user data without password
      const { password, ...userWithoutPassword } = user;
      
      return {
        success: true,
        user: userWithoutPassword
      };
    } catch (error) {
      console.error('Get user profile error:', error);
      return {
        success: false,
        message: 'Failed to get user profile'
      };
    }
  }
  
  // Validate password strength
  private validatePassword(password: string): boolean {
    // Password must be at least 8 characters long
    if (password.length < 8) {
      return false;
    }
    
    // Password must include at least one number
    if (!/\d/.test(password)) {
      return false;
    }
    
    // Password must include at least one special character
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return false;
    }
    
    return true;
  }
}

export default new AuthService();