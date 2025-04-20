import React from 'react';
import { useSession } from 'better-auth/client';
import { Link } from 'react-router-dom';

const UserStatus: React.FC = () => {
  const { data: session, isLoading, signOut } = useSession();

  if (isLoading) {
    return <div className="user-status-loading">Loading...</div>;
  }

  if (!session) {
    return (
      <div className="user-status-signed-out">
        <Link to="/auth/signIn">Sign In</Link>
        <Link to="/auth/signUp">Register</Link>
      </div>
    );
  }

  return (
    <div className="user-status-signed-in">
      <span>Hi, {session.user.email}</span>
      <button onClick={() => signOut()} className="sign-out-button">
        Sign Out
      </button>
    </div>
  );
};

export default UserStatus;