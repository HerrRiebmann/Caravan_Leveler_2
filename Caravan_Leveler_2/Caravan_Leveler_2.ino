#define DEBUG false //Uses my personal WiFi Credentials
//Gyro Adafruit MPU6050
#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>
#include <Wire.h>
Adafruit_MPU6050 mpu;

//Filesystem
#include "SPIFFS.h"

//Webserver
#include <WiFi.h>
#include <WebServer.h>

//Setup WiFi from SerialPort
#include <ImprovWiFiLibrary.h>

#include <Preferences.h>

#if DEBUG
#include <Credentials.h>
String ssid = WIFI_SSID;
String password = WIFI_PASSWORD;
#else
String ssid = "";
String password = "";
#endif

WebServer webServer(80);
ImprovWiFi improvSerial(&Serial);

#include <DNSServer.h>
const byte DNS_PORT = 53;
DNSServer dnsServer;

//Over the Air Update
#include <ArduinoOTA.h>

const char deviceName[] = "Caravan Leveler";
const char devicePassword[] = "SportAndFun";

bool accelInitialized = false;
float calibrationX = -0.0;
float calibrationY = -0.0;

float pitch, roll, temperature, voltage;

long lastMillisClientAvailable = 0;
bool voltage_read = false;
String logBuffer;

bool UploadIsOTA = false;
bool UploadIsSPIFFS = false;

//Settings
Preferences settings;
bool Serial_Enabled = true;
bool OTA_Enabled = true;
uint8_t levelThreshold = 5;
int invertAxis = 0;
bool useAcessPointMode = false;
float voltThreshold = 0.0;
int resistor1 = 5100;
int resistor2 = 1000;
#if CONFIG_IDF_TARGET_ESP32
uint8_t voltagePin = 34;
#elif CONFIG_IDF_TARGET_ESP32C3
uint8_t voltagePin = 0;
#elif CONFIG_IDF_TARGET_ESP32S3
uint8_t voltagePin = 2;
#else
#error Target CONFIG_IDF_TARGET is not supported
#endif

void logPrintLn(const String &msg);
void logPrint(const String &msg, bool linebreak = false);

void setup() {
  SerialBegin();

  setupImprov();

  MPU6050Begin();

  SpiffsBegin();

  LoadData();

  WiFiBegin();

  setupOTA();

  InitializeVoltageMeasuring();
}

void loop() {
  //WebServer
  webServer.handleClient();

  //DNS
  dnsServer.processNextRequest();

  //OTA
  OTA_Handle();

  //Improv Setup Wifi by serial:
  loopImprov();
}