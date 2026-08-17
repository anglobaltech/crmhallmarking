import React, { useState } from 'react';

const CORRECT_PIN = '1234';

export default function LockOverlay({ isLocked, onUnlock }) {
  const [pinBuffer, setPinBuffer] = useState('');
  const [error, setError] = useState('');

  if (!isLocked) return null;

  const pinPress = (n) => {
    if (pinBuffer.length >= 4) return;
    setPinBuffer(prev => prev + n);
    setError('');
  };

  const pinClear = () => {
    setPinBuffer('');
    setError('');
  };

  const pinEnter = () => {
    if (pinBuffer === CORRECT_PIN) {
      onUnlock();
      setPinBuffer('');
      setError('');
    } else {
      setError('Incorrect PIN. Try again.');
      setPinBuffer('');
    }
  };

  return (
    <div className="lock-overlay show" id="lockOverlay">
      <div className="lock-box">
        <i className="ti ti-lock"></i>
        <h2>Hallmark Centre Login</h2>
        <p>Enter your 4-digit PIN to access the system</p>
        
        <div className="pin-row" id="pinDots">
          {[0, 1, 2, 3].map((i) => (
            <div 
              key={i} 
              className={`pin-dot ${i < pinBuffer.length ? 'filled' : ''}`}
            ></div>
          ))}
        </div>
        
        <div className="pin-keys">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <button key={num} className="pin-key" onClick={() => pinPress(num)}>{num}</button>
          ))}
          <button className="pin-key" onClick={pinClear} style={{ fontSize: '11px' }}>CLR</button>
          <button className="pin-key" onClick={() => pinPress(0)}>0</button>
          <button className="pin-key" onClick={pinEnter} style={{ fontSize: '11px', background: 'var(--gold)', color: '#fff' }}>OK</button>
        </div>
        
        <p id="pinError" style={{ color: 'var(--red)', fontSize: '12px', marginTop: '10px', height: '18px' }}>
          {error}
        </p>
      </div>
    </div>
  );
}
