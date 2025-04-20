import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';

function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <header>
          <h1>My App</h1>
          <nav>
            <ul style={{ display: 'flex', listStyle: 'none', gap: '20px' }}>
              <li><Link to="/">Home</Link></li>
              <li><Link to="/auth">Sign In</Link></li>
              <li><Link to="/dashboard">Dashboard</Link></li>
              <li><Link to="/profile">Profile</Link></li>
            </ul>
          </nav>
        </header>
        <main style={{ padding: '20px' }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
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