import React, { useState } from 'react';
import { sensorService } from '../services/api';
import { Cpu, Car, ShieldAlert, CheckCircle, RefreshCw, Zap, Sparkles } from 'lucide-react';

const LiveSensorDemoTrigger = ({ realSlot, realSensor, reservations = [], onTriggerComplete }) => {
  const [loading, setLoading] = useState(false);
  const [lastAction, setLastAction] = useState(null);
  const [error, setError] = useState('');

  const triggerSensor = async (distance, occupied, label) => {
    setLoading(true);
    setError('');
    try {
      await sensorService.updateSensorData({
        sensorId: 'PN-SENSOR-001',
        slotId: 'PN-A-001',
        distance,
        occupied,
        firmwareVersion: '1.0.3-DEMO',
        isSimulator: true
      });
      setLastAction(label);
      if (onTriggerComplete) onTriggerComplete();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not send this demo sensor reading.');
    } finally {
      setLoading(false);
    }
  };

  const currentDist = realSlot?.distance;
  const currentStatus = realSlot?.status || 'UNKNOWN';
  const sensorOnline = realSensor?.status === 'ONLINE' && Boolean(realSensor.lastSource);
  const isOccupiedBySensor = sensorOnline && Number(currentDist) < (realSlot?.threshold || 15);
  const activeReservation = reservations.find((reservation) =>
    reservation.slotId === 'PN-A-001' &&
    ['ACTIVE', 'PENDING'].includes(reservation.status) &&
    new Date(reservation.endTime) > new Date()
  );

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-blue-100 bg-blue-50 p-2.5 text-blue-700">
            <Cpu size={21} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-bold text-slate-900 text-base">Live sensor demo</h3>
              <span className={`${sensorOnline ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-800'} flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold`}>
                <span className={`h-1.5 w-1.5 rounded-full ${sensorOnline ? 'animate-pulse bg-emerald-500' : 'bg-amber-500'}`} />
                PN-A-001 · {sensorOnline ? realSensor.lastSource === 'PHYSICAL SENSOR' ? 'Physical sensor live' : 'Simulator live' : 'Awaiting telemetry'}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">Ultrasonic telemetry · NodeMCU ESP8266 + HC-SR04</p>
          </div>
        </div>

        <div className="grid w-full grid-cols-2 gap-2 sm:w-auto sm:min-w-[26rem] sm:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
            <div className="text-[10px] font-medium text-slate-500">Distance</div>
            <div className="font-mono text-lg font-bold text-slate-900">
              {currentDist ?? '—'} <span className="text-xs text-slate-500">cm</span>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
            <div className="text-[10px] font-medium text-slate-500">Sensor status</div>
            <div className={`text-xs font-bold ${!sensorOnline ? 'text-slate-500' : isOccupiedBySensor ? 'text-red-700' : 'text-emerald-700'}`}>
              {!sensorOnline ? 'No live reading' : isOccupiedBySensor ? `Occupied (<${realSlot?.threshold || 15} cm)` : `Empty (≥${realSlot?.threshold || 15} cm)`}
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
            <div className="text-[10px] font-medium text-slate-500">Slot status</div>
            <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-bold ${
              currentStatus === 'AVAILABLE' ? 'bg-emerald-100 text-emerald-800' :
              currentStatus === 'RESERVED' ? 'bg-blue-100 text-blue-800' :
              currentStatus === 'OCCUPIED' ? 'bg-red-100 text-red-800' : 'bg-slate-200 text-slate-700'
            }`}>
              {currentStatus}
            </span>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
            <div className="text-[10px] font-medium text-slate-500">Reserved for</div>
            <div className="truncate text-xs font-bold text-blue-700">{activeReservation ? activeReservation.vehicleNumber : 'No active booking'}</div>
          </div>
        </div>
      </div>

      <p className="mb-4 text-[11px] text-slate-500">
        Telemetry source: <strong className="text-slate-700">{realSensor?.lastSource || 'No reading received yet'}</strong>
        {realSensor?.lastSeen ? ` · Last seen ${new Date(realSensor.lastSeen).toLocaleTimeString()}` : ''}
        . Demo buttons below always send simulated readings.
      </p>

      <div className="mb-5 grid grid-cols-1 gap-3 text-xs sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div className="mb-1 flex items-center gap-1.5 font-semibold text-emerald-700">
            <CheckCircle size={14} /> Departure
          </div>
          <p className="text-[11px] leading-relaxed text-slate-600">
            If a slot becomes physically empty with no active booking, it automatically becomes <strong className="text-emerald-700">Available</strong>.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div className="mb-1 flex items-center gap-1.5 font-semibold text-blue-700">
            <ShieldAlert size={14} /> Unbooked car
          </div>
          <p className="text-[11px] leading-relaxed text-slate-600">
            If a different car parks in a booked slot, it remains <strong className="text-blue-700">Reserved</strong> for the booked vehicle when that car leaves.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div className="mb-1 flex items-center gap-1.5 font-semibold text-amber-700">
            <RefreshCw size={14} /> Expiry + empty
          </div>
          <p className="text-[11px] leading-relaxed text-slate-600">
            When booking time expires and the physical sensor is empty, the slot becomes <strong className="text-emerald-700">Available</strong> for new bookings.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div className="mb-1 flex items-center gap-1.5 font-semibold text-red-700">
            <Zap size={14} /> Expiry + occupied
          </div>
          <p className="text-[11px] leading-relaxed text-slate-600">
            If booking expires while the sensor reports a car present, the slot stays <strong className="font-bold text-red-700">Unavailable</strong> until empty.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-100 bg-blue-50/60 p-3.5">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="shrink-0 text-blue-600" />
          <span className="text-xs font-semibold text-slate-700">Demo controls <span className="font-normal text-slate-500">(send simulated readings)</span></span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            disabled={loading}
            onClick={() => triggerSensor(4, true, 'Parked Car (4cm)')}
            className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 transition-colors hover:bg-red-50 disabled:opacity-50"
          >
            <Car size={14} />
            <span>Park Car (4 cm)</span>
          </button>

          <button
            disabled={loading}
            onClick={() => triggerSensor(35, false, 'Removed Car (35cm)')}
            className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-white px-3 py-2 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-50 disabled:opacity-50"
          >
            <CheckCircle size={14} />
            <span>Remove Car (35 cm)</span>
          </button>

          <button
            disabled={loading}
            onClick={() => triggerSensor(8, true, 'Unbooked Car Parked')}
            className="flex items-center gap-1.5 rounded-lg border border-amber-200 bg-white px-3 py-2 text-xs font-semibold text-amber-800 transition-colors hover:bg-amber-50 disabled:opacity-50"
          >
            <ShieldAlert size={14} />
            <span>Simulate Unbooked Car</span>
          </button>
        </div>
      </div>

      {error && <p role="alert" className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">{error}</p>}
      {lastAction && (
        <div className="mt-2 text-right font-mono text-[11px] text-slate-500">
          Last telemetry event emitted: <strong className="text-slate-700">{lastAction}</strong>
        </div>
      )}
    </div>
  );
};

export default LiveSensorDemoTrigger;
