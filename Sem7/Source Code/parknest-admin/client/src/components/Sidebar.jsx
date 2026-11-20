import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ParkingCircle,
  Map,
  CalendarCheck,
  BarChart3,
  Cpu,
  Radio,
  Users,
  Settings,
  Car
} from 'lucide-react';

const Sidebar = ({ mobileOpen = false, onNavigate = () => {} }) => {
  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { name: 'Live Parking', icon: ParkingCircle, path: '/live-parking' },
    { name: 'Parking Areas', icon: Map, path: '/areas' },
    { name: 'Reservations', icon: CalendarCheck, path: '/reservations' },
    { name: 'Analytics', icon: BarChart3, path: '/analytics' },
    { name: 'Sensors', icon: Cpu, path: '/sensors' },
    { name: 'Sensor Monitor', icon: Radio, path: '/sensor-monitor' },
    { name: 'Users', icon: Users, path: '/users' },
    { name: 'Settings', icon: Settings, path: '/settings' },
  ];

  return (
    <aside className={`fixed left-0 top-0 z-40 flex h-screen w-64 flex-col bg-parknest-dark text-white transition-transform duration-200 lg:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="p-6 flex items-center gap-3 border-b border-gray-700">
        <div className="bg-parknest-blue p-2 rounded-lg">
          <Car size={24} />
        </div>
        <span className="text-xl font-bold tracking-tight">ParkNest</span>
      </div>

      <nav className="mt-4 flex-1 space-y-2 overflow-y-auto p-4">
        {menuItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            onClick={onNavigate}
            className={({ isActive }) => `
              flex items-center gap-3 p-3 rounded-lg transition-colors
              ${isActive
                ? 'bg-parknest-blue text-white'
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'}
            `}
          >
            <item.icon size={20} />
            <span className="font-medium">{item.name}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-700">
        <NavLink to="/user" onClick={onNavigate} className="mb-3 flex items-center gap-2 rounded-lg bg-gray-800 px-3 py-2 text-sm font-semibold text-blue-200 hover:bg-gray-700">
          <Car size={17} /> Open driver app
        </NavLink>
        <div className="flex items-center gap-3 p-2">
          <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
            <Users size={16} />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium">Admin User</span>
            <span className="text-xs text-gray-500">admin@parknest.com</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
