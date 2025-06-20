import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import './AuthComponent.css';

const AuthComponent = () => {
  const { user, signInWithGoogle, logout } = useAuth();

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Failed to sign in:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Failed to sign out:', error);
    }
  };

  if (user) {
    return (
      <div className="auth-component signed-in">
        <div className="user-info">
          <img 
            src={user.photoURL} 
            alt="Profile" 
            className="profile-image"
          />
          <span className="user-name">{user.displayName}</span>
        </div>
        <button 
          onClick={handleSignOut}
          className="auth-button sign-out"
        >
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <div className="auth-component signed-out">
      <button 
        onClick={handleSignIn}
        className="auth-button sign-in"
      >
        <svg width="18" height="18" viewBox="0 0 18 18">
          <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/>
          <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2.04a4.8 4.8 0 0 1-7.18-2.53H1.83v2.07A8 8 0 0 0 8.98 17z"/>
          <path fill="#FBBC05" d="M4.5 10.49a4.8 4.8 0 0 1 0-3.07V5.35H1.83a8 8 0 0 0 0 7.28l2.67-2.14z"/>
          <path fill="#EA4335" d="M8.98 4.72c1.16 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.35L4.5 7.42a4.77 4.77 0 0 1 4.48-2.7z"/>
        </svg>
        Sign in with Google
      </button>
    </div>
  );
};

export default AuthComponent; 