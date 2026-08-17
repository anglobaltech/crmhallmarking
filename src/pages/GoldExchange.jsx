import React, { useState } from 'react';
import client from '../api/client';
import ServiceForm from '../components/ServiceForm';
import { toast } from '../components/Toast';

export default function GoldExchange({ setPage, globalEdit, setGlobalEdit }) {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data) => {
    setLoading(true);
    try {
      await client.post('/services/exchange', {
        ...data,
        txn_type: 'Buy',
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
    <div className="page active" id="p-goldexchange">
      <div className="page-title"><i className="ti ti-exchange"></i> Gold Exchange</div>
      <ServiceForm title="Gold Exchange" icon="ti-exchange" onSubmit={handleSubmit} loading={loading} endpoint="/services/exchange" globalEdit={globalEdit} setGlobalEdit={setGlobalEdit} />
    </div>
  );
}
