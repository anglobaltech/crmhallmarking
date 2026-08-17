import React, { useState } from 'react';
import client from '../api/client';
import ServiceForm from '../components/ServiceForm';
import { toast } from '../components/Toast';

export default function LaserCutting({ setPage, globalEdit, setGlobalEdit }) {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data) => {
    setLoading(true);
    try {
      await client.post('/services/laser', {
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
    <div className="page active" id="p-lasercutting">
      <div className="page-title"><i className="ti ti-cut"></i> Laser Cutting</div>
      <ServiceForm title="Laser Cutting" icon="ti-cut" onSubmit={handleSubmit} loading={loading} endpoint="/services/laser" globalEdit={globalEdit} setGlobalEdit={setGlobalEdit} />
    </div>
  );
}
