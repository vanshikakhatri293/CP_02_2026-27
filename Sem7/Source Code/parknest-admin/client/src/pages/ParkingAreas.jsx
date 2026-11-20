import React, { useState, useEffect } from 'react';
import { parkingService } from '../services/api';
import { MapPin, Plus, ChevronRight, LayoutGrid } from 'lucide-react';

const ParkingAreas = () => {
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAreas = async () => {
      try {
        const response = await parkingService.getAreas();
        setAreas(response.data);
      } catch (err) {
        console.error('Error fetching areas:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAreas();
  }, []);

  if (loading) return <div>Loading areas...</div>;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Parking Areas</h1>
          <p className="text-gray-500 mt-2">Manage facility zones and slot distribution</p>
        </div>
        <button className="bg-parknest-blue text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-blue-600 transition-colors shadow-lg shadow-blue-200">
          <Plus size={20} />
          Add New Area
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {areas.map((area) => (
          <div key={area._id} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div className="p-3 bg-blue-50 text-parknest-blue rounded-2xl">
                  <LayoutGrid size={28} />
                </div>
                <div className="flex flex-col items-end">
                   <span className="text-2xl font-black text-gray-900">{area.totalSlots}</span>
                   <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Slots Total</span>
                </div>
              </div>

              <h3 className="text-xl font-bold text-gray-900 mb-2">{area.name}</h3>

              <div className="flex items-center gap-2 text-gray-500 text-sm mb-4">
                <MapPin size={16} />
                <span>{area.location}</span>
              </div>

              <p className="text-gray-500 text-sm mb-6 line-clamp-2 min-h-[40px]">
                {area.description || 'No description provided for this parking zone.'}
              </p>

              <div className="space-y-3">
                 <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-parknest-blue h-full w-[65%]"></div>
                 </div>
                 <div className="flex justify-between text-[10px] font-bold text-gray-500">
                    <span>CAPACITY UTILIZATION</span>
                    <span>65%</span>
                 </div>
              </div>
            </div>

            <div className="px-8 py-5 bg-gray-50 border-t border-gray-100 flex justify-between items-center group cursor-pointer hover:bg-gray-100 transition-colors">
               <span className="text-sm font-bold text-gray-700">View Area Details</span>
               <ChevronRight size={18} className="text-gray-400 group-hover:text-parknest-blue transition-colors" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ParkingAreas;
