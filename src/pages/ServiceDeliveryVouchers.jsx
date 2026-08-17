import React, { useState, useEffect } from 'react';
import client from '../api/client';
import ServiceDeliveryVoucher from './ServiceDeliveryVoucher';

export default function ServiceDeliveryVouchers({ userContext }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [laserRes, solderingRes, fireRes, exchangeRes, xrfRes] = await Promise.all([
        client.get('/services/laser'),
        client.get('/services/soldering'),
        client.get('/services/fire'),
        client.get('/services/exchange'),
        client.get('/services/xrf')
      ]);

      const laserJobs = (laserRes.data?.data || []).map(j => ({ ...j, serviceName: 'Laser Cutting' }));
      const solderingJobs = (solderingRes.data?.data || []).map(j => ({ ...j, serviceName: 'Soldering' }));
      const fireJobs = (fireRes.data?.data || []).map(j => ({ ...j, serviceName: 'Fire Assay' }));
      const exchangeJobs = (exchangeRes.data?.data || []).map(j => ({ ...j, serviceName: 'Gold Exchange' }));
      const xrfJobs = (xrfRes.data?.data || []).map(j => ({ ...j, serviceName: 'XRF Testing', jeweller_name: j.jeweller_name || 'Walk-in Customer', weight: j.weight || 0 }));

      let allJobs = [...laserJobs, ...solderingJobs, ...fireJobs, ...exchangeJobs, ...xrfJobs];
      // Sort by newest first
      allJobs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      setJobs(allJobs);
    } catch (err) {
      console.error('Failed to fetch service delivery vouchers data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (selectedJob) {
    return (
      <ServiceDeliveryVoucher
        job={selectedJob}
        userContext={userContext}
        onBack={() => setSelectedJob(null)}
      />
    );
  }

  return (
    <div className="page active" id="p-service-vouchers-list">
      <div className="page-title">
        <i className="ti ti-file-invoice"></i> Service Delivery Vouchers
        <button className="btn btn-outline btn-sm" onClick={fetchData} style={{ marginLeft: 'auto' }}>
          <i className="ti ti-refresh"></i> Refresh
        </button>
      </div>

      <div className="search-box">
        <i className="ti ti-search"></i>
        <input type="text" placeholder="Search by Customer Name, Service..." />
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>Service Type</th>
                <th>Customer Name</th>
                <th>Mobile</th>
                <th>Weight (g)</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={`${job.serviceName}-${job.id}`}>
                  <td className="text-gold">{job.serviceName}</td>
                  <td>{job.jeweller_name}</td>
                  <td>{job.phone || 'N/A'}</td>
                  <td>{job.weight || job.gross_weight || job.sample_weight || 'N/A'}</td>
                  <td className="text-sm">{new Date(job.created_at).toLocaleDateString('en-IN')}</td>
                  <td>
                    <button className="btn btn-sm btn-outline" onClick={() => setSelectedJob(job)}>
                      Open Voucher
                    </button>
                  </td>
                </tr>
              ))}
              {jobs.length === 0 && !loading && (
                <tr><td colSpan="6" style={{ textAlign: 'center' }}>No services found.</td></tr>
              )}
              {loading && jobs.length === 0 && (
                <tr><td colSpan="6" style={{ textAlign: 'center' }}>Loading...</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
