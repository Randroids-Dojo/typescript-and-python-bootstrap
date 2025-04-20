import React from 'react';
import { AuthUIProvider } from "@daveyplate/better-auth-ui";
import { authClient } from "./lib/auth-client";
import { useNavigate, NavLink } from "react-router-dom";

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const navigate = useNavigate();
  
  return (
    <AuthUIProvider authClient={authClient} navigate={navigate} Link={NavLink}>
      {children}
    </AuthUIProvider>
  );
}