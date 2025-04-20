import { Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import HomePage from './pages/HomePage';
import AuthPage from './pages/AuthPage';
import SignUpPage from './pages/SignUpPage';
import ErrorPage from './pages/ErrorPage';
import './App.css';

function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        } />
        <Route path="/auth/signUp" element={<SignUpPage />} />
        <Route path="/auth/:page" element={<AuthPage />} />
        <Route path="*" element={<ErrorPage />} />
      </Routes>
    </div>
  );
}

export default App;