import React, { useEffect, useState } from 'react';

const ErrorPage: React.FC = () => {
  const [errors, setErrors] = useState<string[]>([]);
  
  useEffect(() => {
    // Get any errors from local storage
    const storedErrors = localStorage.getItem('appErrors');
    if (storedErrors) {
      setErrors(JSON.parse(storedErrors));
    }
    
    // Override console.error to capture errors
    const originalConsoleError = console.error;
    console.error = (...args) => {
      originalConsoleError(...args);
      
      // Convert error to string
      const errorText = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      
      setErrors(prev => {
        const newErrors = [...prev, errorText];
        // Store in localStorage
        localStorage.setItem('appErrors', JSON.stringify(newErrors.slice(-10))); // Keep last 10 errors
        return newErrors;
      });
    };
    
    return () => {
      console.error = originalConsoleError;
    };
  }, []);
  
  return (
    <div style={{padding: '20px', maxWidth: '800px', margin: '0 auto'}}>
      <h1>Error Log</h1>
      {errors.length === 0 ? (
        <p>No errors logged.</p>
      ) : (
        <>
          <p>Recent errors:</p>
          <div>
            {errors.map((error, index) => (
              <div key={index} style={{
                background: '#ffebee', 
                padding: '10px', 
                borderRadius: '4px',
                marginBottom: '10px',
                fontFamily: 'monospace',
                whiteSpace: 'pre-wrap',
                overflow: 'auto'
              }}>
                {error}
              </div>
            ))}
          </div>
          <button 
            onClick={() => {
              localStorage.removeItem('appErrors');
              setErrors([]);
            }}
            style={{
              background: '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '8px 16px',
              cursor: 'pointer'
            }}
          >
            Clear Errors
          </button>
        </>
      )}
    </div>
  );
};

export default ErrorPage;