import React from 'react';
import { getImageUrl } from '../api/client';

export default function ServiceDeliveryVoucher({ job, onBack, userContext }) {
  const customerName = job?.jeweller_name || 'N/A';
  const customerMobile = job?.phone || 'N/A';
  const address = job?.address || 'N/A';
  const gstNumber = job?.gst_number || job?.gstin || 'N/A';
  const receiptDate = job?.created_at ? new Date(job.created_at).toLocaleDateString() : 'N/A';
  
  const weight = job?.weight || job?.gross_weight || job?.sample_weight || 'N/A';
  const metal = job?.material || job?.gold_type || 'N/A';
  const purity = job?.purity || job?.declared_purity || 'N/A';

  const handlePrint = () => {
    window.print();
  };

  const centreName = userContext?.tenant_name || 'Hallmarking Centre';
  const centreLicence = userContext?.bis_licence || 'N/A';
  const centreAddress = userContext?.tenant_address || 'Address not provided';

  return (
    <div className="page active" id="p-service-delivery-voucher">
      <div className="page-title">
        <i className="ti ti-file-invoice"></i> Service Delivery Voucher
        {onBack && (
          <button className="btn btn-outline btn-sm" onClick={onBack} style={{marginLeft: 'auto'}}>
            <i className="ti ti-arrow-left"></i> Back to List
          </button>
        )}
      </div>
      <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
        
        {/* Header Section */}
        <div style={{ textAlign: 'center', marginBottom: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {userContext?.logo_url && (
            <img src={getImageUrl(userContext.logo_url)} alt="Centre Logo" style={{ maxWidth: '300px', height: '80px', objectFit: 'contain', marginBottom: '15px' }} />
          )}
          <h2 style={{ margin: '0 0 5px 0', color: 'var(--gold)', fontSize: '28px' }}>{centreName}</h2>
          <p style={{ margin: '0 0 5px 0', color: 'var(--text2)', fontSize: '14px' }}>{centreAddress}</p>
          <p style={{ margin: '0 0 15px 0', color: 'var(--text2)', fontWeight: 'bold' }}>BIS Licence: {centreLicence}</p>
          
          <div style={{ padding: '8px', background: 'var(--bg-app)', border: '1px solid var(--border)', borderRadius: '4px', display: 'inline-block', minWidth: '300px' }}>
            <h3 style={{ margin: 0, fontSize: '18px' }}>{job?.serviceName || 'Service'} - Delivery Voucher</h3>
          </div>
        </div>
        <div className="divider"></div>

        {/* Customer Details */}
        <div className="form-grid">
          <div className="form-group">
            <label>Customer Mobile</label>
            <input type="text" value={customerMobile} readOnly />
          </div>
          <div className="form-group">
            <label>Order Date</label>
            <input type="text" value={receiptDate} readOnly />
          </div>
          <div className="form-group">
            <label>GST Number</label>
            <input type="text" value={gstNumber} readOnly />
          </div>
          <div className="form-group full">
            <label>Address</label>
            <textarea value={address} readOnly></textarea>
          </div>
        </div>
        
        <div className="divider" style={{ margin: '20px 0' }}></div>
        
        {/* Service Details */}
        <h3 style={{ fontSize: '1.1rem', marginBottom: '15px' }}>Service Details</h3>
        <div className="tbl-wrap">
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--surface2)' }}>
                <th style={{ padding: '10px' }}>Service</th>
                <th style={{ padding: '10px' }}>Metal</th>
                <th style={{ padding: '10px' }}>Purity</th>
                <th style={{ padding: '10px' }}>Weight (g)</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '10px' }}>{job?.serviceName}</td>
                <td style={{ padding: '10px' }}>{metal}</td>
                <td style={{ padding: '10px' }}>{purity}</td>
                <td style={{ padding: '10px' }}>{weight}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="btn-row" style={{ marginTop: '30px' }}>
          <button className="btn btn-outline" onClick={handlePrint}>
            <i className="ti ti-printer"></i> Print Voucher
          </button>
        </div>
      </div>
    </div>
  );
}
