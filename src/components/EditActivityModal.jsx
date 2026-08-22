import React, { useState, useEffect } from 'react';
import client from '../api/client';
import toast from 'react-hot-toast';

export default function EditActivityModal({ activity, onClose, onSave }) {
  const [job, setJob] = useState(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let endpoint = '';
    switch (activity.type) {
      case 'Article Intake': endpoint = `/workflow/articles/${activity.id}`; break;
      case 'Laser Cutting': endpoint = `/services/laser/${activity.id}`; break;
      case 'XRF Test': endpoint = `/services/xrf/${activity.id}`; break;
      case 'Soldering': endpoint = `/services/soldering/${activity.id}`; break;
      case 'Fire Assay': endpoint = `/services/fire/${activity.id}`; break;
      case 'Gold Exchange': endpoint = `/services/exchange/${activity.id}`; break;
      default: break;
    }

    if (endpoint) {
      client.get(endpoint)
        .then(res => {
          setJob(res.data);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          toast('Failed to load details', 'error');
          onClose();
        });
    }
  }, [activity]);

  const handleSave = async () => {
    let endpoint = '';
    switch (activity.type) {
      case 'Article Intake': endpoint = `/workflow/articles/${activity.id}`; break;
      case 'Laser Cutting': endpoint = `/services/laser/${activity.id}`; break;
      case 'XRF Test': endpoint = `/services/xrf/${activity.id}`; break;
      case 'Soldering': endpoint = `/services/soldering/${activity.id}`; break;
      case 'Fire Assay': endpoint = `/services/fire/${activity.id}`; break;
      case 'Gold Exchange': endpoint = `/services/exchange/${activity.id}`; break;
      default: break;
    }

    setIsSavingEdit(true);
    try {
      await client.put(endpoint, job);
      toast('Updated successfully', 'success');
      onSave();
    } catch (err) {
      console.error(err);
      toast('Failed to update', 'error');
    } finally {
      setIsSavingEdit(false);
    }
  };

  if (loading || !job) {
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
        <div className="card" style={{ padding: '40px' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
      <div className="card" style={{ maxWidth: '600px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="card-title">Edit {activity.type}</div>
          <button className="btn btn-outline btn-sm" onClick={onClose}><i className="ti ti-x"></i></button>
        </div>
        
        <div className="form-grid" style={{ marginTop: '16px' }}>
          
          <div className="form-group full">
            <label>Customer Name</label>
            <input type="text" value={job.customer_name || job.jeweller_name || ''} onChange={e => setJob({...job, customer_name: e.target.value, jeweller_name: e.target.value})} />
          </div>

          <div className="form-group">
            <label>Mobile Number</label>
            <div style={{ display: 'flex' }}>
              <div style={{ padding: '8px 12px', background: '#F8F7F4', border: '1px solid var(--border)', borderRight: 'none', borderRadius: '4px 0 0 4px', color: '#666', display: 'flex', alignItems: 'center', fontSize: '13px' }}>+91</div>
              <input type="tel" value={job.phone || ''} onChange={e => {
                const val = e.target.value.replace(/\D/g, '');
                if (val.length <= 10) setJob({...job, phone: val});
              }} style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }} placeholder="10-digit mobile" />
            </div>
          </div>

          <div className="form-group">
            <label>Article Type</label>
            <input type="text" value={job.article_type || job.exchange_type || ''} onChange={e => setJob({...job, article_type: e.target.value, exchange_type: e.target.value})} />
          </div>

          {job.metal !== undefined || job.material !== undefined ? (
            <div className="form-group">
              <label>Metal / Material</label>
              <select value={job.metal || job.material || ''} onChange={e => setJob({...job, metal: e.target.value, material: e.target.value})}>
                <option value="Gold">Gold</option>
                <option value="Silver">Silver</option>
                <option value="Platinum">Platinum</option>
              </select>
            </div>
          ) : null}

          {job.pieces !== undefined || job.quantity !== undefined ? (
            <div className="form-group">
              <label>Quantity / Pieces</label>
              <input type="number" value={job.pieces || job.quantity || ''} onChange={e => setJob({...job, pieces: parseInt(e.target.value), quantity: parseInt(e.target.value)})} />
            </div>
          ) : null}

          {job.gross_weight !== undefined || job.weight !== undefined || job.net_weight !== undefined ? (
            <div className="form-group">
              <label>Weight (g)</label>
              <input type="number" step="0.001" value={job.gross_weight || job.weight || job.net_weight || ''} onChange={e => setJob({...job, gross_weight: parseFloat(e.target.value), weight: parseFloat(e.target.value), net_weight: parseFloat(e.target.value)})} />
            </div>
          ) : null}
          
          <div className="form-group">
            <label>Status</label>
            <select value={job.status || job.result || 'Pending'} onChange={e => setJob({...job, status: e.target.value, result: e.target.value})}>
              <option value="Intake">Intake</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Delivered">Delivered</option>
              <option value="Pass">Pass</option>
              <option value="Fail">Fail</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          <div className="form-group full">
            <label>Remarks / Notes</label>
            <textarea value={job.remarks || job.notes || job.description || ''} onChange={e => setJob({...job, remarks: e.target.value, notes: e.target.value, description: e.target.value})} />
          </div>

        </div>

        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={isSavingEdit}>
            {isSavingEdit ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
