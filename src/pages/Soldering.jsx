import React, { useState } from 'react';
import client from '../api/client';
import ServiceForm from '../components/ServiceForm';
import { toast } from '../components/Toast';

export default function Soldering({ setPage, globalEdit, setGlobalEdit }) {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data) => {
    setLoading(true);
    try {
      await client.post('/services/soldering', {
        ...data,
        status: 'Pending'
      });
      
    } catch (err) {
      console.error(err);
      toast('Error saving job: ' + (err.response?.data?.error || err.message), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page active" id="p-soldering">
      <div className="page-title"><i className="ti ti-flame"></i> Soldering</div>
      <ServiceForm title="Soldering" icon="ti-flame" onSubmit={handleSubmit} loading={loading} endpoint="/services/soldering" globalEdit={globalEdit} setGlobalEdit={setGlobalEdit} />
    </div>
  );
}
