const getSensorState = (slot) => {
  if (!slot.sensorId || slot.distance === undefined || slot.distance === null || !Number.isFinite(Number(slot.distance))) {
    return 'UNKNOWN';
  }
  return Number(slot.distance) < Number(slot.threshold || 10) ? 'OCCUPIED' : 'EMPTY';
};

const resolveSlotStatus = (currentStatus, sensorState, hasActiveReservation) => {
  if (currentStatus === 'MAINTENANCE' || currentStatus === 'OFFLINE') return currentStatus;
  if (hasActiveReservation) return 'RESERVED';
  if (sensorState === 'OCCUPIED') return 'OCCUPIED';
  if (sensorState === 'EMPTY') return 'AVAILABLE';
  return currentStatus;
};

module.exports = { getSensorState, resolveSlotStatus };
