import React, { createContext, useContext, useEffect, useState } from 'react';
import { userService } from '../services/api';

const UserContext = createContext();

const emptyUser = {
  id: '',
  isLoggedIn: false,
  phone: '',
  name: '',
  vehicles: []
};

const phoneDigits = (phone) => {
  const digits = String(phone ?? '').replace(/\D/g, '');
  return digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits;
};

const mapUser = (record) => {
  const vehicles = Array.isArray(record.vehicles) ? record.vehicles.map((vehicle) => ({
    id: vehicle.id || vehicle._id,
    plate: vehicle.plate,
    type: vehicle.type,
    model: vehicle.model || '',
    color: vehicle.color || '',
    isDefault: Boolean(vehicle.isDefault)
  })) : [];

  if (vehicles.length && !vehicles.some((vehicle) => vehicle.isDefault)) {
    vehicles[0].isDefault = true;
  }

  return {
    id: record.id || record._id,
    isLoggedIn: true,
    phone: `+91 ${phoneDigits(record.phone)}`,
    name: record.name || '',
    vehicles
  };
};

const getInitialUser = () => {
  try {
    const saved = JSON.parse(localStorage.getItem('parknest_user') || 'null');
    if (/^[\da-f]{24}$/i.test(saved?.id || '') && saved.isLoggedIn) {
      return { ...emptyUser, ...saved, vehicles: Array.isArray(saved.vehicles) ? saved.vehicles : [] };
    }
  } catch {
    localStorage.removeItem('parknest_user');
  }
  return { ...emptyUser };
};

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(getInitialUser);
  const [activeTab, setActiveTab] = useState('user');

  useEffect(() => {
    if (user.isLoggedIn && user.id) {
      localStorage.setItem('parknest_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('parknest_user');
    }
  }, [user]);

  const loginWithPhone = async (phone) => {
    const response = await userService.login(phoneDigits(phone));
    const nextUser = mapUser(response.data.user);
    setUser(nextUser);
    return { ...nextUser, needsName: response.data.needsName };
  };

  const saveProfile = async (updates) => {
    if (!user.isLoggedIn) {
      throw new Error('Sign in before saving your profile.');
    }
    const response = await userService.updateProfile({
      phone: phoneDigits(user.phone),
      name: updates.name ?? user.name,
      vehicles: updates.vehicles ?? user.vehicles
    });
    const nextUser = mapUser(response.data.user);
    setUser(nextUser);
    return nextUser;
  };

  const addVehicle = async (newVehicle) => {
    const plate = String(newVehicle.plate ?? '').trim().toUpperCase();
    if (!plate) throw new Error('Enter the vehicle number plate.');
    if (user.vehicles.some((vehicle) => vehicle.plate === plate)) {
      throw new Error('That number plate is already registered.');
    }

    return saveProfile({
      vehicles: [...user.vehicles, {
        id: `v-${Date.now()}`,
        plate,
        type: newVehicle.type || 'Sedan',
        model: newVehicle.model || '',
        color: newVehicle.color || '',
        isDefault: user.vehicles.length === 0
      }]
    });
  };

  const setDefaultVehicle = async (id) => {
    if (!user.vehicles.some((vehicle) => vehicle.id === id)) {
      throw new Error('The selected vehicle could not be found.');
    }
    return saveProfile({
      vehicles: user.vehicles.map((vehicle) => ({ ...vehicle, isDefault: vehicle.id === id }))
    });
  };

  const deleteVehicle = async (id) => {
    const vehicles = user.vehicles.filter((vehicle) => vehicle.id !== id);
    if (vehicles.length && !vehicles.some((vehicle) => vehicle.isDefault)) {
      vehicles[0] = { ...vehicles[0], isDefault: true };
    }
    return saveProfile({ vehicles });
  };

  const updateProfile = (profile) => saveProfile(profile);

  const logout = () => setUser({ ...emptyUser });

  const getDefaultVehicle = () => user.vehicles.find((vehicle) => vehicle.isDefault) || user.vehicles[0];

  return (
    <UserContext.Provider value={{
      user,
      loginWithPhone,
      logout,
      addVehicle,
      setDefaultVehicle,
      deleteVehicle,
      updateProfile,
      getDefaultVehicle,
      activeTab,
      setActiveTab
    }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
