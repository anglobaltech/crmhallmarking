import React, { useState, useRef, useEffect } from 'react';
import client from '../api/client';

export default function WeightCheck() {
  const [weight, setWeight] = useState('000.000');
  const [status, setStatus] = useState('● Stable — Ready to capture');
  const [statusColor, setStatusColor] = useState('#7BC');
  const [articleId, setArticleId] = useState('');
  
  const [weightLogs, setWeightLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const timerRef = useRef(null);

  const fetchLogs = async () => {
    try {
      const res = await client.get('/workflow/articles');
      // Filter for articles that have been weighed (gross_weight is not null)
      const weighed = res.data?.data?.filter(a => a.gross_weight) || [];
      setWeightLogs(weighed);
    } catch (err) {
      console.error('Failed to fetch weight logs:', err);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const simulateWeight = () => {
    const vals = ['028.384', '028.397', '028.401', '028.399', '028.400'];
    let i = 0;
    setStatus('○ Stabilising...');
    setStatusColor('#EF9F27');
    
    timerRef.current = setInterval(() => {
      setWeight(vals[i % vals.length]);
      i++;
      if (i >= vals.length) {
        clearInterval(timerRef.current);
        setWeight('028.400');
        setStatus('● Stable — Ready to capture');
        setStatusColor('#7BC');
      }
    }, 300);
  };

  const tare = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setWeight('000.000');
    setStatus('● Tared — Place article');
    setStatusColor('#7BC');
    setTimeout(simulateWeight, 800);
  };

  const captureWeight = () => {
    alert(`Weight captured: ${weight}g for ${articleId || 'current item'}`);
  };

  const saveWeight = async () => {
    if (!articleId) return alert('Please enter Article ID');
    
    // Find the article to get its primary key ID
    const article = weightLogs.find(a => a.article_code === articleId);
    if (!article) return alert('Article not found in recent logs. Ensure correct Article ID.');

    setLoading(true);
    try {
      await client.patch(`/workflow/articles/${article.id}/status`, {
        status: 'Weight Checked',
        gross_weight: parseFloat(weight)
      });
      alert('Weight saved to article record successfully.');
      setArticleId('');
      fetchLogs();
    } catch (err) {
      console.error(err);
      alert('Error saving weight: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page active" id="p-weightcheck">
      <div className="page-title"><i className="ti ti-scale"></i> Weight Automation</div>
      
      <div className="two-col">
        <div>
          <div className="weight-display">
            <div className="w-val" id="weightVal">{weight}</div>
            <div className="w-unit">grams</div>
            <div className="w-status" id="weightStatus" style={{ color: statusColor }}>{status}</div>
          </div>
          
          <div className="card">
            <div className="card-title" style={{ marginBottom: '12px' }}>Scale Controls</div>
            <div className="btn-row" style={{ marginTop: 0 }}>
              <button className="btn btn-outline" onClick={tare}><i className="ti ti-refresh"></i> Tare / Zero</button>
              <button className="btn btn-gold" onClick={captureWeight}><i className="ti ti-check"></i> Capture Weight</button>
            </div>
            
            <div className="divider"></div>
            
            <div className="form-grid">
              <div className="form-group">
                <label>Article ID</label>
                <input 
                  type="text" 
                  placeholder="ART-2024-XXX" 
                  value={articleId} 
                  onChange={e => setArticleId(e.target.value)} 
                />
              </div>
              <div className="form-group">
                <label>Weighing Type</label>
                <select><option>Gross Weight</option><option>Net Weight</option><option>Stone Weight</option></select>
              </div>
            </div>
            
            <div className="btn-row">
              <button className="btn btn-green" onClick={saveWeight} disabled={loading}>
                <i className="ti ti-device-floppy"></i> {loading ? 'Saving...' : 'Save to Article'}
              </button>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="card-header"><div className="card-title">Weight Log Today</div></div>
          <div className="tbl-wrap">
            <table>
              <thead>
                <tr><th>Time</th><th>Article</th><th>Gross</th><th>Net</th></tr>
              </thead>
              <tbody>
                {weightLogs.slice(0, 10).map(log => (
                  <tr key={log.id}>
                    <td className="text-sm">{new Date(log.updated_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                    <td className="text-gold">{log.article_code}</td>
                    <td>{log.gross_weight}g</td>
                    <td>{log.net_weight ? log.net_weight + 'g' : '-'}</td>
                  </tr>
                ))}
                {weightLogs.length === 0 && (
                  <tr><td colSpan="4" style={{textAlign: 'center'}}>No weight logs yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          
          <div className="divider"></div>
          
          <div className="form-group">
            <label>Scale Device</label>
            <select><option>Mettler Toledo ME204 (COM3)</option><option>Ohaus Pioneer (COM4)</option></select>
          </div>
          <div className="form-group" style={{ marginTop: '10px' }}>
            <label>Auto-capture on stable</label>
            <select><option>Enabled (2s stable)</option><option>Manual only</option></select>
          </div>
        </div>
      </div>
    </div>
  );
}
