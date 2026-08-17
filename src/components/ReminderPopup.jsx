import React, { useState, useEffect } from 'react';
import client from '../api/client';

export default function ReminderPopup({ setPage }) {
  const [reminders, setReminders] = useState([]);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const fetchReminders = async () => {
      try {
        const res = await client.get('/workflow/reminders');
        if (res.data && res.data.reminders) {
          const now = new Date();
          const upcoming = res.data.reminders.filter(r => {
            if (r.status === 'Completed') return false;
            const due = new Date(r.due_date);
            const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
            return diffDays <= 7; // Show if due within 7 days or overdue
          });
          if (upcoming.length > 0) {
            setReminders(upcoming);
            setVisible(true);
          }
        }
      } catch (err) {
        console.error('Failed to fetch reminders for popup:', err);
      }
    };
    
    // Fetch initially
    fetchReminders();
    
    // Check every hour
    const interval = setInterval(fetchReminders, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (!visible || reminders.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      width: '350px',
      background: 'var(--card)',
      border: '1px solid var(--border)',
      borderRadius: '12px',
      boxShadow: '0 10px 40px rgba(0,0,0,0.4)',
      zIndex: 9999,
      overflow: 'hidden',
      animation: 'slideUp 0.4s ease-out'
    }}>
      <div style={{
        background: 'linear-gradient(90deg, rgba(0,117,182,0.1) 0%, transparent 100%)',
        borderBottom: '1px solid var(--border)',
        padding: '12px 16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, color: 'var(--text)' }}>
          <i className="ti ti-bell-ringing" style={{ color: 'var(--gold)', fontSize: '18px' }}></i>
          Reminder Alert
        </div>
        <button 
          onClick={() => setVisible(false)}
          style={{ background: 'transparent', border: 'none', color: '#9AB', cursor: 'pointer', fontSize: '18px' }}
        >
          <i className="ti ti-x"></i>
        </button>
      </div>

      <div style={{ padding: '16px', maxHeight: '300px', overflowY: 'auto' }}>
        {reminders.slice(0, 3).map(r => {
          const due = new Date(r.due_date);
          const diffDays = Math.ceil((due - new Date()) / (1000 * 60 * 60 * 24));
          
          let badgeColor = 'badge-blue';
          let dayText = `${diffDays} days left`;
          
          if (diffDays < 0) { badgeColor = 'badge-red'; dayText = `${Math.abs(diffDays)} days overdue`; }
          else if (diffDays === 0) { badgeColor = 'badge-red'; dayText = 'Due Today'; }
          else if (diffDays <= 3) { badgeColor = 'badge-gold'; }
          
          return (
            <div key={r.id} style={{ 
              marginBottom: '12px', 
              padding: '12px', 
              background: 'rgba(0,0,0,0.2)', 
              borderRadius: '8px',
              borderLeft: `3px solid var(--${badgeColor.split('-')[1]})`
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <div style={{ fontWeight: 600, fontSize: '13px', color: '#fff' }}>{r.title}</div>
                <span className={`badge ${badgeColor}`}>{dayText}</span>
              </div>
              {r.description && <div style={{ fontSize: '12px', color: '#9AB', marginBottom: '8px' }}>{r.description}</div>}
            </div>
          );
        })}
        {reminders.length > 3 && (
          <div style={{ textAlign: 'center', fontSize: '12px', color: '#9AB', marginTop: '8px' }}>
            + {reminders.length - 3} more reminders
          </div>
        )}
      </div>

      <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: '8px' }}>
        <button 
          className="btn btn-gold btn-sm" 
          style={{ flex: 1 }}
          onClick={() => {
            setVisible(false);
            setPage('reminders');
          }}
        >
          View All Reminders
        </button>
      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
