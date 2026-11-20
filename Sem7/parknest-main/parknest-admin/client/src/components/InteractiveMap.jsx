import React, { useMemo, useState } from 'react';
import { Car, CheckCircle2, Compass, MapPin, Navigation, Shield, Wrench } from 'lucide-react';
import { getCoordinates } from '../utils/location';

const mapFilters = [
  { id: 'all', label: 'All', icon: MapPin, query: 'parking, PUC, repair and RTO services' },
  { id: 'parking', label: 'Parking', icon: Car, query: 'parking' },
  { id: 'puc', label: 'PUC', icon: CheckCircle2, query: 'PUC testing center' },
  { id: 'repair', label: 'Repair', icon: Wrench, query: 'car repair' },
  { id: 'rto', label: 'RTO', icon: Shield, query: 'RTO office' }
];

const InteractiveMap = ({ parkingAreas = [], onSelectArea, userLocation, onLocateMe, locationStatus = 'idle' }) => {
  const [selectedFilter, setSelectedFilter] = useState('all');
  const activeFilter = mapFilters.find((filter) => filter.id === selectedFilter) || mapFilters[0];
  const mapQuery = useMemo(() => {
    if (userLocation) return `${activeFilter.query} near ${userLocation.latitude},${userLocation.longitude}`;
    const firstArea = parkingAreas.find((area) => getCoordinates(area));
    const coordinates = getCoordinates(firstArea);
    if (coordinates) return `${activeFilter.query} near ${coordinates.latitude},${coordinates.longitude}`;
    return `${activeFilter.query} in Mumbai`;
  }, [activeFilter.query, parkingAreas, userLocation]);

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <header className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/70 p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <span className="rounded-xl bg-blue-50 p-2 text-blue-700"><Navigation size={18} /></span>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Nearby services on Google Maps</h2>
            <p className="text-xs text-slate-500">Explore parking, PUC, repair, and RTO services around you.</p>
          </div>
        </div>
        <div className="flex gap-1.5 overflow-x-auto">
          {mapFilters.map(({ id, label, icon: Icon }) => (
            <button key={id} type="button" onClick={() => setSelectedFilter(id)} className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${selectedFilter === id ? 'bg-blue-600 text-white' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>
              <Icon size={13} />{label}
            </button>
          ))}
        </div>
      </header>

      <div className="relative">
        <iframe
          title={`Google Maps ${activeFilter.label} nearby`}
          src={`https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&z=14&output=embed`}
          className="h-72 w-full border-0 sm:h-96"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
        <button type="button" onClick={onLocateMe} disabled={locationStatus === 'loading'} className="absolute bottom-3 right-3 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 shadow-lg hover:bg-slate-50 disabled:opacity-60">
          <Compass size={14} className="text-blue-600" />
          {locationStatus === 'loading' ? 'Finding you…' : 'Use my location'}
        </button>
      </div>

      {parkingAreas.length > 0 && (
        <div className="grid gap-2 border-t border-slate-100 p-3 sm:grid-cols-2 lg:grid-cols-3">
          {parkingAreas.slice(0, 3).map((area) => (
            <button key={area._id || area.name} type="button" onClick={() => onSelectArea?.(area)} className="flex min-w-0 items-center justify-between gap-2 rounded-xl bg-slate-50 p-3 text-left hover:bg-blue-50">
              <span className="flex min-w-0 items-center gap-2">
                <Car size={16} className="shrink-0 text-blue-600" />
                <span className="truncate text-xs font-semibold text-slate-800">{area.name}</span>
              </span>
              <span className="shrink-0 text-[11px] font-semibold text-emerald-700">{area.availableSlots} free</span>
            </button>
          ))}
        </div>
      )}

      <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-4 py-3 text-[11px] text-slate-500">
        <span>{userLocation ? 'Map search centered on your current location.' : 'Showing a demo-area map until location permission is granted.'}</span>
        <a className="inline-flex items-center gap-1 font-semibold text-blue-700 hover:text-blue-900" target="_blank" rel="noreferrer" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`}>
          Open Google Maps <MapPin size={12} />
        </a>
      </footer>
    </section>
  );
};

export default InteractiveMap;
