import express from 'express';
import cookieParser from 'cookie-parser';
import { configureSecurityMiddleware } from './middleware/security';
import authRoutes from './routes/auth';
import { PORT } from './config';
import UserModel from './models/user';

// Create Express application
const app = express();

// Configure middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Configure security middleware
configureSecurityMiddleware(app);

// Initialize database schema
const initializeDatabase = async () => {
  try {
    await UserModel.createSchema();
    console.log('Database schema initialized');
  } catch (error) {
    console.error('Error initializing database schema:', error);
    process.exit(1);
  }
};

// Configure routes
app.use('/api/auth', authRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  
  // CSRF errors
  if (err.code === 'EBADCSRFTOKEN') {
    return res.status(403).json({
      message: 'Invalid CSRF token. Please refresh the page and try again.'
    });
  }
  
  res.status(500).json({
    message: 'An unexpected error occurred'
  });
});

// Start the server
const startServer = async () => {
  try {
    // Initialize database
    await initializeDatabase();
    
    // Start the server
    app.listen(PORT, () => {
      console.log(`Auth service is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle SIGTERM signal for graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received. Closing server...');
  process.exit(0);
});

// Start the application
startServer();