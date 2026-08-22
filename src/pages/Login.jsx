import React, { useState, useEffect, useRef } from 'react';
import client from '../api/client';
import { toast } from '../components/Toast';

import Swal from 'sweetalert2';

export default function Login({ onLogin }) {
  const [activeTab, setActiveTab] = useState('login'); // 'login', 'register', 'forgot'
  
  // Login State
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  
  // Register State
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regMobile, setRegMobile] = useState('');
  const [regCentreName, setRegCentreName] = useState('');
  const [regBisLicence, setRegBisLicence] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regGstNumber, setRegGstNumber] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRetypePassword, setRegRetypePassword] = useState('');
  const [regLogoFile, setRegLogoFile] = useState(null);

  // OTP State for Register
  const [otpSent, setOtpSent] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);

  // Forgot Password State
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtpSent, setForgotOtpSent] = useState(false);
  const [forgotOtpValue, setForgotOtpValue] = useState('');
  const [forgotOtpVerified, setForgotOtpVerified] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [retypeNewPassword, setRetypeNewPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const fileInputRef = useRef(null);

  const getDeviceToken = () => {
    let token = localStorage.getItem('device_token');
    if (!token) {
      token = 'device-' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('device_token', token);
    }
    return token;
  };

  const calculatePasswordStrength = (pwd) => {
    let strength = 0;
    if (pwd.length > 5) strength += 1;
    if (pwd.length > 7) strength += 1;
    if (/[A-Z]/.test(pwd)) strength += 1;
    if (/[0-9]/.test(pwd)) strength += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) strength += 1;
    
    if (strength === 0) return { label: '', color: 'transparent' };
    if (strength <= 2) return { label: 'Weak', color: '#ef4444' };
    if (strength <= 4) return { label: 'Medium', color: '#f59e0b' };
    return { label: 'Strong', color: '#10b981' };
  };

  const handleLoginSubmit = async (e) => {
    e?.preventDefault();
    setLoading(true);
    setError('');

    try {
      const device_token = getDeviceToken();
      const res = await client.post('/auth/login', {
        identifier,
        password,
        device_token: device_token
      });

      localStorage.setItem('token', res.data.token);
      
      Swal.fire({
        title: 'Welcome Back!',
        text: `Successfully logged in as ${res.data.user.name}`,
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
        background: '#ffffff',
        color: '#333333',
        backdrop: `rgba(0,0,0,0.4)`
      });
      
      onLogin({ 
        username: res.data.user.name, 
        tenantId: res.data.user.tenant_id, 
        role: res.data.user.role,
        tenant_name: res.data.user.tenant_name,
        bis_licence: res.data.user.bis_licence,
        tenant_address: res.data.user.tenant_address,
        logo_url: res.data.user.logo_url,
        gst_number: res.data.user.gst_number
      });
    } catch (err) {
      const errorMsg = err.message || 'Login failed. Please check your credentials.';
      Swal.fire({
        title: 'Login Failed',
        text: errorMsg,
        icon: 'error',
        confirmButtonColor: '#d4af37',
        background: '#ffffff',
        color: '#333333'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (email, isForgot = false) => {
    if (!email) {
      setError('Please enter an email address first.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await client.post('/auth/send-otp', { email });
      if (isForgot) setForgotOtpSent(true);
      else setOtpSent(true);
      toast('OTP sent successfully. Check your email.', 'success');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (email, otp, isForgot = false) => {
    if (!otp) return setError('Please enter the OTP.');
    setLoading(true);
    setError('');
    try {
      await client.post('/auth/verify-otp', { email, otp });
      if (isForgot) setForgotOtpVerified(true);
      else setEmailVerified(true);
      toast('Email verified successfully!', 'success');
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    
    if (!emailVerified) return setError('Please verify your email with OTP first.');
    if (regPassword !== regRetypePassword) return setError('Passwords do not match.');
    if (regMobile.length !== 10) return setError('Mobile number must be exactly 10 digits.');
    
    setLoading(true);
    setError('');

    try {
      let logoUrl = '';
      if (regLogoFile) {
        const formData = new FormData();
        formData.append('logo', regLogoFile);
        const uploadRes = await client.post('/auth/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        logoUrl = uploadRes.data.url;
      }

      await client.post('/auth/register', {
        fullName: regFullName,
        email: regEmail,
        mobile: '+91' + regMobile,
        centreName: regCentreName,
        bisLicence: regBisLicence,
        address: regAddress,
        gstNumber: regGstNumber,
        logoUrl,
        password: regPassword
      });
      
      Swal.fire({
        title: 'Registration Successful!',
        text: 'Your Hallmarking Centre has been successfully registered. You can now log in.',
        icon: 'success',
        confirmButtonColor: '#d4af37',
        background: '#ffffff',
        color: '#333333'
      });
      
      setActiveTab('login');
      // Reset form
      setRegEmail(''); setRegFullName(''); setRegMobile(''); setRegCentreName(''); setRegBisLicence('');
      setRegAddress(''); setRegGstNumber(''); setRegPassword(''); setRegRetypePassword(''); setRegLogoFile(null);
      setEmailVerified(false); setOtpSent(false); setOtpValue('');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== retypeNewPassword) return setError('Passwords do not match.');
    setLoading(true);
    setError('');
    try {
      await client.post('/auth/reset-password', { email: forgotEmail, newPassword });
      toast('Password reset successfully. You can now login.', 'success');
      setActiveTab('login');
      setForgotEmail(''); setForgotOtpSent(false); setForgotOtpVerified(false); setForgotOtpValue('');
      setNewPassword(''); setRetypeNewPassword('');
    } catch(err) {
      setError(err.response?.data?.error || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const regPwdStrength = calculatePasswordStrength(regPassword);
  const newPwdStrength = calculatePasswordStrength(newPassword);

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', backgroundColor: 'var(--bg-app)', fontFamily: "'Inter', sans-serif", padding: '20px'
    }}>
      <div className="card" style={{ width: activeTab === 'register' ? '600px' : '420px', padding: '30px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', border: '1px solid var(--border)', transition: 'width 0.3s ease' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '32px', color: 'var(--gold)', marginBottom: '8px' }}>⚜</div>
          <h2 style={{ margin: 0, color: 'var(--text1)', fontWeight: 600 }}>HallmarkPro</h2>
          <div style={{ color: 'var(--text3)', fontSize: '14px', marginTop: '4px' }}>Multi-Tenant Access Gateway</div>
        </div>

        {error && (
          <div className="alert alert-danger" style={{ marginBottom: '20px', padding: '10px', borderRadius: '4px', backgroundColor: '#fee2e2', color: '#991b1b', fontSize: '14px' }}>
            <i className="ti ti-alert-triangle"></i> {error}
          </div>
        )}

        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '20px' }}>
          <button 
            style={{ flex: 1, padding: '10px', background: 'transparent', border: 'none', borderBottom: activeTab === 'login' ? '2px solid var(--gold)' : '2px solid transparent', color: activeTab === 'login' ? 'var(--gold)' : 'var(--text3)', fontWeight: activeTab === 'login' ? 600 : 400, cursor: 'pointer' }}
            onClick={() => { setActiveTab('login'); setError(''); }}
          >
            Login
          </button>
          <button 
            style={{ flex: 1, padding: '10px', background: 'transparent', border: 'none', borderBottom: activeTab === 'register' ? '2px solid var(--gold)' : '2px solid transparent', color: activeTab === 'register' ? 'var(--gold)' : 'var(--text3)', fontWeight: activeTab === 'register' ? 600 : 400, cursor: 'pointer' }}
            onClick={() => { setActiveTab('register'); setError(''); }}
          >
            Sign Up
          </button>
        </div>

        {activeTab === 'login' && (
          <form onSubmit={handleLoginSubmit} className="form-grid" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group full">
              <label>Centre Name or Email</label>
              <input 
                type="text" 
                placeholder="e.g. Royal Assaying Centre or email@example.com" 
                value={identifier} 
                onChange={e => setIdentifier(e.target.value)} 
                required 
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-app)', color: 'var(--text1)' }}
              />
            </div>
            <div className="form-group full">
              <label>Password</label>
              <input 
                type="password" 
                placeholder="Enter password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required 
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-app)', color: 'var(--text1)' }}
              />
            </div>
            
            <div style={{ textAlign: 'right', marginTop: '-10px' }}>
              <button type="button" style={{ background: 'transparent', border: 'none', color: 'var(--gold)', fontSize: '12px', cursor: 'pointer' }} onClick={() => { setActiveTab('forgot'); setError(''); }}>
                Forgot Password?
              </button>
            </div>
            
            <button type="submit" className="btn btn-gold" style={{ width: '100%', padding: '12px', display: 'flex', justifyContent: 'center' }} disabled={loading}>
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>
        )}

        {activeTab === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            
            <div className="form-group full" style={{ gridColumn: '1 / -1' }}>
              <label>Full Name</label>
              <input type="text" placeholder="Admin Name" value={regFullName} onChange={e => setRegFullName(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-app)', color: 'var(--text1)' }} />
            </div>            <div className="form-group full" style={{ gridColumn: '1 / -1' }}>
              <label>Email Address</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input type="email" placeholder="email@example.com" value={regEmail} onChange={e => {setRegEmail(e.target.value); setEmailVerified(false); setOtpSent(false);}} disabled={emailVerified} required style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-app)', color: 'var(--text1)' }} />
                {!emailVerified && !otpSent && (
                  <button type="button" className="btn btn-outline btn-sm" onClick={() => handleSendOtp(regEmail)} disabled={loading || !regEmail}>
                    {loading ? 'Sending...' : 'Send OTP'}
                  </button>
                )}
                {emailVerified && (
                  <span style={{ display: 'flex', alignItems: 'center', color: '#10b981', fontWeight: 'bold', padding: '0 10px', backgroundColor: '#d1fae5', borderRadius: '6px', fontSize: '14px' }}>
                    ✓ Verified
                  </span>
                )}
              </div>
            </div>

            {otpSent && !emailVerified && (
              <div className="form-group full" style={{ gridColumn: '1 / -1' }}>
                <label style={{ color: '#10b981' }}>✓ OTP Sent Successfully</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input type="text" placeholder="Enter 6-digit OTP" value={otpValue} onChange={e => setOtpValue(e.target.value)} style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-app)', color: 'var(--text1)' }} />
                  <button type="button" className="btn btn-gold btn-sm" onClick={() => handleVerifyOtp(regEmail, otpValue)} disabled={loading || !otpValue}>
                    {loading ? 'Verifying...' : 'Verify'}
                  </button>
                </div>
              </div>
            )}

            <div className="form-group full" style={{ gridColumn: '1 / -1' }}>
              <label>Mobile Number</label>
              <div style={{ display: 'flex' }}>
                <span style={{ padding: '10px', background: 'var(--border)', border: '1px solid var(--border)', borderRadius: '6px 0 0 6px', color: 'var(--text2)' }}>+91</span>
                <input type="text" placeholder="10-digit number" value={regMobile} onChange={e => setRegMobile(e.target.value.replace(/\D/g, '').slice(0, 10))} required style={{ flex: 1, padding: '10px', borderRadius: '0 6px 6px 0', border: '1px solid var(--border)', backgroundColor: 'var(--bg-app)', color: 'var(--text1)' }} />
              </div>
            </div>

            <div className="form-group full">
              <label>Hallmarking Centre Name</label>
              <input type="text" placeholder="e.g. Royal Assaying" value={regCentreName} onChange={e => setRegCentreName(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-app)', color: 'var(--text1)' }} />
            </div>

            <div className="form-group full">
              <label>BIS Licence Number</label>
              <input type="text" placeholder="e.g. HM/C-1234567" value={regBisLicence} onChange={e => setRegBisLicence(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-app)', color: 'var(--text1)' }} />
            </div>
            
            <div className="form-group full">
              <label>GST Number</label>
              <input type="text" placeholder="e.g. 22AAAAA0000A1Z5" value={regGstNumber} onChange={e => setRegGstNumber(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-app)', color: 'var(--text1)' }} />
            </div>

            <div className="form-group full">
              <label>Centre Logo</label>
              <input type="file" ref={fileInputRef} accept="image/*" onChange={e => setRegLogoFile(e.target.files[0])} style={{ width: '100%', padding: '7px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-app)', color: 'var(--text1)', fontSize: '13px' }} />
            </div>

            <div className="form-group full" style={{ gridColumn: '1 / -1' }}>
              <label>Centre Address</label>
              <textarea placeholder="Full address" value={regAddress} onChange={e => setRegAddress(e.target.value)} required rows="2" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-app)', color: 'var(--text1)', resize: 'vertical' }} />
            </div>

            <div className="form-group full">
              <label>Password</label>
              <input type="password" placeholder="Create password" value={regPassword} onChange={e => setRegPassword(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-app)', color: 'var(--text1)' }} />
              {regPassword && (
                <div style={{ marginTop: '4px', fontSize: '12px', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text3)' }}>Strength:</span>
                  <span style={{ color: regPwdStrength.color, fontWeight: 'bold' }}>{regPwdStrength.label}</span>
                </div>
              )}
            </div>

            <div className="form-group full">
              <label>Retype Password</label>
              <input type="password" placeholder="Confirm password" value={regRetypePassword} onChange={e => setRegRetypePassword(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-app)', color: 'var(--text1)' }} />
              {regRetypePassword && regPassword !== regRetypePassword && (
                <div style={{ marginTop: '4px', fontSize: '12px', color: '#ef4444' }}>Passwords do not match</div>
              )}
            </div>
            
            <button type="submit" className="btn btn-gold" style={{ gridColumn: '1 / -1', width: '100%', padding: '12px', marginTop: '10px', display: 'flex', justifyContent: 'center' }} disabled={loading || !emailVerified}>
              {loading ? 'Creating Account...' : 'Register Centre'}
            </button>
          </form>
        )}

        {activeTab === 'forgot' && (
          <div style={{ padding: '10px 0' }}>
            <h3 style={{ margin: '0 0 20px 0', color: 'var(--text1)', textAlign: 'center' }}>Reset Password</h3>
            
            {!forgotOtpVerified ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group full">
                  <label>Registered Email</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input type="email" placeholder="email@example.com" value={forgotEmail} onChange={e => {setForgotEmail(e.target.value); setForgotOtpSent(false);}} disabled={forgotOtpSent} required style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-app)', color: 'var(--text1)' }} />
                    {!forgotOtpSent && (
                      <button type="button" className="btn btn-outline btn-sm" onClick={() => handleSendOtp(forgotEmail, true)} disabled={loading || !forgotEmail}>
                        {loading ? 'Sending...' : 'Send OTP'}
                      </button>
                    )}
                  </div>
                </div>

                {forgotOtpSent && (
                  <div className="form-group full">
                    <label style={{ color: '#10b981' }}>✓ OTP Sent Successfully</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input type="text" placeholder="Enter 6-digit OTP" value={forgotOtpValue} onChange={e => setForgotOtpValue(e.target.value)} style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-app)', color: 'var(--text1)' }} />
                      <button type="button" className="btn btn-gold btn-sm" onClick={() => handleVerifyOtp(forgotEmail, forgotOtpValue, true)} disabled={loading || !forgotOtpValue}>
                        {loading ? 'Verifying...' : 'Verify'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group full">
                  <label>New Password</label>
                  <input type="password" placeholder="Create new password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-app)', color: 'var(--text1)' }} />
                  {newPassword && (
                    <div style={{ marginTop: '4px', fontSize: '12px', display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text3)' }}>Strength:</span>
                      <span style={{ color: newPwdStrength.color, fontWeight: 'bold' }}>{newPwdStrength.label}</span>
                    </div>
                  )}
                </div>

                <div className="form-group full">
                  <label>Retype New Password</label>
                  <input type="password" placeholder="Confirm new password" value={retypeNewPassword} onChange={e => setRetypeNewPassword(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-app)', color: 'var(--text1)' }} />
                  {retypeNewPassword && newPassword !== retypeNewPassword && (
                    <div style={{ marginTop: '4px', fontSize: '12px', color: '#ef4444' }}>Passwords do not match</div>
                  )}
                </div>
                
                <button type="submit" className="btn btn-gold" style={{ width: '100%', padding: '12px', display: 'flex', justifyContent: 'center' }} disabled={loading}>
                  Reset Password
                </button>
              </form>
            )}

            <button 
              className="btn btn-outline" 
              style={{ marginTop: '20px', width: '100%', display: 'flex', justifyContent: 'center' }}
              onClick={() => { setActiveTab('login'); setError(''); setForgotOtpSent(false); setForgotOtpVerified(false); }}
            >
              Back to Login
            </button>
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '11px', color: 'var(--text3)' }}>
          Strict Tenant Isolation Active • Single Device Enforced
        </div>
      </div>
    </div>
  );
}
