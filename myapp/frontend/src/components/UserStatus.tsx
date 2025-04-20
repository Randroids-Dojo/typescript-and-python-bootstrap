import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface User {
  id: string;
  email: string;
  name?: string;
}

const UserStatus: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        setLoading(true);
        // Try to get user data from our backend API
        const backendUrl = process.env.REACT_APP_API_URL || 'http://localhost:8001';
        const { data } = await axios.get(`${backendUrl}/api/user`, { withCredentials: true });
        setUser(data);
      } catch (error) {
        console.error('Error checking auth status:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const handleLogout = async () => {
    try {
      const authUrl = process.env.REACT_APP_AUTH_URL || 'http://localhost:4000/api/auth';
      await axios.post(`${authUrl}/signout`, {}, { withCredentials: true });
      setUser(null);
      window.location.href = '/auth';
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return (
      <div>
        <a href="/auth" style={{ textDecoration: 'none', color: '#0070f3' }}>
          Sign In
        </a>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <span>
        Welcome, {user.name || user.email}
      </span>
      <button
        onClick={handleLogout}
        style={{
          background: 'transparent',
          color: '#0070f3',
          border: '1px solid #0070f3',
          padding: '4px 8px',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '14px'
        }}
      >
        Sign Out
      </button>
    </div>
  );
};

export default UserStatus;