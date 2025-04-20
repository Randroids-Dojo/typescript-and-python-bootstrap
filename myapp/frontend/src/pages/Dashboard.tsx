import React, { useState, useEffect } from 'react';

function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome to your dashboard!</p>
      
      <div style={{ marginTop: '20px' }}>
        <h2>Protected Content</h2>
        <p>This is protected content that would normally require authentication.</p>
      </div>
    </div>
  );
}

export default Dashboard;