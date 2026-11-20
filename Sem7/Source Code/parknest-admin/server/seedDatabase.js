require("dotenv").config();

const mongoose = require("mongoose");

const ParkingArea = require("./models/ParkingArea");
const ParkingSlot = require("./models/ParkingSlot");
const Sensor = require("./models/Sensor");
const Reservation = require("./models/Reservation");

async function seedDatabase() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is missing from the .env file");
    }

    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected successfully");
    console.log("Database:", mongoose.connection.name);

    // 1. Create a sample parking area if it does not exist.
    let area = await ParkingArea.findOne({
      name: "ParkNest Demo Parking"
    });

    if (!area) {
      area = await ParkingArea.create({
        name: "ParkNest Demo Parking",
        location: "Demo Location, Mumbai",
        latitude: 19.045,
        longitude: 72.889,
        totalSlots: 5,
        description: "Development dataset for ParkNest"
      });

      console.log("Created sample parking area");
    } else {
      console.log("Sample parking area already exists");
      area.latitude = 19.045;
      area.longitude = 72.889;
      await area.save();
    }

    // 2. Create sample sensors.
    const sensorDefinitions = [
      {
        sensorId: "PN-SENSOR-001",
        slotId: "PN-A-001",
        status: "ONLINE",
        distance: 25
      },
      {
        sensorId: "PN-SENSOR-002",
        slotId: "PN-A-002",
        status: "ONLINE",
        distance: 5
      },
      {
        sensorId: "PN-SENSOR-003",
        slotId: "PN-A-003",
        status: "OFFLINE",
        distance: 0
      },
      {
        sensorId: "PN-SENSOR-004",
        slotId: "PN-A-004",
        status: "ONLINE",
        distance: 30
      },
      {
        sensorId: "PN-SENSOR-005",
        slotId: "PN-A-005",
        status: "MAINTENANCE",
        distance: 0
      }
    ];

    const sensors = [];

    for (const definition of sensorDefinitions) {
      const sensor = await Sensor.findOneAndUpdate(
        { sensorId: definition.sensorId },
        {
          $setOnInsert: {
            ...definition,
            deviceType: "NodeMCU/ESP8266",
            firmwareVersion: "1.0.0",
            lastSeen: new Date()
          }
        },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true
        }
      );

      sensors.push(sensor);
    }

    console.log("Verified sample sensor records");

    // 3. Create sample parking slots.
    const slotDefinitions = [
      {
        slotId: "PN-A-001",
        status: "AVAILABLE",
        sensorId: "PN-SENSOR-001",
        distance: 25
      },
      {
        slotId: "PN-A-002",
        status: "OCCUPIED",
        sensorId: "PN-SENSOR-002",
        distance: 5
      },
      {
        slotId: "PN-A-003",
        status: "OFFLINE",
        sensorId: "PN-SENSOR-003",
        distance: 0
      },
      {
        slotId: "PN-A-004",
        status: "AVAILABLE",
        sensorId: "PN-SENSOR-004",
        distance: 30
      },
      {
        slotId: "PN-A-005",
        status: "MAINTENANCE",
        sensorId: "PN-SENSOR-005",
        distance: 0
      }
    ];

    for (const definition of slotDefinitions) {
      await ParkingSlot.findOneAndUpdate(
        { slotId: definition.slotId },
        {
          $setOnInsert: {
            ...definition,
            areaId: area._id,
            threshold: 10,
            lastUpdated: new Date()
          }
        },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true
        }
      );
    }

    console.log("Verified sample parking slot records");

    // 4. Create one sample reservation.
    const existingReservation = await Reservation.findOne({
      reservationId: "PN-DEMO-RES-001"
    });

    if (!existingReservation) {
      await Reservation.create({
        reservationId: "PN-DEMO-RES-001",
        slotId: "PN-A-004",
        userId: "PN-DEMO-USER-001",
        startTime: new Date(Date.now() + 60 * 60 * 1000),
        endTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
        userName: "Demo Driver",
        userPhone: "+91 98765 43210",
        vehicleNumber: "MH-02-CB-4321",
        vehicleType: "Sedan",
        status: "PENDING"
      });

      console.log("Created sample reservation");
    } else {
      console.log("Sample reservation already exists");
    }

    // 5. Display document counts.
    const counts = {
      parkingAreas: await ParkingArea.countDocuments(),
      parkingSlots: await ParkingSlot.countDocuments(),
      sensors: await Sensor.countDocuments(),
      reservations: await Reservation.countDocuments()
    };

    console.log("\nDatabase document counts:");
    console.table(counts);

    console.log("\nSeeding completed successfully");
  } catch (error) {
    console.error("Database seeding failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

seedDatabase();
