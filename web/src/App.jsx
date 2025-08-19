// web/src/App.jsx
import React from 'react'
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



function Guard({ children, expect = 'API' }) {
  const token = localStorage.getItem(expect === 'ADMIN' ? 'admin_token' : 'api_token')
  return token ? children : <Navigate to="/login" />
}

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<LoginUnified />} />
        <Route path="/register" element={<Register />} />

        {/* API user app */}
        <Route path="/app" element={<Guard expect="API"><Dashboard /></Guard>} />
        <Route path="/logs" element={<Guard expect="API"><OtpLogs /></Guard>} />
        <Route path="/settings" element={<Guard expect="API"><Settings /></Guard>} />
        <Route path="/invoices" element={<Guard expect="API"><InvoicesUser /></Guard>} />
         <Route path="/demo" element={<LiveDemo />} />


        {/* Admin app */}
        <Route path="/admin" element={<Guard expect="ADMIN"><AdminDashboard /></Guard>} />
        <Route path="/admin/users" element={<Guard expect="ADMIN"><Users /></Guard>} />
        <Route path="/admin/invoices" element={<Guard expect="ADMIN"><AdminInvoices /></Guard>} />
        <Route path="/admin/wallet-topups" element={<Guard expect="ADMIN"><WalletTopups /></Guard>} />
        <Route path="/admin/deposit" element={<Guard expect="ADMIN"><DepositConfigAdmin /></Guard>} />


        {/* 404 */}
        <Route path="*" element={<div className="px-10">Not found.</div>} />
      </Routes>
    </div>
  )
}