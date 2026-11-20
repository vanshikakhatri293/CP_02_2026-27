import React, { useState, useEffect, useCallback } from 'react';
import {
  ParkingCircle,
  CheckCircle2,
  Clock,
  WifiOff,
  Activity
} from 'lucide-react';
import { dashboardService } from '../services/api';
import { useSocket } from '../hooks/useSocket';

const StatCard = ({ title, value, icon: Icon, colorClass, bgColorClass }) => (
  <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
    <div className={`p-4 rounded-xl ${bgColorClass} ${colorClass}`}>
      <Icon size={28} />
    </div>
    <div>
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
    </div>
  </div>
);

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const socket = useSocket();
  const [socketConnected, setSocketConnected] = useState(() => Boolean(socket?.connected));

  const fetchStats = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      const response = await dashboardService.getStats();
      setStats(response.data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    } finally {
      if (isInitial) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats(true);
  }, [fetchStats]);

  useEffect(() => {
    if (!socket) return;

    const handleConnect = () => setSocketConnected(true);
    const handleDisconnect = () => setSocketConnected(false);
    const handleUpdate = () => fetchStats(false);

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('parkingUpdated', handleUpdate);
    socket.on('slotUpdated', handleUpdate);
    socket.on('sensorUpdated', handleUpdate);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('parkingUpdated', handleUpdate);
      socket.off('slotUpdated', handleUpdate);
      socket.off('sensorUpdated', handleUpdate);
    };
  }, [socket, fetchStats]);

  if (loading) return <div className="p-10 text-center font-medium text-gray-500">Loading dashboard stats...</div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="text-gray-500 mt-2">Real-time status of your parking facility</p>
        </div>

        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-gray-200 shadow-xs">
          <div className={`w-3 h-3 rounded-full ${socketConnected ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
          <span className="text-xs font-bold text-gray-700">
            {socketConnected ? 'Live Socket Connected' : 'Connecting...'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        <StatCard
          title="Total Slots"
          value={stats?.totalSlots || 0}
          icon={ParkingCircle}
          colorClass="text-blue-600"
          bgColorClass="bg-blue-50"
        />
        <StatCard
          title="Available"
          value={stats?.available || 0}
          icon={CheckCircle2}
          colorClass="text-green-600"
          bgColorClass="bg-green-50"
        />
        <StatCard
          title="Occupied"
          value={stats?.occupied || 0}
          icon={Activity}
          colorClass="text-red-600"
          bgColorClass="bg-red-50"
        />
        <StatCard
          title="Reserved"
          value={stats?.reserved || 0}
          icon={Clock}
          colorClass="text-yellow-600"
          bgColorClass="bg-yellow-50"
        />
        <StatCard
          title="Offline"
          value={stats?.offline || 0}
          icon={WifiOff}
          colorClass="text-gray-600"
          bgColorClass="bg-gray-100"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-100 min-h-[350px]">
          <h3 className="text-xl font-bold mb-4 text-gray-900">System Telemetry</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-100">
              <span className="text-sm font-medium text-gray-600">Active Sensors Online</span>
              <span className="text-lg font-bold text-emerald-600">{stats?.onlineSensors || 0} / {stats?.totalSensors || 0}</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-100">
              <span className="text-sm font-medium text-gray-600">Maintenance Slots</span>
              <span className="text-lg font-bold text-purple-600">{stats?.maintenance || 0}</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-100 min-h-[350px]">
          <h3 className="text-xl font-bold mb-4 text-gray-900">Occupancy Rate</h3>
          <div className="flex flex-col items-center justify-center h-[220px]">
             <div className="text-6xl font-bold text-parknest-blue">
               {stats?.totalSlots ? Math.round((stats.occupied / stats.totalSlots) * 100) : 0}%
             </div>
             <p className="text-gray-500 mt-2 font-medium">Current Facility Occupancy</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
