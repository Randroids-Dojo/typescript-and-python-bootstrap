import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function AuthPage() {
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const authUrl = process.env.REACT_APP_AUTH_URL || 'http://localhost:4000/api/auth';
      
      if (activeTab === 'signin') {
        // Sign in
        await axios.post(`${authUrl}/signin`, { email, password }, { withCredentials: true });
        navigate('/dashboard');
      } else {
        // Sign up
        await axios.post(`${authUrl}/signup`, { email, password, name }, { withCredentials: true });
        alert('Account created! Please sign in.');
        setActiveTab('signin');
      }
    } catch (err) {
      setError('Authentication failed. Please check your credentials and try again.');
      console.error('Auth error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGithubSignIn = () => {
    const authUrl = process.env.REACT_APP_AUTH_URL || 'http://localhost:4000/api/auth';
    window.location.href = `${authUrl}/github`;
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '60vh' 
    }}>
      <div style={{ 
        border: '1px solid #ddd', 
        padding: '20px', 
        borderRadius: '8px', 
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        width: '400px',
        maxWidth: '100%'
      }}>
        <div style={{ display: 'flex', marginBottom: '20px' }}>
          <button 
            onClick={() => setActiveTab('signin')}
            style={{
              flex: 1,
              background: activeTab === 'signin' ? '#0070f3' : '#f5f5f5',
              color: activeTab === 'signin' ? 'white' : '#333',
              border: 'none',
              padding: '10px 15px',
              borderRadius: '4px 0 0 4px',
              cursor: 'pointer'
            }}
          >
            Sign In
          </button>
          <button 
            onClick={() => setActiveTab('signup')}
            style={{
              flex: 1,
              background: activeTab === 'signup' ? '#0070f3' : '#f5f5f5',
              color: activeTab === 'signup' ? 'white' : '#333',
              border: 'none',
              padding: '10px 15px',
              borderRadius: '0 4px 4px 0',
              cursor: 'pointer'
            }}
          >
            Sign Up
          </button>
        </div>
        
        {error && (
          <div style={{ 
            color: 'red', 
            backgroundColor: '#ffebee', 
            padding: '10px', 
            borderRadius: '4px', 
            marginBottom: '15px' 
          }}>
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
              style={{ 
                width: '100%', 
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid #ddd'
              }}
            />
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Password</label>
            <input 
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="Password"
              required
              style={{ 
                width: '100%', 
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid #ddd'
              }}
            />
          </div>
          
          {activeTab === 'signup' && (
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Name (optional)</label>
              <input 
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)} 
                placeholder="Name"
                style={{ 
                  width: '100%', 
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #ddd'
                }}
              />
            </div>
          )}
          
          <button 
            type="submit"
            disabled={loading}
            style={{
              background: '#0070f3',
              color: 'white',
              border: 'none',
              padding: '10px 15px',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              width: '100%',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Processing...' : activeTab === 'signin' ? 'Sign In' : 'Sign Up'}
          </button>
        </form>
        
        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <div style={{ marginBottom: '10px', color: '#666' }}>Or sign in with</div>
          <button
            onClick={handleGithubSignIn}
            style={{
              background: '#24292e',
              color: 'white',
              border: 'none',
              padding: '10px 15px',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%'
            }}
          >
            GitHub
          </button>
        </div>
      </div>
    </div>
  );
}

export default AuthPage;