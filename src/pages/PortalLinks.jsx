import React from 'react';

export default function PortalLinks() {
  const openPortal = (url) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="page active" id="p-portal-links">
      <div className="page-title"><i className="ti ti-external-link"></i> Manak Portal Access</div>
      
      <div className="alert alert-info">
        <i className="ti ti-info-circle"></i> 
        These links open the official BIS / Manak Portal in a new window with the relevant section pre-selected.
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px', marginTop: '8px' }}>
        <div className="portal-tile" onClick={() => openPortal('https://www.bis.gov.in/')}>
          <i className="ti ti-door-enter" style={{ color: 'var(--green)' }}></i>
          <div className="p-name">Reception / Intake</div>
          <div className="p-url">bis.gov.in →</div>
        </div>
        <div className="portal-tile" onClick={() => openPortal('https://www.bis.gov.in/')}>
          <i className="ti ti-microscope" style={{ color: 'var(--blue)' }}></i>
          <div className="p-name">Quality / XRF</div>
          <div className="p-url">bis.gov.in →</div>
        </div>
        <div className="portal-tile" onClick={() => openPortal('https://www.bis.gov.in/')}>
          <i className="ti ti-qrcode" style={{ color: 'var(--gold-dark)' }}></i>
          <div className="p-name">HUID Desk</div>
          <div className="p-url">bis.gov.in →</div>
        </div>
        <div className="portal-tile" onClick={() => openPortal('https://www.bis.gov.in/')}>
          <i className="ti ti-file-check" style={{ color: 'var(--purple)' }}></i>
          <div className="p-name">Licence & Renewal</div>
          <div className="p-url">bis.gov.in →</div>
        </div>
        <div className="portal-tile" onClick={() => openPortal('https://www.bis.gov.in/')}>
          <i className="ti ti-report" style={{ color: 'var(--red)' }}></i>
          <div className="p-name">Daily Upload</div>
          <div className="p-url">bis.gov.in →</div>
        </div>
        <div className="portal-tile" onClick={() => openPortal('https://www.bis.gov.in/')}>
          <i className="ti ti-database" style={{ color: 'var(--navy)' }}></i>
          <div className="p-name">Article Status</div>
          <div className="p-url">bis.gov.in →</div>
        </div>
      </div>
    </div>
  );
}
