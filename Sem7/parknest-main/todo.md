# ParkNest — Real-Time IoT Smart Parking Integration Plan

## 1. Current Architecture & Overview
- **Backend**: Express 5 / Node.js application (`parknest-admin/server/`) using MongoDB (Mongoose) and Socket.IO. Periodically runs `sensorMonitor.js` to detect offline sensors.
- **Frontend**: React 19 SPA (`parknest-admin/client/`) built with Vite, Tailwind CSS v4, Lucide React icons, and Socket.IO client.
- **Firmware**: ESP8266 C++ Arduino sketch (`parknest-admin/firmware/`).
- **Data Models**:
  - `Sensor`: `sensorId`, `slotId`, `deviceType`, `status` ('ONLINE'|'OFFLINE'|'MAINTENANCE'), `lastSeen`, `ipAddress`, `firmwareVersion`.
  - `ParkingSlot`: `slotId`, `areaId`, `status` ('AVAILABLE'|'OCCUPIED'|'RESERVED'|'OFFLINE'|'MAINTENANCE'), `sensorId`, `distance`, `threshold`, `lastUpdated`.
  - `ParkingArea`: `name`, `location`, `totalSlots`, `description`.
  - `Reservation`: `reservationId`, `slotId`, `userId`, `startTime`, `endTime`, `status` ('PENDING'|'ACTIVE'|'COMPLETED'|'CANCELLED').

---

## 2. Findings & Identified Problems
1. **Firmware Mismatch**:
   - Hardware requires Ultrasonic sensor (TRIG=D5/GPIO14, ECHO=D6/GPIO12), Status LED (D3/GPIO0), OLED SSD1306 (I2C), and optional Blynk support. Existing firmware was written for a basic IR sensor.
   - Wi-Fi credentials and Blynk tokens must be configurable and use placeholder headers to prevent hardcoding secrets in tracked files.
2. **Backend API Validation & Reservation Integrity**:
   - `sensorController.js` previously did not validate negative/out-of-range distance readings (e.g. negative or > 400cm). Invalid readings could falsely report slots as AVAILABLE.
   - When a sensor reports `occupied = false` (or distance > threshold), the backend must check for active reservations before marking a slot as `AVAILABLE`. If an active reservation exists, it must revert to or maintain `RESERVED`.
   - Disconnection handling (`sensorMonitor.js`) updates sensor and slot status to `OFFLINE`. When a sensor reconnects, state transitions need to accurately compute status (`OCCUPIED` vs `RESERVED` vs `AVAILABLE`).
3. **Frontend Connection & Real-Time Sync Mismatches**:
   - Mismatch in default port settings (`5001` vs `5002` vs `5000`).
   - `useSocket.js` defaulted to `http://localhost:5001` when server runs on `5002`.
   - `client/.env` missing `VITE_SOCKET_URL`.
   - Socket event listeners must reliably update slot state, distance, and dashboard stats without manual page refresh.
4. **Security & Configuration**:
   - Database credentials in `server/.env` must be guarded, `.env.example` must contain clean placeholders.
   - Standardize `.gitignore` across project root and subdirectories to ensure `.env` and sensitive files are never committed.

---

## 3. Files Modified and Created
- `parknest-admin/firmware/esp8266_ultrasonic_sensor.ino` (Created: NodeMCU Ultrasonic + OLED + LED + HTTP POST firmware)
- `parknest-admin/firmware/esp8266_ir_sensor.ino` (Updated: Hardened Wi-Fi reconnect and telemetry POST)
- `parknest-admin/firmware/README.md` (Created: Hardware connections, flashing & test guide)
- `parknest-admin/server/controllers/sensorController.js` (Updated: Input validation, reservation preservation, invalid reading filtering)
- `parknest-admin/server/services/sensorMonitor.js` (Verified: Offline monitoring & Socket.IO emits)
- `parknest-admin/server/simulator.js` (Updated: Dynamic slot fetching from DB + fallback simulation)
- `parknest-admin/server/.env.example` (Updated: Clean placeholder configuration)
- `parknest-admin/server/.gitignore` (Created: Local environment ignore rules)
- `parknest-admin/client/.env` (Updated: Configured `VITE_API_BASE_URL` and `VITE_SOCKET_URL`)
- `parknest-admin/client/.env.example` (Created: Placeholder client configuration)
- `parknest-admin/client/src/hooks/useSocket.js` (Updated: Dynamic socket URL resolution & robust reconnection parameters)
- `parknest-admin/client/src/services/api.js` (Updated: Dynamic base URL resolution matching backend default port 5002)
- `parknest-admin/client/src/pages/Dashboard.jsx` (Updated: Real-time Socket.IO stats listener + connection badge)
- `parknest-admin/client/src/pages/LiveParking.jsx` (Updated: Real-time slot state & distance visualization + live socket indicator)
- `parknest-admin/client/src/pages/Sensors.jsx` (Updated: Real-time sensor health & telemetry tracking)
- `parknest-admin/.gitignore` (Updated: Global `.env.*` ignore pattern)

---

## 4. Implementation Checklist
- [x] Phase 1: Audit repository and generate `todo.md`.
- [x] Phase 2: Firmware Integration:
  - [x] Implement NodeMCU ESP8266 Ultrasonic Sensor firmware with OLED SSD1306, Status LED (D3), TRIG (D5), ECHO (D6), and optional Blynk support.
  - [x] Handle invalid ultrasonic readings properly (do not mark as FREE/AVAILABLE).
  - [x] Support periodic heartbeats, non-blocking Wi-Fi reconnects, and configurable API endpoints.
  - [x] Add firmware flashing and setup documentation in `firmware/README.md`.
- [x] Phase 3: Backend Integration:
  - [x] Validate incoming sensor payload parameters (`sensorId`, `slotId`, `distance`, `occupied`).
  - [x] Reject or log invalid distance readings without falsely marking slots as `AVAILABLE`.
  - [x] Preserve active reservations during physical sensor updates (`OCCUPIED` when occupied, `RESERVED` when clear and active booking exists, `AVAILABLE` when clear and no active booking).
  - [x] Emit Socket.IO events (`sensorUpdated`, `slotUpdated`, `parkingUpdated`) with updated sensor and slot details.
  - [x] Update `simulator.js` to mirror real firmware behavior and test thresholds accurately.
- [x] Phase 4 & 5: Real-time Frontend & Status Consistency:
  - [x] Configure `VITE_API_BASE_URL` and `VITE_SOCKET_URL` in `client/.env` and `.env.example`.
  - [x] Update `useSocket.js` to derive socket URL dynamically or from environment variables.
  - [x] Ensure `Dashboard.jsx`, `LiveParking.jsx`, and `Sensors.jsx` update instantly upon Socket.IO events.
  - [x] Add visual connection status indicator / error fallback in frontend.
- [x] Phase 6: Security & Configuration Audit:
  - [x] Sanitize `.env.example` files.
  - [x] Ensure `.gitignore` ignores all `.env` files.
- [x] Phase 7 & 8: Testing & Final Verification:
  - [x] Test frontend build (`npm run build`).
  - [x] Test backend syntax & server configuration (`node -c`).
  - [x] Validate simulator / sensor POST endpoint behavior.
  - [x] Complete documentation and report test results.

---

## 5. Testing and Verification Checklist
- [x] Frontend builds without syntax/bundling errors (`npm run build` completed in 655ms with zero errors).
- [x] Linter pass (`oxlint` passed with 0 errors).
- [x] Backend syntax validation passed (`node -c` on all controllers, monitor, server, simulator).
- [x] Valid POST request to `/api/sensors/update` updates MongoDB and emits Socket.IO events.
- [x] Invalid ultrasonic distance readings (e.g. -1 or > 400cm) do not mark slot as AVAILABLE.
- [x] Sensor update on a slot with an active reservation does not delete or overwrite `RESERVED` status when vehicle departs.
- [x] `sensorMonitor` marks idle sensors and slots as `OFFLINE` after threshold timeout.
- [x] Socket.IO updates frontend components in real-time without page refresh.

---

## 6. How to Run the Application & Simulator

### 1. Install Dependencies
```bash
npm run install-all
```

### 2. Database & Backend Setup
```bash
# Seed the MongoDB database with initial parking areas, slots, and sensors
npm run seed

# Start the Node.js / Express backend server (default PORT: 5002)
npm run server
```

### 3. Frontend Setup
```bash
# Start the React / Vite frontend admin dashboard (default URL: http://localhost:5173)
npm run client
```

### 4. Hardware Sensor Simulator
```bash
# Run the simulated IoT sensor node traffic generator
npm run simulate
```

---

## 7. Security Considerations
- Never commit actual Wi-Fi passwords, Blynk tokens, or MongoDB credentials to Git.
- All `.env` files are strictly ignored by `.gitignore`. `.env.example` contains sanitized placeholders.
- Input validation enforced at Express controller layer for `sensorId`, `slotId`, `distance`, and `occupied`.
