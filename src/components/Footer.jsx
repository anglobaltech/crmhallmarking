import React from 'react';

export default function Footer() {
  return (
    <div style={{
      marginTop: '20px',
      padding: '12px 20px',
      textAlign: 'center',
      borderTop: '1px solid var(--border)',
      background: 'linear-gradient(to right, rgba(248, 247, 244, 0.2), rgba(220, 165, 55, 0.08), rgba(248, 247, 244, 0.2))',
      color: '#666',
      fontSize: '13px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '6px',
      borderRadius: '8px',
    }}>
      <div style={{ fontWeight: 500, letterSpacing: '0.3px', color: '#555', marginBottom: '8px' }}>
        Designed and developed by
      </div>
      <img src="/company-logo.png" alt="A N Global Services Logo" style={{ height: '54px', objectFit: 'contain', marginBottom: '6px' }} />
      <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
        &copy; {new Date().getFullYear()} All Rights Reserved. A complete industrial solution provider.
      </div>
    </div>
  );
}
