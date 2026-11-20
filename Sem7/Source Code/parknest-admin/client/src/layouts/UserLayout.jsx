import React, { useCallback, useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, LoaderCircle, MapPin } from 'lucide-react';
import Navbar from '../components/Navbar';
import { useUser } from '../context/UserContext';
import { parkingService, reservationService, sensorService } from '../services/api';
import { useSocket } from '../hooks/useSocket';
import useDeviceLocation from '../hooks/useDeviceLocation';
import AuthModal from '../components/AuthModal';

const UserLayout = () => {
  const { user } = useUser();
  const location = useLocation();
  const navigate = useNavigate();
  const socket = useSocket();
  const { location: deviceLocation, status: locationStatus, error: locationError, locate } = useDeviceLocation();
  const [slots, setSlots] = useState([]);
  const [sensors, setSensors] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [socketConnected, setSocketConnected] = useState(false);
  const [authOpen, setAuthOpen] = useState(() => !user.isLoggedIn);

  const refreshParkingData = useCallback(async () => {
    setLoadError('');
    try {
      const [slotResponse, sensorResponse, reservationResponse] = await Promise.all([
        parkingService.getSlots(),
        sensorService.getSensors(),
        reservationService.getReservations()
      ]);
      setSlots(slotResponse.data || []);
      setSensors(sensorResponse.data || []);
      setReservations(reservationResponse.data || []);
    } catch (error) {
      setLoadError(error.response?.data?.message || 'Could not load live parking data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user.isLoggedIn) {
      setLoading(false);
      return;
    }
    setLoading(true);
    refreshParkingData();
    locate();
  }, [user.isLoggedIn, refreshParkingData, locate]);

  useEffect(() => {
    if (!user.isLoggedIn) setAuthOpen(true);
  }, [user.isLoggedIn]);

  useEffect(() => {
    if (!socket) return undefined;
    const handleConnect = () => setSocketConnected(true);
    const handleDisconnect = () => setSocketConnected(false);
    const handleSlotUpdate = (updatedSlot) => {
      if (!updatedSlot?.slotId) return;
      setSlots((current) => {
        const exists = current.some((slot) => slot.slotId === updatedSlot.slotId);
        return exists
          ? current.map((slot) => slot.slotId === updatedSlot.slotId ? { ...slot, ...updatedSlot } : slot)
          : [...current, updatedSlot];
      });
    };
    const handleSensorUpdate = (updatedSensor) => {
      if (!updatedSensor?.sensorId) return;
      setSensors((current) => {
        const exists = current.some((sensor) => sensor.sensorId === updatedSensor.sensorId);
        return exists
          ? current.map((sensor) => sensor.sensorId === updatedSensor.sensorId ? { ...sensor, ...updatedSensor } : sensor)
          : [...current, updatedSensor];
      });
    };

    setSocketConnected(Boolean(socket.connected));
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('slotUpdated', handleSlotUpdate);
    socket.on('sensorUpdated', handleSensorUpdate);
    socket.on('reservationCreated', refreshParkingData);
    socket.on('reservationCancelled', refreshParkingData);
    socket.on('reservationExpired', refreshParkingData);
    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('slotUpdated', handleSlotUpdate);
      socket.off('sensorUpdated', handleSensorUpdate);
      socket.off('reservationCreated', refreshParkingData);
      socket.off('reservationCancelled', refreshParkingData);
      socket.off('reservationExpired', refreshParkingData);
    };
  }, [socket, refreshParkingData]);

  const realSlot = slots.find((slot) => slot.slotId === 'PN-A-001');
  const realSensor = sensors.find((sensor) => sensor.sensorId === 'PN-SENSOR-001');
  const finishSignIn = () => {
    setAuthOpen(false);
    navigate('/user', { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar socketConnected={socketConnected} realSensor={realSensor} onSignIn={() => setAuthOpen(true)} />
      <main className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 sm:py-8">
        {user.isLoggedIn && <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 shadow-sm">
          <div className="flex items-center gap-2">
            {locationStatus === 'loading' ? <LoaderCircle size={14} className="animate-spin text-blue-600" /> : <MapPin size={14} className="text-blue-600" />}
            <span>
              {locationStatus === 'ready'
                ? 'Using your current location for nearby sorting'
                : locationStatus === 'loading'
                  ? 'Finding your location…'
                  : locationError || 'Location unavailable; showing demo-area distances.'}
            </span>
          </div>
          {locationStatus === 'error' && (
            <button type="button" onClick={locate} className="font-semibold text-blue-700 hover:text-blue-900">
              Try location again
            </button>
          )}
        </div>}

        {user.isLoggedIn && loadError && (
          <div role="alert" className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            <span className="flex items-center gap-2"><AlertCircle size={17} />{loadError}</span>
            <button type="button" onClick={refreshParkingData} className="font-semibold underline">Retry</button>
          </div>
        )}

        {!user.isLoggedIn ? null : loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center text-sm text-slate-500">
            <LoaderCircle size={22} className="mx-auto mb-2 animate-spin text-blue-600" />
            Loading parking availability…
          </div>
        ) : (
          <Outlet context={{
            slots,
            sensors,
            reservations,
            realSlot,
            realSensor,
            location: locationStatus === 'ready' ? deviceLocation : null,
            locationStatus,
            onLocateMe: locate,
            onTriggerComplete: refreshParkingData,
            refreshParkingData,
            socketConnected,
            currentPath: location.pathname
          }} />
        )}
      </main>
      {authOpen && <AuthModal required onClose={finishSignIn} />}
    </div>
  );
};

export default UserLayout;
