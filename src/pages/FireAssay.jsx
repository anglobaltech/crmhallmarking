import React, { useState } from 'react';
import client from '../api/client';
import ServiceForm from '../components/ServiceForm';
import { toast } from '../components/Toast';

export default function FireAssay({ setPage, globalEdit, setGlobalEdit }) {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data) => {
    setLoading(true);
    try {
      await client.post('/services/fire', {
        ...data,
        status: 'Pending',
        result: 'Pending'
      });
      
    } catch (err) {
      console.error(err);
      toast('Error saving job: ' + (err.response?.data?.error || err.message), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page active" id="p-fireassay">
      <div className="page-title"><i className="ti ti-test-pipe"></i> Fire Assay</div>
      <ServiceForm title="Fire Assay" icon="ti-test-pipe" onSubmit={handleSubmit} loading={loading} endpoint="/services/fire" globalEdit={globalEdit} setGlobalEdit={setGlobalEdit} />
    </div>
  );
}
