import React, { useState, useEffect } from 'react';
import LockOverlay from './components/LockOverlay';
import TopBar from './components/TopBar';
import DeskNav from './components/DeskNav';
import Sidebar from './components/Sidebar';
import ToastContainer from './components/Toast';

import Dashboard from './pages/Dashboard';
import Intake from './pages/Intake';
import Articles from './pages/Articles';
import Delivery from './pages/Delivery';
import DeliveryVoucher from './pages/DeliveryVoucher';
import DeliveryVouchers from './pages/DeliveryVouchers';
import Discount from './pages/Discount';
import WeightCheck from './pages/WeightCheck';
import ImageAuto from './pages/ImageAuto';
import Xrf from './pages/Xrf';
import HuidEntry from './pages/HuidEntry';
import HuidRegister from './pages/HuidRegister';
import PortalLinks from './pages/PortalLinks';
import DailyReport from './pages/DailyReport';
import Reminders from './pages/Reminders';
import Services from './pages/Services';
import Settings from './pages/Settings';
import LaserCutting from './pages/LaserCutting';
import Soldering from './pages/Soldering';
import FireAssay from './pages/FireAssay';
import GoldExchange from './pages/GoldExchange';
import ServiceDeliveryVouchers from './pages/ServiceDeliveryVouchers';
import BillingDashboard from './pages/BillingDashboard';
import CreateInvoice from './pages/CreateInvoice';
import Login from './pages/Login';

const deskDefaultPage = {
  dashboard_nav: 'dashboard',
  reception: 'intake',
  quality: 'xrf',
  huid: 'huidentry',
  admin: 'dailyreport',
  extra_services: 'lasercutting'
};

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userContext, setUserContext] = useState(null);
  const [isLocked, setIsLocked] = useState(true);
  const [currentDesk, setCurrentDesk] = useState('reception');
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [globalEdit, setGlobalEdit] = useState(null);

  const handleLogin = (userData) => {
    setUserContext(userData);
    setIsAuthenticated(true);
    setIsLocked(false);
  };

  const handleDeskChange = (desk) => {
    setCurrentDesk(desk);
    setCurrentPage(deskDefaultPage[desk]);
  };

  // If not authenticated via the main login screen, show login
  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard userContext={userContext} setPage={setCurrentPage} globalEdit={globalEdit} setGlobalEdit={setGlobalEdit} />;
      case 'intake': return <Intake setPage={setCurrentPage} userContext={userContext} />;
      case 'articles': return <Articles setPage={setCurrentPage} userContext={userContext} globalEdit={globalEdit} setGlobalEdit={setGlobalEdit} />;
      case 'delivery': return <Delivery userContext={userContext} />;
      case 'delivery_vouchers': return <DeliveryVouchers userContext={userContext} />;
      case 'delivery_voucher': return <DeliveryVoucher userContext={userContext} />;
      case 'discount': return <BillingDashboard userContext={userContext} />;
      case 'xrf': return <Xrf userContext={userContext} setPage={setCurrentPage} globalEdit={globalEdit} setGlobalEdit={setGlobalEdit} />;
      case 'weightcheck': return <WeightCheck userContext={userContext} />;
      case 'imageauto': return <ImageAuto userContext={userContext} />;
      case 'huidentry': return <HuidEntry userContext={userContext} />;
      case 'huidregister': return <HuidRegister userContext={userContext} />;
      case 'portal-links': return <PortalLinks userContext={userContext} />;
      case 'dailyreport': return <DailyReport userContext={userContext} />;
      case 'reminders': return <Reminders userContext={userContext} setUserContext={setUserContext} />;
      case 'services': return <Services userContext={userContext} />;
      case 'settings': return <Settings userContext={userContext} setUserContext={setUserContext} />;
      case 'lasercutting': return <LaserCutting setPage={setCurrentPage} userContext={userContext} globalEdit={globalEdit} setGlobalEdit={setGlobalEdit} />;
      case 'soldering': return <Soldering setPage={setCurrentPage} userContext={userContext} globalEdit={globalEdit} setGlobalEdit={setGlobalEdit} />;
      case 'fireassay': return <FireAssay setPage={setCurrentPage} userContext={userContext} globalEdit={globalEdit} setGlobalEdit={setGlobalEdit} />;
      case 'goldexchange': return <GoldExchange setPage={setCurrentPage} userContext={userContext} globalEdit={globalEdit} setGlobalEdit={setGlobalEdit} />;
      case 'service_vouchers': return <ServiceDeliveryVouchers userContext={userContext} />;
      case 'billing': return <BillingDashboard userContext={userContext} />;
      default: return <div>Page {currentPage} not implemented yet.</div>;
    }
  };

  return (
    <>
      <LockOverlay isLocked={isLocked} onUnlock={() => setIsLocked(false)} />
      <TopBar setLocked={setIsLocked} setPage={setCurrentPage} userContext={userContext} />
      <DeskNav currentDesk={currentDesk} onDeskChange={handleDeskChange} userContext={userContext} />
      
      <div id="main">
        <Sidebar 
          currentDesk={currentDesk} 
          currentPage={currentPage} 
          setPage={setCurrentPage} 
        />
        <div id="content">
          {renderPage()}
        </div>
      </div>
      <ToastContainer />
    </>
  );
}
