import React, { useState } from 'react';
import client from '../api/client';

export default function Delivery() {
  const [artId, setArtId] = useState('');
  const [mobile, setMobile] = useState('');
  const [loading, setLoading] = useState(false);
  const [article, setArticle] = useState(null);

  const fetchArticle = async () => {
    if (!artId) return;
    try {
      const res = await client.get('/workflow/articles');
      const found = res.data?.data?.find(a => a.article_code === artId || a.huid === artId);
      if (found) {
        setArticle(found);
      } else {
        alert('Article not found.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const confirmDelivery = async () => {
    if (!article) return alert('No article selected.');
    
    setLoading(true);
    try {
      await client.patch(`/workflow/articles/${article.id}/status`, {
        status: 'Delivered'
      });
      alert(`Article ${article.article_code} marked as Delivered!`);
      setArticle(null);
      setArtId('');
    } catch (err) {
      console.error(err);
      alert('Error updating delivery status.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page active" id="p-delivery">
      <div className="page-title"><i className="ti ti-package-export"></i> Delivery & Return</div>
      
      <div className="card">
        <div className="card-title" style={{ marginBottom: '12px' }}>Process Delivery</div>
        
        <div className="form-grid">
          <div className="form-group">
            <label>Article ID / HUID *</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input type="text" placeholder="Scan or enter" value={artId} onChange={e => setArtId(e.target.value)} />
              <button className="btn btn-outline" onClick={fetchArticle}>Search</button>
            </div>
          </div>
          <div className="form-group">
            <label>Customer Mobile</label>
            <div style={{ display: 'flex' }}>
              <div style={{ padding: '8px 12px', background: '#F8F7F4', border: '1px solid var(--border)', borderRight: 'none', borderRadius: '4px 0 0 4px', color: '#666', display: 'flex', alignItems: 'center', fontSize: '13px' }}>+91</div>
              <input type="tel" value={mobile} onChange={e => {
                const val = e.target.value.replace(/\D/g, '');
                if (val.length <= 10) setMobile(val);
              }} style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }} placeholder="Verify customer" />
            </div>
          </div>
        </div>
        
        {article && (
          <div className={`alert ${article.status === 'Delivered' ? 'alert-info' : 'alert-success'}`} style={{ marginTop: '12px' }}>
            <i className="ti ti-check"></i> 
            <b>{article.article_code}</b> — {article.article_type} · {article.customer_name} · HUID: {article.huid || 'N/A'} · 
            {article.status === 'Delivered' ? ' Already Delivered' : ' Ready for delivery'}
          </div>
        )}
        
        <div className="form-grid" style={{ marginTop: '12px' }}>
          <div className="form-group">
            <label>Delivery Type</label>
            <select><option>Customer Pickup</option><option>Home Delivery</option><option>Courier</option></select>
          </div>
          <div className="form-group"><label>Received By (Customer Signature)</label><input type="text" placeholder="Name of person receiving" /></div>
          <div className="form-group">
            <label>ID Proof Type</label>
            <select><option>Aadhaar</option><option>PAN Card</option><option>Passport</option><option>Driving Licence</option></select>
          </div>
          <div className="form-group"><label>ID Number (last 4)</label><input type="text" maxLength="4" placeholder="XXXX" /></div>
        </div>
        
        <div className="btn-row">
          <button className="btn btn-green" onClick={confirmDelivery} disabled={loading || !article || article.status === 'Delivered'}>
            <i className="ti ti-check"></i> Confirm Delivery
          </button>
          <button className="btn btn-outline" disabled={!article}><i className="ti ti-printer"></i> Print Delivery Note</button>
          <button className="btn btn-outline" disabled={!article}><i className="ti ti-send"></i> SMS Customer</button>
        </div>
      </div>
    </div>
  );
}
