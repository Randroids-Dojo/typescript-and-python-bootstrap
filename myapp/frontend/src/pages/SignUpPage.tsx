import React from 'react';
import { Link } from 'react-router-dom';

const SignUpPage: React.FC = () => {
  return (
    <div style={{ 
      maxWidth: '800px', 
      margin: '0 auto', 
      padding: '20px',
      fontFamily: 'sans-serif'
    }}>
      <h1>Create an Account</h1>
      <p>
        To sign up for this application, please use one of the following methods:
      </p>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        marginTop: '20px'
      }}>
        <Link to="/auth/signUp" style={{
          display: 'inline-block',
          padding: '10px 20px',
          background: '#4F46E5',
          color: 'white',
          textDecoration: 'none',
          borderRadius: '4px',
          fontWeight: 'bold',
          textAlign: 'center'
        }}>
          Sign Up with Email
        </Link>
        
        <Link to="/auth/signIn" style={{
          display: 'inline-block',
          padding: '10px 20px',
          background: '#E5E7EB',
          color: '#333',
          textDecoration: 'none',
          borderRadius: '4px',
          fontWeight: 'bold',
          textAlign: 'center'
        }}>
          Already have an account? Sign In
        </Link>
      </div>

      <div style={{ marginTop: '40px' }}>
        <h2>Need Help?</h2>
        <p>
          If you're having trouble accessing the sign-up page, try the following:
        </p>
        <ul>
          <li>Ensure all containers are running with <code>docker ps</code></li>
          <li>Check the logs with <code>docker-compose -f myapp/docker-compose.yml logs -f</code></li>
          <li>Visit the direct sign-up URL: <a href="http://localhost:3001/auth/signUp">http://localhost:3001/auth/signUp</a></li>
        </ul>
      </div>
    </div>
  );
};

export default SignUpPage;