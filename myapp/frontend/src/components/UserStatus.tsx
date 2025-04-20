import { authClient } from '../lib/auth-client';

export function UserStatus() {
  const { data: session, isLoading } = authClient.useSession();
  const { signOut } = authClient.useSignOut();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!session) {
    return (
      <div>
        <a href="/auth/signIn">Sign In</a> | <a href="/auth/signUp">Sign Up</a>
      </div>
    );
  }

  // Mock session display for template
  return (
    <div>
      Signed in as user@example.com
      <button onClick={() => signOut()} className="ml-2">
        Sign Out
      </button>
    </div>
  );
}