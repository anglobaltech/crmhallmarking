import React, { useState, useEffect } from 'react';
import client from '../api/client';
import { toast } from '../components/Toast';

export default function Articles({ setPage, globalEdit, setGlobalEdit }) {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalArticles, setTotalArticles] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const limit = 50;
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [viewingJob, setViewingJob] = useState(null);
  const [editingJob, setEditingJob] = useState(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  useEffect(() => {
    if (globalEdit?.id && globalEdit?.type === 'Article Intake' && articles.length > 0) {
      const target = articles.find(a => a.id === globalEdit.id);
      if (target) {
        setEditingJob({...target});
        if (setGlobalEdit) setGlobalEdit(null);
      }
    }
  }, [globalEdit, articles, setGlobalEdit]);

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const res = await client.get(`/workflow/articles?page=${currentPage}&limit=${limit}&search=${searchQuery}`);
      setArticles(res.data?.data || []);
      setTotalArticles(res.data?.total || 0);
    } catch (err) {
      console.error('Failed to fetch articles:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchArticles();
    }, 300);
    return () => clearTimeout(timer);
  }, [currentPage, searchQuery]);

  useEffect(() => {
    const closeDropdown = () => setActiveDropdown(null);
    if (activeDropdown) {
      document.addEventListener('click', closeDropdown);
    }
    return () => document.removeEventListener('click', closeDropdown);
  }, [activeDropdown]);

  const handleSaveEdit = async () => {
    if (!editingJob) return;
    setIsSavingEdit(true);
    try {
      await client.put(`/workflow/articles/${editingJob.id}`, editingJob);
      toast('Article updated successfully', 'success');
      setEditingJob(null);
      fetchArticles();
    } catch (err) {
      console.error('Failed to update article', err);
      toast('Error updating', 'error');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this article?')) return;
    try {
      await client.delete(`/workflow/articles/${id}`);
      toast('Article deleted', 'success');
      fetchArticles();
    } catch (err) {
      console.error('Failed to delete', err);
      toast('Error deleting', 'error');
    }
  };

  const getStatusClass = (status) => {
    switch(status) {
      case 'Intake': return 'badge-amber';
      case 'Weight Checked': return 'badge-amber';
      case 'In XRF': return 'badge-blue';
      case 'HUID Wait': return 'badge-amber';
      case 'Pending': return 'badge-amber';
      case 'In Progress': return 'badge-blue';
      case 'Completed': return 'badge-green';
      case 'Delivered': return 'badge-green';
      case 'Rejected': return 'badge-red';
      default: return 'badge-outline';
    }
  };

  return (
    <div className="page active" id="p-articles">
      <div className="page-title">
        <i className="ti ti-list-details"></i> Article Register
      </div>
      
      <div className="search-box">
        <i className="ti ti-search"></i>
        <input 
          type="text" 
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
          placeholder="Search by Article ID, Customer, HUID, Batch..." 
        />
      </div>
      
      <div className="card" style={{ padding: 0 }}>
        <div className="tbl-wrap" style={{ maxHeight: '700px', overflowY: 'auto' }}>
          <table style={{ position: 'relative' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 1, backgroundColor: 'var(--card)', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
              <tr>
                <th>S.No.</th><th>Customer</th><th>Type</th><th>Metal</th><th>Purity</th><th>Weight(g)</th><th>Status</th><th>Date</th><th style={{ width: '120px', textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {articles.map((article, index) => {
                const sNo = (currentPage - 1) * limit + index + 1;
                return (
                  <tr key={article.id}>
                    <td className="text-gold" style={{ textAlign: 'center' }}>{sNo}</td>
                    <td>{article.customer_name}</td>
                    <td>{article.article_type}</td>
                    <td>{article.metal}</td>
                    <td>{article.declared_purity || 'N/A'}</td>
                    <td>{article.gross_weight || 'N/A'}</td>
                    <td><span className={`badge ${getStatusClass(article.status)}`}>{article.status}</span></td>
                    <td className="text-sm">{new Date(article.created_at).toLocaleDateString('en-IN', {day:'numeric', month:'short'})}</td>
                    
                    <td style={{ textAlign: 'center', position: 'relative' }}>
                      <button className="btn btn-outline btn-sm" onClick={(e) => {
                        e.stopPropagation();
                        setActiveDropdown(activeDropdown === article.id ? null : article.id);
                      }}>
                        <i className="ti ti-dots-vertical"></i>
                      </button>
                      
                      {activeDropdown === article.id && (
                        <div style={{ position: 'absolute', right: '40px', top: '10px', backgroundColor: '#fff', border: '1px solid var(--border)', borderRadius: '4px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 10, display: 'flex', flexDirection: 'column', minWidth: '100px', textAlign: 'left' }}>
                          <div style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid var(--border)', fontSize: '13px' }} onClick={() => { setViewingJob(article); setActiveDropdown(null); }}>
                            <i className="ti ti-eye" style={{ marginRight: '6px' }}></i> View
                          </div>
                          <div style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid var(--border)', fontSize: '13px' }} onClick={() => { setEditingJob({...article}); setActiveDropdown(null); }}>
                            <i className="ti ti-edit" style={{ marginRight: '6px' }}></i> Edit
                          </div>
                          <div style={{ padding: '8px 12px', cursor: 'pointer', color: 'var(--red)', fontSize: '13px' }} onClick={() => { handleDelete(article.id); setActiveDropdown(null); }}>
                            <i className="ti ti-trash" style={{ marginRight: '6px' }}></i> Delete
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {articles.length === 0 && !loading && (
                <tr><td colSpan="9" style={{textAlign: 'center'}}>No articles found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination UI */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderTop: '1px solid var(--border)', background: '#fff' }}>
          <div style={{ fontSize: '13px', color: '#666' }}>
            Showing {Math.min((currentPage - 1) * limit + 1, totalArticles)} to {Math.min(currentPage * limit, totalArticles)} of {totalArticles} entries
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              className="btn btn-outline btn-sm" 
              disabled={currentPage === 1}
              onClick={() => {
                setCurrentPage(prev => Math.max(1, prev - 1));
                document.querySelector('#p-articles .tbl-wrap')?.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              Previous
            </button>
            <button 
              className="btn btn-outline btn-sm" 
              disabled={currentPage * limit >= totalArticles}
              onClick={() => {
                setCurrentPage(prev => prev + 1);
                document.querySelector('#p-articles .tbl-wrap')?.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {viewingJob && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="card" style={{ maxWidth: '600px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="card-title">Article Details</div>
              <button className="btn btn-outline btn-sm" onClick={() => setViewingJob(null)}><i className="ti ti-x"></i></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
              <div><strong>S.No.:</strong> {articles.findIndex(a => a.id === viewingJob.id) + 1}</div>
              <div><strong>Customer Name:</strong> {viewingJob.customer_name || 'N/A'}</div>
              <div><strong>Mobile:</strong> {viewingJob.phone || 'N/A'}</div>
              <div><strong>GST/License:</strong> {viewingJob.gst_number || viewingJob.gstin || 'N/A'}</div>
              <div><strong>Address:</strong> {viewingJob.address || 'N/A'}</div>
              <div className="divider"></div>
              <div><strong>Article Type:</strong> {viewingJob.article_type || 'N/A'}</div>
              <div><strong>Metal:</strong> {viewingJob.metal || viewingJob.material || 'N/A'}</div>
              <div><strong>Declared Purity:</strong> {viewingJob.declared_purity || 'N/A'}</div>
              <div><strong>Weight:</strong> {viewingJob.weight || viewingJob.gross_weight || 'N/A'}</div>
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
              <div className="card-title">Edit Article Details</div>
              <button className="btn btn-outline btn-sm" onClick={() => setEditingJob(null)}><i className="ti ti-x"></i></button>
            </div>
            <div className="form-grid" style={{ marginTop: '16px' }}>
              <div className="form-group full">
                <label>Customer Name</label>
                <input type="text" value={editingJob.customer_name || ''} onChange={e => setEditingJob({...editingJob, customer_name: e.target.value})} />
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
                <label>GST Number / License</label>
                <input type="text" value={editingJob.gst_number || editingJob.bis_license || editingJob.gstin || ''} onChange={e => setEditingJob({...editingJob, gst_number: e.target.value, bis_license: e.target.value, gstin: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Date of Receipt</label>
                <input type="date" value={editingJob.receipt_date || editingJob.job_date || editingJob.test_date || editingJob.created_at ? new Date(editingJob.receipt_date || editingJob.job_date || editingJob.test_date || editingJob.created_at).toISOString().split('T')[0] : ''} onChange={e => setEditingJob({...editingJob, receipt_date: e.target.value})} />
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
                <select value={editingJob.metal || ''} onChange={e => setEditingJob({...editingJob, metal: e.target.value})}>
                  <option>Gold</option>
                  <option>Silver</option>
                  <option>Platinum</option>
                </select>
              </div>
              <div className="form-group">
                <label>Declared Purity</label>
                <input type="text" value={editingJob.declared_purity || ''} onChange={e => setEditingJob({...editingJob, declared_purity: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Gross Weight (g)</label>
                <input type="number" step="0.001" value={editingJob.gross_weight || ''} onChange={e => setEditingJob({...editingJob, gross_weight: parseFloat(e.target.value)})} />
              </div>
              <div className="form-group">
                <label>Quantity</label>
                <input type="number" value={editingJob.quantity || ''} onChange={e => setEditingJob({...editingJob, quantity: parseInt(e.target.value)})} />
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
                  <option value="Intake">Intake</option>
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
              <button className="btn btn-gold" onClick={handleSaveEdit} disabled={isSavingEdit}>
                {isSavingEdit ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
