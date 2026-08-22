import React, { useState, useEffect } from 'react';
import client from '../api/client';
import { toast } from '../components/Toast';
import ServiceDeliveryVoucher from './ServiceDeliveryVoucher';

export default function Dashboard({ setPage, globalEdit, setGlobalEdit }) {
  const navigateTo = (page) => {
    console.log(`Navigate to ${page}`);
  };

  const [stats, setStats] = useState({
    intake_today: 0,
    xrf_today: 0,
    laser_today: 0,
    soldering_today: 0,
    fire_today: 0,
    exchange_today: 0,
    huid_completed: 0,
    huid_rejected: 0,
    xrf_completed: 0,
    laser_completed: 0,
    soldering_completed: 0,
    fire_completed: 0,
    exchange_completed: 0,
  });

  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const [recentActivities, setRecentActivities] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [editingRowId, setEditingRowId] = useState(null);
  const [viewingJob, setViewingJob] = useState(null);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalActivities, setTotalActivities] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const limit = 50;
  
  useEffect(() => {
    const closeDropdown = () => setActiveDropdown(null);
    if (activeDropdown) {
      document.addEventListener('click', closeDropdown);
    }
    return () => document.removeEventListener('click', closeDropdown);
  }, [activeDropdown]);

  const handleDelete = async (activity) => {
    if (!window.confirm('Are you sure you want to delete this activity record?')) return;
    try {
      await client.delete(`/dashboard/activity/${activity.type}/${activity.id}`);
      fetchDashboard();
      toast.success('Record deleted successfully');
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete record');
    }
  };
  
  const [purityData, setPurityData] = useState([]);
  const [quickStats, setQuickStats] = useState({ avgTurnaround: '24 Mins', activeJobs: '0 Items', revenue: '₹ 0', goldReceived: '0 g', silverReceived: '0 g' });

  const fetchDashboard = async () => {
    try {
      const [res, dailyRes] = await Promise.all([
        client.get(`/dashboard/stats?from=${fromDate}&to=${toDate}`),
        client.get(`/dashboard/daily-report?from=${fromDate}&to=${toDate}`)
      ]);
      const data = res.data;
      const dailyStats = dailyRes.data.stats;
      
      if (data.master_command) {
        setStats({
          intake_today: parseInt(data.master_command.intake_today || 0),
          xrf_today: parseInt(data.master_command.xrf_today || 0),
          laser_today: parseInt(data.master_command.laser_today || 0),
          soldering_today: parseInt(data.master_command.soldering_today || 0),
          fire_today: parseInt(data.master_command.fire_today || 0),
          exchange_today: parseInt(data.master_command.exchange_today || 0),
          
          huid_completed: parseInt(data.master_command.huid_completed || 0),
          huid_rejected: parseInt(data.master_command.huid_rejected || 0),
          xrf_completed: parseInt(data.master_command.xrf_completed || 0),
          laser_completed: parseInt(data.master_command.laser_completed || 0),
          soldering_completed: parseInt(data.master_command.soldering_completed || 0),
          fire_completed: parseInt(data.master_command.fire_completed || 0),
          exchange_completed: parseInt(data.master_command.exchange_completed || 0),
        });
      }

      if (dailyRes.data && dailyRes.data.purity) {
        const rawPurity = dailyRes.data.purity;
        const totalPurityCount = rawPurity.reduce((sum, item) => sum + parseInt(item.count || 0), 0);
        const colors = ['#FCD34D', '#A78BFA', '#FCA5A5', '#6EE7B7', '#93C5FD', '#FBCFE8', '#D8B4FE'];
        const formattedPurity = rawPurity.map((item, idx) => ({
          label: item.label,
          percent: totalPurityCount > 0 ? Math.round((parseInt(item.count) / totalPurityCount) * 100) : 0,
          color: colors[idx % colors.length]
        }));
        setPurityData(formattedPurity);
      }

      if (data) {
        let activeCount = 0;
        if (data.workflow) {
          activeCount += parseInt(data.workflow.intake || 0) + parseInt(data.workflow.weighing || 0) + parseInt(data.workflow.imaging || 0) + parseInt(data.workflow.xrf || 0) + parseInt(data.workflow.huid || 0);
        }
        if (data.laser) activeCount += parseInt(data.laser.pending || 0);
        if (data.soldering) activeCount += parseInt(data.soldering.pending || 0) + parseInt(data.soldering.active || 0);
        
        setQuickStats({
          avgTurnaround: `${dailyStats?.avg_turnaround || 24} Mins`,
          activeJobs: `${activeCount} Items`,
          revenue: `₹ ${Number(dailyStats?.revenue || 0).toLocaleString('en-IN')}`,
          goldReceived: `${Number(dailyStats?.gold_received || 0).toFixed(2)} g`,
          silverReceived: `${Number(dailyStats?.silver_received || 0).toFixed(2)} g`,
          articlesReceived: `${dailyStats?.articles_received || 0} Items`
        });
      }
    } catch (err) {
      console.error('Failed to fetch dashboard stats', err);
    }
  };

  const fetchActivities = async () => {
    try {
      const actRes = await client.get(`/dashboard/activity?from=${fromDate}&to=${toDate}&page=${currentPage}&limit=${limit}&search=${searchQuery}`);
      if (actRes.data) {
        setRecentActivities(actRes.data.data || []);
        setTotalActivities(actRes.data.total || 0);
      }
    } catch (err) {
      console.error('Failed to fetch activities', err);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [fromDate, toDate]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchActivities();
    }, 300);
    return () => clearTimeout(timer);
  }, [fromDate, toDate, currentPage, searchQuery]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchDashboard(), fetchActivities()]);
      toast('Dashboard data refreshed successfully', 'success');
    } catch (err) {
      console.error(err);
      toast('Failed to refresh dashboard', 'error');
    } finally {
      setRefreshing(false);
    }
  };

  const handleStatusChange = async (activity, newStatus) => {
    try {
      // Optimistically update UI
      setRecentActivities(prev => prev.map(a => 
        (a.id === activity.id && a.type === activity.type) ? { ...a, status: newStatus } : a
      ));
      
      await client.patch(`/dashboard/activity/${activity.type}/${activity.id}`, {
        status: newStatus
      });
      toast(`Updated ${activity.type} status to ${newStatus}`, 'success');
    } catch (err) {
      console.error('Failed to update status', err);
      toast('Error updating status', 'error');
      fetchDashboard(); // revert on failure
    }
  };

  // Status mapping for dropdowns based on service type
  const getStatusOptions = (type) => {
    if (type === 'XRF Test' || type === 'Fire Assay') {
      return ['Pass', 'Fail', 'Pending'];
    }
    return ['Pending', 'In Progress', 'Completed', 'Rejected'];
  };

  const handleViewJob = async (activity) => {
    try {
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
      
      if (!endpoint) {
        setViewingJob(activity);
        return;
      }
      
      const res = await client.get(endpoint);
      const fullJob = { ...activity, ...res.data };
      setViewingJob(fullJob);
    } catch (err) {
      console.error('Failed to load full job details', err);
      // Fallback to basic activity data
      setViewingJob(activity);
    }
  };

  const getStatusBadge = (status) => {
    if (['Pass', 'Completed', 'Delivered'].includes(status)) return 'badge-green';
    if (['Fail'].includes(status)) return 'badge-red';
    if (['In Progress'].includes(status)) return 'badge-blue';
    return 'badge-amber';
  };

  const handleOpenVoucher = async (activity) => {
    try {
      let endpoint = '';
      switch (activity.type) {
        case 'Laser Cutting': endpoint = `/services/laser/${activity.id}`; break;
        case 'XRF Test': endpoint = `/services/xrf/${activity.id}`; break;
        case 'Soldering': endpoint = `/services/soldering/${activity.id}`; break;
        case 'Fire Assay': endpoint = `/services/fire/${activity.id}`; break;
        case 'Gold Exchange': endpoint = `/services/exchange/${activity.id}`; break;
        default:
          toast('Voucher not available for this activity type yet.', 'info');
          return;
      }
      const res = await client.get(endpoint);
      const fullJob = { ...res.data, serviceName: activity.type };
      // XRF test returns weight in different field sometimes, normalize it if needed, but ServiceDeliveryVoucher handles it.
      if (activity.type === 'XRF Test' && !fullJob.jeweller_name) {
         fullJob.jeweller_name = 'Walk-in Customer';
      }
      setSelectedJob(fullJob);
    } catch (err) {
      console.error('Failed to load voucher', err);
      toast('Failed to load voucher details', 'error');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
    });
  };

  if (selectedJob) {
    return (
      <ServiceDeliveryVoucher 
        job={selectedJob} 
        onBack={() => setSelectedJob(null)} 
      />
    );
  }

  const totalPages = Math.ceil(totalActivities / limit);

  return (
    <div className="page active" id="p-dashboard">
      <div className="page-title" style={{ display: 'flex', alignItems: 'center' }}>
        <div><i className="ti ti-layout-dashboard"></i> Master Command Center</div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '12px', alignItems: 'center', fontWeight: 'normal' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--card)', padding: '4px 8px', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
            <span style={{ fontSize: '12px', color: '#9AB', fontWeight: 600 }}>From</span>
            <input type="date" className="form-control" style={{ padding: '2px 6px', fontSize: '13px', border: 'none', background: 'transparent', outline: 'none' }} value={fromDate} onChange={e => setFromDate(e.target.value)} />
            <span style={{ fontSize: '12px', color: '#9AB', fontWeight: 600 }}>To</span>
            <input type="date" className="form-control" style={{ padding: '2px 6px', fontSize: '13px', border: 'none', background: 'transparent', outline: 'none' }} value={toDate} onChange={e => setToDate(e.target.value)} />
          </div>
          <button className="btn btn-primary btn-sm" onClick={handleRefresh} disabled={refreshing}>
            <i className={`ti ti-refresh ${refreshing ? 'rotating' : ''}`}></i> {refreshing ? 'Refreshing...' : 'Refresh Data'}
          </button>
        </div>
      </div>
      
      <div className="stats-row" style={{ gridTemplateColumns: 'repeat(6, 1fr)' }}>
        <div className="stat-tile blue"><div className="lbl">Article Intake</div><div className="val">{stats.intake_today}</div></div>
        <div className="stat-tile blue"><div className="lbl">XRF</div><div className="val">{stats.xrf_today}</div></div>
        <div className="stat-tile blue"><div className="lbl">Laser Cutting</div><div className="val">{stats.laser_today}</div></div>
        <div className="stat-tile blue"><div className="lbl">Soldering</div><div className="val">{stats.soldering_today}</div></div>
        <div className="stat-tile blue"><div className="lbl">Fire Assays</div><div className="val">{stats.fire_today}</div></div>
        <div className="stat-tile blue"><div className="lbl">Gold Exchange</div><div className="val">{stats.exchange_today}</div></div>
      </div>
      
      <div className="stats-row" style={{ gridTemplateColumns: 'repeat(7, 1fr)', marginTop: '16px' }}>
        <div className="stat-tile green"><div className="lbl">HUID Completed</div><div className="val">{stats.huid_completed}</div></div>
        <div className="stat-tile red"><div className="lbl">HUID Rejected</div><div className="val">{stats.huid_rejected}</div></div>
        <div className="stat-tile green"><div className="lbl">XRF Completed</div><div className="val">{stats.xrf_completed}</div></div>
        <div className="stat-tile green"><div className="lbl">Laser Completed</div><div className="val">{stats.laser_completed}</div></div>
        <div className="stat-tile green"><div className="lbl">Soldering Completed</div><div className="val">{stats.soldering_completed}</div></div>
        <div className="stat-tile green"><div className="lbl">Fire Assays Completed</div><div className="val">{stats.fire_completed}</div></div>
        <div className="stat-tile green"><div className="lbl">Gold Exchange Completed</div><div className="val">{stats.exchange_completed}</div></div>
      </div>

      <div className="two-col" style={{ gridTemplateColumns: '2fr 1fr' }}>
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="card-title"><i className="ti ti-activity" style={{marginRight: '8px', color: 'var(--blue)'}}></i> Live Services Activity Feed</div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', background: '#fff', borderRadius: '4px', padding: '4px 10px', border: '1px solid var(--border)' }}>
                <i className="ti ti-search" style={{ color: '#888', marginRight: '6px' }}></i>
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search feed..." style={{ border: 'none', outline: 'none', fontSize: '13px', width: '180px' }} />
              </div>
            </div>
          </div>
          <div className="tbl-wrap" style={{ maxHeight: '450px', overflowY: 'auto' }}>
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: '#F8F7F4', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                <tr>
                  <th style={{ padding: '12px', borderBottom: '1px solid var(--border)', width: '60px' }}>S.No.</th>
                  <th style={{ padding: '12px', borderBottom: '1px solid var(--border)' }}>Service</th>
                  <th style={{ padding: '12px', borderBottom: '1px solid var(--border)' }}>Customer</th>
                  <th style={{ padding: '12px', borderBottom: '1px solid var(--border)' }}>Details</th>
                  <th style={{ padding: '12px', borderBottom: '1px solid var(--border)' }}>Time</th>
                  <th style={{ padding: '12px', borderBottom: '1px solid var(--border)' }}>Status</th>
                  <th style={{ width: '120px', textAlign: 'center', padding: '12px', borderBottom: '1px solid var(--border)' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentActivities.map((activity, idx) => {
                  const rowId = `${activity.type}-${activity.id}`;
                  const isEditing = editingRowId === rowId;
                  const sNo = (currentPage - 1) * limit + idx + 1;
                  
                  return (
                  <tr key={`${activity.type}-${activity.id}-${idx}`}>
                    <td style={{ color: '#888', fontSize: '13px' }}>{sNo}</td>
                    <td style={{ fontWeight: 600 }}>{activity.type}</td>
                    <td>{activity.jeweller_name}</td>
                    <td style={{ fontSize: '13px', color: '#555' }}>{activity.detail}</td>
                    <td style={{ fontSize: '12px', color: '#888' }}>{formatDate(activity.created_at)}</td>
                    <td>
                      {isEditing ? (
                        <select 
                          value={activity.status || 'Pending'}
                          onChange={(e) => handleStatusChange(activity, e.target.value)}
                          style={{ 
                            padding: '4px 8px', 
                            borderRadius: '4px', 
                            border: '1px solid var(--border)',
                            backgroundColor: '#fff',
                            fontSize: '12px',
                            fontWeight: 500,
                            cursor: 'pointer',
                            outline: 'none'
                          }}
                        >
                          {getStatusOptions(activity.type).map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : (
                        <span className={`badge ${getStatusBadge(activity.status)}`}>{activity.status || 'Pending'}</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center', position: 'relative' }}>
                      {isEditing ? (
                        <button className="btn btn-outline btn-sm" onClick={() => setEditingRowId(null)}>Done</button>
                      ) : (
                        <>
                          <button className="btn btn-outline btn-sm" onClick={(e) => {
                            e.stopPropagation();
                            setActiveDropdown(activeDropdown === rowId ? null : rowId);
                          }}>
                            <i className="ti ti-dots-vertical"></i>
                          </button>
                          
                          {activeDropdown === rowId && (
                            <div style={{ 
                              position: 'absolute', 
                              right: '40px', 
                              top: idx >= recentActivities.length - 2 && recentActivities.length > 3 ? 'auto' : '10px',
                              bottom: idx >= recentActivities.length - 2 && recentActivities.length > 3 ? '10px' : 'auto',
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
                              <div style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid var(--border)', fontSize: '13px' }} onClick={() => { handleViewJob(activity); setActiveDropdown(null); }}>
                                <i className="ti ti-eye" style={{ marginRight: '6px' }}></i> View
                              </div>
                              <div style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid var(--border)', fontSize: '13px' }} onClick={() => { 
                                setActiveDropdown(null);
                                if (setGlobalEdit && setPage) {
                                  const routeMap = {
                                    'Article Intake': 'articles',
                                    'Laser Cutting': 'lasercutting',
                                    'XRF Test': 'xrf',
                                    'Soldering': 'soldering',
                                    'Fire Assay': 'fireassay',
                                    'Gold Exchange': 'goldexchange'
                                  };
                                  setGlobalEdit({ type: activity.type, id: activity.id });
                                  setPage(routeMap[activity.type] || 'dashboard');
                                } else {
                                  setEditingRowId(rowId);
                                }
                              }}>
                                <i className="ti ti-edit" style={{ marginRight: '6px' }}></i> Edit
                              </div>
                              <div style={{ padding: '8px 12px', cursor: 'pointer', color: 'var(--red)', fontSize: '13px' }} onClick={() => { handleDelete(activity); setActiveDropdown(null); }}>
                                <i className="ti ti-trash" style={{ marginRight: '6px' }}></i> Delete
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                  );
                })}
                {recentActivities.length === 0 && (
                  <tr><td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>No recent activity found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {/* Pagination UI */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderTop: '1px solid var(--border)', background: '#fff' }}>
            <div style={{ fontSize: '13px', color: '#666' }}>
              Showing {Math.min((currentPage - 1) * limit + 1, totalActivities)} to {Math.min(currentPage * limit, totalActivities)} of {totalActivities} entries
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                className="btn btn-outline btn-sm" 
                disabled={currentPage === 1}
                onClick={() => {
                  setCurrentPage(prev => Math.max(1, prev - 1));
                  document.querySelector('#p-dashboard .tbl-wrap')?.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                Previous
              </button>
              <button 
                className="btn btn-outline btn-sm" 
                disabled={currentPage * limit >= totalActivities}
                onClick={() => {
                  setCurrentPage(prev => prev + 1);
                  document.querySelector('#p-dashboard .tbl-wrap')?.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                Next
              </button>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="card-header"><div className="card-title">Daily Summary</div></div>
          <div className="section-title" style={{ marginTop: '0px' }}>Purity Breakdown</div>
          {purityData.map((item, idx) => (
            <div className="bar-row" key={idx}>
              <div className="bar-label">{item.label}</div>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: `${item.percent}%`, background: item.color }}></div>
              </div>
              <div className="bar-val">{item.percent}%</div>
            </div>
          ))}
          
          <div style={{ marginTop: '30px', padding: '16px', background: '#F8F9FA', borderRadius: '8px', borderLeft: '4px solid var(--blue)' }}>
            <h4 style={{ margin: '0 0 8px 0', color: 'var(--text1)' }}>Quick Stats</h4>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
              <span style={{ color: '#666' }}>Avg. Turnaround:</span>
              <span style={{ fontWeight: 600 }}>{quickStats.avgTurnaround}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
              <span style={{ color: '#666' }}>Active Jobs:</span>
              <span style={{ fontWeight: 600 }}>{quickStats.activeJobs}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
              <span style={{ color: '#666' }}>Articles Received:</span>
              <span style={{ fontWeight: 600 }}>{quickStats.articlesReceived || '0 Items'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
              <span style={{ color: '#666' }}>Gold Processed:</span>
              <span style={{ fontWeight: 600, color: 'var(--gold)' }}>{quickStats.goldReceived}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
              <span style={{ color: '#666' }}>Silver Processed:</span>
              <span style={{ fontWeight: 600, color: '#A0AAB3' }}>{quickStats.silverReceived}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
              <span style={{ color: '#666' }}>Est. Revenue:</span>
              <span style={{ fontWeight: 600, color: 'var(--green)' }}>{quickStats.revenue}</span>
            </div>
          </div>
        </div>
      </div>

      {viewingJob && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="card" style={{ maxWidth: '600px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="card-title">Activity Details</div>
              <button className="btn btn-outline btn-sm" onClick={() => setViewingJob(null)}><i className="ti ti-x"></i></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
              <div><strong>Service:</strong> {viewingJob.type || 'N/A'}</div>
              <div><strong>Customer Name:</strong> {viewingJob.jeweller_name || 'N/A'}</div>
              <div><strong>Mobile:</strong> {viewingJob.phone || 'N/A'}</div>
              <div><strong>GST/License:</strong> {viewingJob.gst_number || viewingJob.bis_license || viewingJob.gstin || 'N/A'}</div>
              <div><strong>Address:</strong> {viewingJob.address || 'N/A'}</div>
              <div className="divider"></div>
              <div><strong>Article Type:</strong> {viewingJob.article_type || 'N/A'}</div>
              <div><strong>Metal:</strong> {viewingJob.metal || viewingJob.material || 'N/A'}</div>
              <div><strong>Declared Purity:</strong> {viewingJob.purity || viewingJob.declared_purity || 'N/A'}</div>
              <div><strong>Weight:</strong> {viewingJob.weight || viewingJob.gross_weight || viewingJob.sample_weight || 'N/A'}</div>
              <div><strong>Quantity (Pieces):</strong> {viewingJob.pieces || viewingJob.quantity || 'N/A'}</div>
              <div><strong>Priority:</strong> {viewingJob.priority || 'N/A'}</div>
              <div><strong>Remarks:</strong> {viewingJob.remarks || 'N/A'}</div>
              <div className="divider"></div>
              <div><strong>Date:</strong> {new Date(viewingJob.created_at || new Date()).toLocaleString('en-IN')}</div>
              <div><strong>Status:</strong> {viewingJob.status || 'Pending'}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
