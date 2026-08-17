import React, { useState, useEffect, useRef } from 'react';
import client from '../api/client';
import CreateInvoice from './CreateInvoice';
import PrintReceipt from '../components/PrintReceipt';

export default function BillingDashboard({ userContext }) {
  const [invoices, setInvoices] = useState([]);
  const [stats, setStats] = useState({ total_paid: 0, total_unpaid: 0, total_revenue: 0 });
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [viewingInvoice, setViewingInvoice] = useState(null);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals for actions
  const [showGraphModal, setShowGraphModal] = useState(false);
  const [showExcelModal, setShowExcelModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  
  // Printing state
  const [printInvoice, setPrintInvoice] = useState(null);
  const [shouldPrint, setShouldPrint] = useState(false);
  const printRef = useRef(null);

  useEffect(() => {
    if (shouldPrint && printInvoice) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          window.print();
          setShouldPrint(false);
        });
      });
    }
  }, [shouldPrint, printInvoice]);

  // Filters
  const [dateFrom, setDateFrom] = useState(new Date().toISOString().split('T')[0]);
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);

  const filteredInvoices = React.useMemo(() => {
    return invoices.filter(inv => {
      // Filter by Date
      let invDate = '';
      try {
        const d = inv.invoice_date || inv.created_at;
        if (d) {
          invDate = new Date(d).toISOString().split('T')[0];
        }
      } catch (e) {
        // ignore invalid dates
      }
      if (invDate && dateFrom && invDate < dateFrom) return false;
      if (invDate && dateTo && invDate > dateTo) return false;
      // Filter by Search Query
      if (searchQuery) {
        const sq = searchQuery.toLowerCase();
        if (!inv.invoice_number?.toLowerCase().includes(sq) && 
            !inv.customer_name?.toLowerCase().includes(sq)) {
          return false;
        }
      }
      return true;
    });
  }, [invoices, dateFrom, dateTo, searchQuery]);

  useEffect(() => {
    if (!showCreate) {
      fetchData();
    }
  }, [showCreate]);

  useEffect(() => {
    const closeDropdown = () => setActiveDropdown(null);
    if (activeDropdown) {
      document.addEventListener('click', closeDropdown);
    }
    return () => document.removeEventListener('click', closeDropdown);
  }, [activeDropdown]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await client.get('/billing/invoices');
      setInvoices(res.data?.data || res.data || []);
      if (res.data?.stats) {
        setStats(res.data.stats);
      }
    } catch (err) {
      console.error('Failed to fetch billing data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSale = () => {
    setShowCreate(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      try {
        await client.delete(`/billing/invoices/${id}`);
        fetchData();
      } catch (err) {
        console.error('Failed to delete transaction', err);
        alert('Error deleting transaction');
      }
    }
  };

  const handleSaveEdit = async () => {
    try {
      await client.put(`/billing/invoices/${editingInvoice.id}`, {
        customer_name: editingInvoice.customer_name,
        customer_phone: editingInvoice.customer_phone,
        sale_type: editingInvoice.sale_type,
        status: editingInvoice.status,
        payment_amount: editingInvoice.payment_amount === '' ? 0 : parseFloat(editingInvoice.payment_amount),
        balance_due: editingInvoice.balance_due === '' ? 0 : parseFloat(editingInvoice.balance_due)
      });
      setEditingInvoice(null);
      fetchData();
    } catch (err) {
      console.error('Failed to update invoice', err);
      alert('Error updating invoice');
    }
  };

  const handlePrint = async (invoiceId) => {
    try {
      // Fetch full invoice details including items
      const res = await client.get(`/billing/invoices/${invoiceId}`);
      setPrintInvoice(res.data);
      setShouldPrint(true);
    } catch (err) {
      console.error('Failed to fetch invoice for printing', err);
      alert('Error loading receipt data for printing');
    }
  };

  const formatMoney = (amt) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amt || 0);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const handleExcelDownload = () => {
    if (filteredInvoices.length === 0) {
      alert('No data to download');
      return;
    }
    const headers = ['Date', 'Invoice No.', 'Party Name', 'Transaction', 'Payment Type', 'Amount', 'Balance Due', 'Status'];
    const rows = filteredInvoices.map(inv => {
      const amt = parseFloat(inv.grand_total) || parseFloat(inv.amount) || 0;
      const bal = inv.status === 'Paid' ? 0 : amt;
      return [
        formatDate(inv.invoice_date || inv.created_at),
        inv.invoice_number,
        `"${inv.customer_name || ''}"`,
        'Sale',
        inv.linked_payment || inv.sale_type || 'Cash',
        amt.toFixed(2),
        bal.toFixed(2),
        inv.status || 'Unpaid'
      ].join(',');
    });
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Billing_Report.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExcelModal(false);
  };

  const filteredStats = React.useMemo(() => {
    let paid = 0;
    let unpaid = 0;
    filteredInvoices.forEach(inv => {
      const amt = parseFloat(inv.grand_total) || parseFloat(inv.amount) || 0;
      if (inv.status === 'Paid') {
        paid += amt;
      } else {
        unpaid += amt;
      }
    });
    return {
      total_paid: paid,
      total_unpaid: unpaid,
      total_revenue: paid + unpaid
    };
  }, [filteredInvoices]);

  // Group data for graph
  const graphData = React.useMemo(() => {
    const dailyTotals = {};
    filteredInvoices.forEach(inv => {
      const d = inv.invoice_date || inv.created_at;
      if (!d) return;
      let dateKey = '';
      try {
        dateKey = new Date(d).toISOString().split('T')[0];
      } catch (e) { return; }
      const amt = parseFloat(inv.grand_total) || parseFloat(inv.amount) || 0;
      dailyTotals[dateKey] = (dailyTotals[dateKey] || 0) + amt;
    });
    // Sort keys and format
    return Object.keys(dailyTotals).sort().map(key => ({
      date: key,
      label: formatDate(key),
      total: dailyTotals[key]
    }));
  }, [filteredInvoices]);

  const maxGraphTotal = graphData.length > 0 ? Math.max(...graphData.map(d => d.total)) : 0;

  if (showCreate) {
    return <CreateInvoice onBack={() => setShowCreate(false)} userContext={userContext} />;
  }

  return (
    <div className="page active" id="p-billing-dashboard" style={{ padding: '0', background: '#F4F6F8' }}>
      
      {/* Top Header Bar */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: '16px 24px', borderBottom: '1px solid var(--border)' }}>
        <h2 style={{ margin: 0, fontSize: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <i className="ti ti-file-invoice"></i> Billing & Transactions
        </h2>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            className="btn" 
            style={{ background: '#FFE4E6', color: '#E11D48', border: 'none', display: 'flex', alignItems: 'center', gap: '4px', padding: '8px 16px', borderRadius: '20px', fontWeight: 600, cursor: 'pointer' }}
            onClick={handleAddSale}
          >
            <i className="ti ti-plus"></i> Add Sale
          </button>
        </div>
      </div>

      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Filters & Summary Cards */}
        <div className="card" style={{ padding: '24px', borderRadius: '12px' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
            <div className="no-print" style={{ display: 'flex', alignItems: 'center', background: '#F1F3F5', borderRadius: '4px', padding: '4px' }}>
              <span style={{ fontSize: '12px', padding: '0 8px', color: '#666', fontWeight: 500 }}>Between</span>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ border: 'none', background: '#fff', padding: '4px 8px', borderRadius: '4px' }} />
              <span style={{ padding: '0 8px', color: '#666' }}>To</span>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ border: 'none', background: '#fff', padding: '4px 8px', borderRadius: '4px' }} />
            </div>

            <div className="no-print" style={{ marginLeft: 'auto', display: 'flex', gap: '16px' }}>
              <button className="btn btn-outline btn-sm" onClick={() => setShowGraphModal(true)} style={{ padding: '6px 12px' }}><i className="ti ti-chart-bar"></i> Graph</button>
              <button className="btn btn-outline btn-sm" onClick={() => setShowExcelModal(true)} style={{ padding: '6px 12px' }}><i className="ti ti-file-spreadsheet"></i> Excel Report</button>
              <button className="btn btn-outline btn-sm" onClick={() => setShowPrintModal(true)} style={{ padding: '6px 12px' }}><i className="ti ti-printer"></i> Print</button>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ flex: 1, background: '#D1FAE5', padding: '24px', borderRadius: '12px', color: '#065F46', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize: '16px', marginBottom: '8px', fontWeight: 500 }}>Paid</div>
              <div style={{ fontSize: '28px', fontWeight: 700 }}>{formatMoney(filteredStats.total_paid)}</div>
            </div>
            <div style={{ fontSize: '24px', color: '#666' }}>+</div>
            <div style={{ flex: 1, background: '#DBEAFE', padding: '24px', borderRadius: '12px', color: '#1E40AF', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize: '16px', marginBottom: '8px', fontWeight: 500 }}>Unpaid</div>
              <div style={{ fontSize: '28px', fontWeight: 700 }}>{formatMoney(filteredStats.total_unpaid)}</div>
            </div>
            <div style={{ fontSize: '24px', color: '#666' }}>=</div>
            <div style={{ flex: 1, background: '#FEF3C7', padding: '24px', borderRadius: '12px', color: '#92400E', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize: '16px', marginBottom: '8px', fontWeight: 500 }}>Total</div>
              <div style={{ fontSize: '28px', fontWeight: 700 }}>{formatMoney(filteredStats.total_revenue)}</div>
            </div>
          </div>
          
        </div>

        {/* Transactions Table */}
        <div className="card" style={{ padding: 0, borderRadius: '12px', overflow: 'visible' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ margin: 0, fontSize: '16px', color: '#666', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>TRANSACTIONS</h3>
            <div className="no-print" style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', background: '#fff', borderRadius: '4px', padding: '6px 12px', border: '1px solid var(--border)', width: '250px' }}>
                <i className="ti ti-search" style={{ color: '#888', marginRight: '8px' }}></i>
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search..." style={{ border: 'none', background: 'transparent', width: '100%', outline: 'none' }} />
              </div>
              <button className="btn btn-blue btn-sm" onClick={handleAddSale} style={{ display: 'flex', alignItems: 'center', gap: '4px', borderRadius: '20px', padding: '8px 16px', cursor: 'pointer' }}>
                <i className="ti ti-plus"></i> Add Sale
              </button>
            </div>
          </div>
          

          <div className="tbl-wrap" style={{ padding: '0' }}>
            <table style={{ width: '100%', margin: 0, borderCollapse: 'collapse' }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 10, boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                <tr style={{ color: '#888', fontSize: '12px', background: '#F8F7F4' }}>
                  <th style={{ padding: '12px 24px' }}>DATE <i className="ti ti-filter"></i></th>
                  <th>INVOICE NO. <i className="ti ti-filter"></i></th>
                  <th>PARTY NAME <i className="ti ti-filter"></i></th>
                  <th>TRANSACTION <i className="ti ti-filter"></i></th>
                  <th>PAYMENT TYPE <i className="ti ti-filter"></i></th>
                  <th style={{ textAlign: 'right' }}>AMOUNT <i className="ti ti-filter"></i></th>
                  <th style={{ textAlign: 'right' }}>BALANCE DUE <i className="ti ti-filter"></i></th>
                  <th style={{ paddingLeft: '24px' }}>STATUS</th>
                  <th className="no-print" style={{ width: '80px' }}></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="9" style={{ textAlign: 'center', padding: '40px' }}>Loading transactions...</td></tr>
                ) : (
                  (() => {
                    if (filteredInvoices.length === 0) {
                      return <tr><td colSpan="9" style={{ textAlign: 'center', padding: '40px' }}>No transactions found.</td></tr>;
                    }

                    return filteredInvoices.map((inv) => {
                      const amt = parseFloat(inv.grand_total) || parseFloat(inv.amount) || 0;
                      let bal = parseFloat(inv.balance_due);
                      if (isNaN(bal)) {
                        bal = inv.status === 'Paid' ? 0 : amt;
                      }
                      const isUnpaid = inv.status !== 'Paid' && bal > 0;
                      
                      return (
                    <tr key={inv.id} style={{ background: isUnpaid ? '#F0F9FF' : '#fff', borderBottom: '1px solid #f1f3f5' }}>
                      <td style={{ padding: '16px 24px' }}>{formatDate(inv.invoice_date || inv.created_at)}</td>
                      <td>{inv.invoice_number}</td>
                      <td style={{ fontWeight: 500 }}>{inv.customer_name || 'N/A'}</td>
                      <td>Sale</td>
                      <td>{inv.linked_payment || inv.sale_type || 'Cash'}</td>
                      <td style={{ textAlign: 'right' }}>{formatMoney(amt).replace('₹', '')}</td>
                      <td style={{ textAlign: 'right' }}>{formatMoney(bal).replace('₹', '')}</td>
                      <td style={{ color: isUnpaid ? '#0284C7' : '#10B981', fontWeight: 600, paddingLeft: '24px' }}>{isUnpaid ? 'Unpaid' : 'Paid'}</td>
                      <td className="no-print" style={{ textAlign: 'right', paddingRight: '24px', position: 'relative' }}>
                        <i className="ti ti-printer" onClick={() => handlePrint(inv.id)} style={{ cursor: 'pointer', marginRight: '16px', color: '#666', fontSize: '18px' }} title="Print Receipt"></i>
                        <i className="ti ti-dots-vertical" onClick={(e) => { e.stopPropagation(); setActiveDropdown(activeDropdown === inv.id ? null : inv.id); }} style={{ cursor: 'pointer', color: '#666', fontSize: '18px' }}></i>
                        {activeDropdown === inv.id && (
                          <div style={{ position: 'absolute', right: '24px', top: '24px', backgroundColor: '#fff', border: '1px solid var(--border)', borderRadius: '4px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 10, display: 'flex', flexDirection: 'column', minWidth: '120px', textAlign: 'left' }}>
                            <div style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid var(--border)', fontSize: '13px', display: 'flex', alignItems: 'center' }} onClick={(e) => { e.stopPropagation(); setViewingInvoice(inv); setActiveDropdown(null); }}>
                              <i className="ti ti-eye" style={{ marginRight: '6px' }}></i> View
                            </div>
                            <div style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid var(--border)', fontSize: '13px', display: 'flex', alignItems: 'center' }} onClick={(e) => { e.stopPropagation(); setEditingInvoice({...inv}); setActiveDropdown(null); }}>
                              <i className="ti ti-edit" style={{ marginRight: '6px' }}></i> Edit
                            </div>
                            <div style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid var(--border)', fontSize: '13px', display: 'flex', alignItems: 'center' }} onClick={(e) => { e.stopPropagation(); handlePrint(inv.id); setActiveDropdown(null); }}>
                              <i className="ti ti-printer" style={{ marginRight: '6px' }}></i> Print Receipt
                            </div>
                            <div style={{ padding: '8px 12px', cursor: 'pointer', color: 'var(--red)', fontSize: '13px', display: 'flex', alignItems: 'center' }} onClick={(e) => { e.stopPropagation(); handleDelete(inv.id); setActiveDropdown(null); }}>
                              <i className="ti ti-trash" style={{ marginRight: '6px' }}></i> Delete
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              })()
            )}
              </tbody>
            </table>
          </div>

        </div>

      </div>

      {/* Hidden Print Component */}
      <PrintReceipt invoice={printInvoice} innerRef={printRef} userContext={userContext} />

      {/* View Modal */}
      {viewingInvoice && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="card" style={{ maxWidth: '500px', width: '100%' }}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="card-title">Transaction Details</div>
              <button className="btn btn-outline btn-sm" onClick={() => setViewingInvoice(null)}><i className="ti ti-x"></i></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px', fontSize: '14px' }}>
              <div><strong>Invoice Number:</strong> {viewingInvoice.invoice_number}</div>
              <div><strong>Date:</strong> {formatDate(viewingInvoice.invoice_date || viewingInvoice.created_at)}</div>
              <div><strong>Customer Name:</strong> {viewingInvoice.customer_name || 'N/A'}</div>
              <div><strong>Sale Type:</strong> {viewingInvoice.sale_type || 'Cash'}</div>
              <div><strong>Total Amount:</strong> {formatMoney(parseFloat(viewingInvoice.grand_total) || parseFloat(viewingInvoice.amount) || 0)}</div>
              <div><strong>Status:</strong> {viewingInvoice.status || 'Unpaid'}</div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingInvoice && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="card" style={{ maxWidth: '500px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="card-title">Edit Transaction</div>
              <button className="btn btn-outline btn-sm" onClick={() => setEditingInvoice(null)}><i className="ti ti-x"></i></button>
            </div>
            <div className="form-grid" style={{ marginTop: '16px' }}>
              <div className="form-group full">
                <label>Customer Name</label>
                <input type="text" value={editingInvoice.customer_name || ''} onChange={e => setEditingInvoice({...editingInvoice, customer_name: e.target.value})} />
              </div>
              <div style={{ display: 'flex', gap: '16px', gridColumn: '1 / -1' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Sale Type</label>
                  <select value={editingInvoice.sale_type || 'Cash'} onChange={e => setEditingInvoice({...editingInvoice, sale_type: e.target.value})}>
                    <option>Cash</option>
                    <option>Credit</option>
                    <option>Card</option>
                    <option>UPI</option>
                  </select>
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Status</label>
                  <select value={editingInvoice.status || 'Unpaid'} onChange={e => setEditingInvoice({...editingInvoice, status: e.target.value})}>
                    <option>Unpaid</option>
                    <option>Paid</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '16px', gridColumn: '1 / -1' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Amount Paid (₹)</label>
                  <input type="number" value={editingInvoice.payment_amount !== undefined ? editingInvoice.payment_amount : ''} onChange={e => {
                    const val = e.target.value;
                    const pAmt = parseFloat(val) || 0;
                    const grand = parseFloat(editingInvoice.grand_total) || parseFloat(editingInvoice.amount) || 0;
                    setEditingInvoice({...editingInvoice, payment_amount: val, balance_due: (grand - pAmt).toFixed(2)});
                  }} />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Balance Due (₹)</label>
                  <input type="number" value={editingInvoice.balance_due !== undefined ? editingInvoice.balance_due : ''} onChange={e => setEditingInvoice({...editingInvoice, balance_due: e.target.value})} />
                </div>
              </div>
            </div>
            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button className="btn btn-outline" onClick={() => setEditingInvoice(null)}>Cancel</button>
              <button className="btn btn-gold" onClick={handleSaveEdit}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* Graph Modal */}
      {showGraphModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="card" style={{ maxWidth: '800px', width: '100%', display: 'flex', flexDirection: 'column', background: '#fff', padding: '0', overflow: 'hidden' }}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #f0f0f0', background: '#FAFAF8' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ background: '#E3F0FF', color: '#1565C0', padding: '8px', borderRadius: '8px' }}>
                  <i className="ti ti-chart-bar" style={{ fontSize: '20px' }}></i>
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', color: '#333' }}>Sales Analytics</h3>
                  <p style={{ margin: 0, fontSize: '12px', color: '#888' }}>Revenue overview based on your filtered date range</p>
                </div>
              </div>
              <button className="btn btn-outline btn-sm" onClick={() => setShowGraphModal(false)} style={{ borderRadius: '50%', padding: '8px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i className="ti ti-x" style={{ fontSize: '16px' }}></i></button>
            </div>
            
            <div style={{ padding: '40px 24px 20px', overflowX: 'auto', flex: 1 }}>
              {graphData.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px', color: '#888' }}>
                  <i className="ti ti-chart-pie" style={{ fontSize: '48px', color: '#ddd', marginBottom: '16px', display: 'block' }}></i>
                  No transaction data available for the selected dates.
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'flex-end', height: '280px', gap: '16px', borderBottom: '2px solid #E0DDD6', paddingBottom: '0' }}>
                  {graphData.map(d => {
                    const heightPct = maxGraphTotal > 0 ? (d.total / maxGraphTotal) * 100 : 0;
                    return (
                      <div key={d.date} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', gap: '12px', flex: 1, minWidth: '70px', height: '100%', position: 'relative', group: 'bar' }}>
                        <div style={{ fontSize: '12px', color: '#444', fontWeight: 600, background: '#fff', padding: '2px 6px', borderRadius: '4px', border: '1px solid #f0f0f0', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', whiteSpace: 'nowrap' }}>
                          {formatMoney(d.total).replace('₹', '')}
                        </div>
                        <div style={{
                          width: '100%',
                          maxWidth: '48px',
                          height: `${Math.max(heightPct, 2)}%`,
                          background: 'linear-gradient(180deg, var(--gold) 0%, #B7700A 100%)',
                          borderRadius: '6px 6px 0 0',
                          transition: 'height 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                          boxShadow: '0 4px 12px rgba(183, 112, 10, 0.2)',
                          cursor: 'pointer'
                        }}></div>
                        <div style={{ fontSize: '11px', color: '#666', textAlign: 'center', whiteSpace: 'nowrap', marginTop: '8px' }}>
                          {d.label}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            
            {graphData.length > 0 && (
              <div style={{ padding: '16px 24px', background: '#FAFAF8', borderTop: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '13px', color: '#666' }}>
                  Total Date Range Revenue: <strong style={{ color: '#333' }}>{formatMoney(filteredStats.total_revenue)}</strong>
                </div>
                <div style={{ fontSize: '12px', color: '#888' }}>
                  Max Daily: {formatMoney(maxGraphTotal)}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Excel Report Modal */}
      {showExcelModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="card" style={{ maxWidth: '400px', width: '100%' }}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="card-title">Export to Excel</div>
              <button className="btn btn-outline btn-sm" onClick={() => setShowExcelModal(false)}><i className="ti ti-x"></i></button>
            </div>
            <div style={{ padding: '20px' }}>
              <p style={{ fontSize: '14px', color: '#444', marginBottom: '24px' }}>Download an Excel report of all transactions currently filtered by your date selection.</p>
              <button className="btn btn-blue" style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }} onClick={handleExcelDownload}>
                <i className="ti ti-download"></i> Download CSV Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print Summary Modal */}
      {showPrintModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="card" style={{ maxWidth: '400px', width: '100%' }}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="card-title">Print Dashboard</div>
              <button className="btn btn-outline btn-sm" onClick={() => setShowPrintModal(false)}><i className="ti ti-x"></i></button>
            </div>
            <div style={{ padding: '20px' }}>
              <p style={{ fontSize: '14px', color: '#444', marginBottom: '24px' }}>Generate a printable format of your Billing & Transactions summary and lists.</p>
              <button className="btn btn-gold" style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }} onClick={() => {
                setShowPrintModal(false);
                setTimeout(() => window.print(), 200);
              }}>
                <i className="ti ti-printer"></i> Print Report Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
