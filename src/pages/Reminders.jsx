import React, { useState, useEffect } from 'react';
import client from '../api/client';
import { toast } from '../components/Toast';

const REMINDER_TYPES = ['General', 'Licence Renewal', 'Calibration', 'Compliance', 'Government Filing', 'Equipment Service', 'Staff Training', 'Audit', 'Other'];
const PRIORITIES = ['Low', 'Normal', 'High', 'Critical'];
const ALERT_UNITS = ['Hours', 'Days', 'Weeks'];
const REPEAT_TYPES = ['None', 'Daily', 'Weekly', 'Monthly', 'Yearly'];

const EMPTY_FORM = {
  title: '',
  description: '',
  due_date: '',
  priority: 'Normal',
  reminder_type: 'General',
  alert_before: 3,
  alert_unit: 'Days',
  repeat_type: 'None',
  assigned_to: '',
  notes: '',
};

export default function Reminders({ userContext, setUserContext }) {
  const [reminders, setReminders] = useState([]);
  const [calibrationSchedule, setCalibrationSchedule] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [expiryInput, setExpiryInput] = useState('');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  // Filter state
  const [filterType, setFilterType] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchText, setSearchText] = useState('');

  const saveLicenceExpiry = async () => {
    if (!expiryInput) return toast('Please select an expiry date', 'error');
    setSaving(true);
    try {
      const res = await client.post('/auth/update-licence-expiry', { expiry_date: expiryInput });
      if (res.data.expiry_date) {
        setUserContext(prev => ({ ...prev, bis_licence_expiry: res.data.expiry_date }));
        toast('Licence expiry updated successfully');
      }
    } catch (err) {
      console.error(err);
      toast('Failed to save expiry date', 'error');
    } finally {
      setSaving(false);
    }
  };

  const fetchReminders = async () => {
    setLoading(true);
    try {
      const res = await client.get('/workflow/reminders');
      setCalibrationSchedule(res.data?.calibrations || []);
      setReminders(res.data?.reminders || []);
    } catch (err) {
      console.error('Failed to fetch reminders:', err);
      toast('Failed to load reminders', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchReminders();
      toast('Reminders refreshed successfully', 'success');
    } catch (err) {
      console.error(err);
      toast('Failed to refresh reminders', 'error');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReminders();
  }, []);

  const openCreateModal = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, due_date: new Date(Date.now() + 7 * 24 * 3600000).toISOString().split('T')[0] });
    setShowModal(true);
  };

  const openEditModal = (reminder) => {
    setEditingId(reminder.id);
    setForm({
      title: reminder.title || '',
      description: reminder.description || '',
      due_date: reminder.due_date ? reminder.due_date.split('T')[0] : '',
      priority: reminder.priority || 'Normal',
      reminder_type: reminder.reminder_type || 'General',
      alert_before: reminder.alert_before ?? 3,
      alert_unit: reminder.alert_unit || 'Days',
      repeat_type: reminder.repeat_type || 'None',
      assigned_to: reminder.assigned_to || '',
      notes: reminder.notes || '',
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const handleFormChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.due_date) {
      toast('Title and Due Date are required', 'error');
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await client.patch(`/workflow/reminders/${editingId}`, form);
        toast('Reminder updated successfully', 'success');
      } else {
        await client.post('/workflow/reminders', form);
        toast('Reminder created successfully', 'success');
      }
      closeModal();
      fetchReminders();
    } catch (err) {
      console.error(err);
      toast(err.response?.data?.error || 'Failed to save reminder', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this reminder?')) return;
    try {
      await client.delete(`/workflow/reminders/${id}`);
      toast('Reminder deleted', 'success');
      fetchReminders();
    } catch (err) {
      toast('Failed to delete reminder', 'error');
    }
  };

  const handleMarkDone = async (id) => {
    try {
      await client.patch(`/workflow/reminders/${id}`, { status: 'Completed' });
      toast('Marked as completed!', 'success');
      fetchReminders();
    } catch (err) {
      toast('Failed to update status', 'error');
    }
  };

  const getDaysUntilDue = (dueDateStr) => {
    const due = new Date(dueDateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const getDueLabel = (days) => {
    if (days < 0) return { label: `${Math.abs(days)}d overdue`, color: '#ef4444' };
    if (days === 0) return { label: 'Due Today', color: '#f97316' };
    if (days <= 3) return { label: `${days}d left`, color: '#f97316' };
    if (days <= 7) return { label: `${days}d left`, color: '#eab308' };
    return { label: `${days}d left`, color: '#22c55e' };
  };

  const getPriorityColor = (priority) => {
    if (priority === 'Critical') return '#ef4444';
    if (priority === 'High') return '#f97316';
    if (priority === 'Normal') return '#eab308';
    return '#22c55e';
  };

  const getStatusBadgeClass = (status) => {
    if (status === 'Completed') return 'badge-green';
    if (status === 'Overdue') return 'badge-red';
    return 'badge-amber';
  };

  const openPortal = (url) => window.open(url, '_blank', 'noopener,noreferrer');

  // Filtered list
  const filteredReminders = reminders.filter(r => {
    if (filterType !== 'All' && r.reminder_type !== filterType) return false;
    if (filterStatus !== 'All' && r.status !== filterStatus) return false;
    if (searchText && !r.title?.toLowerCase().includes(searchText.toLowerCase()) && !r.description?.toLowerCase().includes(searchText.toLowerCase())) return false;
    return true;
  });

  const urgentCount = reminders.filter(r => r.status !== 'Completed' && getDaysUntilDue(r.due_date) <= 3).length;

  return (
    <div className="page active" id="p-reminders">
      {/* Header */}
      <div className="page-title">
        <i className="ti ti-bell"></i> Reminders &amp; Licence Alerts
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
          <button className="btn btn-outline btn-sm" onClick={handleRefresh} disabled={refreshing}>
            <i className={`ti ti-refresh ${refreshing ? 'rotating' : ''}`}></i> {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          <button className="btn btn-gold btn-sm" onClick={openCreateModal}>
            <i className="ti ti-bell" style={{ fontSize: '15px', color: '#fff', opacity: 1, marginRight: '4px' }}></i> Set Reminder
          </button>
        </div>
      </div>

      {/* Urgent Alert Banner */}
      {urgentCount > 0 && (
        <div className="alert alert-danger" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <i className="ti ti-alert-triangle" style={{ fontSize: '18px' }}></i>
          <b>{urgentCount} reminder{urgentCount > 1 ? 's' : ''} require{urgentCount === 1 ? 's' : ''} immediate attention!</b>
        </div>
      )}

      <div className="two-col">
        {/* Left Column */}
        <div>
          {/* Licence Expiry Card */}
          <div className="section-title">Licence Expiry</div>
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div className="card-title">BIS Hallmarking Licence</div>
                <div className="text-sm" style={{ marginTop: '4px' }}>Licence No: {userContext?.bis_licence || 'N/A'}</div>
              </div>
              {userContext?.bis_licence_expiry && (
                <span className={`badge ${new Date(userContext.bis_licence_expiry) < new Date() ? 'badge-red' : 'badge-gold'}`}>
                  {Math.ceil((new Date(userContext.bis_licence_expiry) - new Date()) / (1000 * 60 * 60 * 24))} days left
                </span>
              )}
            </div>
            
            {userContext?.bis_licence_expiry ? (
              <>
                <div className="progress-bar" style={{ marginTop: '12px' }}>
                  <div className="progress-fill" style={{ 
                    width: `${Math.max(0, Math.min(100, Math.ceil((new Date(userContext.bis_licence_expiry) - new Date()) / (1000 * 60 * 60 * 24)) / 365 * 100))}%`, 
                    background: new Date(userContext.bis_licence_expiry) < new Date() ? 'var(--red)' : 'var(--gold)' 
                  }}></div>
                </div>
                <div className="text-sm" style={{ marginTop: '6px' }}>Expires: {new Date(userContext.bis_licence_expiry).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                <div className="btn-row">
                  <button className="btn btn-red btn-sm" onClick={() => openPortal('https://www.bis.gov.in/')}>
                    <i className="ti ti-external-link"></i> Renew on BIS Portal
                  </button>
                  <button className="btn btn-outline btn-sm" onClick={() => {
                    setForm({ ...EMPTY_FORM, title: 'BIS Licence Renewal', reminder_type: 'Licence Renewal', priority: 'High', due_date: userContext.bis_licence_expiry, alert_before: 7 });
                    setEditingId(null);
                    setShowModal(true);
                  }}>
                    <i className="ti ti-bell"></i> Set Reminder
                  </button>
                </div>
              </>
            ) : (
              <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius)' }}>
                <div style={{ fontSize: '12px', color: '#9AB', marginBottom: '8px' }}>Please set your licence expiry date:</div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input 
                    type="date" 
                    className="form-control" 
                    value={expiryInput}
                    onChange={(e) => setExpiryInput(e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <button className="btn btn-gold btn-sm" onClick={saveLicenceExpiry} disabled={saving}>
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Calibration Schedule */}
          <div className="section-title">Calibration Schedule</div>
          <div className="card">
            <table style={{ width: '100%' }}>
              <thead>
                <tr><th>Equipment</th><th>Last Cal.</th><th>Due</th><th>Status</th></tr>
              </thead>
              <tbody>
                {calibrationSchedule.map((item) => (
                  <tr key={item.id}>
                    <td>{item.equipment || item.title}</td>
                    <td className="text-sm">{item.last_cal_date ? new Date(item.last_cal_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}</td>
                    <td className="text-sm">{new Date(item.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</td>
                    <td><span className={`badge ${getStatusBadgeClass(item.status)}`}>{item.status || 'Pending'}</span></td>
                  </tr>
                ))}
                {calibrationSchedule.length === 0 && !loading && (
                  <tr><td colSpan="4" style={{ textAlign: 'center', color: 'var(--text3)' }}>No calibrations scheduled.</td></tr>
                )}
              </tbody>
            </table>
            <div className="btn-row">
              <button className="btn btn-gold btn-sm" onClick={() => {
                setForm({ ...EMPTY_FORM, reminder_type: 'Calibration', title: 'Equipment Calibration' });
                setEditingId(null);
                setShowModal(true);
              }}>
                <i className="ti ti-plus"></i> Add Calibration Event
              </button>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div className="section-title" style={{ margin: 0 }}>Upcoming Reminders</div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <select
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
                style={{ fontSize: '12px', padding: '4px 8px', border: '1px solid var(--border)', borderRadius: '4px', background: 'var(--bg-app)', color: 'var(--text1)' }}
              >
                <option value="All">All Types</option>
                {REMINDER_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                style={{ fontSize: '12px', padding: '4px 8px', border: '1px solid var(--border)', borderRadius: '4px', background: 'var(--bg-app)', color: 'var(--text1)' }}
              >
                <option value="All">All Status</option>
                <option value="Pending">Pending</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          {/* Search */}
          <div className="search-box" style={{ marginBottom: '12px' }}>
            <i className="ti ti-search"></i>
            <input
              type="text"
              placeholder="Search reminders..."
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
            />
          </div>

          <div className="card" style={{ padding: 0 }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text3)' }}>Loading...</div>
            ) : filteredReminders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text3)' }}>
                <i className="ti ti-bell-off" style={{ fontSize: '32px', display: 'block', marginBottom: '8px' }}></i>
                No reminders found.
              </div>
            ) : (
              <div>
                {filteredReminders.map((reminder) => {
                  const days = getDaysUntilDue(reminder.due_date);
                  const dueInfo = getDueLabel(days);
                  const isDone = reminder.status === 'Completed';
                  return (
                    <div
                      key={reminder.id}
                      style={{
                        padding: '14px 16px',
                        borderBottom: '1px solid var(--border)',
                        display: 'flex',
                        gap: '12px',
                        alignItems: 'flex-start',
                        opacity: isDone ? 0.6 : 1,
                        background: isDone ? 'transparent' : days <= 0 ? 'rgba(239,68,68,0.05)' : days <= 3 ? 'rgba(249,115,22,0.05)' : 'transparent',
                      }}
                    >
                      {/* Priority dot */}
                      <div style={{
                        width: '10px', height: '10px', borderRadius: '50%',
                        background: getPriorityColor(reminder.priority),
                        flexShrink: 0, marginTop: '5px'
                      }}></div>

                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                          <div>
                            <div style={{ fontWeight: 600, color: isDone ? 'var(--text3)' : 'var(--text1)', textDecoration: isDone ? 'line-through' : 'none' }}>
                              {reminder.title}
                            </div>
                            {reminder.description && (
                              <div className="text-sm" style={{ color: 'var(--text2)', marginTop: '2px' }}>{reminder.description}</div>
                            )}
                            <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                              <span className="badge badge-blue" style={{ fontSize: '10px' }}>{reminder.reminder_type || 'General'}</span>
                              <span className="badge" style={{ fontSize: '10px', background: 'var(--bg-app)', color: 'var(--text2)', border: '1px solid var(--border)' }}>
                                {reminder.priority}
                              </span>
                              {reminder.repeat_type && reminder.repeat_type !== 'None' && (
                                <span className="badge badge-amber" style={{ fontSize: '10px' }}>
                                  <i className="ti ti-repeat"></i> {reminder.repeat_type}
                                </span>
                              )}
                              {reminder.assigned_to && (
                                <span className="badge" style={{ fontSize: '10px', background: 'var(--bg-app)', color: 'var(--text3)', border: '1px solid var(--border)' }}>
                                  <i className="ti ti-user"></i> {reminder.assigned_to}
                                </span>
                              )}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <div style={{ fontSize: '12px', fontWeight: 700, color: dueInfo.color }}>{dueInfo.label}</div>
                            <div className="text-sm" style={{ color: 'var(--text3)', marginTop: '2px' }}>
                              {new Date(reminder.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </div>
                            {reminder.alert_before && (
                              <div className="text-sm" style={{ color: 'var(--text3)', marginTop: '2px' }}>
                                Alert: {reminder.alert_before} {reminder.alert_unit} before
                              </div>
                            )}
                          </div>
                        </div>
                        {reminder.notes && (
                          <div style={{ marginTop: '6px', fontSize: '12px', color: 'var(--text3)', background: 'var(--bg-app)', padding: '6px 8px', borderRadius: '4px', borderLeft: '2px solid var(--border)' }}>
                            📝 {reminder.notes}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flexShrink: 0 }}>
                        {!isDone && (
                          <button
                            className="btn btn-sm"
                            style={{ fontSize: '11px', padding: '3px 8px', background: 'var(--green)', color: '#fff', border: 'none' }}
                            onClick={() => handleMarkDone(reminder.id)}
                            title="Mark Done"
                          >
                            <i className="ti ti-check"></i>
                          </button>
                        )}
                        <button
                          className="btn btn-outline btn-sm"
                          style={{ fontSize: '11px', padding: '3px 8px' }}
                          onClick={() => openEditModal(reminder)}
                          title="Edit"
                        >
                          <i className="ti ti-edit"></i>
                        </button>
                        <button
                          className="btn btn-outline btn-sm"
                          style={{ fontSize: '11px', padding: '3px 8px', color: 'var(--red)', borderColor: 'var(--red)' }}
                          onClick={() => handleDelete(reminder.id)}
                          title="Delete"
                        >
                          <i className="ti ti-trash"></i>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '20px'
        }}>
          <div className="card" style={{
            width: '100%', maxWidth: '600px', maxHeight: '90vh',
            overflowY: 'auto', padding: '24px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="ti ti-bell" style={{ color: '#000', fontSize: '18px' }}></i>
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '16px' }}>{editingId ? 'Edit Reminder' : 'Set New Reminder'}</div>
                  <div className="text-sm" style={{ color: 'var(--text3)' }}>Fill in the details below</div>
                </div>
              </div>
              <button className="btn btn-outline btn-sm" onClick={closeModal}>
                <i className="ti ti-x"></i>
              </button>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Event Title */}
              <div className="form-group full">
                <label>Event Title <span style={{ color: 'var(--red)' }}>*</span></label>
                <input
                  type="text"
                  placeholder="e.g. BIS Licence Renewal, XRF Calibration Due..."
                  value={form.title}
                  onChange={e => handleFormChange('title', e.target.value)}
                  required
                />
              </div>

              {/* Description */}
              <div className="form-group full">
                <label>Description</label>
                <textarea
                  placeholder="Brief description of the reminder event..."
                  value={form.description}
                  onChange={e => handleFormChange('description', e.target.value)}
                  rows="2"
                  style={{ resize: 'vertical' }}
                />
              </div>

              {/* Type + Priority */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label>Reminder Type</label>
                  <select value={form.reminder_type} onChange={e => handleFormChange('reminder_type', e.target.value)}>
                    {REMINDER_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Priority</label>
                  <select value={form.priority} onChange={e => handleFormChange('priority', e.target.value)}>
                    {PRIORITIES.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
              </div>

              {/* Due Date + Repeat */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label>Due Date <span style={{ color: 'var(--red)' }}>*</span></label>
                  <input
                    type="date"
                    value={form.due_date}
                    onChange={e => handleFormChange('due_date', e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Repeat</label>
                  <select value={form.repeat_type} onChange={e => handleFormChange('repeat_type', e.target.value)}>
                    {REPEAT_TYPES.map(r => <option key={r}>{r}</option>)}
                  </select>
                </div>
              </div>

              {/* Alert Before */}
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text2)', fontWeight: 600 }}>Alert Before Due Date</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={form.alert_before}
                    onChange={e => handleFormChange('alert_before', e.target.value)}
                    style={{ width: '80px' }}
                  />
                  <select
                    value={form.alert_unit}
                    onChange={e => handleFormChange('alert_unit', e.target.value)}
                    style={{ flex: 1 }}
                  >
                    {ALERT_UNITS.map(u => <option key={u}>{u}</option>)}
                  </select>
                  <div className="text-sm" style={{ color: 'var(--text3)', whiteSpace: 'nowrap' }}>
                    before due date
                  </div>
                </div>
                {form.due_date && (
                  <div className="text-sm" style={{ color: 'var(--gold)', marginTop: '4px' }}>
                    ⚡ You will be reminded on:{' '}
                    {(() => {
                      const due = new Date(form.due_date);
                      const alertMs = parseInt(form.alert_before) * (form.alert_unit === 'Hours' ? 3600000 : form.alert_unit === 'Weeks' ? 604800000 : 86400000);
                      const alertDate = new Date(due.getTime() - alertMs);
                      return alertDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
                    })()}
                  </div>
                )}
              </div>

              {/* Assigned To */}
              <div className="form-group full">
                <label>Assigned To</label>
                <input
                  type="text"
                  placeholder="e.g. Manager, Admin, Self..."
                  value={form.assigned_to}
                  onChange={e => handleFormChange('assigned_to', e.target.value)}
                />
              </div>

              {/* Notes */}
              <div className="form-group full">
                <label>Additional Notes</label>
                <textarea
                  placeholder="Any extra information, links, or action items..."
                  value={form.notes}
                  onChange={e => handleFormChange('notes', e.target.value)}
                  rows="2"
                  style={{ resize: 'vertical' }}
                />
              </div>

              {/* Preview Summary */}
              {form.title && form.due_date && (
                <div style={{
                  background: 'rgba(212,175,55,0.08)',
                  border: '1px solid rgba(212,175,55,0.3)',
                  borderRadius: '8px',
                  padding: '12px 14px',
                  fontSize: '13px',
                  color: 'var(--text2)'
                }}>
                  <div style={{ fontWeight: 700, marginBottom: '4px', color: 'var(--gold)' }}>📋 Summary Preview</div>
                  <div><b>{form.title}</b> — {form.reminder_type} · {form.priority} Priority</div>
                  <div style={{ marginTop: '3px' }}>Due: {new Date(form.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                  {form.repeat_type !== 'None' && <div style={{ marginTop: '3px' }}>Repeats: {form.repeat_type}</div>}
                  {form.assigned_to && <div style={{ marginTop: '3px' }}>Assigned to: {form.assigned_to}</div>}
                </div>
              )}

              {/* Actions */}
              <div className="btn-row" style={{ marginTop: '8px' }}>
                <button type="button" className="btn btn-outline" onClick={closeModal} disabled={saving}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-gold" disabled={saving}>
                  <i className={`ti ${saving ? 'ti-loader' : 'ti-bell'}`}></i>
                  {saving ? 'Saving...' : editingId ? 'Update Reminder' : 'Set Reminder'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
