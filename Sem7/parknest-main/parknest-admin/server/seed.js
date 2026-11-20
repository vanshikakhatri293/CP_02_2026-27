const mongoose = require('mongoose');
const dotenv = require('dotenv');
const ParkingArea = require('./models/ParkingArea');
const ParkingSlot = require('./models/ParkingSlot');
const Sensor = require('./models/Sensor');
const Reservation = require('./models/Reservation');

dotenv.config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB for seeding...');

    // Clear existing data
    await ParkingArea.deleteMany({});
    await ParkingSlot.deleteMany({});
    await Sensor.deleteMany({});
    await Reservation.deleteMany({});

    // Create Areas
    const areas = await ParkingArea.insertMany([
      { name: 'VESITs A1', location: 'Ground Floor', latitude: 19.045, longitude: 72.889, totalSlots: 10, description: 'Near Entry gate · Demo location' },
      { name: 'VESITs A2', location: 'Ground Floor', latitude: 19.052, longitude: 72.898, totalSlots: 10, description: 'Garden Entry · Demo location' },
      { name: 'VESITs A3', location: 'Ground Floor', latitude: 19.042, longitude: 72.883, totalSlots: 6, description: 'Behind Garden · Demo location' }
    ]);

    const areaA1 = areas[0];
    const areaA2 = areas[1];
    const areaA3 = areas[2];

    // Create Sensors
    const sensors = [];
    const totalSlotsCount = 26;
    for (let i = 1; i <= totalSlotsCount; i++) {
      let status = 'ONLINE';
      if (i % 8 === 0) status = 'OFFLINE';
      if (i % 12 === 0) status = 'MAINTENANCE';

      sensors.push({
        sensorId: i === 1 ? 'PN-SENSOR-001' : `SN-${String(i).padStart(3, '0')}`,
        slotId: i === 1 ? 'PN-A-001' : `P-${String(i).padStart(3, '0')}`,
        status: status,
        lastSeen: new Date(),
        deviceType: 'NodeMCU/ESP8266',
        ipAddress: `192.168.1.${100 + i}`,
        firmwareVersion: '1.0.3'
      });
    }
    const savedSensors = await Sensor.insertMany(sensors);

    // Create Slots
    const slots = [];
    for (let i = 1; i <= totalSlotsCount; i++) {
      let areaId;
      if (i <= 10) areaId = areaA1._id;
      else if (i <= 20) areaId = areaA2._id;
      else areaId = areaA3._id;

      const sensor = savedSensors[i-1];
      let status = 'AVAILABLE';

      if (i === 1) {
        status = 'AVAILABLE';
      } else if (sensor.status === 'OFFLINE') {
        status = 'OFFLINE';
      } else if (sensor.status === 'MAINTENANCE') {
        status = 'MAINTENANCE';
      } else {
        const rand = Math.random();
        if (rand > 0.8) status = 'OCCUPIED';
        else if (rand > 0.6) status = 'RESERVED';
      }

      slots.push({
        slotId: i === 1 ? 'PN-A-001' : `P-${String(i).padStart(3, '0')}`,
        areaId: areaId,
        status: status,
        sensorId: sensor.sensorId,
        distance: status === 'OCCUPIED' ? Math.floor(Math.random() * 8) + 2 : Math.floor(Math.random() * 20) + 30,
        threshold: 15,
        lastUpdated: new Date()
      });
    }
    const savedSlots = await ParkingSlot.insertMany(slots);

    // Create Reservations
    const users = ['John Doe', 'Jane Smith', 'Mike Ross', 'Rachel Zane', 'Harvey Specter'];
    const reservations = [];

    // Find reserved slots
    const reservedSlots = savedSlots.filter(s => s.status === 'RESERVED');

    for (let i = 0; i < reservedSlots.length; i++) {
      const startTime = new Date();
      startTime.setHours(startTime.getHours() - Math.floor(Math.random() * 5));

      const endTime = new Date(startTime);
      endTime.setHours(endTime.getHours() + 2 + Math.floor(Math.random() * 4));

      reservations.push({
        reservationId: `RES-${1000 + i}`,
        slotId: reservedSlots[i].slotId,
        userId: users[i % users.length],
        userName: users[i % users.length],
        userPhone: `+91 90000 ${String(10000 + i)}`,
        vehicleNumber: `MH-02-CB-${String(4321 + i).padStart(4, '0')}`,
        vehicleType: 'Sedan',
        startTime: startTime,
        endTime: endTime,
        status: 'ACTIVE'
      });
    }

    // Add some completed reservations
    for (let i = 0; i < 5; i++) {
        const startTime = new Date();
        startTime.setDate(startTime.getDate() - 1);
        const endTime = new Date(startTime);
        endTime.setHours(endTime.getHours() + 2);

        reservations.push({
            reservationId: `RES-${2000 + i}`,
            slotId: savedSlots[i % savedSlots.length].slotId,
            userId: users[i % users.length],
            userName: users[i % users.length],
            userPhone: `+91 90000 ${String(20000 + i)}`,
            vehicleNumber: `MH-02-AB-${String(1000 + i)}`,
            vehicleType: 'Hatchback',
            startTime: startTime,
            endTime: endTime,
            status: 'COMPLETED'
        });
    }

    await Reservation.insertMany(reservations);

    console.log(`Seeding completed successfully! Created ${areas.length} areas, ${slots.length} slots, and ${reservations.length} reservations.`);
    process.exit();
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
};

seedData();
