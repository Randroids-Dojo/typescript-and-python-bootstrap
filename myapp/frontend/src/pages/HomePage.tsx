import { useState, useEffect } from 'react';
import { getUserProfile } from '../lib/api';
import { UserStatus } from '../components/UserStatus';
import { authClient } from '../lib/auth-client';

interface UserProfile {
  id: string;
  email: string;
}

export default function HomePage() {
  // Mock session handling
  authClient.useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Just load profile data directly for template purposes
    setLoading(true);
    getUserProfile()
      .then((data) => {
        setProfile(data);
      })
      .catch((error) => {
        console.error('Error fetching profile:', error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div>
      <h1>Welcome to MyApp</h1>
      <UserStatus />
      
      <div>
        <h2>User Profile</h2>
        {loading ? (
          <p>Loading profile...</p>
        ) : profile ? (
          <pre>{JSON.stringify(profile, null, 2)}</pre>
        ) : (
          <p>Could not load profile.</p>
        )}
      </div>
    </div>
  );
}