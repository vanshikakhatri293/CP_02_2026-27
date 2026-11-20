const test = require('node:test');
const assert = require('node:assert/strict');
const { getSensorState, resolveSlotStatus } = require('../services/slotState');

test('active reservations stay reserved while the sensor sees an occupied or empty slot', () => {
  assert.equal(resolveSlotStatus('AVAILABLE', 'OCCUPIED', true), 'RESERVED');
  assert.equal(resolveSlotStatus('RESERVED', 'EMPTY', true), 'RESERVED');
});

test('an expired reservation frees an empty slot but an occupied slot remains unavailable', () => {
  assert.equal(resolveSlotStatus('RESERVED', 'EMPTY', false), 'AVAILABLE');
  assert.equal(resolveSlotStatus('RESERVED', 'OCCUPIED', false), 'OCCUPIED');
});

test('sensor readings use the configured threshold and treat a zero distance as occupied', () => {
  const slot = { sensorId: 'sensor-1', threshold: 10 };
  assert.equal(getSensorState({ ...slot, distance: 0 }), 'OCCUPIED');
  assert.equal(getSensorState({ ...slot, distance: 9.9 }), 'OCCUPIED');
  assert.equal(getSensorState({ ...slot, distance: 10 }), 'EMPTY');
});

test('maintenance and offline slots remain unavailable, and missing telemetry is unknown', () => {
  assert.equal(resolveSlotStatus('MAINTENANCE', 'EMPTY', false), 'MAINTENANCE');
  assert.equal(resolveSlotStatus('OFFLINE', 'EMPTY', false), 'OFFLINE');
  assert.equal(getSensorState({ sensorId: 'sensor-1', threshold: 10 }), 'UNKNOWN');
  assert.equal(getSensorState({ distance: 25, threshold: 10 }), 'UNKNOWN');
});
