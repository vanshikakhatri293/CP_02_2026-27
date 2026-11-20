import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import { parkingService } from '../../services/api';
import InteractiveMap from '../../components/InteractiveMap';
import { distanceInKm, getCoordinates } from '../../utils/location';
import {
  ArrowUpDown, ArrowUpRight, Calendar, CalendarCheck, Car, ChevronRight,
  Compass, Home, MapPin, Sparkles, UserRound
} from 'lucide-react';

const DEMO_LOCATION = { latitude: 19.045, longitude: 72.889 };

const UserHome = ({
  slots = [], location, locationStatus = 'idle', onLocateMe, reservations = []
}) => {
  const { user, getDefaultVehicle } = useUser();
  const navigate = useNavigate();
  const defaultVehicle = getDefaultVehicle();
  const [areas, setAreas] = useState([]);
  const [sortByProximity, setSortByProximity] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const referenceLocation = location || DEMO_LOCATION;

  const fetchHomeData = useCallback(async () => {
    setLoadError('');
    try {
      const areaResponse = await parkingService.getAreas();
      setAreas(areaResponse.data || []);
    } catch (error) {
      setLoadError(error.response?.data?.message || 'Could not load nearby parking. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHomeData();
  }, [fetchHomeData]);

  const enrichedAreas = areas.map((area) => {
    const areaSlots = slots.filter((slot) => {
      const slotAreaId = typeof slot.areaId === 'object' ? slot.areaId?._id : slot.areaId;
      return slotAreaId === area._id;
    });
    const areaCoordinates = getCoordinates(area) ||
      (/demo/i.test(`${area.name} ${area.location}`) ? DEMO_LOCATION : null);
    return {
      ...area,
      availableSlots: areaSlots.filter((slot) => slot.status === 'AVAILABLE').length,
      distanceKm: areaCoordinates ? distanceInKm(referenceLocation, areaCoordinates) : null
    };
  });
  const sortedAreas = [...enrichedAreas].sort((a, b) => sortByProximity
    ? (a.distanceKm ?? Number.MAX_VALUE) - (b.distanceKm ?? Number.MAX_VALUE)
    : b.availableSlots - a.availableSlots
  );
  const phone = (user.phone || '').replace(/\D/g, '');
  const activeReservations = reservations.filter((reservation) =>
    ['ACTIVE', 'PENDING'].includes(reservation.status) &&
    reservation.userPhone?.replace(/\D/g, '') === phone &&
    new Date(reservation.endTime) > new Date()
  );
  const availableSlots = slots.filter((slot) => slot.status === 'AVAILABLE').length;

  return (
    <div className="space-y-6 pb-10">
      <section className="relative flex min-h-48 flex-col justify-center overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-br from-white via-white to-blue-50 p-5 shadow-sm sm:min-h-56 sm:p-8">
          <div className="pointer-events-none absolute -right-10 -top-20 h-64 w-64 rounded-full bg-blue-100/60 blur-3xl" />
          <div className="relative">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[11px] font-semibold text-blue-700">
              <Sparkles size={13} className="text-blue-600" /> ParkNest Driver App
            </span>
            <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Welcome, {user.name?.trim().split(/\s+/)[0] || 'Driver'}</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">Your parking and mobility essentials, all in one place.</p>
          </div>
      </section>

      <section aria-label="Quick navigation" className="grid auto-rows-[minmax(116px,auto)] grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
        <div className="col-span-2 flex min-h-32 flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:col-span-1 md:row-span-2 md:min-h-64">
          <div className="flex items-start justify-between gap-2">
            <span className="rounded-xl bg-slate-100 p-2.5 text-slate-600"><Home size={19} /></span>
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700">You’re here</span>
          </div>
          <div>
            <h2 className="font-bold text-slate-900">Home</h2>
            <p className="mt-1 text-xs leading-5 text-slate-500">Explore nearby parking and services from your dashboard.</p>
          </div>
        </div>

        <button type="button" onClick={() => navigate('/user/book')} className="group relative col-span-2 flex min-h-36 flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 p-5 text-left text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg md:row-span-2 md:min-h-64">
          <span aria-hidden="true" className="pointer-events-none absolute -bottom-16 -right-8 h-48 w-48 rounded-full border-[28px] border-white/10" />
          <span className="flex items-start justify-between">
            <span className="rounded-xl bg-white/15 p-2.5"><Calendar size={20} /></span>
            <ArrowUpRight size={20} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </span>
          <span className="relative">
            <span className="block text-lg font-bold">Book parking</span>
            <span className="mt-1 block text-xs text-blue-100">{availableSlots} available in nearby demo areas</span>
          </span>
        </button>

        <button type="button" onClick={() => navigate('/user/reservations')} className="group flex min-h-32 flex-col justify-between rounded-2xl border border-blue-100 bg-blue-50/70 p-4 text-left transition hover:border-blue-300 hover:bg-blue-50">
          <span className="flex items-start justify-between">
            <span className="rounded-xl bg-white p-2.5 text-blue-700"><CalendarCheck size={19} /></span>
            <ArrowUpRight size={17} className="text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </span>
          <span><span className="block text-sm font-bold text-slate-900">Trips</span><span className="text-xs text-slate-500">{activeReservations.length} active reservations</span></span>
        </button>

        <button type="button" onClick={() => navigate('/user/services')} className="group flex min-h-32 flex-col justify-between rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4 text-left transition hover:border-emerald-300 hover:bg-emerald-50">
          <span className="flex items-start justify-between">
            <span className="rounded-xl bg-white p-2.5 text-emerald-700"><MapPin size={19} /></span>
            <ArrowUpRight size={17} className="text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </span>
          <span><span className="block text-sm font-bold text-slate-900">Services</span><span className="text-xs text-slate-500">PUC, repair, RTO & guides</span></span>
        </button>

        <button type="button" onClick={() => navigate('/user/profile')} className="group flex min-h-32 flex-col justify-between rounded-2xl border border-violet-100 bg-violet-50/70 p-4 text-left transition hover:border-violet-300 hover:bg-violet-50">
          <span className="flex items-start justify-between">
            <span className="rounded-xl bg-white p-2.5 text-violet-700"><UserRound size={19} /></span>
            <ArrowUpRight size={17} className="text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </span>
          <span><span className="block text-sm font-bold text-slate-900">Profile</span><span className="text-xs text-slate-500">{user.vehicles.length} registered vehicles</span></span>
        </button>

        <article className="col-span-2 flex min-h-32 items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:col-span-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700"><Car size={23} /></span>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Registered vehicle</p>
              {defaultVehicle ? (
                <>
                  <p className="mt-0.5 truncate font-mono text-sm font-extrabold text-slate-900">{defaultVehicle.plate}</p>
                  <p className="truncate text-xs text-slate-500">{defaultVehicle.model || defaultVehicle.type}{defaultVehicle.color ? ` · ${defaultVehicle.color}` : ''}</p>
                </>
              ) : (
                <p className="mt-1 text-xs text-amber-800">Add a vehicle before booking.</p>
              )}
            </div>
          </div>
          <button type="button" onClick={() => navigate('/user/profile')} className="shrink-0 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-50">
            Manage <ChevronRight size={13} className="ml-1 inline" />
          </button>
        </article>
      </section>

      <InteractiveMap
        parkingAreas={sortedAreas}
        onSelectArea={(area) => navigate(`/user/book?areaId=${area._id}`)}
        userLocation={location}
        locationStatus={locationStatus}
        onLocateMe={onLocateMe}
      />

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 font-bold text-slate-900"><MapPin size={18} className="text-blue-600" /> Nearby parking areas</h2>
            <p className="mt-1 text-xs text-slate-500">{location ? 'Distances use your current device location.' : 'Distances use the clearly marked demo location until location access is enabled.'}</p>
          </div>
          <button type="button" onClick={() => setSortByProximity(!sortByProximity)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50">
            <ArrowUpDown size={13} /> Sort by {sortByProximity ? 'availability' : 'distance'}
          </button>
        </div>
        {loadError && <div role="alert" className="mb-3 flex items-center justify-between rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800"><span>{loadError}</span><button type="button" onClick={fetchHomeData} className="font-semibold underline">Retry</button></div>}
        {loading ? <p className="py-5 text-center text-sm text-slate-500">Loading nearby parking…</p> : sortedAreas.length === 0 ? (
          <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">No parking areas found. Demo areas appear after the server is seeded.</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {sortedAreas.map((area) => (
              <article key={area._id || area.name} className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 transition-shadow hover:shadow-sm">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-slate-900">{area.name}</h3>
                    <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-bold text-emerald-800">{area.availableSlots} available</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{area.location} · Demo area</p>
                  <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-600">
                    <span className="inline-flex items-center gap-1 text-blue-700"><Compass size={13} />{area.distanceKm !== null ? `${area.distanceKm.toFixed(1)} km` : 'Distance unavailable'}</span>
                    <span>{area.totalSlots ?? 0} total slots</span>
                  </div>
                </div>
                <button type="button" onClick={() => navigate(`/user/book?areaId=${area._id}`)} className="mt-4 inline-flex w-full items-center justify-center gap-1 rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white hover:bg-blue-700">
                  Select and book <ChevronRight size={14} />
                </button>
              </article>
            ))}
          </div>
        )}
      </section>

      {activeReservations.length > 0 && (
        <section className="rounded-2xl border border-blue-200 bg-blue-50/70 p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div><h2 className="flex items-center gap-2 font-bold text-slate-900"><Calendar size={17} className="text-blue-700" /> Your active reservations</h2><p className="text-xs text-slate-600">Reservation status is independent of the sensor reading.</p></div>
            <button type="button" onClick={() => navigate('/user/reservations')} className="text-xs font-bold text-blue-700">View all</button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {activeReservations.slice(0, 2).map((reservation) => (
              <div key={reservation.reservationId} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white p-3">
                <div><p className="font-mono text-sm font-bold text-slate-900">{reservation.slotId} · {reservation.vehicleNumber}</p><p className="text-xs text-slate-500">Until {new Date(reservation.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p></div>
                <span className="rounded-full bg-blue-100 px-2.5 py-1 text-[10px] font-bold text-blue-800">{reservation.status}</span>
              </div>
            ))}
          </div>
        </section>
      )}

    </div>
  );
};

export default UserHome;
