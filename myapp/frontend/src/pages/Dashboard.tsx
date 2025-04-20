import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authClient } from '../lib/auth-client';
import api from '../utils/api';

function Dashboard() {
  const { data: session } = authClient.useSession();
  const navigate = useNavigate();
  const [protectedData, setProtectedData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) {
      navigate('/auth/sign-in');
      return;
    }

    const fetchProtectedData = async () => {
      try {
        setLoading(true);
        const response = await api.get('/api/protected');
        setProtectedData(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching protected data:', err);
        setError('Failed to load protected data');
      } finally {
        setLoading(false);
      }
    };

    fetchProtectedData();
  }, [session, navigate]);

  if (!session) {
    return null;
  }

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome to your dashboard, {session.user?.email}!</p>

      <div style={{ marginTop: '20px' }}>
        <h2>Protected API Data:</h2>
        {loading ? (
          <p>Loading...</p>
        ) : error ? (
          <p style={{ color: 'red' }}>{error}</p>
        ) : (
          <pre style={{ 
            background: '#f0f0f0', 
            padding: '10px', 
            borderRadius: '5px' 
          }}>
            {JSON.stringify(protectedData, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}

export default Dashboard;