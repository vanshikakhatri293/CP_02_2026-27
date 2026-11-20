import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarCheck, Clock, RefreshCw, ShieldAlert, ArrowRight, Car } from 'lucide-react';
import { reservationService } from '../../services/api';
import { useUser } from '../../context/UserContext';

const MyReservations = ({ slots = [], sensors = [], reservations = [], refreshParkingData }) => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [actionError, setActionError] = useState('');

  const myReservations = useMemo(() => {
    const phone = (user.phone || '').replace(/\D/g, '');
    return reservations.filter((reservation) => reservation.userPhone?.replace(/\D/g, '') === phone);
  }, [reservations, user.phone]);

  const cancelReservation = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this reservation?')) return;
    setActionError('');
    try {
      await reservationService.cancelReservation(id);
      await refreshParkingData();
    } catch (requestError) {
      setActionError(requestError.response?.data?.message || 'Failed to cancel reservation.');
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <p className="text-sm font-semibold text-blue-700">BOOKINGS</p>
          <h1 className="mt-1 flex items-center gap-2 text-2xl font-bold text-slate-900"><CalendarCheck size={23} className="text-blue-600" /> My reservations</h1>
          <p className="mt-1 text-sm text-slate-500">Reservation and sensor state are shown separately.</p>
        </div>
        <button type="button" onClick={() => navigate('/user/book')} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700">Book a slot <ArrowRight size={15} /></button>
      </header>

      {actionError && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{actionError}</p>}
      {myReservations.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <CalendarCheck size={42} className="mx-auto text-slate-300" />
          <h2 className="mt-3 font-bold text-slate-900">No reservations yet</h2>
          <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">Bookings for {user.phone} will appear here with their time window and live sensor state.</p>
          <button type="button" onClick={() => navigate('/user/book')} className="mt-4 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white">Find a parking slot</button>
        </div>
      ) : (
        <div className="space-y-4">
          {myReservations.map((reservation) => {
            const slot = slots.find((item) => item.slotId === reservation.slotId);
            const sensor = sensors.find((item) => item.sensorId === slot?.sensorId);
            const sensorOnline = sensor?.status === 'ONLINE' && slot?.status !== 'OFFLINE';
            const occupied = sensorOnline && Number(slot?.distance) < Number(slot?.threshold || 10);
            const expired = ['ACTIVE', 'PENDING'].includes(reservation.status) && new Date(reservation.endTime) <= new Date();
            const currentStatus = expired ? 'EXPIRED' : reservation.status;
            const active = ['ACTIVE', 'PENDING'].includes(currentStatus);

            return (
              <article key={reservation._id || reservation.reservationId} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4 sm:p-5">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 font-mono text-xs font-bold text-blue-800">{reservation.slotId}</span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-bold text-slate-900">{reservation.reservationId}</h2>
                        <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${active ? 'bg-blue-100 text-blue-800' : currentStatus === 'CANCELLED' ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-700'}`}>{currentStatus}</span>
                      </div>
                      <p className="mt-0.5 flex flex-wrap items-center gap-1 text-xs text-slate-600"><Car size={13} />{reservation.vehicleNumber} · {reservation.vehicleType || 'Vehicle'}</p>
                    </div>
                  </div>
                  {active && <button type="button" onClick={() => cancelReservation(reservation.reservationId || reservation._id)} className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100">Cancel booking</button>}
                </header>

                <div className="grid gap-3 p-4 sm:grid-cols-3 sm:p-5">
                  <section className="rounded-xl bg-slate-50 p-3">
                    <h3 className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-slate-500"><Clock size={13} className="text-blue-600" /> Booking window</h3>
                    <p className="mt-2 text-sm font-semibold text-slate-900">{new Date(reservation.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – {new Date(reservation.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    <p className="text-xs text-slate-500">{new Date(reservation.startTime).toLocaleDateString()}</p>
                  </section>
                  <section className="rounded-xl bg-slate-50 p-3">
                    <h3 className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-slate-500"><RefreshCw size={13} className="text-indigo-600" /> Sensor status</h3>
                    <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-slate-900"><span className={`h-2 w-2 rounded-full ${sensorOnline ? occupied ? 'bg-red-500' : 'bg-emerald-500' : 'bg-slate-400'}`} />{!sensorOnline ? 'Offline / unknown' : occupied ? 'Occupied' : 'Empty'}</p>
                    <p className="text-xs text-slate-500">{sensorOnline ? `${slot.distance} cm · ${sensor.sensorId}` : 'No current sensor reading'}</p>
                  </section>
                  <section className="rounded-xl border border-blue-100 bg-blue-50/60 p-3">
                    <h3 className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-blue-700"><ShieldAlert size={13} /> Reservation status</h3>
                    <p className="mt-2 text-sm font-bold text-blue-900">{currentStatus}</p>
                    <p className="text-xs leading-5 text-blue-800">{active ? `Reserved for ${reservation.vehicleNumber}; occupancy readings do not release an active reservation.` : 'After expiry, the slot becomes available only when the sensor reports empty.'}</p>
                  </section>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyReservations;
