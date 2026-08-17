import React from 'react';
import { getImageUrl } from '../api/client';

export default function PrintReceipt({ invoice, innerRef, userContext }) {
  if (!invoice) return null;

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const formatMoney = (amt) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amt || 0);
  };

  const centreName = userContext?.tenant_name || 'Hallmarking Centre';
  const centreLicence = userContext?.bis_licence || 'N/A';
  const centreAddress = userContext?.tenant_address || 'Address not provided';

  return (
    <div ref={innerRef} className="print-receipt-container">
      <style>
        {`
          .print-receipt-container {
            display: none;
          }
          
          @media print {
            @page {
              size: auto;
              margin: 0mm;
            }
            /* Hide all app shells */
            #sidebar, .desk-nav, header, nav, .top-bar, .toast-container {
              display: none !important;
            }
            /* Make layout wrappers visible and unrestrained */
            body, html, #root, #main, #content, .page {
              display: block !important;
              height: auto !important;
              overflow: visible !important;
              margin: 0 !important;
              padding: 0 !important;
              background: white !important;
            }
            /* Hide all direct children of the page except our print container */
            .page > div:not(.print-receipt-container) {
              display: none !important;
            }
            
            /* Show our print container */
            .print-receipt-container {
              display: block !important;
              width: 100%;
              background: white;
              font-family: 'Inter', sans-serif;
              color: #000;
              margin: 0 auto;
              padding: 20px;
            }
            .receipt-header {
              display: flex;
              align-items: center;
              justify-content: space-between;
              margin-bottom: 24px;
              border-bottom: 2px dashed #ccc;
              padding-bottom: 16px;
            }
            .receipt-header .logo-container {
              flex: 1;
              text-align: left;
            }
            .receipt-header .text-container {
              flex: 2;
              text-align: center;
            }
            .receipt-header .empty-container {
              flex: 1;
            }
            .receipt-header h1 {
              margin: 0 0 10px 0;
              font-size: 24px;
              letter-spacing: 2px;
            }
            .receipt-header h2 {
              margin: 0 0 5px 0;
              font-size: 28px;
              color: #333;
            }
            .receipt-header p {
              margin: 2px 0;
              font-size: 14px;
              color: #555;
            }
            .receipt-details {
              display: flex;
              justify-content: space-between;
              margin-bottom: 24px;
              font-size: 14px;
            }
            .receipt-details strong {
              display: block;
              margin-bottom: 4px;
            }
            .receipt-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 24px;
              font-size: 14px;
            }
            .receipt-table th, .receipt-table td {
              padding: 8px;
              text-align: left;
              border-bottom: 1px solid #eee;
            }
            .receipt-table th {
              background: #f9f9f9;
              font-weight: bold;
              border-bottom: 2px solid #ccc;
            }
            .receipt-totals {
              width: 300px;
              float: right;
              font-size: 14px;
            }
            .receipt-totals-row {
              display: flex;
              justify-content: space-between;
              padding: 4px 0;
            }
            .receipt-totals-row.grand-total {
              font-size: 18px;
              font-weight: bold;
              border-top: 2px solid #000;
              padding-top: 8px;
              margin-top: 8px;
            }
            .receipt-footer {
              text-align: center;
              margin-top: 40px;
              font-size: 12px;
              color: #666;
              border-top: 2px dashed #ccc;
              padding-top: 16px;
              clear: both;
            }
          }
        `}
      </style>

      <div className="receipt-header">
        <div className="logo-container">
          {userContext?.logo_url && (
            <img 
              src={getImageUrl(userContext.logo_url)} 
              alt="Centre Logo" 
              style={{ maxWidth: '120px', maxHeight: '100px', objectFit: 'contain' }} 
            />
          )}
        </div>
        <div className="text-container">
          <h1>TAX INVOICE</h1>
          <h2>{centreName}</h2>
          <p>{centreAddress}</p>
          <p><strong>GSTIN: {userContext?.gst_number || 'N/A'}</strong></p>
        </div>
        <div className="empty-container"></div>
      </div>

      <div className="receipt-details">
        <div>
          <strong>Billed To:</strong>
          <div>{invoice.customer_name || 'Walk-in Customer'}</div>
          {invoice.customer_phone && <div>{invoice.customer_phone}</div>}
          {invoice.billing_address && <div>{invoice.billing_address}</div>}
        </div>
        <div style={{ textAlign: 'right' }}>
          <strong>Invoice Details:</strong>
          <div>No: {invoice.invoice_number}</div>
          <div>Date: {formatDate(invoice.invoice_date || invoice.created_at)}</div>
          <div>Status: {invoice.status}</div>
          <div>Payment: {invoice.linked_payment || invoice.sale_type || 'Cash'}</div>
        </div>
      </div>

      <table className="receipt-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Item</th>
            <th style={{ textAlign: 'center' }}>Qty</th>
            <th style={{ textAlign: 'right' }}>Rate</th>
            <th style={{ textAlign: 'right' }}>Tax</th>
            <th style={{ textAlign: 'right' }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items && invoice.items.length > 0 ? (
            invoice.items.map((item, idx) => (
              <tr key={item.id || idx}>
                <td>{idx + 1}</td>
                <td>{item.item_name}</td>
                <td style={{ textAlign: 'center' }}>{item.quantity} {item.unit}</td>
                <td style={{ textAlign: 'right' }}>{formatMoney(item.price_per_unit)}</td>
                <td style={{ textAlign: 'right' }}>{item.tax_rate}</td>
                <td style={{ textAlign: 'right' }}>{formatMoney(item.amount)}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6" style={{ textAlign: 'center', fontStyle: 'italic', padding: '16px' }}>
                Summary Sale (Item details not available)
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="receipt-totals">
        <div className="receipt-totals-row">
          <span>Subtotal:</span>
          <span>{formatMoney(invoice.subtotal)}</span>
        </div>
        {parseFloat(invoice.total_discount) > 0 && (
          <div className="receipt-totals-row">
            <span>Discount:</span>
            <span>-{formatMoney(invoice.total_discount)}</span>
          </div>
        )}
        <div className="receipt-totals-row">
          <span>Tax:</span>
          <span>+{formatMoney(invoice.total_tax)}</span>
        </div>
        {parseFloat(invoice.round_off) !== 0 && (
          <div className="receipt-totals-row">
            <span>Round Off:</span>
            <span>{invoice.round_off > 0 ? '+' : ''}{invoice.round_off}</span>
          </div>
        )}
        <div className="receipt-totals-row grand-total">
          <span>Grand Total:</span>
          <span>{formatMoney(invoice.grand_total || invoice.amount)}</span>
        </div>
        <div className="receipt-totals-row" style={{ marginTop: '8px' }}>
          <span>Amount Paid:</span>
          <span>{formatMoney(invoice.payment_amount || 0)}</span>
        </div>
        <div className="receipt-totals-row" style={{ color: '#E11D48', fontWeight: 'bold' }}>
          <span>Amount Pending:</span>
          <span>{formatMoney(Math.max(0, (parseFloat(invoice.grand_total || invoice.amount) || 0) - (parseFloat(invoice.payment_amount) || 0)))}</span>
        </div>
      </div>

      <div className="receipt-footer">
        {invoice.description && (
          <div style={{ marginBottom: '16px', textAlign: 'left', fontStyle: 'italic' }}>
            <strong>Remarks: </strong> {invoice.description}
          </div>
        )}
      </div>
    </div>
  );
}
