import React, { useCallback, useState, useEffect } from 'react';
import { reservationService } from '../services/api';
import { User, MapPin, MoreHorizontal, Filter, Car, AlertCircle, Radio } from 'lucide-react';
import { format } from 'date-fns';
import { useSocket } from '../hooks/useSocket';

const StatusBadge = ({ status }) => {
  const styles = {
    ACTIVE: 'bg-blue-100 text-blue-700',
    COMPLETED: 'bg-green-100 text-green-700',
    PENDING: 'bg-yellow-100 text-yellow-700',
    CANCELLED: 'bg-red-100 text-red-700',
    EXPIRED: 'bg-gray-100 text-gray-700',
  };

  return (
    <span className={`px-3 py-1 rounded-lg text-xs font-bold ${styles[status]}`}>
      {status}
    </span>
  );
};

const Reservations = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const socket = useSocket();
  const [socketConnected, setSocketConnected] = useState(false);

  const fetchReservations = useCallback(async () => {
    setError('');
    try {
      const response = await reservationService.getReservations();
      setReservations(response.data || []);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not load reservations.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  useEffect(() => {
    if (!socket) return undefined;
    const handleConnect = () => setSocketConnected(true);
    const handleDisconnect = () => setSocketConnected(false);
    const handleUpdate = () => fetchReservations();
    setSocketConnected(Boolean(socket.connected));
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('reservationCreated', handleUpdate);
    socket.on('reservationCancelled', handleUpdate);
    socket.on('reservationExpired', handleUpdate);
    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('reservationCreated', handleUpdate);
      socket.off('reservationCancelled', handleUpdate);
      socket.off('reservationExpired', handleUpdate);
    };
  }, [socket, fetchReservations]);

  if (loading) return <div className="p-8 text-sm text-gray-500">Loading reservations...</div>;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reservations</h1>
          <p className="text-gray-500 mt-2">Manage user bookings and parking schedules</p>
          <div className="mt-2 inline-flex items-center gap-1.5 text-xs text-gray-500">
            <Radio size={13} className={socketConnected ? 'text-emerald-600' : 'text-amber-600'} />
            {socketConnected ? 'Live reservation updates' : 'Waiting for live connection'}
          </div>
        </div>
        <div className="flex gap-4">
           <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
             <Filter size={18} />
             <span className="font-medium text-gray-600">Filter</span>
           </button>
           <button className="bg-parknest-blue text-white px-6 py-2 rounded-xl font-bold hover:bg-blue-600 transition-colors">
             Export Data
           </button>
        </div>
      </div>

      {error && <div role="alert" className="flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"><span className="flex items-center gap-2"><AlertCircle size={16} />{error}</span><button type="button" onClick={fetchReservations} className="font-semibold underline">Retry</button></div>}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[850px] text-left">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Reservation ID</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">User</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Slot</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Registered plate</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Start Time</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">End Time</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {reservations.map((res) => (
              <tr key={res._id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4 font-bold text-gray-900">{res.reservationId}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <User size={14} className="text-gray-400" />
                    <span className="font-semibold">{res.userName || 'Name not provided'}</span>
                  </div>
                  <div className="pl-6 text-xs text-gray-500">{res.userPhone || 'Phone not provided'}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <MapPin size={14} className="text-gray-400" />
                    {res.slotId}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-sm font-mono font-bold text-gray-800">
                    <Car size={14} className="text-gray-400" />
                    {res.vehicleNumber || '—'}
                  </div>
                  <div className="pl-6 text-[11px] text-gray-500">{res.vehicleType || 'Vehicle'}</div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {format(new Date(res.startTime), 'MMM dd, HH:mm')}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {format(new Date(res.endTime), 'MMM dd, HH:mm')}
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={res.status} />
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="text-gray-400 hover:text-gray-600">
                    <MoreHorizontal />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
};

export default Reservations;
