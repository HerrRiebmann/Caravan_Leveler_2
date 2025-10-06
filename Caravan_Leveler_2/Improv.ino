void setupImprov() {
  improvSerial.setDeviceInfo(ImprovTypes::ChipFamily::CF_ESP32, "ImprovWiFiLib", "2025.10.0", "CaravanLeveler", "http://{LOCAL_IPV4}");
  improvSerial.onImprovError(onImprovWiFiErrorCb);
  improvSerial.onImprovConnected(onImprovWiFiConnectedCb);
  improvSerial.setCustomConnectWiFi(connectWifi);  // Optional
}

void loopImprov() {
  //Is Wifi not set:
  improvSerial.handleSerial();

  if (improvSerial.isConnected()) {
    //handleHttpRequest();
  }
}

void onImprovWiFiErrorCb(ImprovTypes::Error err) {
  // server.stop();
  // blink_led(2000, 3);
  logPrint("Improv Err: ");
  logPrintLn(String(err));
}

void onImprovWiFiConnectedCb(const char *_ssid, const char *_password) {
  // Save ssid and password here
  ssid = _ssid;
  password = _password;
  StoreWiFi();

  // server.begin();
  // blink_led(100, 3);
}

bool connectWifi(const char *_ssid, const char *_password) {
  ssid = _ssid;
  password = _password;
  //WiFi.begin(ssid, password);
  useAcessPointMode = false;
  WiFiBegin();

  while (!improvSerial.isConnected()) {
    //blink_led(500, 1);
  }
  return true;
}