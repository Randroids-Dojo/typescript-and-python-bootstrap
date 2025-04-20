import React from "react";
import { useSession } from "better-auth/client";
import { Navigate } from "react-router-dom";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { data: session, isLoading } = useSession();
  
  if (isLoading) {
    return <div>Loading...</div>;
  }
  
  if (session === null) {
    return <Navigate to="/auth/signIn" replace />;
  }
  
  return <>{children}</>;
}