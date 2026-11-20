import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Users,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  PieChart as PieIcon
} from 'lucide-react';
import { dashboardService } from '../services/api';

const AnalyticsCard = ({ title, value, change, isPositive, icon: Icon }) => (
  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
    <div className="flex justify-between items-start mb-4">
      <div className="p-3 bg-blue-50 text-parknest-blue rounded-xl">
        <Icon size={24} />
      </div>
      <div className={`flex items-center gap-1 text-sm font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
        {change}%
      </div>
    </div>
    <p className="text-sm font-medium text-gray-500">{title}</p>
    <h3 className="text-2xl font-bold text-gray-900 mt-1">{value}</h3>
  </div>
);

const Analytics = () => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await dashboardService.getStats();
        setStats(response.data);
      } catch (err) {
        console.error('Error fetching stats:', err);
      }
    };
    fetchStats();
  }, []);

  const occupancyRate = stats?.totalSlots ? Math.round((stats.occupied / stats.totalSlots) * 100) : 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Analytics Insights</h1>
        <p className="text-gray-500 mt-2">Deep dive into parking facility performance and trends</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AnalyticsCard
          title="Current Occupancy"
          value={`${occupancyRate}%`}
          change="5.2"
          isPositive={true}
          icon={TrendingUp}
        />
        <AnalyticsCard
          title="Active Reservations"
          value={stats?.reserved || 0}
          change="12.5"
          isPositive={true}
          icon={Clock}
        />
        <AnalyticsCard
          title="Online Sensors"
          value={stats?.onlineSensors || 0}
          change="0.0"
          isPositive={true}
          icon={Users}
        />
        <AnalyticsCard
          title="System Health"
          value={stats?.totalSensors ? Math.round((stats.onlineSensors / stats.totalSensors) * 100) + '%' : '100%'}
          change="2.1"
          isPositive={false}
          icon={BarChart3}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm min-h-[400px]">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <BarChart3 className="text-parknest-blue" />
            Weekly Traffic Flow
          </h3>
          <div className="flex items-end justify-between h-64 gap-2 mt-8">
             {[45, 60, 85, 40, 55, 90, 70].map((height, i) => (
               <div key={i} className="flex-1 flex flex-col items-center gap-4">
                  <div
                    className="w-full bg-blue-100 rounded-t-xl relative group hover:bg-parknest-blue transition-colors cursor-pointer"
                    style={{ height: `${height}%` }}
                  >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                      {height}%
                    </div>
                  </div>
                  <span className="text-xs font-bold text-gray-400">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]}
                  </span>
               </div>
             ))}
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <PieIcon className="text-parknest-blue" />
            User Segments
          </h3>
          <div className="space-y-6">
            {[
              { label: 'Regular Customers', value: 45, color: 'bg-blue-500' },
              { label: 'One-time Visitors', value: 30, color: 'bg-green-500' },
              { label: 'Corporate Partners', value: 15, color: 'bg-yellow-500' },
              { label: 'Staff/Admin', value: 10, color: 'bg-gray-400' }
            ].map((segment, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between text-sm font-bold">
                  <span className="text-gray-600">{segment.label}</span>
                  <span className="text-gray-900">{segment.value}%</span>
                </div>
                <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                  <div className={`${segment.color} h-full`} style={{ width: `${segment.value}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
