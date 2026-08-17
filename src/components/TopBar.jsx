import React, { useState, useEffect, useRef } from 'react';
import client, { getImageUrl } from '../api/client';
import Swal from 'sweetalert2';

export default function TopBar({ setLocked, setPage, userContext, onLogout }) {
  const [showNotifs, setShowNotifs] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [notifications, setNotifications] = useState([]);
  
  const notifRef = useRef(null);
  const profileRef = useRef(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const notifRes = await client.get('/operations/notifications').catch(() => ({ data: { data: [] } }));
        const reminRes = await client.get('/workflow/reminders').catch(() => ({ data: { reminders: [] } }));
        
        let allItems = [];
        if (notifRes.data && notifRes.data.data) {
          allItems = [...allItems, ...notifRes.data.data];
        }
        
        if (reminRes.data && reminRes.data.reminders) {
          const rems = reminRes.data.reminders
            .filter(r => r.status !== 'Completed')
            .map(r => ({
              id: 'rem_' + r.id,
              title: 'Reminder: ' + r.title,
              message: r.description || `Due: ${new Date(r.due_date).toLocaleDateString('en-IN')}`,
              is_read: false,
              created_at: r.created_at || r.due_date,
              type: 'reminder'
            }));
          allItems = [...allItems, ...rems];
        }
        
        allItems.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setNotifications(allItems);
      } catch (err) {
        console.error('Failed to load notifications', err);
      }
    };
    fetchNotifications();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifs(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const tenantName = userContext?.tenant_name || 'Hallmarking Centre';
  const tenantAddress = userContext?.tenant_address || 'Address not provided';
  const bisLicence = userContext?.bis_licence || 'N/A';
  const userName = userContext?.name || 'Admin User';
  const userRole = userContext?.role || 'Admin';
  
  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div id="topbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 24px', borderBottom: '1px solid var(--navy-3)', height: '60px' }}>
      
      {/* LEFT SIDE: Centre Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ 
          height: '40px', minWidth: '40px', maxWidth: '140px',
          borderRadius: userContext?.logo_url ? '6px' : '50%', 
          background: userContext?.logo_url ? '#fff' : 'var(--gold)', color: '#000', 
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 'bold', fontSize: '18px', overflow: 'hidden',
          padding: userContext?.logo_url ? '4px 8px' : '0'
        }}>
          {userContext?.logo_url ? (
            <img src={getImageUrl(userContext.logo_url)} alt="Logo" style={{ height: '100%', width: 'auto', objectFit: 'contain' }} />
          ) : (
            <i className="ti ti-building" style={{ fontSize: '20px' }}></i>
          )}
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontSize: '16px', fontWeight: 700, letterSpacing: '0.3px', color: '#fff', textTransform: 'lowercase' }}>
            {tenantName}
          </div>
          <div style={{ fontSize: '11px', color: '#9AB', marginTop: '2px' }}>
            {tenantAddress} | Lic: {bisLicence}
          </div>
        </div>
      </div>
      
      {/* RIGHT SIDE: Controls & Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        
        {/* Simulate Role Display */}
        <div 
          onClick={() => {
            Swal.fire({
              title: 'Coming Soon!',
              text: 'The Role Simulation feature is currently under development.',
              icon: 'info',
              confirmButtonText: 'Got it!',
              confirmButtonColor: 'var(--gold)',
              customClass: {
                popup: 'swal-premium-popup'
              }
            });
          }}
          style={{ fontSize: '13px', color: '#9AB', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
        >
          Simulate: {userRole.charAt(0).toUpperCase() + userRole.slice(1)} <i className="ti ti-chevron-down" style={{ fontSize: '12px' }}></i>
        </div>

        {/* Notifications */}
        <div style={{ position: 'relative' }} ref={notifRef}>
          <button 
            className="btn btn-outline btn-sm topbar-icon-btn" 
            onClick={() => setShowNotifs(!showNotifs)} 
            style={{ borderColor: 'transparent', color: '#9AB', background: 'transparent', padding: '6px', position: 'relative' }}
          >
            <i className="ti ti-bell" style={{ fontSize: '18px' }}></i> 
            {unreadCount > 0 && (
              <span style={{ position: 'absolute', top: '4px', right: '4px', width: '8px', height: '8px', background: 'var(--red)', borderRadius: '50%' }}></span>
            )}
          </button>
          
          <div className={`notif-panel ${showNotifs ? 'show' : ''}`} id="notifPanel">
            <div style={{ padding: '10px 16px', fontSize: '12px', fontWeight: 700, color: 'var(--text3)', borderBottom: '1px solid var(--border)' }}>
              NOTIFICATIONS & REMINDERS
            </div>
            
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {notifications.length === 0 ? (
                <div className="notif-item">
                  <div className="n-title"><span className="notif-dot" style={{ background: 'transparent' }}></span>No new notifications</div>
                  <div className="n-sub">You're all caught up!</div>
                </div>
              ) : (
                notifications.map(notif => (
                  <div className="notif-item" key={notif.id} 
                    style={{ background: notif.is_read ? 'transparent' : 'rgba(0,117,182,0.05)', cursor: 'pointer' }}
                    onClick={() => {
                      if (notif.type === 'reminder') {
                        setPage('reminders');
                      }
                      setShowNotifs(false);
                    }}
                  >
                    <div className="n-title" style={{ color: 'var(--text)' }}>
                      {!notif.is_read && <span className="notif-dot"></span>}
                      {notif.title}
                    </div>
                    <div className="n-sub" style={{ color: 'var(--text2)' }}>{notif.message}</div>
                    <div className="n-sub" style={{ fontSize: '10px', marginTop: '4px', color: '#666' }}>
                      {new Date(notif.created_at).toLocaleString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        
        {/* Profile Dropdown */}
        <div style={{ position: 'relative' }} ref={profileRef}>
          <button 
            className="btn btn-outline btn-sm topbar-icon-btn" 
            onClick={() => setShowProfileMenu(!showProfileMenu)} 
            style={{ borderColor: 'transparent', color: '#9AB', background: 'transparent', padding: '6px' }}
          >
            <i className="ti ti-user" style={{ fontSize: '18px' }}></i>
          </button>

          {showProfileMenu && (
            <div style={{
              position: 'absolute', top: '100%', right: '0', marginTop: '8px',
              background: 'var(--card)', border: '1px solid var(--border)',
              borderRadius: '8px', width: '260px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
              zIndex: 1000, overflow: 'hidden'
            }}>
              {/* Profile Header */}
              <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--gold-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="ti ti-user" style={{ fontSize: '20px', color: 'var(--gold-dark)' }}></i>
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text)' }}>{userName}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text3)', textTransform: 'capitalize' }}>{userRole}</div>
                </div>
              </div>
              
              {/* Profile Details */}
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontSize: '12px', color: 'var(--text2)' }}>
                <div style={{ marginBottom: '8px' }}>
                  <div style={{ color: 'var(--text3)', marginBottom: '2px', fontSize: '11px', textTransform: 'uppercase' }}>Centre Name</div>
                  <div style={{ fontWeight: 500, color: 'var(--text)' }}>{tenantName}</div>
                </div>
                <div style={{ marginBottom: '8px' }}>
                  <div style={{ color: 'var(--text3)', marginBottom: '2px', fontSize: '11px', textTransform: 'uppercase' }}>BIS Licence</div>
                  <div style={{ fontWeight: 500, color: 'var(--text)' }}>{bisLicence}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text3)', marginBottom: '2px', fontSize: '11px', textTransform: 'uppercase' }}>Address</div>
                  <div style={{ lineHeight: '1.4' }}>{tenantAddress}</div>
                </div>
              </div>

              {/* Actions */}
              <div style={{ padding: '8px' }}>
                <button 
                  className="btn btn-sm"
                  style={{ width: '100%', justifyContent: 'flex-start', background: 'transparent', color: 'var(--text)', border: 'none', padding: '8px 12px' }}
                  onClick={() => { setPage('settings'); setShowProfileMenu(false); }}
                >
                  <i className="ti ti-settings" style={{ marginRight: '8px', color: 'var(--text2)' }}></i> Account Settings
                </button>

                <div style={{ height: '1px', background: 'var(--border)', margin: '4px 0' }}></div>
                <button 
                  className="btn btn-sm"
                  style={{ width: '100%', justifyContent: 'flex-start', background: 'var(--red-light)', color: 'var(--red)', border: 'none', padding: '8px 12px' }}
                  onClick={() => {
                    setShowProfileMenu(false);
                    if (onLogout) onLogout();
                  }}
                >
                  <i className="ti ti-logout" style={{ marginRight: '8px' }}></i> Log out
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
