# ParkNest ESP8266 Firmware Setup & Flashing Guide

This directory contains the firmware implementations for NodeMCU ESP8266 IoT nodes connected to the ParkNest Smart Parking system.

## Hardware Setup
- **Microcontroller**: NodeMCU ESP8266 / Wemos D1 Mini
- **Ultrasonic Distance Sensor**: HC-SR04 or HY-SRF05
  - **TRIG Pin**: `D5` (GPIO 14)
  - **ECHO Pin**: `D6` (GPIO 12)
  - **VCC**: 5V (VIN)
  - **GND**: GND
- **Status LED**:
  - **Anode**: `D3` (GPIO 0) via 220Ω resistor
  - **Cathode**: GND
- **OLED Display** (0.96" SSD1306 I2C 128x64):
  - **SDA**: `D2` (GPIO 4)
  - **SCL**: `D1` (GPIO 5)
  - **VCC**: 3.3V
  - **GND**: GND

## Required Arduino Libraries
Open **Arduino IDE** -> **Tools** -> **Manage Libraries...** and install:
1. `ESP8266 Community Board Package` (Add `http://arduino.esp8266.com/stable/package_esp8266com_index.json` to Additional Boards Manager URLs)
2. `Adafruit SSD1306`
3. `Adafruit GFX Library`
4. (Optional) `Blynk` library if using legacy/cloud Blynk sync (`#define USE_BLYNK 1`)

## Firmware Configuration
Before flashing `esp8266_ultrasonic_sensor.ino`:
1. Open `esp8266_ultrasonic_sensor.ino` in Arduino IDE.
2. Update Wi-Fi settings:
   ```cpp
   const char* WIFI_SSID = "YOUR_ACTUAL_WIFI_SSID";
   const char* WIFI_PASS = "YOUR_ACTUAL_WIFI_PASSWORD";
   ```
3. Update backend server URL (Use your computer's local IP on the network):
   ```cpp
   const char* SERVER_URL = "http://192.168.x.x:5002/api/sensors/update";
   ```
4. Set unique IDs matching database records (e.g. `PN-SENSOR-001` and `PN-A-001`):
   ```cpp
   const char* SENSOR_ID = "PN-SENSOR-001";
   const char* SLOT_ID   = "PN-A-001";
   ```

## Flashing Instructions
1. Connect NodeMCU ESP8266 to your computer via USB.
2. Select Board: **Tools -> Board -> ESP8266 Boards -> NodeMCU 1.0 (ESP-12E Module)**.
3. Select Port: **Tools -> Port -> (Choose your serial port, e.g. COM3 or /dev/cu.usbserial-xxx)**.
4. Set Upload Speed: **115200**.
5. Click **Upload**.
6. Open **Serial Monitor** at **115200 baud** to view real-time Wi-Fi connection and sensor HTTP POST logs.

## Testing & Verification
- When an object approaches within `8 cm` (configurable threshold), the OLED displays `OCCUPIED`, LED lights up, and state is POSTed to backend.
- When object moves away (> `8 cm`), status switches to `AVAILABLE` and POSTs update.
- Invalid readings (distance <= 0 or > 400cm) are filtered out and will NOT falsely change slot status.
