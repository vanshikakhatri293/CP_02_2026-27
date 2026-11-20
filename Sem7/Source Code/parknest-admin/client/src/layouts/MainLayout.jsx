import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { Menu, X } from 'lucide-react';

const MainLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <div className="min-h-screen w-full bg-gray-50">
      {mobileOpen && <button type="button" aria-label="Close admin navigation" onClick={() => setMobileOpen(false)} className="fixed inset-0 z-30 bg-slate-950/50 lg:hidden" />}
      <Sidebar mobileOpen={mobileOpen} onNavigate={() => setMobileOpen(false)} />
      <main className="min-h-screen lg:ml-64">
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
          <button type="button" onClick={() => setMobileOpen(!mobileOpen)} aria-label={mobileOpen ? 'Close admin menu' : 'Open admin menu'} className="rounded-lg p-2 text-slate-700 hover:bg-slate-100">
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <span className="text-sm font-bold text-slate-900">ParkNest Admin</span>
          <span className="w-9" />
        </div>
        <div className="p-4 sm:p-6 lg:p-8">
        <Outlet />
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
