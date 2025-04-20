import { Navigate } from 'react-router-dom';
import { authClient } from '../lib/auth-client';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  // Get session from our mock auth client
  const { data: session, isLoading } = authClient.useSession();
  
  if (isLoading) {
    return <div>Loading...</div>;
  }
  
  if (session === null) {
    return <Navigate to="/auth/signIn" replace />;
  }
  
  return <>{children}</>;
}