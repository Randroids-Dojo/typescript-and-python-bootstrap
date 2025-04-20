import { Navigate } from 'react-router-dom';
import { authClient } from '../lib/auth-client';

export default function SignUpPage() {
  const { data: session } = authClient.useSession();

  if (session) {
    return <Navigate to="/" replace />;
  }

  // Simple mock signup UI for template
  return (
    <div>
      <h1>Sign Up</h1>
      <form>
        <div>
          <label htmlFor="email">Email</label>
          <input type="email" id="email" name="email" />
        </div>
        <div>
          <label htmlFor="password">Password</label>
          <input type="password" id="password" name="password" />
        </div>
        <button type="submit">Sign Up</button>
      </form>
    </div>
  );
}