import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BookOpen, CheckCircle2, ExternalLink, MapPin, Shield, Wrench } from 'lucide-react';
import useDeviceLocation from '../../hooks/useDeviceLocation';

const serviceTypes = [
  { id: 'puc', label: 'PUC testing', icon: CheckCircle2, color: 'text-emerald-700', query: 'PUC testing center' },
  { id: 'repair', label: 'Repairs', icon: Wrench, color: 'text-amber-700', query: 'car repair near me' },
  { id: 'rto', label: 'RTO offices', icon: Shield, color: 'text-violet-700', query: 'RTO office' },
  { id: 'guides', label: 'Fitting guides', icon: BookOpen, color: 'text-blue-700', query: '' }
];

const fittingGuides = [
  { title: 'Installing a dashcam', summary: 'Plan a safe cable route, mount behind the rear-view mirror, and test recording before driving.' },
  { title: 'Setting up a FASTag', summary: 'Clean the inside of the windscreen, place the tag near the center, then verify it in your issuer app.' },
  { title: 'Checking parking sensors', summary: 'Keep sensors clean and test each sensor at low speed in a clear, controlled area.' }
];

const NearbyServices = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selected, setSelected] = useState(searchParams.get('tab') || 'puc');
  const { location, status, error, locate } = useDeviceLocation();
  const activeService = serviceTypes.find((service) => service.id === selected) || serviceTypes[0];
  const mapQuery = useMemo(() => {
    if (selected === 'guides') return '';
    const nearby = location ? `${location.latitude},${location.longitude}` : 'Mumbai';
    return `${activeService.query} near ${nearby}`;
  }, [activeService.query, location, selected]);

  const chooseService = (id) => {
    setSelected(id);
    setSearchParams(id === 'puc' ? {} : { tab: id });
  };

  return (
    <div className="space-y-5">
      <header>
        <p className="text-sm font-semibold text-blue-700">ON THE ROAD</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Nearby mobility services</h1>
        <p className="mt-1 text-sm text-slate-500">Search Google Maps for nearby services or browse quick fitting tips.</p>
      </header>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {serviceTypes.map(({ id, label, icon: Icon }) => (
          <button key={id} type="button" onClick={() => chooseService(id)} className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${selected === id ? 'bg-blue-600 text-white shadow-sm' : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}>
            <Icon size={16} />{label}
          </button>
        ))}
      </div>

      {selected === 'guides' ? (
        <section className="grid gap-4 md:grid-cols-3">
          {fittingGuides.map((guide) => (
            <article key={guide.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <BookOpen size={20} className="text-blue-600" />
              <h2 className="mt-3 font-bold text-slate-900">{guide.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{guide.summary}</p>
              <span className="mt-4 inline-block rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">Quick guide</span>
            </article>
          ))}
        </section>
      ) : (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4">
            <div className="flex items-center gap-2">
              <MapPin size={18} className={activeService.color} />
              <div>
                <h2 className="font-bold text-slate-900">Google Maps: {activeService.label}</h2>
                <p className="text-xs text-slate-500">{location ? 'Search centered on your current location.' : 'Location is not available; search centered on Mumbai.'}</p>
              </div>
            </div>
            <button type="button" onClick={locate} disabled={status === 'loading'} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50">
              {status === 'loading' ? 'Finding location…' : 'Use my location'}
            </button>
          </div>
          {status === 'error' && <p role="status" className="px-4 pt-3 text-xs text-amber-800">{error}</p>}
          <iframe
            title={`Google Maps search for ${activeService.label}`}
            src={`https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&z=13&output=embed`}
            className="h-[55vh] min-h-80 w-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 p-4">
            <p className="text-xs text-slate-500">Map results are supplied by Google Maps, not verified or stored by ParkNest.</p>
            <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700 hover:text-blue-900">
              Open in Google Maps <ExternalLink size={14} />
            </a>
          </div>
        </section>
      )}
    </div>
  );
};

export default NearbyServices;
