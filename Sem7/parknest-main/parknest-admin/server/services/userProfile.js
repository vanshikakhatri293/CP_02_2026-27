const VEHICLE_TYPES = new Set(['Sedan', 'SUV', 'Hatchback', 'EV', 'Bike']);

const normalizePhone = (value) => {
  const digits = String(value ?? '').replace(/\D/g, '');
  return digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits;
};

const formatPhone = (value) => `+91 ${normalizePhone(value)}`;

const normalizeVehicles = (vehicles) => {
  if (!Array.isArray(vehicles)) {
    throw new Error('Vehicles must be a list.');
  }

  const seenPlates = new Set();
  const normalized = vehicles.map((vehicle, index) => {
    if (!vehicle || typeof vehicle !== 'object') {
      throw new Error('Vehicle details are invalid.');
    }

    const plate = String(vehicle.plate ?? '').trim().toUpperCase();
    const type = String(vehicle.type ?? '');
    if (!plate || plate.length > 16) {
      throw new Error('Each vehicle needs a valid number plate.');
    }
    if (!VEHICLE_TYPES.has(type)) {
      throw new Error('Select a supported vehicle type.');
    }
    if (seenPlates.has(plate)) {
      throw new Error('A number plate can only be registered once.');
    }
    seenPlates.add(plate);

    return {
      id: String(vehicle.id || `vehicle-${index + 1}`),
      plate,
      type,
      model: String(vehicle.model ?? '').trim().slice(0, 80),
      color: String(vehicle.color ?? '').trim().slice(0, 40),
      isDefault: Boolean(vehicle.isDefault)
    };
  });

  const defaultIndex = normalized.findIndex((vehicle) => vehicle.isDefault);
  normalized.forEach((vehicle, index) => {
    vehicle.isDefault = index === (defaultIndex === -1 ? 0 : defaultIndex);
  });
  return normalized;
};

module.exports = { formatPhone, normalizePhone, normalizeVehicles };
