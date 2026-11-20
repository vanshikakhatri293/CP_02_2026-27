const test = require('node:test');
const assert = require('node:assert/strict');
const { formatPhone, normalizePhone, normalizeVehicles } = require('../services/userProfile');

test('phone normalization accepts ten digits with or without the country code', () => {
  assert.equal(normalizePhone('+91 98765 43210'), '9876543210');
  assert.equal(formatPhone('9876543210'), '+91 9876543210');
});

test('vehicle normalization uppercases plates and assigns a default when needed', () => {
  assert.deepEqual(normalizeVehicles([
    { id: 'car-1', plate: 'mh 02 cb 4321', type: 'Sedan' },
    { id: 'car-2', plate: 'mh 03 xy 4321', type: 'SUV', isDefault: true }
  ]).map(({ plate, isDefault }) => ({ plate, isDefault })), [
    { plate: 'MH 02 CB 4321', isDefault: false },
    { plate: 'MH 03 XY 4321', isDefault: true }
  ]);

  assert.equal(normalizeVehicles([{ plate: 'mh02cb4321', type: 'Sedan' }])[0].isDefault, true);
});

test('vehicle normalization rejects duplicate plates and unsupported vehicle types', () => {
  assert.throws(() => normalizeVehicles([
    { plate: 'mh02cb4321', type: 'Sedan' },
    { plate: 'MH02CB4321', type: 'SUV' }
  ]), /only be registered once/i);
  assert.throws(() => normalizeVehicles([
    { plate: 'mh02cb4321', type: 'Truck' }
  ]), /supported vehicle type/i);
});
