import { useParams } from 'react-router-dom';

export default function AuthPage() {
  const { page } = useParams<{ page: string }>();
  
  // Simple mock auth UI for template
  return (
    <div>
      <h1>{page === 'signIn' ? 'Sign In' : 'Sign Up'}</h1>
      <form>
        <div>
          <label htmlFor="email">Email</label>
          <input type="email" id="email" name="email" />
        </div>
        <div>
          <label htmlFor="password">Password</label>
          <input type="password" id="password" name="password" />
        </div>
        <button type="submit">{page === 'signIn' ? 'Sign In' : 'Sign Up'}</button>
      </form>
    </div>
  );
}