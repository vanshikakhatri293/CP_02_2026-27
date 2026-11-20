/*
 * =================================================================================
 * ParkNest IoT Firmware - ESP8266 Wi-Fi Module with IR Parking Slot Sensor
 * =================================================================================
 *
 * HARDWARE CONNECTIONS:
 * ---------------------
 * - ESP8266 NodeMCU / Wemos D1 Mini
 * - IR Obstacle / Proximity Sensor Module (FC-51 / TCRT5000 / Sharp IR)
 *     - VCC  -> 3.3V or 5V
 *     - GND  -> GND
 *     - OUT  -> D1 (GPIO 5) [Digital Input]
 * - Built-in LED / Status LED -> D3 (GPIO 0) / D4 (GPIO 2)
 *
 * DEPENDENCIES (Standard Arduino ESP8266 Core Libraries):
 * -------------------------------------------------------
 * - ESP8266WiFi.h
 * - ESP8266HTTPClient.h
 * - WiFiClient.h
 */

#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClient.h>

// ================= USER CONFIGURATION =================
const char* WIFI_SSID        = "YOUR_WIFI_SSID";
const char* WIFI_PASS        = "YOUR_WIFI_PASSWORD";

// Replace with your Node.js backend IP and port (e.g., http://192.168.1.100:5002/api/sensors/update)
const char* SERVER_URL       = "http://192.168.1.100:5002/api/sensors/update";

const char* SENSOR_ID        = "PN-SENSOR-001";
const char* SLOT_ID          = "PN-A-001";
const char* FIRMWARE_VERSION = "1.0.3";

// Hardware Pins
const int IR_SENSOR_PIN      = D1;  // GPIO5 connected to IR Sensor OUT
const int STATUS_LED_PIN     = D3;  // GPIO0 Status LED

// Sensor Behavior Parameters
const bool IR_ACTIVE_LOW     = true;  // Most IR sensors output LOW (0) when obstacle detected
const unsigned long HEARTBEAT_INTERVAL_MS = 10000; // Heartbeat telemetry every 10 sec
const unsigned long DEBOUNCE_TIME_MS      = 500;   // Debounce window to filter noise

// State Variables
bool lastOccupiedState   = false;
bool currentOccupiedState = false;
unsigned long lastStateChangeTime = 0;
unsigned long lastHeartbeatTime   = 0;

void setupWiFi() {
  Serial.println();
  Serial.print("[Wi-Fi] Connecting to ");
  Serial.println(WIFI_SSID);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    digitalWrite(STATUS_LED_PIN, !digitalRead(STATUS_LED_PIN)); // Blink LED while connecting
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    digitalWrite(STATUS_LED_PIN, HIGH);
    Serial.println("\n[Wi-Fi] Connected successfully!");
    Serial.print("[Wi-Fi] Local IP Address: ");
    Serial.println(WiFi.localIP());
  } else {
    digitalWrite(STATUS_LED_PIN, LOW);
    Serial.println("\n[Wi-Fi] Wi-Fi connection timeout, retrying in main loop...");
  }
}

bool transmitSensorData(bool occupied) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[HTTP] Wi-Fi disconnected. Skipping POST.");
    return false;
  }

  WiFiClient client;
  HTTPClient http;

  http.setTimeout(3000);
  if (!http.begin(client, SERVER_URL)) {
    Serial.println("[HTTP] Unable to connect to host");
    return false;
  }

  http.addHeader("Content-Type", "application/json");

  // Construct JSON payload
  String payload = "{";
  payload += "\"sensorId\":\"" + String(SENSOR_ID) + "\",";
  payload += "\"slotId\":\"" + String(SLOT_ID) + "\",";
  payload += "\"occupied\":" + String(occupied ? "true" : "false") + ",";
  payload += "\"distance\":" + String(occupied ? 5 : 25) + ",";
  payload += "\"ipAddress\":\"" + WiFi.localIP().toString() + "\",";
  payload += "\"firmwareVersion\":\"" + String(FIRMWARE_VERSION) + "\"";
  payload += "}";

  digitalWrite(STATUS_LED_PIN, occupied ? HIGH : LOW);
  int httpResponseCode = http.POST(payload);

  if (httpResponseCode > 0) {
    Serial.printf("[HTTP] POST Response code: %d\n", httpResponseCode);
    String response = http.getString();
    Serial.println("[HTTP] Server Response: " + response);
    http.end();
    return true;
  } else {
    Serial.printf("[HTTP] POST failed, error: %s\n", http.errorToString(httpResponseCode).c_str());
    http.end();
    return false;
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(IR_SENSOR_PIN, INPUT);
  pinMode(STATUS_LED_PIN, OUTPUT);
  digitalWrite(STATUS_LED_PIN, LOW);

  Serial.println("\n=============================================");
  Serial.println("  ParkNest IoT Sensor Firmware Starting...");
  Serial.println("=============================================");

  setupWiFi();

  // Initial sensor read
  int rawRead = digitalRead(IR_SENSOR_PIN);
  currentOccupiedState = IR_ACTIVE_LOW ? (rawRead == LOW) : (rawRead == HIGH);
  lastOccupiedState = currentOccupiedState;

  // Send initial state upon boot
  transmitSensorData(currentOccupiedState);
  lastHeartbeatTime = millis();
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    setupWiFi();
  }

  unsigned long now = millis();

  // Read raw IR sensor digital pin
  int rawRead = digitalRead(IR_SENSOR_PIN);
  bool rawOccupied = IR_ACTIVE_LOW ? (rawRead == LOW) : (rawRead == HIGH);

  // Filter noise / debounce
  if (rawOccupied != lastOccupiedState) {
    lastStateChangeTime = now;
    lastOccupiedState = rawOccupied;
  }

  if ((now - lastStateChangeTime) > DEBOUNCE_TIME_MS) {
    if (rawOccupied != currentOccupiedState) {
      currentOccupiedState = rawOccupied;
      Serial.print("[Sensor] Slot state changed! New State: ");
      Serial.println(currentOccupiedState ? "OCCUPIED" : "AVAILABLE");

      // Transmit state change immediately
      transmitSensorData(currentOccupiedState);
      lastHeartbeatTime = now;
    }
  }

  // Periodic heartbeat transmission
  if ((now - lastHeartbeatTime) >= HEARTBEAT_INTERVAL_MS) {
    Serial.println("[Heartbeat] Sending periodic sensor telemetry...");
    transmitSensorData(currentOccupiedState);
    lastHeartbeatTime = now;
  }

  delay(100);
}
