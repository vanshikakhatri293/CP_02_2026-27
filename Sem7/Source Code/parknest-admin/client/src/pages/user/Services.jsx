import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle2, Wrench, Shield, Zap, Phone, MapPin, ExternalLink, Star, ChevronRight, BookOpen } from 'lucide-react';

const Services = () => {
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'puc';
  const [activeTab, setActiveTab] = useState(initialTab);

  const pucCenters = [
    { id: 1, name: 'CleanDrive Verified PUC Testing Station', address: 'HP Petrol Pump, Eastern Express Highway, Chembur', dist: '0.4 km', phone: '+91 98200 12345', rating: '4.8 ★', status: 'Open Now (9 AM - 9 PM)' },
    { id: 2, name: 'Express Green Auto PUC Center', address: 'BPCL Fuel Plaza, Station Road, Wadala East', dist: '1.2 km', phone: '+91 98200 54321', rating: '4.6 ★', status: 'Open Now (8 AM - 10 PM)' },
    { id: 3, name: 'EcoCheck Certified PUC Point', address: 'Indian Oil Pump, LBS Marg, Ghatkopar West', dist: '1.9 km', phone: '+91 98200 99887', rating: '4.7 ★', status: 'Open Now' },
  ];

  const repairShops = [
    { id: 1, name: 'Apex 24/7 Roadside Assistance & Garage', address: 'Sion-Trombay Road, Near VESIT Campus, Chembur', dist: '0.6 km', phone: '+91 99887 11223', rating: '4.9 ★', services: 'Engine, Flat Tire, Battery Jumpstart, Towing' },
    { id: 2, name: 'Precision Motors Auto Workshop', address: 'Near Monorail Station, Chembur West', dist: '1.5 km', phone: '+91 99887 33445', rating: '4.7 ★', services: 'Brake Service, AC Repair, Electricals' },
    { id: 3, name: 'Swift Mechanics & Wheel Alignment', address: 'Ghatkopar Depot Road, Mumbai', dist: '2.3 km', phone: '+91 99887 55667', rating: '4.8 ★', services: 'Tire Replacement, Balancing, Oil Change' },
  ];

  const rtoOffices = [
    { id: 1, name: 'Wadala Regional Transport Office (MH-03)', address: 'Truck Terminal Road, Wadala East, Mumbai - 400037', dist: '2.8 km', hours: '10:00 AM - 5:30 PM (Mon-Fri)', services: 'Vehicle Registration, Driving License, Fitness Cert' },
    { id: 2, name: 'Andheri RTO Office (MH-02)', address: 'D.N. Nagar, Andheri West, Mumbai', dist: '12.4 km', hours: '10:00 AM - 5:30 PM (Mon-Fri)', services: 'Permits, Transfer of Ownership, NOC' },
    { id: 3, name: 'Thane RTO Office (MH-04)', address: 'Central Maidan, Thane West', dist: '15.1 km', hours: '10:00 AM - 5:30 PM (Mon-Fri)', services: 'Smart Card RC, Driving Test Booking' },
  ];

  const fittingGuides = [
    {
      id: 1,
      title: 'Ultrasonic Parking Sensor Installation Guide',
      category: 'IoT Hardware',
      steps: [
        'Mount the HC-SR04 ultrasonic sensor at bumper height (30-50 cm from ground).',
        'Ensure TRIG pin is wired to ESP8266 GPIO14 (D5) and ECHO to GPIO12 (D6).',
        'Connect status indicator LED to D3 (GPIO0) and OLED display to I2C D1/D2.',
        'Configure Wi-Fi credentials and set API target to http://parknest-wt7j.onrender.com/api/sensors/update.'
      ]
    },
    {
      id: 2,
      title: 'FASTag RFID Sticker Quick Mounting Guide',
      category: 'Toll & Gate Access',
      steps: [
        'Clean top center of windshield behind rear-view mirror with alcohol wipe.',
        'Peel backing paper from FASTag sticker carefully.',
        'Stick tag firmly on inside of windshield with barcode facing outwards.',
        'Avoid removing or re-sticking tag once applied to protect internal RFID chip.'
      ]
    },
    {
      id: 3,
      title: 'Dual Dashcam Hardwiring & Smart Cable Guide',
      category: 'Car Safety',
      steps: [
        'Mount front camera behind rear-view mirror for unobstructed driver view.',
        'Tuck cable along windshield headliner and A-pillar trim down to fuse box.',
        'Connect ACC wire to switched fuse and B+ wire to constant 12V fuse.',
        'Attach rear camera to back windshield center and route cable along roof liner.'
      ]
    }
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Wrench className="text-blue-600" size={24} />
          Nearby Mobility Services & DIY Guides
        </h1>
        <p className="text-xs text-gray-500">Find verified PUC testing centers, 24/7 breakdown mechanics, RTO offices, and car fitting guides.</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('puc')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'puc' ? 'bg-green-600 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          <CheckCircle2 size={15} /> PUC Testing Centers
        </button>

        <button
          onClick={() => setActiveTab('repair')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'repair' ? 'bg-amber-600 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          <Wrench size={15} /> 24/7 Car Mechanics & Repair
        </button>

        <button
          onClick={() => setActiveTab('rto')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'rto' ? 'bg-purple-600 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          <Shield size={15} /> Regional RTO Offices
        </button>

        <button
          onClick={() => setActiveTab('guides')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'guides' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          <Zap size={15} /> Car-Fitting & DIY Guides
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'puc' && (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 text-green-900 p-4 rounded-3xl text-xs flex items-center justify-between">
            <div>
              <span className="font-bold block">Government Verified PUC Pollution Stations</span>
              <span>All listed stations issue official digital PUC certificates with QR verification.</span>
            </div>
            <CheckCircle2 size={24} className="text-green-600 shrink-0" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {pucCenters.map((c) => (
              <div key={c.id} className="bg-white p-5 rounded-3xl border border-gray-200 shadow-sm hover:border-green-300 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-green-700">{c.rating}</span>
                    <span className="text-[10px] bg-green-100 text-green-800 font-bold px-2 py-0.5 rounded-full">{c.dist}</span>
                  </div>
                  <h3 className="font-bold text-gray-900 text-sm mt-2">{c.name}</h3>
                  <p className="text-xs text-gray-500 mt-1 flex items-start gap-1">
                    <MapPin size={13} className="shrink-0 text-gray-400 mt-0.5" /> {c.address}
                  </p>
                  <p className="text-[11px] text-gray-600 font-medium mt-2">{c.status}</p>
                </div>

                <a
                  href={`tel:${c.phone}`}
                  className="mt-4 w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Phone size={14} /> Call Station ({c.phone})
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'repair' && (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 text-amber-900 p-4 rounded-3xl text-xs flex items-center justify-between">
            <div>
              <span className="font-bold block">24/7 Emergency Breakdown & Towing Services</span>
              <span>Need urgent help? Connect directly with mobile mechanics nearby.</span>
            </div>
            <Wrench size={24} className="text-amber-600 shrink-0" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {repairShops.map((r) => (
              <div key={r.id} className="bg-white p-5 rounded-3xl border border-gray-200 shadow-sm hover:border-amber-300 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-700">{r.rating}</span>
                    <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">{r.dist}</span>
                  </div>
                  <h3 className="font-bold text-gray-900 text-sm mt-2">{r.name}</h3>
                  <p className="text-xs text-gray-500 mt-1 flex items-start gap-1">
                    <MapPin size={13} className="shrink-0 text-gray-400 mt-0.5" /> {r.address}
                  </p>
                  <p className="text-[11px] text-amber-800 font-medium mt-2 bg-amber-50 p-2 rounded-xl border border-amber-100">
                    Services: {r.services}
                  </p>
                </div>

                <a
                  href={`tel:${r.phone}`}
                  className="mt-4 w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Phone size={14} /> Call Mechanic ({r.phone})
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'rto' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {rtoOffices.map((o) => (
              <div key={o.id} className="bg-white p-5 rounded-3xl border border-gray-200 shadow-sm flex flex-col justify-between">
                <div>
                  <span className="text-[10px] bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded-full">{o.dist}</span>
                  <h3 className="font-bold text-gray-900 text-sm mt-2">{o.name}</h3>
                  <p className="text-xs text-gray-500 mt-1 flex items-start gap-1">
                    <MapPin size={13} className="shrink-0 text-gray-400 mt-0.5" /> {o.address}
                  </p>
                  <div className="mt-3 text-xs text-gray-600 space-y-1">
                    <div>Hours: <strong className="text-gray-800">{o.hours}</strong></div>
                    <div>Key Services: <strong className="text-gray-800">{o.services}</strong></div>
                  </div>
                </div>

                <a
                  href="https://parivahan.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <ExternalLink size={14} /> Parivahan RTO Portal
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'guides' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {fittingGuides.map((g) => (
              <div key={g.id} className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-3">
                <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2.5 py-0.5 rounded-full uppercase">{g.category}</span>
                <h3 className="font-bold text-gray-900 text-sm">{g.title}</h3>

                <div className="space-y-2 pt-2 border-t border-gray-100 text-xs text-gray-700">
                  {g.steps.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-blue-50 text-blue-600 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5 border border-blue-200">
                        {idx + 1}
                      </span>
                      <p className="leading-tight text-gray-600 text-[11px]">{step}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Services;
