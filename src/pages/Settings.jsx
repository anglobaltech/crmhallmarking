import React, { useState, useEffect, useRef } from 'react';
import client, { getImageUrl } from '../api/client';
import { toast } from '../components/Toast';

export default function Settings({ userContext, setUserContext }) {
  const [profile, setProfile] = useState({
    centre_name: '',
    bis_licence: '',
    gst_number: '',
    address: '',
    mobile: '',
    full_name: '',
    email: '',
    logo_url: ''
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await client.get('/auth/settings');
      if (res.data.profile) {
        setProfile(res.data.profile);
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err);
      toast('Failed to load centre profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      await client.put('/auth/settings', profile);
      toast('Profile updated successfully', 'success');
      if (setUserContext && userContext) {
        setUserContext({
          ...userContext,
          tenant_name: profile.centre_name,
          bis_licence: profile.bis_licence,
          tenant_address: profile.address,
          name: profile.full_name,
          logo_url: profile.logo_url,
          gst_number: profile.gst_number
        });
      }
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to update settings:', err);
      toast('Failed to save profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append('logo', file);
    
    try {
      const res = await client.post('/auth/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.url) {
        setProfile({ ...profile, logo_url: res.data.url });
        toast('Logo uploaded successfully', 'success');
        if (setUserContext && userContext) {
          setUserContext({ ...userContext, logo_url: res.data.url });
        }
      }
    } catch (err) {
      console.error('Logo upload error:', err);
      toast('Failed to upload logo', 'error');
    }
  };

  return (
    <div className="page active" id="p-settings">
      <div className="page-title">
        <i className="ti ti-adjustments"></i> Settings
      </div>
      
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div className="card">
          <div className="card-header" style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="card-title">Centre Profile</div>
            {!isEditing && !loading && (
              <button className="btn btn-outline btn-sm" onClick={() => setIsEditing(true)}>
                <i className="ti ti-edit"></i> Edit Profile
              </button>
            )}
          </div>
          
          {loading ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>Loading profile...</div>
          ) : (
            <>
              {/* Logo Section */}
              <div className="form-group" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div 
                  style={{ 
                    width: '64px', height: '64px', borderRadius: '8px', 
                    background: profile.logo_url ? '#fff' : '#F5F4F0',
                    border: '1px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    overflow: 'hidden'
                  }}
                >
                  {profile.logo_url ? (
                    <img src={getImageUrl(profile.logo_url)} alt="Logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                  ) : (
                    <i className="ti ti-photo" style={{ fontSize: '24px', color: '#CCC' }}></i>
                  )}
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px' }}>Centre Logo</label>
                  {isEditing && (
                    <>
                      <input type="file" accept="image/*" style={{ display: 'none' }} ref={fileInputRef} onChange={handleLogoUpload} />
                      <button className="btn btn-outline btn-sm" onClick={() => fileInputRef.current.click()}>
                        <i className="ti ti-upload"></i> Upload Logo
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label>Centre Name</label>
                <input type="text" value={profile.centre_name || ''} onChange={e => setProfile({...profile, centre_name: e.target.value})} disabled={!isEditing} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '10px' }}>
                <div className="form-group">
                  <label>BHC Licence Number</label>
                  <input type="text" value={profile.bis_licence || ''} onChange={e => setProfile({...profile, bis_licence: e.target.value})} disabled={!isEditing} />
                </div>
                <div className="form-group">
                  <label>GST Number</label>
                  <input type="text" value={profile.gst_number || ''} onChange={e => setProfile({...profile, gst_number: e.target.value})} disabled={!isEditing} />
                </div>
              </div>

              <div className="form-group" style={{ marginTop: '10px' }}>
                <label>Centre Address</label>
                <textarea value={profile.address || ''} onChange={e => setProfile({...profile, address: e.target.value})} disabled={!isEditing}></textarea>
              </div>

              <div className="divider"></div>
              <div className="card-title" style={{ marginBottom: '12px', fontSize: '14px', color: '#666' }}>Admin Contact Details</div>

              <div className="form-group" style={{ marginTop: '10px' }}>
                <label>Admin Name</label>
                <input type="text" value={profile.full_name || ''} onChange={e => setProfile({...profile, full_name: e.target.value})} disabled={!isEditing} />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '10px' }}>
                <div className="form-group">
                  <label>Email Address <span style={{fontSize:'11px', color:'#999', marginLeft:'4px'}}>(Cannot be changed)</span></label>
                  <input type="email" value={profile.email || ''} disabled={true} style={{ background: '#F5F4F0' }} />
                </div>
                <div className="form-group">
                  <label>Contact Mobile</label>
                  <div style={{ display: 'flex' }}>
                    <div style={{ padding: '8px 12px', background: '#F8F7F4', border: '1px solid var(--border)', borderRight: 'none', borderRadius: '4px 0 0 4px', color: '#666', display: 'flex', alignItems: 'center', fontSize: '13px' }}>+91</div>
                    <input type="tel" value={profile.mobile || ''} onChange={e => {
                      const val = e.target.value.replace(/\D/g, '');
                      if (val.length <= 10) setProfile({...profile, mobile: val});
                    }} style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }} placeholder="10-digit mobile" disabled={!isEditing} />
                  </div>
                </div>
              </div>

              {isEditing && (
                <div className="btn-row" style={{ marginTop: '20px', gap: '10px', display: 'flex' }}>
                  <button className="btn btn-gold" onClick={handleSaveProfile} disabled={saving}>
                    <i className={`ti ${saving ? 'ti-loader rotating' : 'ti-device-floppy'}`}></i> {saving ? 'Saving...' : 'Save Profile'}
                  </button>
                  <button className="btn btn-outline" onClick={() => {
                    setIsEditing(false);
                    fetchSettings(); // Revert changes
                  }} disabled={saving}>
                    Cancel
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
