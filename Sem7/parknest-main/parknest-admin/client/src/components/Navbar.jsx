import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import {
  Car,
  Shield,
  Radio,
  LogOut,
  ChevronDown,
  Calendar,
  CalendarCheck,
  Wrench,
  UserRound,
  Home
} from 'lucide-react';
import AuthModal from './AuthModal';

const Navbar = ({ socketConnected, realSensor, onSignIn }) => {
  const { user, logout, getDefaultVehicle } = useUser();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isDriverApp = pathname.startsWith('/user');

  const defaultVehicle = getDefaultVehicle();

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex min-h-16 items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3 sm:gap-6">
              <div
                onClick={() => navigate('/user')}
                className="group flex shrink-0 cursor-pointer items-center gap-2.5"
              >
                <div className="rounded-xl bg-blue-600 p-2 text-white transition-transform group-hover:scale-105">
                  <Car size={22} className="text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">ParkNest</span>
                    <span className="hidden rounded-full border border-blue-100 bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700 sm:inline-flex">
                      Driver
                    </span>
                  </div>
                  <span className="hidden text-[11px] leading-tight text-slate-500 sm:block">Smart parking & mobility</span>
                </div>
              </div>

              <div className="hidden items-center rounded-xl border border-slate-200 bg-slate-50 p-1 md:flex">
                <button
                  onClick={() => {
                    navigate('/user');
                  }}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isDriverApp
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-white hover:text-slate-900'
                  }`}
                >
                  <Car size={14} />
                  <span>Driver App</span>
                </button>
                <button
                  onClick={() => {
                    navigate('/');
                  }}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    !isDriverApp
                      ? 'bg-slate-800 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-white hover:text-slate-900'
                  }`}
                >
                  <Shield size={14} />
                  <span>Admin Operations Panel</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] sm:flex">
                <Radio size={14} className={socketConnected ? 'animate-pulse text-emerald-600' : 'text-amber-600'} />
                <span className="font-mono font-semibold text-slate-600">PN-A-001</span>
                <span className={`max-w-28 truncate font-semibold ${realSensor?.lastSource === 'PHYSICAL SENSOR' ? 'text-emerald-700' : 'text-slate-500'}`}>
                  {realSensor?.status === 'OFFLINE' ? 'Offline' : realSensor?.lastSource || 'Awaiting telemetry'}
                </span>
              </div>

              {user.isLoggedIn ? (
                <div className="relative">
                  <button
                    onClick={() => setShowUserDropdown(!showUserDropdown)}
                    className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-left transition-colors hover:bg-slate-50 sm:px-3"
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-[11px] font-bold text-blue-700">
                      {defaultVehicle?.plate?.slice(0, 2) || 'PN'}
                    </div>
                    <div className="hidden text-left sm:block">
                      <div className="max-w-32 truncate text-xs font-semibold leading-none text-slate-900">{defaultVehicle?.plate || user.name}</div>
                      <div className="mt-1 max-w-32 truncate text-[10px] leading-tight text-slate-500">{defaultVehicle ? `${defaultVehicle.model} (${defaultVehicle.type})` : user.phone}</div>
                    </div>
                    <ChevronDown size={14} className="text-slate-500" />
                  </button>

                  {showUserDropdown && (
                    <div className="absolute right-0 z-50 mt-2 w-60 rounded-2xl border border-slate-200 bg-white py-2 text-xs text-slate-700 shadow-xl">
                      <div className="border-b border-slate-100 px-4 py-2">
                        <p className="font-semibold text-slate-900">{user.name}</p>
                        <p className="text-[11px] text-slate-500">{user.phone}</p>
                      </div>
                      <button
                        onClick={() => { setShowUserDropdown(false); navigate('/user/profile'); }}
                        className="flex w-full items-center gap-2 px-4 py-2 text-left hover:bg-slate-50"
                      >
                        <Car size={14} className="text-blue-600" />
                        <span>Manage car details ({user.vehicles.length})</span>
                      </button>
                      <button
                        onClick={() => { setShowUserDropdown(false); navigate('/user/reservations'); }}
                        className="flex w-full items-center gap-2 px-4 py-2 text-left hover:bg-slate-50"
                      >
                        <Calendar size={14} className="text-blue-600" />
                        <span>My active bookings</span>
                      </button>
                      <button
                        onClick={() => { setShowUserDropdown(false); logout(); }}
                        className="mt-1 flex w-full items-center gap-2 border-t border-slate-100 px-4 py-2 text-left text-red-700 hover:bg-red-50"
                      >
                        <LogOut size={14} />
                        <span>Sign out</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => onSignIn ? onSignIn() : setShowAuthModal(true)}
                  className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-700 sm:px-4"
                >
                  Sign in
                </button>
              )}
            </div>
          </div>

          <div className="flex gap-2 border-t border-slate-100 py-2 md:hidden">
            <button
              onClick={() => navigate('/user')}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold ${
                isDriverApp ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              <Car size={14} /> Driver app
            </button>
            <button
              onClick={() => navigate('/')}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold ${
                !isDriverApp ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              <Shield size={14} /> Admin panel
            </button>
          </div>

          {isDriverApp && (
            <nav aria-label="Driver app navigation" className="flex items-center justify-between gap-0.5 overflow-x-auto border-t border-slate-100 py-2 sm:gap-1 lg:justify-center">
                <NavLink
                  to="/user"
                  end
                  aria-label="Home and map"
                  className={({ isActive }) =>
                    `shrink-0 rounded-lg px-2 py-1.5 text-[11px] font-medium transition-colors sm:px-3 sm:text-xs ${
                      isActive ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`
                  }
                >
                  <span className="inline-flex items-center gap-1.5"><Home size={13} /><span className="sm:hidden">Home</span><span className="hidden sm:inline">Home & map</span></span>
                </NavLink>
                <NavLink
                  to="/user/book"
                  aria-label="Book a parking slot"
                  className={({ isActive }) =>
                    `flex shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-medium transition-colors sm:px-3 sm:text-xs ${
                      isActive ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`
                  }
                >
                  <Calendar size={13} />
                  <span className="sm:hidden">Book</span><span className="hidden sm:inline">Book Slot</span>
                </NavLink>
                <NavLink
                  to="/user/reservations"
                  aria-label="My reservations"
                  className={({ isActive }) =>
                    `flex shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-medium transition-colors sm:px-3 sm:text-xs ${
                      isActive ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`
                  }
                >
                  <CalendarCheck size={13} /><span className="sm:hidden">Trips</span><span className="hidden sm:inline">My reservations</span>
                </NavLink>
                <NavLink
                  to="/user/services"
                  aria-label="Nearby services"
                  className={({ isActive }) =>
                    `flex shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-medium transition-colors sm:px-3 sm:text-xs ${
                      isActive ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`
                  }
                >
                  <Wrench size={13} />
                  <span className="sm:hidden">Services</span><span className="hidden sm:inline">Nearby services</span>
                </NavLink>
                <NavLink
                  to="/user/profile"
                  aria-label="Profile"
                  className={({ isActive }) =>
                    `flex shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-medium transition-colors sm:px-3 sm:text-xs ${
                      isActive ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`
                  }
                >
                  <UserRound size={13} /> Profile
                </NavLink>
            </nav>
          )}
        </div>
      </header>

      {/* OTP Auth Modal */}
      {showAuthModal && (
        <AuthModal onClose={() => setShowAuthModal(false)} />
      )}
    </>
  );
};

export default Navbar;
