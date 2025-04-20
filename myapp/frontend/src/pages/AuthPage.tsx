import React from 'react';
import { useParams } from 'react-router-dom';
import { AuthCard } from '@daveyplate/better-auth-ui';

function AuthPage() {
  const { page } = useParams<{ page: string }>();
  
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '60vh' 
    }}>
      <AuthCard pathname={page || 'sign-in'} />
    </div>
  );
}

export default AuthPage;