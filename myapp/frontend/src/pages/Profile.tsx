import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authClient } from '../lib/auth-client';
import axios from 'axios';

function Profile() {
  const { data: session } = authClient.useSession();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) {
      navigate('/auth/sign-in');
      return;
    }

    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await axios.get('http://localhost:8000/profile', { 
          withCredentials: true 
        });
        setProfile(response.data);
      } catch (err) {
        console.error('Error fetching profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [session, navigate]);

  if (!session) {
    return null;
  }

  return (
    <div>
      <h1>User Profile</h1>
      
      {loading ? (
        <p>Loading profile information...</p>
      ) : profile ? (
        <div>
          <p><strong>Email:</strong> {profile.email}</p>
          <p><strong>User ID:</strong> {session.user?.id}</p>
        </div>
      ) : (
        <p>Failed to load profile information</p>
      )}
    </div>
  );
}

export default Profile;