/*
 * =================================================================================
 * ParkNest IoT Firmware - ESP8266 NodeMCU with HC-SR04 Ultrasonic Sensor & OLED
 * =================================================================================
 *
 * HARDWARE CONNECTIONS:
 * ---------------------
 * - ESP8266 NodeMCU (ESP-12E / Wemos D1 Mini)
 * - Ultrasonic Sensor (HC-SR04 / HY-SRF05):
 *     - VCC  -> 5V (VIN)
 *     - GND  -> GND
 *     - TRIG -> D5 (GPIO 14)
 *     - ECHO -> D6 (GPIO 12)
 * - LED Indicator:
 *     - Anode  -> D3 (GPIO 0) via 220 ohm resistor
 *     - Cathode-> GND
 * - OLED Display (0.96" SSD1306 128x64 I2C):
 *     - VCC  -> 3.3V
 *     - GND  -> GND
 *     - SDA  -> D2 (GPIO 4)
 *     - SCL  -> D1 (GPIO 5)
 *
 * DEPENDENCIES (Install via Arduino Library Manager):
 * --------------------------------------------------
 * - ESP8266WiFi.h & ESP8266HTTPClient.h (ESP8266 Core)
 * - Adafruit_GFX & Adafruit_SSD1306
 * - (Optional) BlynkSimpleEsp8266.h (Enable #define USE_BLYNK 1 if required)
 */

#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClient.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

// ================= OPTIONAL BLYNK INTEGRATION =================
// Set to 1 if using Blynk legacy/cloud, 0 if using standalone HTTP backend.
#define USE_BLYNK 0

#if USE_BLYNK
  #include <BlynkSimpleEsp8266.h>
  const char* BLYNK_AUTH = "YOUR_BLYNK_AUTH_TOKEN";
#endif

// ================= USER CONFIGURATION =================
const char* WIFI_SSID        = "YOUR_WIFI_SSID";
const char* WIFI_PASS        = "YOUR_WIFI_PASSWORD";

// Backend API URL:
// For Live Cloud Backend on Render: "http://parknest-wt7j.onrender.com/api/sensors/update"
// For Local Testing on Wi-Fi:       "http://192.168.1.X:5002/api/sensors/update"
const char* SERVER_URL       = "http://parknest-wt7j.onrender.com/api/sensors/update";

const char* SENSOR_ID        = "PN-SENSOR-001";
const char* SLOT_ID          = "PN-A-001";
const char* FIRMWARE_VERSION = "1.0.3";

// Threshold in centimeters for vehicle occupancy
const int OCCUPANCY_THRESHOLD_CM = 8;

// Hardware Pins
const int TRIG_PIN           = D5;  // GPIO 14
const int ECHO_PIN           = D6;  // GPIO 12
const int LED_PIN            = D3;  // GPIO 0

// OLED Setup (I2C 128x64)
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, -1);

// Timing Parameters
const unsigned long HEARTBEAT_INTERVAL_MS = 10000; // Send status every 10 seconds
const unsigned long RECONNECT_INTERVAL_MS = 15000; // Wi-Fi retry interval
const int HTTP_TIMEOUT_MS                 = 3000;  // 3s HTTP timeout

// State Variables
int currentDistance         = -1;
bool currentOccupiedState   = false;
bool lastTransmittedOccupied = false;
int lastTransmittedDistance = -1;
unsigned long lastHeartbeatTime = 0;
unsigned long lastWifiRetryTime = 0;

// Initialize OLED Display
void initOLED() {
  Wire.begin(D2, D1); // SDA = D2, SCL = D1
  if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    Serial.println(F("[OLED] Allocation failed or OLED not found."));
  } else {
    display.clearDisplay();
    display.setTextColor(SSD1306_WHITE);
    display.setTextSize(1);
    display.setCursor(0, 10);
    display.println("ParkNest IoT Node");
    display.println("Initializing...");
    display.display();
  }
}

// Update OLED screen
void updateOLED(const char* wifiStatus, int distanceCm, bool occupied) {
  display.clearDisplay();
  display.setTextSize(1);
  display.setCursor(0, 0);
  display.print("Slot: ");
  display.println(SLOT_ID);

  display.setCursor(0, 16);
  display.print("WiFi: ");
  display.println(wifiStatus);

  display.setCursor(0, 32);
  display.print("Dist: ");
  if (distanceCm < 0) {
    display.println("INVALID");
  } else {
    display.print(distanceCm);
    display.println(" cm");
  }

  display.setTextSize(2);
  display.setCursor(0, 48);
  if (distanceCm < 0) {
    display.println("ERROR");
  } else if (occupied) {
    display.println("OCCUPIED");
  } else {
    display.println("AVAILABLE");
  }
  display.display();
}

// Non-blocking Wi-Fi connection handler
void handleWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;

  unsigned long now = millis();
  if (now - lastWifiRetryTime >= RECONNECT_INTERVAL_MS) {
    lastWifiRetryTime = now;
    Serial.print("[Wi-Fi] Reconnecting to ");
    Serial.println(WIFI_SSID);
    WiFi.begin(WIFI_SSID, WIFI_PASS);
  }
}

// Measure ultrasonic distance (returns distance in cm, or -1 if invalid)
int measureDistanceCm() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  // pulseIn with timeout (30ms ~ 5 meters max)
  long duration = pulseIn(ECHO_PIN, HIGH, 30000);

  if (duration == 0) {
    // Timeout or invalid reading
    return -1;
  }

  // Speed of sound: 0.0343 cm/us -> distance = (duration * 0.0343) / 2
  int distance = (int)(duration * 0.0343 / 2.0);

  // Filter out noisy extreme readings (> 400cm or <= 0cm)
  if (distance <= 0 || distance > 400) {
    return -1;
  }

  return distance;
}

// Transmit sensor telemetry via HTTP POST
bool transmitSensorData(int distance, bool occupied) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[HTTP] Wi-Fi not connected. Skipping POST.");
    return false;
  }

  WiFiClient client;
  HTTPClient http;

  http.setTimeout(HTTP_TIMEOUT_MS);
  if (!http.begin(client, SERVER_URL)) {
    Serial.println("[HTTP] Failed to connect to host");
    return false;
  }

  http.addHeader("Content-Type", "application/json");

  // Construct JSON payload
  String payload = "{";
  payload += "\"sensorId\":\"" + String(SENSOR_ID) + "\",";
  payload += "\"slotId\":\"" + String(SLOT_ID) + "\",";
  payload += "\"distance\":" + String(distance) + ",";
  payload += "\"occupied\":" + String(occupied ? "true" : "false") + ",";
  payload += "\"ipAddress\":\"" + WiFi.localIP().toString() + "\",";
  payload += "\"firmwareVersion\":\"" + String(FIRMWARE_VERSION) + "\"";
  payload += "}";

  Serial.println("[HTTP] POSTing payload: " + payload);

  int httpCode = http.POST(payload);

  if (httpCode > 0) {
    Serial.printf("[HTTP] POST code: %d\n", httpCode);
    String response = http.getString();
    Serial.println("[HTTP] Server Response: " + response);
    http.end();
    return true;
  } else {
    Serial.printf("[HTTP] POST failed, error: %s\n", http.errorToString(httpCode).c_str());
    http.end();
    return false;
  }
}

void setup() {
  Serial.begin(115200);

  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  pinMode(LED_PIN, OUTPUT);

  digitalWrite(TRIG_PIN, LOW);
  digitalWrite(LED_PIN, LOW);

  Serial.println("\n==================================================");
  Serial.println("  ParkNest ESP8266 Ultrasonic Firmware Starting  ");
  Serial.println("==================================================");

  initOLED();

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    digitalWrite(LED_PIN, !digitalRead(LED_PIN));
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[Wi-Fi] Connected! IP: " + WiFi.localIP().toString());
    digitalWrite(LED_PIN, HIGH);
  } else {
    Serial.println("\n[Wi-Fi] Initial connection pending, proceeding to main loop...");
    digitalWrite(LED_PIN, LOW);
  }

#if USE_BLYNK
  Blynk.config(BLYNK_AUTH);
#endif

  // Initial sensor measurement
  int initialDist = measureDistanceCm();
  if (initialDist > 0) {
    currentDistance = initialDist;
    currentOccupiedState = (initialDist < OCCUPANCY_THRESHOLD_CM);
    transmitSensorData(currentDistance, currentOccupiedState);
    lastTransmittedOccupied = currentOccupiedState;
    lastTransmittedDistance = currentDistance;
  }
  lastHeartbeatTime = millis();
}

void loop() {
  handleWiFi();

#if USE_BLYNK
  if (WiFi.status() == WL_CONNECTED) {
    Blynk.run();
  }
#endif

  unsigned long now = millis();

  // Read current sensor distance
  int measuredDist = measureDistanceCm();

  if (measuredDist > 0) {
    currentDistance = measuredDist;
    currentOccupiedState = (currentDistance < OCCUPANCY_THRESHOLD_CM);

    // Set LED indicator: HIGH when OCCUPIED, LOW when AVAILABLE
    digitalWrite(LED_PIN, currentOccupiedState ? HIGH : LOW);

    updateOLED(WiFi.status() == WL_CONNECTED ? "CONNECTED" : "DISCONNECTED", currentDistance, currentOccupiedState);

    // Transmit immediately if occupancy state changes or distance changed significantly (>= 5cm)
    bool stateChanged = (currentOccupiedState != lastTransmittedOccupied);
    bool distChanged  = (abs(currentDistance - lastTransmittedDistance) >= 5);

    if (stateChanged || distChanged) {
      Serial.printf("[Sensor] Event trigger - Dist: %d cm, Occupied: %s\n",
                    currentDistance, currentOccupiedState ? "YES" : "NO");
      if (transmitSensorData(currentDistance, currentOccupiedState)) {
        lastTransmittedOccupied = currentOccupiedState;
        lastTransmittedDistance = currentDistance;
        lastHeartbeatTime = now;
      }
    }
  } else {
    // Invalid reading: do NOT change occupied state or mark as free
    Serial.println("[Sensor] Warning: Invalid ultrasonic measurement ignored.");
    updateOLED(WiFi.status() == WL_CONNECTED ? "CONNECTED" : "DISCONNECTED", -1, currentOccupiedState);
  }

  // Periodic Heartbeat
  if (now - lastHeartbeatTime >= HEARTBEAT_INTERVAL_MS) {
    if (currentDistance > 0) {
      Serial.println("[Heartbeat] Sending periodic telemetry...");
      if (transmitSensorData(currentDistance, currentOccupiedState)) {
        lastTransmittedOccupied = currentOccupiedState;
        lastTransmittedDistance = currentDistance;
      }
    }
    lastHeartbeatTime = now;
  }

  delay(200); // Main loop sampling delay
}
