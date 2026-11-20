import React, { useState, useEffect, useCallback } from 'react';
import { sensorService } from '../services/api';
import { useSocket } from '../hooks/useSocket';
import {
  WifiOff,
  Activity,
  Cpu,
  RefreshCw,
  CheckCircle2
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const SensorStatusBadge = ({ status }) => {
  const styles = {
    ONLINE: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold',
    OFFLINE: 'bg-gray-200 text-gray-700 border-gray-300 font-bold',
    MAINTENANCE: 'bg-purple-100 text-purple-800 border-purple-300 font-bold',
  };

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs border ${styles[status] || styles.OFFLINE}`}>
      {status}
    </span>
  );
};

const Sensors = () => {
  const [sensors, setSensors] = useState([]);
  const [loading, setLoading] = useState(true);
  const socket = useSocket();

  const fetchSensors = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      const response = await sensorService.getSensors();
      setSensors(response.data);
    } catch (err) {
      console.error('Error fetching sensors:', err);
    } finally {
      if (isInitial) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSensors(true);
  }, [fetchSensors]);

  useEffect(() => {
    if (!socket) return;

    const handleSensorUpdate = (updatedSensor) => {
      setSensors(prev => {
        const index = prev.findIndex(s => s.sensorId === updatedSensor.sensorId);
        if (index !== -1) {
          const next = [...prev];
          next[index] = { ...next[index], ...updatedSensor };
          return next;
        }
        return [...prev, updatedSensor];
      });
    };

    const handleParkingUpdate = ({ sensor }) => {
      if (sensor) handleSensorUpdate(sensor);
      else fetchSensors(false);
    };

    socket.on('sensorUpdated', handleSensorUpdate);
    socket.on('parkingUpdated', handleParkingUpdate);

    return () => {
      socket.off('sensorUpdated', handleSensorUpdate);
      socket.off('parkingUpdated', handleParkingUpdate);
    };
  }, [socket, fetchSensors]);

  if (loading) return <div className="flex justify-center p-20"><RefreshCw className="animate-spin text-parknest-blue" size={40} /></div>;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sensor Management</h1>
          <p className="text-gray-500 mt-2">Monitor health and connectivity of IoT nodes</p>
        </div>
        <button
          onClick={() => fetchSensors(true)}
          className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors shadow-xs cursor-pointer"
        >
          <RefreshCw size={18} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
          <div className="flex items-center gap-4">
             <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><CheckCircle2 /></div>
             <div>
               <p className="text-sm text-gray-500 font-medium">Online Nodes</p>
               <h3 className="text-2xl font-bold text-gray-900">{sensors.filter(s => s.status === 'ONLINE').length}</h3>
             </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
          <div className="flex items-center gap-4">
             <div className="p-3 bg-gray-100 text-gray-600 rounded-xl"><WifiOff /></div>
             <div>
               <p className="text-sm text-gray-500 font-medium">Offline Nodes</p>
               <h3 className="text-2xl font-bold text-gray-900">{sensors.filter(s => s.status === 'OFFLINE').length}</h3>
             </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
          <div className="flex items-center gap-4">
             <div className="p-3 bg-purple-50 text-purple-600 rounded-xl"><Activity /></div>
             <div>
               <p className="text-sm text-gray-500 font-medium">In Maintenance</p>
               <h3 className="text-2xl font-bold text-gray-900">{sensors.filter(s => s.status === 'MAINTENANCE').length}</h3>
             </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Sensor ID</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Assigned Slot</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">IP Address</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Firmware</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Last Seen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {sensors.map((sensor) => (
              <tr key={sensor._id || sensor.sensorId} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${sensor.status === 'ONLINE' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                      <Cpu size={18} />
                    </div>
                    <span className="font-bold text-gray-900 font-mono">{sensor.sensorId}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm font-semibold text-gray-700">
                  {sensor.slotId || 'Unassigned'}
                </td>
                <td className="px-6 py-4">
                  <SensorStatusBadge status={sensor.status} />
                </td>
                <td className="px-6 py-4 text-sm font-mono text-gray-600">
                  {sensor.ipAddress || '---.---.---.---'}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  v{sensor.firmwareVersion || '1.0.3'}
                </td>
                <td className="px-6 py-4 text-xs text-gray-500">
                  {sensor.lastSeen ? formatDistanceToNow(new Date(sensor.lastSeen), { addSuffix: true }) : 'Never'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Sensors;
