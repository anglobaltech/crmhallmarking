import React, { useState, useEffect } from 'react';
import client from '../api/client';

export default function Discount() {
  const [hmCharge, setHmCharge] = useState(45);
  const [testCharge, setTestCharge] = useState(50);
  const [qty, setQty] = useState(1);
  const [discountPct, setDiscountPct] = useState(0);
  const [artId, setArtId] = useState('');
  const [customerName, setCustomerName] = useState('');

  const [billingHistory, setBillingHistory] = useState([]);
  const [revenueStats, setRevenueStats] = useState({ todayRevenue: '₹0', transactions: '0 transactions' });
  const [loading, setLoading] = useState(false);

  const fetchHistory = async () => {
    try {
      const res = await client.get('/workflow/billing');
      setBillingHistory(res.data?.data || []);
      
      const totalRev = res.data?.data?.reduce((acc, bill) => acc + parseFloat(bill.total_amount || 0), 0) || 0;
      setRevenueStats({
        todayRevenue: `₹${totalRev.toFixed(0)}`,
        transactions: `${res.data?.data?.length || 0} transactions`
      });
    } catch (err) {
      console.error('Failed to fetch billing history:', err);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const subtotal = (hmCharge * qty) + (testCharge * qty);
  const discountAmt = (subtotal * discountPct) / 100;
  const taxable = subtotal - discountAmt;
  const gst = taxable * 0.18;
  const total = taxable + gst;

  const dateStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  const generateBill = async () => {
    if (!customerName) return alert('Customer Name is required for billing.');

    setLoading(true);
    try {
      await client.post('/workflow/billing', {
        order_id: null,
        customer_name: customerName,
        hm_charges: hmCharge,
        test_charges: testCharge,
        qty: qty,
        discount_pct: discountPct
      });
      alert('Bill generated successfully!');
      fetchHistory();
      setCustomerName('');
      setArtId('');
    } catch (err) {
      console.error(err);
      alert('Error generating bill.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page active" id="p-discount">
      <div className="page-title"><i className="ti ti-percent"></i> Discount & Billing</div>
      
      <div className="two-col">
        <div className="card">
          <div className="card-title" style={{ marginBottom: '12px' }}>Generate Bill</div>
          <div className="form-group">
            <label>Customer Name *</label>
            <input type="text" placeholder="Enter customer name" value={customerName} onChange={e => setCustomerName(e.target.value)} />
          </div>
          <div className="form-group" style={{ marginTop: '10px' }}>
            <label>Article ID (Optional)</label>
            <input type="text" placeholder="ART-2024-XXX" value={artId} onChange={e => setArtId(e.target.value)} />
          </div>
          
          <div className="divider"></div>
          
          <div className="form-grid">
            <div className="form-group">
              <label>Hallmarking Charges (₹)</label>
              <input type="number" value={hmCharge} onChange={e => setHmCharge(Number(e.target.value))} />
            </div>
            <div className="form-group">
              <label>Testing Charges (₹)</label>
              <input type="number" value={testCharge} onChange={e => setTestCharge(Number(e.target.value))} />
            </div>
            <div className="form-group">
              <label>Quantity</label>
              <input type="number" value={qty} min="1" onChange={e => setQty(Number(e.target.value))} />
            </div>
            <div className="form-group">
              <label>Discount (%)</label>
              <input type="number" value={discountPct} min="0" max="100" onChange={e => setDiscountPct(Number(e.target.value))} />
            </div>
          </div>
          
          <div className="divider"></div>
          
          <div className="receipt" id="billReceipt">
            <div className="receipt-header">
              <div className="receipt-logo">⚜ HallmarkPro Centre</div>
              <div className="text-sm" style={{ color: 'var(--text3)' }}>BIS Licensed · {dateStr}</div>
            </div>
            <div className="receipt-row"><span>Hallmarking Charges</span><span>₹{(hmCharge * qty).toFixed(2)}</span></div>
            <div className="receipt-row"><span>Testing Charges</span><span>₹{(testCharge * qty).toFixed(2)}</span></div>
            <div className="receipt-row"><span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
            <div className="receipt-row"><span>Discount</span><span style={{ color: 'var(--green)' }}>-₹{discountAmt.toFixed(2)}</span></div>
            <div className="receipt-row"><span>GST (18%)</span><span>₹{gst.toFixed(2)}</span></div>
            <div className="receipt-row"><span style={{ fontWeight: 700 }}>Total</span><span style={{ color: 'var(--gold-dark)' }}>₹{total.toFixed(2)}</span></div>
          </div>
          
          <div className="btn-row">
            <button className="btn btn-gold" onClick={generateBill} disabled={loading}><i className="ti ti-printer"></i> {loading ? 'Saving...' : 'Print Bill'}</button>
            <button className="btn btn-outline"><i className="ti ti-brand-whatsapp"></i> Send WhatsApp</button>
          </div>
        </div>
        
        <div className="card">
          <div className="card-header">
            <div className="card-title">Billing History</div>
            <button className="btn btn-outline btn-sm" onClick={fetchHistory}><i className="ti ti-refresh"></i> Refresh</button>
          </div>
          <div className="tbl-wrap">
            <table>
              <thead>
                <tr><th>Bill No.</th><th>Customer</th><th>Amount</th><th>Date</th></tr>
              </thead>
              <tbody>
                {billingHistory.slice(0, 10).map(bill => (
                  <tr key={bill.id}>
                    <td className="text-gold">{bill.invoice_no}</td>
                    <td>{bill.customer_name}</td>
                    <td>₹{bill.total_amount}</td>
                    <td className="text-sm">{new Date(bill.created_at).toLocaleDateString('en-IN', {day:'numeric', month:'short'})}</td>
                  </tr>
                ))}
                {billingHistory.length === 0 && (
                  <tr><td colSpan="4" style={{textAlign: 'center'}}>No billing history.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          
          <div className="divider"></div>
          
          <div className="stat-tile gold" style={{ margin: 0 }}>
            <div className="lbl">Today's Revenue</div>
            <div className="val">{revenueStats.todayRevenue}</div>
            <div className="sub">{revenueStats.transactions}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
