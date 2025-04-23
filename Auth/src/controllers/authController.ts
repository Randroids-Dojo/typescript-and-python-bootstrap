import { Request, Response } from 'express';
import authService from '../services/authService';

class AuthController {
  // Register a new user
  async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        res.status(400).json({ message: 'Email and password are required' });
        return;
      }
      
      const result = await authService.register({ email, password });
      
      if (!result.success) {
        res.status(400).json({ message: result.message });
        return;
      }
      
      // Set tokens in cookies
      this.setTokenCookies(res, result.tokens!);
      
      res.status(201).json({
        message: 'User registered successfully',
        user: result.user
      });
    } catch (error) {
      console.error('Register controller error:', error);
      res.status(500).json({ message: 'Registration failed' });
    }
  }
  
  // Login a user
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        res.status(400).json({ message: 'Email and password are required' });
        return;
      }
      
      const result = await authService.login(email, password);
      
      if (!result.success) {
        res.status(401).json({ message: result.message });
        return;
      }
      
      // Set tokens in cookies
      this.setTokenCookies(res, result.tokens!);
      
      res.status(200).json({
        message: 'Login successful',
        user: result.user
      });
    } catch (error) {
      console.error('Login controller error:', error);
      res.status(500).json({ message: 'Login failed' });
    }
  }
  
  // Refresh access token
  async refresh(req: Request, res: Response): Promise<void> {
    try {
      const refreshToken = req.cookies?.refresh_token || req.body.refreshToken;
      
      if (!refreshToken) {
        res.status(400).json({ message: 'Refresh token is required' });
        return;
      }
      
      const result = await authService.refreshToken(refreshToken);
      
      if (!result.success) {
        res.status(401).json({ message: result.message });
        return;
      }
      
      // Set new tokens in cookies
      this.setTokenCookies(res, result.tokens!);
      
      res.status(200).json({
        message: 'Token refreshed successfully'
      });
    } catch (error) {
      console.error('Refresh token controller error:', error);
      res.status(500).json({ message: 'Token refresh failed' });
    }
  }
  
  // Logout a user
  async logout(req: Request, res: Response): Promise<void> {
    try {
      const refreshToken = req.cookies?.refresh_token || req.body.refreshToken;
      
      if (!refreshToken || !req.user?.id) {
        res.status(400).json({ message: 'Refresh token and authentication are required' });
        return;
      }
      
      // Call the service but don't need to store the result
      await authService.logout(refreshToken, req.user.id);
      
      // Clear token cookies
      res.clearCookie('access_token');
      res.clearCookie('refresh_token');
      
      res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
      console.error('Logout controller error:', error);
      res.status(500).json({ message: 'Logout failed' });
    }
  }
  
  // Get user profile
  async me(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user?.id) {
        res.status(401).json({ message: 'Authentication required' });
        return;
      }
      
      const result = await authService.getUserProfile(req.user.id);
      
      if (!result.success) {
        res.status(404).json({ message: result.message });
        return;
      }
      
      res.status(200).json({
        user: result.user
      });
    } catch (error) {
      console.error('Get profile controller error:', error);
      res.status(500).json({ message: 'Failed to retrieve user profile' });
    }
  }
  
  // Validate token
  async validate(req: Request, res: Response): Promise<void> {
    // If the request reaches this point, the token is valid due to the auth middleware
    res.status(200).json({
      valid: true,
      user: req.user
    });
  }
  
  // Helper method to set token cookies
  private setTokenCookies(res: Response, tokens: { accessToken: string, refreshToken: string }): void {
    // Access token cookie - shorter lived
    res.cookie('access_token', tokens.accessToken, {
      maxAge: 15 * 60 * 1000, // 15 minutes
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/api'
    });
    
    // Refresh token cookie - longer lived, more restrictive
    res.cookie('refresh_token', tokens.refreshToken, {
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/api/auth/refresh' // Restricted path
    });
  }
}

export default new AuthController();