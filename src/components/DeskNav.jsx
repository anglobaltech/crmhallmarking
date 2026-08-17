import React from 'react';
import { useTranslation } from 'react-i18next';

export default function DeskNav({ currentDesk, onDeskChange, userContext }) {
  const { t, i18n } = useTranslation();
  
  const allDesks = [
    { id: 'dashboard_nav', label: 'Dashboard', icon: 'ti-layout-dashboard', roles: ['admin', 'employee'] },
    { id: 'reception', label: 'Reception', icon: 'ti-door-enter', roles: ['admin', 'employee'] },
    { id: 'quality', label: 'Quality / XRF', icon: 'ti-microscope', roles: ['admin', 'employee'] },
    { id: 'admin', label: 'Admin', icon: 'ti-settings', roles: ['admin'] },
    { id: 'extra_services', label: 'Services', icon: 'ti-briefcase', roles: ['admin'] }
  ];

  const desks = allDesks.filter(d => !userContext || d.roles.includes(userContext.role));

  const changeLanguage = (e) => {
    i18n.changeLanguage(e.target.value);
  };

  return (
    <div id="desknav">
      {desks.map((desk, index) => (
        <React.Fragment key={desk.id}>
          <div 
            className={`desk-tab ${currentDesk === desk.id ? 'active' : ''}`} 
            onClick={() => onDeskChange(desk.id)}
          >
            <i className={`ti ${desk.icon}`}></i> {desk.label}
          </div>
          {index < desks.length - 1 && <div className="desk-sep"></div>}
        </React.Fragment>
      ))}
      <div className="desk-sep"></div>
      
      <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px', alignItems: 'center', padding: '0 8px' }}>

        
        <a href="https://www.bis.gov.in/" target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
          <button className="btn btn-outline btn-sm" style={{ borderColor: '#567', color: '#9AB', background: 'transparent', fontSize: '11px' }}>
            <i className="ti ti-external-link"></i> Manak Portal
          </button>
        </a>
      </div>
    </div>
  );
}
