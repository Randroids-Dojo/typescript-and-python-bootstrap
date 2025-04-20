import React from "react";
import { Routes, Route } from "react-router-dom";
import { AuthUIProvider } from "@daveyplate/better-auth-ui";
import { authClient } from "./lib/auth-client";
import { BrowserRouter, useNavigate, NavLink } from "react-router-dom";
import { SessionProvider } from "better-auth/client";
import HomePage from "./pages/HomePage";
import AuthPage from "./pages/AuthPage";
import ErrorPage from "./pages/ErrorPage";
import SignUpPage from "./pages/SignUpPage";
import { ProtectedRoute } from "./components/ProtectedRoute";
import UserStatus from "./components/UserStatus";
import "./App.css";

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/auth/:page" element={<AuthPage />} />
      <Route path="/sign-up" element={<SignUpPage />} />
      <Route path="/errors" element={<ErrorPage />} />
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <div>Protected Dashboard</div>
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
}

// Error boundary component
class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: Error | null}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("React error boundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{padding: '20px', maxWidth: '800px', margin: '0 auto', fontFamily: 'sans-serif'}}>
          <h1>Something went wrong.</h1>
          <p>The application encountered an error:</p>
          <pre style={{background: '#f5f5f5', padding: '10px', borderRadius: '4px', overflow: 'auto'}}>
            {this.state.error?.message || 'Unknown error'}
          </pre>
          <button 
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{padding: '8px 16px', background: '#646cff', color: 'white', border: 'none', borderRadius: '4px', marginTop: '10px'}}
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  console.log('Rendering App component');
  
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <div style={{padding: '20px'}}>
          <h1>Hello World App</h1>
          <p>If you can see this, basic React rendering is working.</p>
          <ErrorBoundary>
            <AuthProvider>
              <div className="app">
                <header>
                  <nav>
                    <NavLink to="/">Home</NavLink>
                    <NavLink to="/dashboard">Dashboard</NavLink>
                    <NavLink to="/sign-up">Sign Up</NavLink>
                    <NavLink to="/errors">Errors</NavLink>
                    <div className="user-status">
                      <UserStatus />
                    </div>
                  </nav>
                </header>
                <main>
                  <AppRoutes />
                </main>
              </div>
            </AuthProvider>
          </ErrorBoundary>
        </div>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

function AuthProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  
  // Wrap in a try-catch to prevent rendering errors
  try {
    console.log('Setting up auth provider with client:', authClient);
    
    return (
      <SessionProvider client={authClient}>
        <AuthUIProvider
          authClient={authClient}
          navigate={navigate}
          Link={NavLink}
        >
          {children}
        </AuthUIProvider>
      </SessionProvider>
    );
  } catch (error) {
    console.error('Error in AuthProvider:', error);
    return (
      <div style={{padding: '20px', background: '#ffebee', borderRadius: '4px', margin: '10px 0'}}>
        <h3>Authentication Error</h3>
        <p>There was an error setting up authentication. Basic app functionality is still available.</p>
        <div>{children}</div>
      </div>
    );
  }
}

export default App;