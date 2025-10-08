void setupImprov() {
  String buildStr = ArduinoDateToDisplayDate(__DATE__);

#if CONFIG_IDF_TARGET_ESP32
improvSerial.setDeviceInfo(ImprovTypes::ChipFamily::CF_ESP32, deviceName, buildStr.c_str(), WiFi.getHostname(), "http://{LOCAL_IPV4}");
#elif CONFIG_IDF_TARGET_ESP32C3
improvSerial.setDeviceInfo(ImprovTypes::ChipFamily::CF_ESP32_C3, deviceName, buildStr.c_str(), WiFi.getHostname(), "http://{LOCAL_IPV4}");
#elif CONFIG_IDF_TARGET_ESP32S3
improvSerial.setDeviceInfo(ImprovTypes::ChipFamily::CF_ESP32_S3, deviceName, buildStr.c_str(), WiFi.getHostname(), "http://{LOCAL_IPV4}");
#else
#error Target CONFIG_IDF_TARGET is not supported
#endif

  improvSerial.onImprovError(onImprovWiFiErrorCb);
  improvSerial.onImprovConnected(onImprovWiFiConnectedCb);
  improvSerial.setCustomConnectWiFi(connectWifi);  // Optional
}

void loopImprov() {
  //Is Wifi not set:
  improvSerial.handleSerial();
}

void onImprovWiFiErrorCb(ImprovTypes::Error err) {
  // server.stop();  
  logPrint("Improv Err: ");
  logPrintLn(String(err));
}

void onImprovWiFiConnectedCb(const char *_ssid, const char *_password) {  
  // Save ssid and password here
  logPrintLn("WiFi configured via Web-Installer");  
  ssid = _ssid;
  password = _password;
  StoreWiFi();
}

bool connectWifi(const char *_ssid, const char *_password) {  
  ssid = _ssid;
  password = _password;  
  useAcessPointMode = false;
  WiFiBegin();

  return improvSerial.isConnected();
}