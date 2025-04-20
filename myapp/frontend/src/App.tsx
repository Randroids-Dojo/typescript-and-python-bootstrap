import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { authClient } from './lib/auth-client';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';

function App() {
  const { data: session } = authClient.useSession();

  return (
    <div className="App">
      <header>
        <nav>
          <ul style={{ display: 'flex', listStyle: 'none', gap: '20px' }}>
            <li><Link to="/">Home</Link></li>
            {session ? (
              <>
                <li><Link to="/dashboard">Dashboard</Link></li>
                <li><Link to="/profile">Profile</Link></li>
                <li>
                  <button 
                    onClick={() => authClient.signOut()}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'blue', textDecoration: 'underline' }}
                  >
                    Sign Out
                  </button>
                </li>
              </>
            ) : (
              <li><Link to="/auth/sign-in">Sign In</Link></li>
            )}
          </ul>
        </nav>
      </header>

      <main style={{ padding: '20px' }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/auth/:page" element={<AuthPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </main>
    </div>
  );
}

function Home() {
  return (
    <div>
      <h1>Welcome to MyApp</h1>
      <p>A full-stack TypeScript and Python application with authentication.</p>
    </div>
  );
}

export default App;