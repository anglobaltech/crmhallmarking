import React, { useState, useEffect } from 'react';
import { toast } from './Toast';
import client from '../api/client';
import Swal from 'sweetalert2';

export default function ServiceForm({ title, icon, onSubmit, loading, extraFields, endpoint, globalEdit, setGlobalEdit }) {
  const [customerName, setCustomerName] = useState('');
  const [mobile, setMobile] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [address, setAddress] = useState('');
  const [dateOfReceipt, setDateOfReceipt] = useState('');
  
  const [articles, setArticles] = useState([]);
  
  const [articleType, setArticleType] = useState('');
  const [metal, setMetal] = useState('');
  const [purity, setPurity] = useState('');
  const [weight, setWeight] = useState('');
  const [quantity, setQuantity] = useState('');
  const [priority, setPriority] = useState('');
  const [remarks, setRemarks] = useState('');
  const [otherArticleType, setOtherArticleType] = useState('');
  const [weightUnit, setWeightUnit] = useState('g');
  
  const [recentJobs, setRecentJobs] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalJobs, setTotalJobs] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const limit = 50;
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [viewingJob, setViewingJob] = useState(null);
  const [editingJob, setEditingJob] = useState(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (globalEdit?.id && globalEdit?.type === title && recentJobs.length > 0) {
      const target = recentJobs.find(a => a.id === globalEdit.id);
      if (target) {
        setEditingJob({...target});
        if (setGlobalEdit) setGlobalEdit(null);
      }
    }
  }, [globalEdit, recentJobs, title, setGlobalEdit]);

  const handleSaveEdit = async () => {
    if (!endpoint || !editingJob) return;
    try {
      await client.put(`${endpoint}/${editingJob.id}`, editingJob);
      toast('Service job updated successfully', 'success');
      setEditingJob(null);
      fetchJobs();
    } catch (err) {
      console.error(err);
      toast('Failed to update job', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!endpoint) return;
    if (!window.confirm('Are you sure you want to delete this record?')) return;
    try {
      await client.delete(`${endpoint}/${id}`);
      toast('Record deleted', 'success');
      fetchJobs();
    } catch (err) {
      console.error(err);
      toast('Error deleting', 'error');
    }
  };

  const fetchJobs = async () => {
    if (!endpoint) return;
    try {
      const res = await client.get(`${endpoint}?page=${currentPage}&limit=${limit}&search=${searchQuery}`);
      setRecentJobs(res.data?.data || []);
      setTotalJobs(res.data?.total || 0);
    } catch (err) {
      console.error('Error fetching recent jobs:', err);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchJobs();
    }, 300);
    return () => clearTimeout(timer);
  }, [endpoint, currentPage, searchQuery]);

  useEffect(() => {
    const closeDropdown = () => setActiveDropdown(null);
    if (activeDropdown) {
      document.addEventListener('click', closeDropdown);
    }
    return () => document.removeEventListener('click', closeDropdown);
  }, [activeDropdown]);

  const addArticle = (e) => {
    e.preventDefault();
    if (!weight) {
      return toast('Weight is required.', 'error');
    }
    
    setArticles([...articles, {
      articleType: articleType === 'Other' ? (otherArticleType || 'Other') : articleType,
      metal, purity, weight: parseFloat(weight), weight_unit: weightUnit, quantity: parseInt(quantity) || 1, priority, remarks
    }]);

    setArticleType('');
    setMetal('');
    setPurity('');
    setWeight('');
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
    
    const standardTypes = ['Ring', 'Necklace', 'Bangle', 'Earrings', 'Bracelet', 'Pendant', 'Chain', 'Anklet'];
    if (standardTypes.includes(art.articleType)) {
      setArticleType(art.articleType);
      setOtherArticleType('');
    } else {
      setArticleType('Other');
      setOtherArticleType(art.articleType);
    }
    
    setMetal(art.metal);
    setPurity(art.purity);
    setWeight(art.weight.toString());
    setWeightUnit(art.weight_unit || 'g');
    setQuantity(art.quantity.toString());
    setPriority(art.priority);
    setRemarks(art.remarks || '');
    setArticles(articles.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const articlesToSave = [...articles];
    if (weight) {
      articlesToSave.push({ 
        articleType: articleType === 'Other' ? (otherArticleType || 'Other') : articleType, 
        metal, purity, weight: parseFloat(weight), weight_unit: weightUnit, quantity: parseInt(quantity) || 1, priority, remarks 
      });
    }
    
    if (!customerName || articlesToSave.length === 0) {
      toast('Customer Name and at least one article are required.', 'error');
      return;
    }
    
    try {
      await Promise.all(articlesToSave.map(art => {
        const data = {
          jeweller_name: customerName,
          phone: mobile,
          gst_number: gstNumber,
          gstin: gstNumber,
          address,
          job_date: dateOfReceipt,
          test_date: dateOfReceipt,
          weight: parseFloat(art.weight),
          gross_weight: parseFloat(art.weight),
          sample_weight: parseFloat(art.weight),
          pieces: parseInt(art.quantity) || 1,
          material: art.metal,
          metal: art.metal,
          gold_type: art.metal,
          purity: art.purity,
          declared_purity: art.purity,
          article_type: art.articleType || 'Unknown',
          priority: art.priority,
          remarks: art.remarks,
          status: 'Pending',
          ...extraFields
        };
        return onSubmit ? onSubmit(data) : client.post(endpoint, data);
      }));
      
      Swal.fire({
        title: 'Entry Saved!',
        text: `Your ${title} entry was successfully added.`,
        icon: 'success',
        confirmButtonText: 'Great',
        confirmButtonColor: '#0055FF'
      });
      
      setShowForm(false);
      
      if (!onSubmit) {
        fetchJobs();
      } else {
        setTimeout(fetchJobs, 1000);
      }
      
      setCustomerName('');
      setMobile('');
      setGstNumber('');
      setAddress('');
      setDateOfReceipt('');
      setArticles([]);
      setArticleType('');
      setMetal('');
      setPurity('');
      setWeight('');
      setQuantity('');
      setPriority('');
      setRemarks('');
      setOtherArticleType('');
      setWeightUnit('g');
    } catch (err) {
      console.error(err);
      toast('Error saving: ' + (err.response?.data?.error || err.message), 'error');
    }
  };

  return (
    <div>
      {showForm ? (
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px', alignItems: 'center' }}>
          <div className="card-title" style={{ margin: 0 }}>
            <i className={`ti ${icon}`}></i> {title} Intake
          </div>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => setShowForm(false)}>Back to List</button>
        </div>
        
        <form onSubmit={handleSubmit}>

          <div className="form-grid">
            <div className="form-group">
              <label>Customer Name *</label>
              <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Enter customer name" />
            </div>
            <div className="form-group">
              <label>Mobile Number</label>
              <div style={{ display: 'flex' }}>
                <div style={{ padding: '8px 12px', background: '#F8F7F4', border: '1px solid var(--border)', borderRight: 'none', borderRadius: '4px 0 0 4px', color: '#666', display: 'flex', alignItems: 'center', fontSize: '13px' }}>+91</div>
                <input type="tel" value={mobile} onChange={e => {
                  const val = e.target.value.replace(/\D/g, '');
                  if (val.length <= 10) setMobile(val);
                }} style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }} placeholder="10-digit mobile" />
              </div>
            </div>
            <div className="form-group">
              <label>GST Number (Optional)</label>
              <input type="text" value={gstNumber} onChange={e => setGstNumber(e.target.value)} placeholder="e.g. 22AAAAA0000A1Z5" />
            </div>
            <div className="form-group">
              <label>Date of Receipt</label>
              <input type="date" value={dateOfReceipt} onChange={e => setDateOfReceipt(e.target.value)} />
            </div>
            <div className="form-group full">
              <label>Address</label>
              <textarea value={address} onChange={e => setAddress(e.target.value)} placeholder="Customer address..."></textarea>
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
                      <td style={{ padding: '8px' }}>{art.articleType}</td>
                      <td style={{ padding: '8px' }}>{art.metal}</td>
                      <td style={{ padding: '8px' }}>{art.purity}</td>
                      <td style={{ padding: '8px' }}>{art.weight} {art.weight_unit}</td>
                      <td style={{ padding: '8px' }}>{art.quantity}</td>
                      <td style={{ padding: '8px' }}>{art.priority}</td>
                      <td style={{ padding: '8px' }}>
                        <button type="button" className="btn btn-outline" style={{ padding: '4px 8px', fontSize: '12px', marginRight: '4px' }} onClick={() => editArticle(idx)}>Edit</button>
                        <button type="button" className="btn btn-outline" style={{ padding: '4px 8px', fontSize: '12px' }} onClick={() => removeArticle(idx)}>Remove</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="card-title" style={{ marginBottom: '14px', fontSize: '14px' }}>Add Article</div>
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
                <input type="number" step="0.001" value={weight} onChange={e => setWeight(e.target.value)} placeholder="0.000" style={{ flex: 1 }} />
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
          
          <div className="btn-row" style={{ marginTop: '20px' }}>
            <button type="submit" className="btn btn-gold" disabled={loading}>
              <i className="ti ti-check"></i> {loading ? 'Saving...' : 'Save All Articles'}
            </button>
          </div>
        </form>
      </div>
      ) : endpoint ? (
        <div className="card" style={{ padding: 0 }}>
          <div className="card-header" style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div className="card-title" style={{ margin: 0 }}>Recent {title} Entries</div>
              <span className="badge badge-amber">{recentJobs.length}</span>
              <div style={{ display: 'flex', alignItems: 'center', background: '#fff', borderRadius: '4px', padding: '4px 10px', border: '1px solid var(--border)', marginLeft: '20px' }}>
                <i className="ti ti-search" style={{ color: '#888', marginRight: '6px' }}></i>
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Search entries..." 
                  style={{ border: 'none', outline: 'none', fontSize: '13px', width: '200px' }} 
                />
              </div>
            </div>
            <button 
              type="button" 
              className="btn btn-gold" 
              style={{ padding: '10px 24px', fontSize: '15px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(220,165,55,0.3)', borderRadius: '8px' }} 
              onClick={() => setShowForm(true)}
            >
              <i className="ti ti-plus"></i> Add {title} Entry
            </button>
          </div>
          <div className="tbl-wrap" style={{ maxHeight: '700px', overflowY: 'auto' }}>
            <table style={{ position: 'relative' }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 1, backgroundColor: 'var(--card)', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                <tr>
                  <th>S.No.</th>
                  <th>Customer</th>
                  <th>Weight</th>
                  <th>Metal</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th style={{ width: '120px', textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentJobs.map((item, idx) => {
                  const weightField = item.weight !== undefined ? 'weight' : item.gross_weight !== undefined ? 'gross_weight' : item.sample_weight !== undefined ? 'sample_weight' : 'weight';
                  const metalField = item.metal !== undefined ? 'metal' : item.material !== undefined ? 'material' : item.gold_type !== undefined ? 'gold_type' : 'metal';
                  const sNo = (currentPage - 1) * limit + idx + 1;
                  
                  return (
                    <tr key={item.id || idx}>
                      <td style={{ color: '#888', fontSize: '13px', textAlign: 'center' }}>{sNo}</td>
                      <td>{item.jeweller_name}</td>
                      <td>{item[weightField] || 'N/A'}</td>
                      <td>{item[metalField] || 'N/A'}</td>
                      <td>
                        <span className={`badge badge-${item.status === 'Completed' ? 'green' : item.status === 'Rejected' ? 'red' : item.status === 'In Progress' ? 'blue' : 'amber'}`}>
                          {item.status || 'Pending'}
                        </span>
                      </td>
                      <td className="text-sm">{new Date(item.created_at || new Date()).toLocaleDateString('en-IN')}</td>
                      
                      <td style={{ textAlign: 'center', position: 'relative' }}>
                        <button className="btn btn-outline btn-sm" onClick={(e) => {
                          e.stopPropagation();
                          setActiveDropdown(activeDropdown === item.id ? null : item.id);
                        }}>
                          <i className="ti ti-dots-vertical"></i>
                        </button>
                        
                        {activeDropdown === item.id && (
                          <div style={{ 
                            position: 'absolute', 
                            right: '40px', 
                            top: idx >= recentJobs.length - 2 && recentJobs.length > 4 ? 'auto' : '10px', 
                            bottom: idx >= recentJobs.length - 2 && recentJobs.length > 4 ? '10px' : 'auto', 
                            backgroundColor: '#fff', 
                            border: '1px solid var(--border)', 
                            borderRadius: '4px', 
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)', 
                            zIndex: 10, 
                            display: 'flex', 
                            flexDirection: 'column', 
                            minWidth: '100px', 
                            textAlign: 'left' 
                          }}>
                            <div style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid var(--border)', fontSize: '13px' }} onClick={() => { setViewingJob(item); setActiveDropdown(null); }}>
                              <i className="ti ti-eye" style={{ marginRight: '6px' }}></i> View
                            </div>
                            <div style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid var(--border)', fontSize: '13px' }} onClick={() => { setEditingJob({...item}); setActiveDropdown(null); }}>
                              <i className="ti ti-edit" style={{ marginRight: '6px' }}></i> Edit
                            </div>
                            <div style={{ padding: '8px 12px', cursor: 'pointer', color: 'var(--red)', fontSize: '13px' }} onClick={() => { handleDelete(item.id); setActiveDropdown(null); }}>
                              <i className="ti ti-trash" style={{ marginRight: '6px' }}></i> Delete
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {recentJobs.length === 0 && (
                  <tr><td colSpan="7" style={{textAlign: 'center'}}>No recent entries.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {/* Pagination UI */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderTop: '1px solid var(--border)', background: '#fff' }}>
            <div style={{ fontSize: '13px', color: '#666' }}>
              Showing {Math.min((currentPage - 1) * limit + 1, totalJobs)} to {Math.min(currentPage * limit, totalJobs)} of {totalJobs} entries
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                className="btn btn-outline btn-sm" 
                disabled={currentPage === 1}
                onClick={(e) => {
                  setCurrentPage(prev => Math.max(1, prev - 1));
                  e.target.closest('.card').querySelector('.tbl-wrap')?.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                Previous
              </button>
              <button 
                className="btn btn-outline btn-sm" 
                disabled={currentPage * limit >= totalJobs}
                onClick={(e) => {
                  setCurrentPage(prev => prev + 1);
                  e.target.closest('.card').querySelector('.tbl-wrap')?.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {viewingJob && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="card" style={{ maxWidth: '600px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="card-title">Job Details</div>
              <button className="btn btn-outline btn-sm" onClick={() => setViewingJob(null)}><i className="ti ti-x"></i></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
              <div><strong>Customer Name:</strong> {viewingJob.jeweller_name || 'N/A'}</div>
              <div><strong>Mobile:</strong> {viewingJob.phone || 'N/A'}</div>
              <div><strong>GST/License:</strong> {viewingJob.gst_number || viewingJob.gstin || 'N/A'}</div>
              <div><strong>Address:</strong> {viewingJob.address || 'N/A'}</div>
              <div className="divider"></div>
              <div><strong>Article Type:</strong> {viewingJob.article_type || 'N/A'}</div>
              <div><strong>Metal:</strong> {viewingJob.metal || viewingJob.material || viewingJob.gold_type || 'N/A'}</div>
              <div><strong>Declared Purity:</strong> {viewingJob.purity || viewingJob.declared_purity || 'N/A'}</div>
              <div><strong>Weight:</strong> {viewingJob.weight || viewingJob.gross_weight || viewingJob.sample_weight || 'N/A'}</div>
              <div><strong>Quantity (Pieces):</strong> {viewingJob.pieces || viewingJob.quantity || 'N/A'}</div>
              <div><strong>Priority:</strong> {viewingJob.priority || 'N/A'}</div>
              <div><strong>Remarks:</strong> {viewingJob.remarks || 'N/A'}</div>
              <div><strong>Date:</strong> {new Date(viewingJob.created_at || new Date()).toLocaleString('en-IN')}</div>
              <div><strong>Status:</strong> {viewingJob.status || 'Pending'}</div>
            </div>
          </div>
        </div>
      )}

      {editingJob && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="card" style={{ maxWidth: '600px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="card-title">Edit Job Details</div>
              <button className="btn btn-outline btn-sm" onClick={() => setEditingJob(null)}><i className="ti ti-x"></i></button>
            </div>
            
            <div className="form-grid" style={{ marginTop: '16px' }}>
              <div className="form-group full">
                <label>Customer Name</label>
                <input type="text" value={editingJob.jeweller_name || ''} onChange={e => setEditingJob({...editingJob, jeweller_name: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Mobile Number</label>
                <div style={{ display: 'flex' }}>
                  <div style={{ padding: '8px 12px', background: '#F8F7F4', border: '1px solid var(--border)', borderRight: 'none', borderRadius: '4px 0 0 4px', color: '#666', display: 'flex', alignItems: 'center', fontSize: '13px' }}>+91</div>
                  <input type="tel" value={editingJob.phone || ''} onChange={e => {
                    const val = e.target.value.replace(/\D/g, '');
                    if (val.length <= 10) setEditingJob({...editingJob, phone: val});
                  }} style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }} placeholder="10-digit mobile" />
                </div>
              </div>
              <div className="form-group">
                <label>GST Number</label>
                <input type="text" value={editingJob.gst_number || editingJob.gstin || ''} onChange={e => setEditingJob({...editingJob, gst_number: e.target.value, gstin: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Date of Receipt</label>
                <input type="date" value={editingJob.job_date || editingJob.test_date ? new Date(editingJob.job_date || editingJob.test_date).toISOString().split('T')[0] : ''} onChange={e => setEditingJob({...editingJob, job_date: e.target.value, test_date: e.target.value})} />
              </div>
              <div className="form-group full">
                <label>Address</label>
                <textarea value={editingJob.address || ''} onChange={e => setEditingJob({...editingJob, address: e.target.value})} />
              </div>
              
              <div className="form-group">
                <label>Article Type</label>
                <input type="text" value={editingJob.article_type || ''} onChange={e => setEditingJob({...editingJob, article_type: e.target.value})} />
              </div>
              
              <div className="form-group">
                <label>Metal</label>
                <select value={editingJob.metal || editingJob.material || editingJob.gold_type || ''} onChange={e => {
                  const m = e.target.value;
                  setEditingJob({...editingJob, metal: m, material: m, gold_type: m});
                }}>
                  <option>Gold</option>
                  <option>Silver</option>
                  <option>Platinum</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>Declared Purity</label>
                <input type="text" value={editingJob.purity || editingJob.declared_purity || ''} onChange={e => setEditingJob({...editingJob, purity: e.target.value, declared_purity: e.target.value})} />
              </div>
              
              <div className="form-group">
                <label>Weight (g)</label>
                <input type="number" step="0.001" value={editingJob.weight || editingJob.gross_weight || editingJob.sample_weight || ''} onChange={e => {
                  const w = parseFloat(e.target.value);
                  setEditingJob({...editingJob, weight: w, gross_weight: w, sample_weight: w});
                }} />
              </div>
              
              <div className="form-group">
                <label>Quantity</label>
                <input type="number" value={editingJob.pieces || editingJob.quantity || ''} onChange={e => setEditingJob({...editingJob, pieces: parseInt(e.target.value), quantity: parseInt(e.target.value)})} />
              </div>

              <div className="form-group">
                <label>Priority</label>
                <select value={editingJob.priority || ''} onChange={e => setEditingJob({...editingJob, priority: e.target.value})}>
                  <option value="">Select Priority</option>
                  <option>Normal</option>
                  <option>Urgent</option>
                  <option>Express</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>Status</label>
                <select value={editingJob.status || 'Pending'} onChange={e => setEditingJob({...editingJob, status: e.target.value})}>
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
              
              <div className="form-group full">
                <label>Remarks</label>
                <textarea value={editingJob.remarks || ''} onChange={e => setEditingJob({...editingJob, remarks: e.target.value})} />
              </div>
            </div>
            
            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button className="btn btn-outline" onClick={() => setEditingJob(null)}>Cancel</button>
              <button className="btn btn-gold" onClick={handleSaveEdit}>Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
