import React, { useState, useEffect } from 'react';
import client from '../api/client';
import DeliveryVoucher from './DeliveryVoucher';

export default function DeliveryVouchers({ userContext }) {
  const [orders, setOrders] = useState([]);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ordersRes, articlesRes] = await Promise.all([
        client.get('/workflow/orders'),
        client.get('/workflow/articles')
      ]);
      setOrders(ordersRes.data?.data || []);
      setArticles(articlesRes.data?.data || []);
    } catch (err) {
      console.error('Failed to fetch delivery vouchers data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (selectedOrder) {
    const orderArticles = articles.filter(a => a.order_id === selectedOrder.id);
    return (
      <DeliveryVoucher 
        order={selectedOrder} 
        articles={orderArticles} 
        userContext={userContext}
        onBack={() => setSelectedOrder(null)} 
      />
    );
  }

  return (
    <div className="page active" id="p-delivery-vouchers-list">
      <div className="page-title">
        <i className="ti ti-file-invoice"></i> Delivery Vouchers
        <button className="btn btn-outline btn-sm" onClick={fetchData} style={{marginLeft: 'auto'}}>
          <i className="ti ti-refresh"></i> Refresh
        </button>
      </div>
      
      <div className="search-box">
        <i className="ti ti-search"></i>
        <input type="text" placeholder="Search by Order Code, Hallmarking Centre..." />
      </div>
      
      <div className="card" style={{ padding: 0 }}>
        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>Order Code</th>
                <th>Hallmarking Centre</th>
                <th>Mobile</th>
                <th>Total Articles</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td className="text-gold">{order.order_code}</td>
                  <td>{order.customer_name}</td>
                  <td>{order.customer_mobile || 'N/A'}</td>
                  <td>{order.total_articles}</td>
                  <td className="text-sm">{new Date(order.receipt_date).toLocaleDateString('en-IN')}</td>
                  <td>
                    <button className="btn btn-sm btn-outline" onClick={() => setSelectedOrder(order)}>
                      Open Voucher
                    </button>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && !loading && (
                <tr><td colSpan="6" style={{textAlign: 'center'}}>No orders found.</td></tr>
              )}
              {loading && orders.length === 0 && (
                <tr><td colSpan="6" style={{textAlign: 'center'}}>Loading...</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
