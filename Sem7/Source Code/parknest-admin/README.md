# ParkNest Admin Panel & IoT Management System

Full-stack admin panel and real-time IoT parking slot occupancy management system for ParkNest.

## Project Structure

- `client/`: React + Vite frontend (Live Parking Grid, Sensor Management, Analytics, Dashboard)
- `server/`: Node.js + Express + MongoDB backend (Socket.IO, Connectivity Monitor, REST APIs)
- `firmware/`: ESP8266 Arduino C++ firmware for IR and ultrasonic sensor hardware

## Setup & Running

### 1. Backend Setup (`server/`)

1. Navigate to `server/`:
   ```bash
   cd parknest-admin/server
   npm install
   ```
2. Configure `.env`:
   ```env
   PORT=5002
   MONGO_URI=mongodb+srv://<username>:<password>@parknest.mxdlxyq.mongodb.net/parknest?retryWrites=true&w=majority
   CLIENT_URL=http://localhost:5173
   SENSOR_OFFLINE_THRESHOLD_MS=30000
   ```
3. Seed sample parking areas, slots, and sensors:
   ```bash
   node seed.js
   ```
4. Start the server:
   ```bash
   npm start
   ```

### 2. Frontend Setup (`client/`)

1. Navigate to `client/`:
   ```bash
   cd parknest-admin/client
   npm install
   ```
2. Start the Vite dev server:
   ```bash
   npm run dev
   ```

### 3. ESP8266 Hardware Setup & Firmware (`firmware/`)

1. Connect an **IR Obstacle / Proximity Sensor Module** (e.g., FC-51 or TCRT5000) to an **ESP8266 NodeMCU/Wemos D1 Mini**:
   - `VCC` -> `3.3V` or `5V`
   - `GND` -> `GND`
   - `OUT` -> `D1` (`GPIO 5`)
2. Open `firmware/esp8266_ir_sensor.ino` in Arduino IDE.
3. For the designated live demo slot, use `firmware/esp8266_ultrasonic_sensor.ino` and configure `WIFI_SSID`, `WIFI_PASS`, `SERVER_URL`, `SENSOR_ID=PN-SENSOR-001`, and `SLOT_ID=PN-A-001`.
4. Upload to your ESP8266.

### 4. Hardware Simulation (Optional)

To test without physical ESP8266 hardware:
```bash
cd parknest-admin/server
node simulator.js
```

## Features & Architecture

- **Driver MVP**: Open `/#/user` for the responsive driver app, phone/OTP demo (code `1234`), local vehicle profile, Google Maps nearby searches, booking, and reservation details. OTP is client-only and does not send SMS.
- **Clearly marked sample data**: `npm run seed` creates demo parking areas and slots; `PN-A-001` is the designated physical-sensor slot. Driver service searches are Google Maps results, not ParkNest-verified listings.
- **Reservation/sensor states**: An active or pending reservation remains `RESERVED` while a car is detected. After expiry, an online sensor determines `OCCUPIED` or `AVAILABLE`; offline/maintenance slots remain unavailable. Sensor readings and reservation status are displayed separately.

- **Real-Time IoT Synchronization**: ESP8266 posts readings to `/api/sensors/update`. Node.js updates MongoDB and broadcasts real-time Socket.IO events (`slotUpdated`, `sensorUpdated`, `parkingUpdated`) to web & Android app clients.
- **Visual Status Indicators**:
  - 🟢 **AVAILABLE**: Slot is vacant (Green visual indicator).
  - 🔴 **OCCUPIED**: Car is parked (Red visual indicator).
  - 🟡 **RESERVED**: Slot is reserved.
  - ⚪ **OFFLINE**: Sensor disconnected or inactive (Grey indicator).
- **Sensor Connectivity Monitor**: Background monitor periodically tracks `lastSeen` timestamps. If a device stops transmitting for >30 seconds, it automatically marks both the sensor and slot as `OFFLINE` and notifies all clients in real-time.

## Tech Stack

- **Frontend:** React, Vite, Tailwind CSS, Lucide Icons, Socket.IO Client, Axios
- **Backend:** Node.js, Express, MongoDB (Mongoose), Socket.IO
- **IoT Hardware:** ESP8266 Wi-Fi Module (NodeMCU/Wemos D1 Mini) + IR Obstacle Sensor (FC-51 / TCRT5000)

