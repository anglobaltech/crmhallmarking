import React, { useState } from 'react';
import client from '../api/client';
import { toast } from '../components/Toast';

export default function Intake({ setPage }) {
  const [hmcName, setHmcName] = useState('');
  const [licenseNo, setLicenseNo] = useState('');
  const [custMobile, setCustMobile] = useState('');
  const [loading, setLoading] = useState(false);

  const [articles, setArticles] = useState([]);

  const [articleType, setArticleType] = useState('');
  const [metal, setMetal] = useState('');
  const [purity, setPurity] = useState('');
  const [declaredWt, setDeclaredWt] = useState('');
  const [quantity, setQuantity] = useState('');
  const [priority, setPriority] = useState('');
  const [remarks, setRemarks] = useState('');
  const [dateOfReceipt, setDateOfReceipt] = useState('');
  const [otherArticleType, setOtherArticleType] = useState('');
  const [weightUnit, setWeightUnit] = useState('g');

  const addArticle = () => {
    if (!declaredWt) {
      return toast('Weight declared by customer is required.', 'error');
    }
    
    setArticles([...articles, {
      type: articleType === 'Other' ? (otherArticleType || 'Other') : articleType,
      metal: metal,
      purity: purity,
      gross_weight: parseFloat(declaredWt),
      weight_unit: weightUnit,
      quantity: parseInt(quantity),
      priority: priority,
      remarks: remarks
    }]);

    setArticleType('');
    setMetal('');
    setPurity('');
    setDeclaredWt('');
    setQuantity('');
    setPriority('');
    setRemarks('');
    setOtherArticleType('');
    setWeightUnit('g');
  };

  const removeArticle = (index) => {
    setArticles(articles.filter((_, i) => i !== index));
  };

  const editArticle = (index) => {
    const art = articles[index];
    
    // Check if type is in standard list, if not it's "Other"
    const standardTypes = ['Ring', 'Necklace', 'Bangle', 'Earrings', 'Bracelet', 'Pendant', 'Chain', 'Anklet'];
    if (standardTypes.includes(art.type)) {
      setArticleType(art.type);
      setOtherArticleType('');
    } else {
      setArticleType('Other');
      setOtherArticleType(art.type);
    }
    
    setMetal(art.metal);
    setPurity(art.purity);
    setDeclaredWt(art.gross_weight.toString());
    setWeightUnit(art.weight_unit || 'g');
    setQuantity(art.quantity);
    setPriority(art.priority);
    setRemarks(art.remarks || '');
    setArticles(articles.filter((_, i) => i !== index));
  };

  const saveOrder = async (isReceipt = false) => {
    const articlesToSave = [...articles];
    
    if (declaredWt) {
      articlesToSave.push({
        type: articleType === 'Other' ? (otherArticleType || 'Other') : articleType,
        metal: metal,
        purity: purity,
        gross_weight: parseFloat(declaredWt),
        weight_unit: weightUnit,
        quantity: parseInt(quantity),
        priority: priority,
        remarks: remarks
      });
    }

    if (!hmcName || articlesToSave.length === 0) {
      return toast('HallMarking Centre Name and at least one article are required.', 'error');
    }

    setLoading(true);
    try {
      const payload = {
        customer_name: hmcName,
        customer_id: licenseNo,
        customer_mobile: custMobile,
        articles: articlesToSave
      };
      const res = await client.post('/workflow/orders', payload);
      
      if (isReceipt) {
         toast(`Receipt generated! Order ID: ${res.data.order.order_code}`, 'success');
      } else {
         toast(`Order saved! Order ID: ${res.data.order.order_code}`, 'success');
      }
      
      setHmcName('');
      setLicenseNo('');
      setCustMobile('');
      setDateOfReceipt('');
      setArticles([]);
      setArticleType('');
      setMetal('');
      setPurity('');
      setDeclaredWt('');
      setQuantity('');
      setPriority('');
      setRemarks('');
      setOtherArticleType('');
      setWeightUnit('g');
    } catch (err) {
      console.error(err);
      toast('Error saving order: ' + (err.response?.data?.error || err.message), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page active" id="p-intake">
      <div className="page-title"><i className="ti ti-circle-plus"></i> Article Intake</div>
      <div className="card">

        <div className="card-title" style={{ marginBottom: '14px' }}>Jeweller Shop Details</div>
        <div className="form-grid">
          <div className="form-group">
            <label>Jeweller Shop Name *</label>
            <input type="text" placeholder="Enter shop name" value={hmcName} onChange={e => setHmcName(e.target.value)} />
          </div>
          <div className="form-group">
            <label>License Number of shop</label>
            <input type="text" placeholder="e.g. LIC-1234" value={licenseNo} onChange={e => setLicenseNo(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Mobile Number</label>
            <div style={{ display: 'flex' }}>
              <div style={{ padding: '8px 12px', background: '#F8F7F4', border: '1px solid var(--border)', borderRight: 'none', borderRadius: '4px 0 0 4px', color: '#666', display: 'flex', alignItems: 'center', fontSize: '13px' }}>+91</div>
              <input type="tel" value={custMobile} onChange={e => {
                const val = e.target.value.replace(/\D/g, '');
                if (val.length <= 10) setCustMobile(val);
              }} style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }} placeholder="10-digit mobile" />
            </div>
          </div>
          <div className="form-group">
            <label>Date of Receipt</label>
            <input type="date" value={dateOfReceipt} onChange={e => setDateOfReceipt(e.target.value)} />
          </div>
        </div>
        
        <div className="divider"></div>

        {articles.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <div className="card-title" style={{ fontSize: '14px', marginBottom: '10px' }}>Added Articles</div>
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', marginBottom: '10px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '8px' }}>Type</th>
                  <th style={{ padding: '8px' }}>Metal</th>
                  <th style={{ padding: '8px' }}>Purity</th>
                  <th style={{ padding: '8px' }}>Weight</th>
                  <th style={{ padding: '8px' }}>Qty</th>
                  <th style={{ padding: '8px' }}>Priority</th>
                  <th style={{ padding: '8px' }}></th>
                </tr>
              </thead>
              <tbody>
                {articles.map((art, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '8px' }}>{art.type}</td>
                    <td style={{ padding: '8px' }}>{art.metal}</td>
                    <td style={{ padding: '8px' }}>{art.purity}</td>
                    <td style={{ padding: '8px' }}>{art.gross_weight} {art.weight_unit}</td>
                    <td style={{ padding: '8px' }}>{art.quantity}</td>
                    <td style={{ padding: '8px' }}>{art.priority}</td>
                    <td style={{ padding: '8px' }}>
                      <button className="btn btn-outline" style={{ padding: '4px 8px', fontSize: '12px', marginRight: '4px' }} onClick={() => editArticle(idx)}>
                        Edit
                      </button>
                      <button className="btn btn-outline" style={{ padding: '4px 8px', fontSize: '12px' }} onClick={() => removeArticle(idx)}>
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="card-title" style={{ marginBottom: '14px' }}>Add Article</div>
        
        <div className="form-grid three">
          <div className="form-group">
            <label>Article Type *</label>
            <select value={articleType} onChange={e => setArticleType(e.target.value)}>
              <option value="">Select Type</option>
              <option>Ring</option><option>Necklace</option>
              <option>Bangle</option><option>Earrings</option><option>Bracelet</option>
              <option>Pendant</option><option>Chain</option><option>Anklet</option><option>Other</option>
            </select>
          </div>
          {articleType === 'Other' && (
            <div className="form-group">
              <label>Article Name *</label>
              <input type="text" placeholder="Enter article name" value={otherArticleType} onChange={e => setOtherArticleType(e.target.value)} />
            </div>
          )}
          <div className="form-group">
            <label>Metal *</label>
            <select value={metal} onChange={e => setMetal(e.target.value)}>
              <option value="">Select Metal</option>
              <option>Gold</option>
              <option>Silver</option>
            </select>
          </div>
          <div className="form-group">
            <label>Declared Purity</label>
            <select value={purity} onChange={e => setPurity(e.target.value)}>
              <option value="">Select Purity</option>
              {metal === 'Silver' ? (
                <>
                  <option>999 (Fine Silver)</option>
                  <option>958 (Britannia Silver)</option>
                  <option>925 (Sterling Silver)</option>
                  <option>900 (Coin Silver)</option>
                  <option>800 (800 Silver)</option>
                </>
              ) : (
                <>
                  <option>999 (24K)</option>
                  <option>916 (22K)</option>
                  <option>833 (20K)</option>
                  <option>750 (18K)</option>
                  <option>666 (16K)</option>
                  <option>585 (14K)</option>
                  <option>417 (10K)</option>
                  <option>375 (9K)</option>
                </>
              )}
            </select>
          </div>
          <div className="form-group">
            <label>Weight Declared by customer *</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input type="number" placeholder="0.000" step="0.001" value={declaredWt} onChange={e => setDeclaredWt(e.target.value)} style={{ flex: 1 }} />
              <select value={weightUnit} onChange={e => setWeightUnit(e.target.value)} style={{ width: '80px' }}>
                <option value="mg">mg</option>
                <option value="g">g</option>
                <option value="kg">kg</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Quantity</label>
            <input type="number" value={quantity} min="1" onChange={e => setQuantity(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Priority</label>
            <select value={priority} onChange={e => setPriority(e.target.value)}>
              <option value="">Select Priority</option>
              <option>Normal</option>
              <option>Urgent</option>
              <option>Express</option>
            </select>
          </div>
          <div className="form-group full">
            <label>Special Instructions / Remarks</label>
            <textarea value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="Stone settings, fragile items, notes..."></textarea>
          </div>
        </div>

        <div style={{ marginTop: '10px', marginBottom: '20px' }}>
          <button className="btn btn-outline" onClick={addArticle}>
            <i className="ti ti-plus"></i> Add another article
          </button>
        </div>
        
        <div className="divider"></div>
        
        <div className="btn-row">
          <button className="btn btn-gold" onClick={() => saveOrder(false)} disabled={loading}>
            <i className="ti ti-check"></i> {loading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
