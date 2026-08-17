import React, { useState } from 'react';
import client from '../api/client';

export default function ImageAuto() {
  const [articleId, setArticleId] = useState('');
  const [loading, setLoading] = useState(false);

  const captureImage = async () => {
    if (!articleId) return alert('Please enter Article ID to link image');
    
    setLoading(true);
    try {
      // In a real app we'd upload the image file to S3, but for now we just update status
      const res = await client.get('/workflow/articles');
      const article = res.data?.data?.find(a => a.article_code === articleId);
      
      if (!article) return alert('Article not found.');

      await client.patch(`/workflow/articles/${article.id}/status`, {
        status: 'Image Captured',
      });
      alert('Image captured and linked successfully!');
      setArticleId('');
    } catch (err) {
      console.error(err);
      alert('Error linking image: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page active" id="p-imageauto">
      <div className="page-title"><i className="ti ti-camera"></i> Image Automation</div>
      
      <div className="two-col">
        <div className="card">
          <div className="card-title" style={{ marginBottom: '12px' }}>Camera Capture</div>
          <div style={{ background: 'var(--navy)', borderRadius: 'var(--radius)', aspectRatio: '4/3', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '10px', marginBottom: '12px' }}>
            <i className="ti ti-camera" style={{ fontSize: '40px', color: '#567' }}></i>
            <p style={{ color: '#567', fontSize: '13px' }}>Camera feed — connect device</p>
          </div>
          
          <div className="divider"></div>
          
          <div className="form-group">
            <label>Link to Article</label>
            <input type="text" placeholder="ART-2024-XXX" value={articleId} onChange={e => setArticleId(e.target.value)} />
          </div>
          <div className="form-group" style={{ marginTop: '10px' }}>
            <label>View Type</label>
            <select><option>Front View</option><option>Side View</option><option>Top View</option><option>Hallmark Close-up</option><option>Overall</option></select>
          </div>

          <div className="btn-row" style={{ marginTop: '14px' }}>
            <button className="btn btn-gold" onClick={captureImage} disabled={loading}>
              <i className="ti ti-camera"></i> {loading ? 'Capturing...' : 'Capture & Link'}
            </button>
            <button className="btn btn-outline"><i className="ti ti-upload"></i> Upload</button>
          </div>
        </div>
        
        <div className="card">
          <div className="card-header">
            <div className="card-title">Captured Images</div>
            <button className="btn btn-outline btn-sm"><i className="ti ti-filter"></i> Filter</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div style={{ background: '#F0EFE8', borderRadius: '8px', aspectRatio: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
              <i className="ti ti-ring" style={{ fontSize: '24px', color: 'var(--gold)' }}></i>
              <div style={{ fontSize: '10px', color: 'var(--text3)' }}>ART-248 · Front</div>
            </div>
            <div style={{ background: '#F0EFE8', borderRadius: '8px', aspectRatio: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
              <i className="ti ti-necklace" style={{ fontSize: '24px', color: 'var(--gold)' }}></i>
              <div style={{ fontSize: '10px', color: 'var(--text3)' }}>ART-248 · Side</div>
            </div>
          </div>
          
          <div className="divider"></div>
          
          <div className="alert alert-info"><i className="ti ti-info-circle"></i> Auto-naming enabled: images saved as ArticleID_ViewType_Date.jpg</div>
          <div className="form-group">
            <label>Camera Source</label>
            <select><option>USB Camera (Article View)</option><option>Barcode Scanner Cam</option><option>Mobile Upload QR</option></select>
          </div>
        </div>
      </div>
    </div>
  );
}
