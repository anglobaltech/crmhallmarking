import React, { useState, useEffect } from 'react';
import client from '../api/client';

export default function HuidEntry() {
  const [artId, setArtId] = useState('');
  const [huidNum, setHuidNum] = useState('');
  const [loading, setLoading] = useState(false);

  const [pendingHuid, setPendingHuid] = useState([]);

  const fetchPending = async () => {
    try {
      const res = await client.get('/workflow/articles');
      const pending = res.data?.data?.filter(a => a.status === 'HUID Wait' || !a.huid) || [];
      setPendingHuid(pending);
    } catch (err) {
      console.error('Failed to fetch pending HUID articles:', err);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const fillHUID = (id) => {
    setArtId(id);
  };

  const saveHUID = async () => {
    if (!artId || !huidNum) {
      return alert('Please enter Article ID and HUID number.');
    }
    
    const article = pendingHuid.find(a => a.article_code === artId);
    if (!article) return alert('Article not found in pending list. Ensure correct Article ID.');

    setLoading(true);
    try {
      await client.patch(`/workflow/articles/${article.id}/status`, {
        status: 'Delivered', // After HUID it is ready for delivery/billing
        huid: huidNum
      });
      alert(`HUID ${huidNum} assigned to ${artId} successfully!`);
      setArtId('');
      setHuidNum('');
      fetchPending();
    } catch (err) {
      console.error(err);
      alert('Error assigning HUID: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page active" id="p-huidentry">
      <div className="page-title"><i className="ti ti-barcode"></i> HUID Entry & Tagging</div>
      
      <div className="alert alert-info">
        <i className="ti ti-info-circle"></i> 
        <b>{pendingHuid.length} articles</b> are awaiting HUID assignment. Enter HUID numbers from the BIS Manak Portal below.
      </div>
      
      <div className="two-col">
        <div className="card">
          <div className="card-title" style={{ marginBottom: '12px' }}>Assign HUID</div>
          
          <div className="form-grid">
            <div className="form-group">
              <label>Article ID *</label>
              <input type="text" placeholder="ART-2024-XXX" value={artId} onChange={e => setArtId(e.target.value)} />
            </div>
            <div className="form-group">
              <label>HUID Number *</label>
              <input type="text" placeholder="e.g. HX7892345" value={huidNum} onChange={e => setHuidNum(e.target.value.toUpperCase())} style={{ fontFamily: 'monospace', letterSpacing: '1px' }} />
            </div>
            <div className="form-group"><label>Hallmark Year</label><input type="text" placeholder="e.g. A (2024)" /></div>
            <div className="form-group"><label>Assay Office</label><input type="text" placeholder="BHC Code" /></div>
            <div className="form-group">
              <label>Certified Purity</label>
              <select><option>916 (22K)</option><option>750 (18K)</option><option>585 (14K)</option><option>375 (9K)</option><option>999 (24K)</option></select>
            </div>
            <div className="form-group"><label>Marking Date</label><input type="date" /></div>
          </div>
          
          <div className="divider"></div>
          
          <div className="card-title" style={{ marginBottom: '10px', fontSize: '12px', color: 'var(--text3)' }}>SCAN HUID BARCODE</div>
          <div className="img-zone" style={{ padding: '16px' }}>
            <i className="ti ti-scan"></i>
            <p>Click to scan HUID barcode / QR</p>
          </div>
          
          <div className="btn-row">
            <button className="btn btn-gold" onClick={saveHUID} disabled={loading}>
              <i className="ti ti-check"></i> {loading ? 'Assigning...' : 'Assign HUID'}
            </button>
            <button className="btn btn-outline"><i className="ti ti-printer"></i> Print Certificate</button>
          </div>
        </div>
        
        <div className="card">
          <div className="card-header">
            <div className="card-title">Pending HUID</div>
            <span className="badge badge-amber">{pendingHuid.length}</span>
          </div>
          <div className="tbl-wrap">
            <table>
              <thead>
                <tr><th>Article</th><th>Customer</th><th>Purity</th><th>Weight</th><th></th></tr>
              </thead>
              <tbody>
                {pendingHuid.map(item => (
                  <tr key={item.id}>
                    <td className="text-gold">{item.article_code}</td>
                    <td>{item.customer_name}</td>
                    <td>{item.declared_purity || 'N/A'}</td>
                    <td>{item.gross_weight || 'N/A'}</td>
                    <td><button className="btn btn-gold btn-sm" onClick={() => fillHUID(item.article_code)}>Select</button></td>
                  </tr>
                ))}
                {pendingHuid.length === 0 && (
                  <tr><td colSpan="5" style={{textAlign: 'center'}}>No pending HUIDs.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
