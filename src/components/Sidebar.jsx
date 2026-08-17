import React, { useState, useEffect } from 'react';
import client from '../api/client';

export default function Sidebar({ currentDesk, currentPage, setPage }) {
  const [reminderCount, setReminderCount] = useState(0);

  useEffect(() => {
    // Only fetch if admin desk is open or globally if preferred, we can fetch once
    const fetchRemindersCount = async () => {
      try {
        const res = await client.get('/workflow/reminders');
        const reminders = res.data?.reminders || [];
        
        // Count urgent reminders (due in <= 3 days and not completed)
        let count = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        reminders.forEach(r => {
          if (r.status !== 'Completed') {
            const due = new Date(r.due_date);
            const diff = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
            if (diff <= 3) count++;
          }
        });
        
        setReminderCount(count);
      } catch (err) {
        console.error('Failed to fetch reminders for sidebar:', err);
      }
    };
    
    fetchRemindersCount();
    // Set up a simple poll every 5 minutes to keep it updated
    const interval = setInterval(fetchRemindersCount, 300000);
    return () => clearInterval(interval);
  }, []);

  const sections = {
    dashboard_nav: [
      { id: 'dashboard', icon: 'ti-layout-dashboard', label: 'Dashboard' }
    ],
    reception: [
      { id: 'dashboard', icon: 'ti-layout-dashboard', label: 'Dashboard' },
      { id: 'intake', icon: 'ti-circle-plus', label: 'Article Intake' },
      { id: 'articles', icon: 'ti-list-details', label: 'Article Register' },
      { id: 'delivery_vouchers', icon: 'ti-file-invoice', label: 'Delivery Vouchers' },
      { id: 'discount', icon: 'ti-percent', label: 'Discount & Billing' },
    ],
    quality: [
      { id: 'xrf', icon: 'ti-atom', label: 'XRF Testing' }
    ],
    admin: [
      { id: 'dailyreport', icon: 'ti-report', label: 'Daily Report' },
      { id: 'billing', icon: 'ti-receipt', label: 'Billing & Invoices' },
      { id: 'reminders', icon: 'ti-bell', label: 'Reminders', badge: reminderCount > 0 ? { text: reminderCount.toString(), color: 'badge-red' } : null },
      { id: 'settings', icon: 'ti-adjustments', label: 'Settings' },
    ],
    extra_services: [
      { id: 'lasercutting', icon: 'ti-cut', label: 'Laser Cutting' },
      { id: 'soldering', icon: 'ti-flame', label: 'Soldering' },
      { id: 'fireassay', icon: 'ti-test-pipe', label: 'Fire Assay' },
      { id: 'goldexchange', icon: 'ti-exchange', label: 'Gold Exchange' },
      { id: 'service_vouchers', icon: 'ti-file-invoice', label: 'Delivery Vouchers' },
    ]
  };

  const labels = {
    dashboard_nav: 'Dashboard',
    reception: 'Reception',
    quality: 'Quality / XRF',
    admin: 'Admin',
    extra_services: 'Services'
  };

  const items = sections[currentDesk] || [];

  return (
    <div id="sidebar">
      <div className="sb-section">
        <div className="sb-label">{labels[currentDesk]}</div>
        {items.map(item => (
          <div 
            key={item.id}
            className={`sb-item ${currentPage === item.id ? 'active' : ''}`}
            onClick={() => setPage(item.id)}
          >
            <i className={`ti ${item.icon}`}></i> {item.label}
            {item.badge && (
              <span className={`sb-badge ${item.badge.color || ''}`}>{item.badge.text}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
