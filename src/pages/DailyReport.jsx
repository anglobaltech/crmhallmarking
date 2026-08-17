import React, { useState, useEffect } from 'react';
import client from '../api/client';
import html2pdf from 'html2pdf.js';
import { toast } from '../components/Toast';

export default function DailyReport() {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const [stats, setStats] = useState({
    articlesReceived: 0,
    huidTagged: 0,
    goldReceived: '0',
    revenue: '₹0'
  });

  const [weeklyGold, setWeeklyGold] = useState([]);
  const [weeklySilver, setWeeklySilver] = useState([]);
  const [purityDist, setPurityDist] = useState([]);
  const [loading, setLoading] = useState(false);

  const [activities, setActivities] = useState([]);
  const [masterCommand, setMasterCommand] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalActivities, setTotalActivities] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const limit = 50;

  const fetchReports = async () => {
    setLoading(true);
    try {
      const params = { from: fromDate, to: toDate };
      const [dailyRes, statsRes] = await Promise.all([
        client.get('/dashboard/daily-report', { params }),
        client.get('/dashboard/stats', { params })
      ]);
      const data = dailyRes.data;
      
      setStats(data.stats);
      if (data.weekly) {
        const rawWeekly = data.weekly;
        const maxGold = Math.max(...rawWeekly.map(item => Number(item.gold_weight) || 0)) || 1;
        const maxSilver = Math.max(...rawWeekly.map(item => Number(item.silver_weight) || 0)) || 1;
        
        setWeeklyGold(rawWeekly.map(item => ({
          day: item.day,
          weight: Number(item.gold_weight) || 0,
          percent: ((Number(item.gold_weight) || 0) / maxGold) * 100
        })));
        
        setWeeklySilver(rawWeekly.map(item => ({
          day: item.day,
          weight: Number(item.silver_weight) || 0,
          percent: ((Number(item.silver_weight) || 0) / maxSilver) * 100
        })));
      } else {
        setWeeklyGold([]);
        setWeeklySilver([]);
      }
      if (data.purity) {
        const rawPurity = data.purity;
        const totalPurityCount = rawPurity.reduce((sum, item) => sum + parseInt(item.count || 0), 0);
        const colors = ['#FCD34D', '#A78BFA', '#FCA5A5', '#6EE7B7', '#93C5FD', '#FBCFE8', '#D8B4FE'];
        const formattedPurity = rawPurity.map((item, idx) => ({
          label: item.label,
          percent: totalPurityCount > 0 ? Math.round((parseInt(item.count) / totalPurityCount) * 100) : 0,
          color: colors[idx % colors.length]
        }));
        setPurityDist(formattedPurity);
      } else {
        setPurityDist([]);
      }
      if (statsRes.data && statsRes.data.master_command) {
        setMasterCommand(statsRes.data.master_command);
      }

    } catch (err) {
      console.error('Failed to fetch report data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchActivities = async () => {
    try {
      const res = await client.get(`/dashboard/activity?from=${fromDate}&to=${toDate}&page=${currentPage}&limit=${limit}&search=${searchQuery}`);
      if (res.data) {
        setActivities(res.data.data || []);
        setTotalActivities(res.data.total || 0);
      }
    } catch (err) {
      console.error('Failed to fetch activities', err);
    }
  };

  useEffect(() => {
    fetchReports();
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
      await Promise.all([fetchReports(), fetchActivities()]);
      toast('Daily Report refreshed successfully', 'success');
    } catch (err) {
      console.error(err);
      toast('Failed to refresh report', 'error');
    } finally {
      setRefreshing(false);
    }
  };

  const handlePrint = () => {
    const element = document.getElementById('report-content');
    const opt = {
      margin: 0.5,
      filename: `Report_Management_${fromDate}_to_${toDate}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
  };

  const handleExportExcel = () => {
    const headers = ['Metric', 'Value'];
    const rows = [
        ['Articles Received', stats.articlesReceived],
        ['HUID Tagged', stats.huidTagged],
        ['Gold Received (g)', stats.goldReceived],
        ['Net Weight Today (g)', stats.netWeightToday || 0],
        ['Revenue', stats.revenue ? stats.revenue.replace('₹', '') : 0],
        ['Jeweller Profiles (Yesterday)', stats.jewellersYesterday || 0],
        ['Laser Cut Completed', stats.laserCompleted || 0],
        ['XRF Assaying', stats.xrfAssaying || 0],
        ['Soldering/Repairs', stats.solderingToday || 0]
    ];
    const csvContent = "data:text/csv;charset=utf-8," 
        + headers.join(",") + "\n"
        + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `daily_report_${fromDate}_to_${toDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="page active" id="p-dailyreport">
      <div className="page-title">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <i className="ti ti-file-analytics"></i> Report Management
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--card)', padding: '4px 8px', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
            <span style={{ fontSize: '12px', color: '#9AB' }}>From</span>
            <input type="date" className="form-control" style={{ padding: '2px 6px', fontSize: '13px' }} value={fromDate} onChange={e => setFromDate(e.target.value)} />
            <span style={{ fontSize: '12px', color: '#9AB' }}>To</span>
            <input type="date" className="form-control" style={{ padding: '2px 6px', fontSize: '13px' }} value={toDate} onChange={e => setToDate(e.target.value)} />
          </div>
          <button className="btn btn-outline btn-sm" onClick={handleExportExcel}>
            Excel
          </button>
          <button className="btn btn-outline btn-sm" onClick={handlePrint}>
            PDF
          </button>
          <button className="btn btn-primary btn-sm" onClick={handleRefresh} disabled={refreshing}>
            <i className={`ti ti-refresh ${refreshing ? 'rotating' : ''}`}></i> {refreshing ? 'Refreshing...' : 'Refresh Data'}
          </button>
        </div>
      </div>

      <div id="report-content" style={{ padding: '20px', background: 'var(--bg)', minHeight: '100%' }}>
      {loading ? (<div>Loading report data...</div>) : masterCommand && (
        <>
          <div className="section-title" style={{ marginTop: '30px' }}>Services Activity (All Time)</div>
          <div className="stats-row" style={{ gridTemplateColumns: 'repeat(6, 1fr)' }}>
            <div className="stat-tile blue"><div className="lbl">Article Intake</div><div className="val">{masterCommand.intake_today || 0}</div></div>
            <div className="stat-tile blue"><div className="lbl">XRF</div><div className="val">{masterCommand.xrf_today || 0}</div></div>
            <div className="stat-tile blue"><div className="lbl">Laser Cutting</div><div className="val">{masterCommand.laser_today || 0}</div></div>
            <div className="stat-tile blue"><div className="lbl">Soldering</div><div className="val">{masterCommand.soldering_today || 0}</div></div>
            <div className="stat-tile blue"><div className="lbl">Fire Assays</div><div className="val">{masterCommand.fire_today || 0}</div></div>
            <div className="stat-tile blue"><div className="lbl">Gold Exchange</div><div className="val">{masterCommand.exchange_today || 0}</div></div>
          </div>
          
          <div className="stats-row" style={{ gridTemplateColumns: 'repeat(7, 1fr)', marginTop: '16px' }}>
            <div className="stat-tile green"><div className="lbl">HUID Completed</div><div className="val">{masterCommand.huid_completed || 0}</div></div>
            <div className="stat-tile red"><div className="lbl">HUID Rejected</div><div className="val">{masterCommand.huid_rejected || 0}</div></div>
            <div className="stat-tile green"><div className="lbl">XRF Completed</div><div className="val">{masterCommand.xrf_completed || 0}</div></div>
            <div className="stat-tile green"><div className="lbl">Laser Completed</div><div className="val">{masterCommand.laser_completed || 0}</div></div>
            <div className="stat-tile green"><div className="lbl">Soldering Completed</div><div className="val">{masterCommand.soldering_completed || 0}</div></div>
            <div className="stat-tile green"><div className="lbl">Fire Assays Completed</div><div className="val">{masterCommand.fire_completed || 0}</div></div>
            <div className="stat-tile green"><div className="lbl">Gold Exchange Completed</div><div className="val">{masterCommand.exchange_completed || 0}</div></div>
          </div>
        </>
      )}
      
      <div className="two-col" style={{ marginTop: '20px', gridTemplateColumns: '2fr 1fr' }}>
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="card-title">Recent Activity</div>
            <div style={{ display: 'flex', alignItems: 'center', background: '#fff', borderRadius: '4px', padding: '4px 10px', border: '1px solid var(--border)' }}>
              <i className="ti ti-search" style={{ color: '#888', marginRight: '6px' }}></i>
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search feed..." 
                style={{ border: 'none', outline: 'none', fontSize: '13px', width: '180px' }} 
              />
            </div>
          </div>
          <div className="tbl-wrap" style={{ maxHeight: '400px' }}>
            <table style={{ width: '100%', textAlign: 'left' }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 1, backgroundColor: 'var(--card)' }}>
                <tr>
                  <th>S.No.</th>
                  <th>Service</th>
                  <th>Customer</th>
                  <th>Details</th>
                  <th>Time</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {activities.map((activity, idx) => {
                  const sNo = (currentPage - 1) * limit + idx + 1;
                  return (
                  <tr key={idx}>
                    <td style={{ color: '#888', fontSize: '13px', textAlign: 'center' }}>{sNo}</td>
                    <td style={{ fontWeight: 600 }}>{activity.type}</td>
                    <td>{activity.jeweller_name}</td>
                    <td style={{ fontSize: '13px', color: '#555' }}>{activity.detail}</td>
                    <td style={{ fontSize: '12px', color: '#888' }}>
                      {new Date(activity.created_at).toLocaleString('en-IN', {
                        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                      })}
                    </td>
                    <td>
                      <span className={`badge ${['Pass', 'Completed', 'Delivered'].includes(activity.status) ? 'badge-green' : ['Fail'].includes(activity.status) ? 'badge-red' : ['In Progress'].includes(activity.status) ? 'badge-blue' : 'badge-amber'}`}>
                        {activity.status || 'Pending'}
                      </span>
                    </td>
                  </tr>
                )})}
                {activities.length === 0 && (
                  <tr><td colSpan="6" style={{ textAlign: 'center', padding: '20px', color: '#999' }}>No recent activity found.</td></tr>
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
                onClick={(e) => {
                  setCurrentPage(prev => Math.max(1, prev - 1));
                  e.target.closest('.card').querySelector('.tbl-wrap')?.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                Previous
              </button>
              <button 
                className="btn btn-outline btn-sm" 
                disabled={currentPage * limit >= totalActivities}
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

        <div className="card">
          <div className="card-header"><div className="card-title">This Week — Gold (g)</div></div>
          {weeklyGold.map((item, idx) => (
            <div className="bar-row" key={idx}>
              <div className="bar-label">{item.day}</div>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: `${item.percent}%`, background: 'var(--gold)' }}></div>
              </div>
              <div className="bar-val">{item.weight}</div>
            </div>
          ))}
          
          <div className="card-header" style={{ marginTop: '16px' }}><div className="card-title">This Week — Silver (g)</div></div>
          {weeklySilver.map((item, idx) => (
            <div className="bar-row" key={`s-${idx}`}>
              <div className="bar-label">{item.day}</div>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: `${item.percent}%`, background: '#A0AAB3' }}></div>
              </div>
              <div className="bar-val" style={{ color: '#A0AAB3', fontWeight: 600 }}>{item.weight}</div>
            </div>
          ))}
          
          <div className="divider"></div>
          
          <div className="card-header" style={{ margin: 0 }}><div className="card-title">Purity Distribution</div></div>
          {purityDist.map((item, idx) => (
            <div className="bar-row" key={idx}>
              <div className="bar-label">{item.label}</div>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: `${item.percent}%`, background: item.color }}></div>
              </div>
              <div className="bar-val">{item.percent}%</div>
            </div>
          ))}
        </div>
      </div>
      </div>
    </div>
  );
}
