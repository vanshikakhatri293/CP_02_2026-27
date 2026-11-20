import React, { useState } from 'react';
import { useUser } from '../../context/UserContext';
import { Car, Plus, Trash2, CheckCircle2, Shield, Phone, Mail, User as UserIcon } from 'lucide-react';

const Profile = () => {
  const { user, addVehicle, setDefaultVehicle, deleteVehicle } = useUser();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPlate, setNewPlate] = useState('');
  const [newType, setNewType] = useState('Sedan');
  const [newModel, setNewModel] = useState('');
  const [newColor, setNewColor] = useState('Silver');

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newPlate) return;
    addVehicle({
      plate: newPlate,
      type: newType,
      model: newModel || 'Vehicle',
      color: newColor
    });
    setNewPlate('');
    setNewModel('');
    setShowAddForm(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <UserIcon className="text-blue-600" size={24} />
          Driver Profile & Registered Vehicles
        </h1>
        <p className="text-xs text-gray-500">Manage your profile, mobile sign-in credentials, and vehicle license plates.</p>
      </div>

      {/* User Info Card */}
      <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white font-bold text-xl flex items-center justify-center shadow-md">
            {user.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">{user.name}</h2>
            <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
              <span className="flex items-center gap-1"><Phone size={13} className="text-blue-600" /> {user.phone}</span>
              <span>•</span>
              <span className="flex items-center gap-1"><Mail size={13} className="text-gray-400" /> {user.email}</span>
            </div>
          </div>
        </div>

        <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-2xl text-xs font-semibold flex items-center gap-1.5">
          <Shield size={16} className="text-emerald-600" />
          <span>Verified Phone OTP Driver</span>
        </div>
      </div>

      {/* Vehicles Section */}
      <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div>
            <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
              <Car size={20} className="text-blue-600" />
              Registered Vehicles ({user.vehicles.length})
            </h3>
            <p className="text-xs text-gray-500">Your registered cars are linked to IoT sensor parking reservations</p>
          </div>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-sm"
          >
            <Plus size={16} /> Add Vehicle
          </button>
        </div>

        {/* Add Form */}
        {showAddForm && (
          <form onSubmit={handleAdd} className="bg-gray-50 p-4 rounded-2xl border border-gray-200 space-y-3 text-xs">
            <h4 className="font-bold text-gray-900">Add New Vehicle</h4>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="font-medium text-gray-700 block mb-1">License Plate</label>
                <input
                  type="text"
                  required
                  placeholder="MH-02-AB-1234"
                  value={newPlate}
                  onChange={(e) => setNewPlate(e.target.value.toUpperCase())}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 font-mono uppercase font-bold outline-none"
                />
              </div>
              <div>
                <label className="font-medium text-gray-700 block mb-1">Vehicle Type</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 font-medium outline-none"
                >
                  <option value="Sedan">Sedan</option>
                  <option value="SUV">SUV</option>
                  <option value="Hatchback">Hatchback</option>
                  <option value="EV">EV Electric</option>
                  <option value="Bike">Motorbike</option>
                </select>
              </div>
              <div>
                <label className="font-medium text-gray-700 block mb-1">Model Name</label>
                <input
                  type="text"
                  placeholder="e.g. Honda City"
                  value={newModel}
                  onChange={(e) => setNewModel(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 outline-none"
                />
              </div>
              <div>
                <label className="font-medium text-gray-700 block mb-1">Color</label>
                <input
                  type="text"
                  placeholder="e.g. Pearl White"
                  value={newColor}
                  onChange={(e) => setNewColor(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1.5 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-blue-600 text-white font-bold px-4 py-1.5 rounded-xl text-xs"
              >
                Save Vehicle
              </button>
            </div>
          </form>
        )}

        {/* Vehicles Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {user.vehicles.map((v) => (
            <div
              key={v.id}
              className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${
                v.isDefault ? 'bg-blue-50/70 border-blue-300 ring-2 ring-blue-100' : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-mono font-bold text-sm">
                  <Car size={22} className="text-blue-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-extrabold text-gray-900 text-base">{v.plate}</span>
                    {v.isDefault && (
                      <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 size={10} /> Default
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{v.model} ({v.type} • {v.color})</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {!v.isDefault && (
                  <button
                    onClick={() => setDefaultVehicle(v.id)}
                    className="text-xs text-blue-600 font-semibold hover:underline"
                  >
                    Set Default
                  </button>
                )}
                {user.vehicles.length > 1 && (
                  <button
                    onClick={() => deleteVehicle(v.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Profile;
