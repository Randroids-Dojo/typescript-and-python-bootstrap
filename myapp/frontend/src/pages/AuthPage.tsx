import React from 'react';

function AuthPage() {
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '60vh' 
    }}>
      <div style={{ 
        border: '1px solid #ddd', 
        padding: '20px', 
        borderRadius: '8px', 
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)' 
      }}>
        <h2>Sign In</h2>
        <form>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Email</label>
            <input 
              type="email" 
              placeholder="Email"
              style={{ 
                width: '100%', 
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid #ddd'
              }}
            />
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Password</label>
            <input 
              type="password" 
              placeholder="Password"
              style={{ 
                width: '100%', 
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid #ddd'
              }}
            />
          </div>
          <button 
            type="submit"
            style={{
              background: '#0070f3',
              color: 'white',
              border: 'none',
              padding: '10px 15px',
              borderRadius: '4px',
              cursor: 'pointer',
              width: '100%'
            }}
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}

export default AuthPage;