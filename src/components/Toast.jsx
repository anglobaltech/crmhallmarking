import { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

let addToastFn = null;

export function toast(message, type = 'success') {
  if (addToastFn) addToastFn({ message, type, id: Date.now() });
}

const icons = {
  success: <CheckCircle2 size={18} style={{ color: '#10B981', flexShrink: 0 }} />,
  error: <XCircle size={18} style={{ color: '#EF4444', flexShrink: 0 }} />,
  warning: <AlertTriangle size={18} style={{ color: '#F59E0B', flexShrink: 0 }} />,
  info: <Info size={18} style={{ color: '#3B82F6', flexShrink: 0 }} />,
};

const bgMap = {
  success: { bg: '#ECFDF5', border: '#A7F3D0', text: '#065F46' },
  error: { bg: '#FEF2F2', border: '#FECACA', text: '#991B1B' },
  warning: { bg: '#FFFBEB', border: '#FDE68A', text: '#92400E' },
  info: { bg: '#EFF6FF', border: '#BFDBFE', text: '#1E40AF' },
};

function ToastItem({ toast: t, onRemove }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // trigger animation
    setTimeout(() => setVisible(true), 10);
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onRemove(t.id), 300); // Wait for fade out
    }, 4000);
    return () => clearTimeout(timer);
  }, [t.id, onRemove]);

  const style = bgMap[t.type] || bgMap.success;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '12px 16px',
      borderRadius: '8px',
      backgroundColor: style.bg,
      border: `1px solid ${style.border}`,
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      minWidth: '280px',
      maxWidth: '350px',
      fontFamily: "'Inter', sans-serif",
      transform: visible ? 'translateX(0) scale(1)' : 'translateX(100px) scale(0.9)',
      opacity: visible ? 1 : 0,
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      pointerEvents: 'auto',
    }}>
      {icons[t.type]}
      <p style={{ margin: 0, fontSize: '14px', fontWeight: 500, flex: 1, color: style.text, lineHeight: 1.4 }}>
        {t.message}
      </p>
      <button 
        onClick={() => {
          setVisible(false);
          setTimeout(() => onRemove(t.id), 300);
        }}
        style={{
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: style.text,
          opacity: 0.6,
          borderRadius: '4px',
          transition: 'background 0.2s, opacity 0.2s'
        }}
        onMouseOver={e => { e.currentTarget.style.opacity = 1; e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)'; }}
        onMouseOut={e => { e.currentTarget.style.opacity = 0.6; e.currentTarget.style.backgroundColor = 'transparent'; }}
      >
        <X size={16} />
      </button>
    </div>
  );
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  const add = useCallback((t) => {
    setToasts(prev => [...prev.slice(-4), t]);
  }, []);

  useEffect(() => {
    addToastFn = add;
    return () => { addToastFn = null; };
  }, [add]);

  const remove = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <div style={{
      position: 'fixed',
      top: '24px',
      right: '24px',
      zIndex: 999999,
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      pointerEvents: 'none', // let clicks pass through the container
    }}>
      {toasts.map(t => (
        <ToastItem key={t.id} toast={t} onRemove={remove} />
      ))}
    </div>
  );
}
