import React, { useEffect, useState } from "react";
import { useSession } from "better-auth/client";
import { Link } from "react-router-dom";
import { api } from "../lib/api";

export default function HomePage() {
  const { data: session } = useSession();
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string>("");
  
  useEffect(() => {
    if (session) {
      api.getHello()
        .then(data => setMessage(data.message))
        .catch(err => setError(err.message || "Failed to fetch hello message"));
    }
  }, [session]);
  
  if (!session) {
    return (
      <div className="home-page">
        <h1>Hello, World!</h1>
        <p>Please sign in to see your personalized message.</p>
        
        <div style={{ marginTop: '30px', display: 'flex', gap: '15px', justifyContent: 'center' }}>
          <Link 
            to="/auth/signIn" 
            style={{ 
              padding: '10px 20px', 
              background: '#4F46E5', 
              color: 'white', 
              textDecoration: 'none', 
              borderRadius: '4px',
              fontWeight: 'bold'
            }}
          >
            Sign In
          </Link>
          
          <Link 
            to="/auth/signUp" 
            style={{ 
              padding: '10px 20px', 
              background: '#E5E7EB', 
              color: '#333', 
              textDecoration: 'none', 
              borderRadius: '4px',
              fontWeight: 'bold'
            }}
          >
            Create Account
          </Link>
        </div>
        
        <div style={{ marginTop: '50px', fontSize: '0.9rem', color: '#666' }}>
          <h3>Getting Started</h3>
          <ul style={{ textAlign: 'left', maxWidth: '500px', margin: '0 auto', lineHeight: '1.6' }}>
            <li>Click "Create Account" to register a new account</li>
            <li>After registration, you can sign in and access protected content</li>
            <li>The "/dashboard" page is protected and requires authentication</li>
          </ul>

          <div style={{ 
            marginTop: '20px', 
            padding: '15px', 
            background: '#f8f9fa', 
            border: '1px solid #e9ecef',
            borderRadius: '4px',
            maxWidth: '500px',
            margin: '0 auto',
            textAlign: 'left'
          }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>Important Note</h4>
            <p style={{ margin: '0 0 10px 0' }}>
              The auth service API endpoints (like <code>http://localhost:4000/api/auth/signUp</code>) are not meant 
              to be accessed directly in your browser. Instead, use the frontend routes:
            </p>
            <ul style={{ marginBottom: '0' }}>
              <li><strong>Sign Up:</strong> <code>http://localhost:3001/auth/signUp</code></li>
              <li><strong>Sign In:</strong> <code>http://localhost:3001/auth/signIn</code></li>
            </ul>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="home-page">
      <h1>Hello, World!</h1>
      {message && <p className="message">{message}</p>}
      {error && <p className="error" style={{ color: 'red' }}>{error}</p>}
      <p>You are signed in as: <strong>{session.user.email}</strong></p>
      
      <div style={{ marginTop: '30px' }}>
        <Link 
          to="/dashboard" 
          style={{ 
            padding: '10px 20px', 
            background: '#4F46E5', 
            color: 'white', 
            textDecoration: 'none', 
            borderRadius: '4px',
            fontWeight: 'bold'
          }}
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}