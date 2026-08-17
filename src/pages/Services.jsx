import React, { useState, useEffect } from 'react';

export default function Services() {
  const [serviceCharges, setServiceCharges] = useState([
    { service: 'Gold Hallmarking', perArticle: '₹45', bulk: '₹38', express: '₹75' },
    { service: 'Silver Hallmarking', perArticle: '₹35', bulk: '₹28', express: '₹60' },
    { service: 'XRF Testing (additional)', perArticle: '₹50', bulk: '₹40', express: '₹80' },
    { service: 'Certificate Copy', perArticle: '₹20', bulk: '₹15', express: '₹30' }
  ]);

  useEffect(() => {
    // fetch('/api/services/charges').then(res => res.json()).then(data => setServiceCharges(data));
  }, []);

  return (
    <div className="page active" id="p-services">
      <div className="page-title"><i className="ti ti-briefcase"></i> Our Services</div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
        <div className="card" style={{ borderLeft: '4px solid var(--gold)' }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>⚜</div>
          <div className="card-title">BIS Hallmarking</div>
          <div className="text-sm" style={{ marginTop: '6px', lineHeight: 1.6 }}>Certified hallmarking for gold, silver and platinum jewellery. All purities. Fast turnaround.</div>
          <div style={{ marginTop: '10px' }}>
            <span className="tag">Gold</span><span className="tag">Silver</span><span className="tag">Platinum</span>
          </div>
        </div>
        
        <div className="card" style={{ borderLeft: '4px solid var(--blue)' }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}><i className="ti ti-atom" style={{ color: 'var(--blue)' }}></i></div>
          <div className="card-title">XRF Testing</div>
          <div className="text-sm" style={{ marginTop: '6px', lineHeight: 1.6 }}>Non-destructive X-ray fluorescence testing for precise metal purity analysis.</div>
          <div style={{ marginTop: '10px' }}>
            <span className="tag">Non-destructive</span><span className="tag">Accurate</span>
          </div>
        </div>
        
        <div className="card" style={{ borderLeft: '4px solid var(--purple)' }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}><i className="ti ti-qrcode" style={{ color: 'var(--purple)' }}></i></div>
          <div className="card-title">HUID Tagging</div>
          <div className="text-sm" style={{ marginTop: '6px', lineHeight: 1.6 }}>Unique HUID number assignment for every jewellery article as per BIS mandate.</div>
          <div style={{ marginTop: '10px' }}>
            <span className="tag">BIS Compliant</span><span className="tag">Digital</span>
          </div>
        </div>
        
        <div className="card" style={{ borderLeft: '4px solid var(--green)' }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}><i className="ti ti-certificate" style={{ color: 'var(--green)' }}></i></div>
          <div className="card-title">Certification</div>
          <div className="text-sm" style={{ marginTop: '6px', lineHeight: 1.6 }}>Official hallmark certificates for consumer and trade compliance requirements.</div>
          <div style={{ marginTop: '10px' }}>
            <span className="tag">Official</span><span className="tag">Printable</span>
          </div>
        </div>
        
        <div className="card" style={{ borderLeft: '4px solid var(--red)' }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}><i className="ti ti-scale" style={{ color: 'var(--red)' }}></i></div>
          <div className="card-title">Precision Weighing</div>
          <div className="text-sm" style={{ marginTop: '6px', lineHeight: 1.6 }}>Calibrated precision balances for gross and net weight measurement.</div>
          <div style={{ marginTop: '10px' }}>
            <span className="tag">0.001g precision</span>
          </div>
        </div>
        
        <div className="card" style={{ borderLeft: '4px solid var(--amber)' }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}><i className="ti ti-device-analytics" style={{ color: 'var(--amber)' }}></i></div>
          <div className="card-title">Batch Processing</div>
          <div className="text-sm" style={{ marginTop: '6px', lineHeight: 1.6 }}>High-volume batch hallmarking for jewellery manufacturers and exporters.</div>
          <div style={{ marginTop: '10px' }}>
            <span className="tag">Bulk</span><span className="tag">Export</span>
          </div>
        </div>
      </div>
      
      <div className="card" style={{ marginTop: '14px' }}>
        <div className="card-title" style={{ marginBottom: '12px' }}>Service Charges</div>
        <table>
          <thead>
            <tr><th>Service</th><th>Per Article</th><th>Bulk (50+)</th><th>Express</th></tr>
          </thead>
          <tbody>
            {serviceCharges.map((charge, idx) => (
              <tr key={idx}>
                <td>{charge.service}</td>
                <td>{charge.perArticle}</td>
                <td>{charge.bulk}</td>
                <td>{charge.express}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
