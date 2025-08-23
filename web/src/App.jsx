// web/src/App.jsx
import React, { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import LoginUnified from './pages/LoginUnified'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import OtpLogs from './pages/OtpLogs'
import Settings from './pages/Settings'
import AdminDashboard from './pages/Admin/AdminDashboard'
import Users from './pages/Admin/Users'
import AdminInvoices from './pages/Admin/Invoices'
import WalletTopups from './pages/Admin/WalletTopups'
import InvoicesUser from './pages/InvoicesUser'
import DepositConfigAdmin from './pages/Admin/DepositConfig';
import LiveDemo from './pages/LiveDemo';
import DedicatedOrders from './pages/Admin/DedicatedOrders.jsx';
import GlobalSenders from './pages/Admin/GlobalSenders.jsx'; // <-- NEW
import Footer from './components/Footer';
import Header from './components/Header';
import About from './pages/company/About';
import Careers from './pages/company/Careers';
import Blog from './pages/company/Blog.jsx'
import HelpCenter from './pages/support/HelpCenter.jsx'
import Contact_us from './pages/support/Contact_us';
import FAQ from './pages/support/FAQ.jsx'
import Privacy from './pages/Legal/Privacy.jsx'
import Terms from './pages/Legal/Terms';
import Security from './pages/Legal/Security.jsx'
import AOS from "aos";
import "aos/dist/aos.css";
import PasswordReset from './pages/PasswordReset.jsx';



function Guard({ children, expect = 'API' }) {
  const token = localStorage.getItem(expect === 'ADMIN' ? 'admin_token' : 'api_token')
  return token ? children : <Navigate to="/login" />
}

export default function App() {
  useEffect(() => {
    AOS.init({
      offset: 100,
      duration: 800,
      easing: "ease-in",
      delay: 100,
    });
    AOS.refresh();
  }, []);
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<LoginUnified />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot" element={<PasswordReset />} />


        {/* API user app */}
        <Route path="/app" element={<Guard expect="API"><Dashboard /></Guard>} />
        <Route path="/logs" element={<Guard expect="API"><OtpLogs /></Guard>} />
        <Route path="/settings" element={<Guard expect="API"><Settings /></Guard>} />
        <Route path="/invoices" element={<Guard expect="API"><InvoicesUser /></Guard>} />
        <Route path="/demo" element={<LiveDemo />} />
        <Route path="/about" element={<About />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/careers" element={<Careers />} />
        <Route path="/help" element={<HelpCenter />} />
        <Route path="/contact" element={<Contact_us />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/security" element={<Security />} />


        {/* Admin app */}
        <Route path="/admin" element={<Guard expect="ADMIN"><AdminDashboard /></Guard>} />
        <Route path="/admin/users" element={<Guard expect="ADMIN"><Users /></Guard>} />
        <Route path="/admin/invoices" element={<Guard expect="ADMIN"><AdminInvoices /></Guard>} />
        <Route path="/admin/wallet-topups" element={<Guard expect="ADMIN"><WalletTopups /></Guard>} />
        <Route path="/admin/deposit" element={<Guard expect="ADMIN"><DepositConfigAdmin /></Guard>} />
        <Route path="/admin/dedicated" element={<DedicatedOrders />} />
        <Route path="/admin/global-senders" element={<Guard expect="ADMIN"><GlobalSenders /></Guard>} /> {/* NEW */}




        {/* 404 */}
        <Route path="*" element={<div className="px-10">Not found.</div>} />
      </Routes>
      <Footer />
    </div>
  )
}