import React, { useState, useEffect } from 'react';
import client from '../api/client';

export default function HuidRegister() {
  const [register, setRegister] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalHuids, setTotalHuids] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const limit = 50;

  const fetchRegister = async () => {
    setLoading(true);
    try {
      const res = await client.get(`/workflow/articles?page=${currentPage}&limit=${limit}&search=${searchQuery}&huid_only=true`);
      setRegister(res.data?.data || []);
      setTotalHuids(res.data?.total || 0);
    } catch (err) {
      console.error('Failed to fetch HUID register:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchRegister();
    }, 300);
    return () => clearTimeout(timer);
  }, [currentPage, searchQuery]);

  return (
    <div className="page active" id="p-huidregister">
      <div className="page-title">
        <i className="ti ti-database"></i> HUID Register
        <button className="btn btn-outline btn-sm" onClick={fetchRegister} style={{marginLeft: 'auto'}}>
          <i className="ti ti-refresh"></i> Refresh
        </button>
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
          placeholder="Search by HUID, Article ID, Customer name..." 
        />
      </div>
      
      <div className="card" style={{ padding: 0 }}>
        <div className="tbl-wrap" style={{ maxHeight: '700px', overflowY: 'auto' }}>
          <table style={{ position: 'relative' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 1, backgroundColor: 'var(--card)', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
              <tr><th>S.No.</th><th>HUID</th><th>Article ID</th><th>Customer</th><th>Type</th><th>Purity</th><th>Weight</th><th>Date</th><th>Certificate</th></tr>
            </thead>
            <tbody>
              {register.map((item, idx) => {
                const sNo = (currentPage - 1) * limit + idx + 1;
                return (
                <tr key={item.id}>
                  <td style={{ color: '#888', fontSize: '13px', textAlign: 'center' }}>{sNo}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--blue)' }}>{item.huid}</td>
                  <td className="text-gold">{item.article_code}</td>
                  <td>{item.customer_name}</td>
                  <td>{item.article_type}</td>
                  <td><span className="badge badge-gold">{item.declared_purity || 'N/A'}</span></td>
                  <td>{item.gross_weight || 'N/A'}g</td>
                  <td className="text-sm">{new Date(item.updated_at).toLocaleDateString('en-IN', {day:'numeric', month:'short', year:'numeric'})}</td>
                  <td><button className="btn btn-outline btn-sm"><i className="ti ti-download"></i> PDF</button></td>
                </tr>
              )})}
              {register.length === 0 && !loading && (
                <tr><td colSpan="9" style={{textAlign: 'center'}}>No HUIDs registered yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination UI */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderTop: '1px solid var(--border)', background: '#fff' }}>
          <div style={{ fontSize: '13px', color: '#666' }}>
            Showing {Math.min((currentPage - 1) * limit + 1, totalHuids)} to {Math.min(currentPage * limit, totalHuids)} of {totalHuids} entries
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              className="btn btn-outline btn-sm" 
              disabled={currentPage === 1}
              onClick={() => {
                setCurrentPage(prev => Math.max(1, prev - 1));
                document.querySelector('#p-huidregister .tbl-wrap')?.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              Previous
            </button>
            <button 
              className="btn btn-outline btn-sm" 
              disabled={currentPage * limit >= totalHuids}
              onClick={() => {
                setCurrentPage(prev => prev + 1);
                document.querySelector('#p-huidregister .tbl-wrap')?.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              Next
            </button>
          </div>
        </div>
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
        <button className="btn btn-outline btn-sm"><i className="ti ti-file-export"></i> Export All</button>
        <button className="btn btn-blue btn-sm"><i className="ti ti-external-link"></i> Verify on BIS Portal</button>
      </div>
    </div>
  );
}
