void WiFiBegin() {
  //Manually change between WiFi and Accesspoint. AP will be used as a fallback, after 5 seconds
  if (useAcessPointMode)
    CreateAccessPoint();
  else
    ConnectToAccessPoint();

  webServer.on("/level", handle_level);
  webServer.on("/setup", handle_setup);
  webServer.on("/calibrate", handle_calibrate);
  webServer.on("/espinfo", handle_esp);
  webServer.on("/data", handle_data);
  webServer.on("/reset", handle_reset);
  webServer.on("/restart", handle_restart);
  webServer.on("/voltage", handle_voltage);
  webServer.on("/log", handle_log);
  webServer.on("/upload", HTTP_POST, handle_upload_finish, handle_upload);

  //Allways redirect to captive portal. Request comes with IP (8.8.8.8) or URL (connectivitycheck.XXX / captive.apple / etc.)
  webServer.on("/generate_204", redirect);  //Android captive portal.
  webServer.on("/fwlink", redirect);        //Microsoft captive portal.

  webServer.on("/connecttest.txt", redirect);      //www.msftconnecttest.com
  webServer.on("/hotspot-detect.html", redirect);  //captive.apple.com

  webServer.on("/success.txt", handle_success);  //detectportal.firefox.com/sucess.txt
  webServer.onNotFound(handleFileRead);

  const char* Headers[] = { "If-None-Match" };
  webServer.collectHeaders(Headers, sizeof(Headers) / sizeof(Headers[0]));

  webServer.begin();
  if (Serial_Enabled)
    logPrintLn(F("HTTP webServer started"));
  delay(100);
}

void ConnectToAccessPoint() {
  if(ssid == ""){
    logPrintLn("SSID empty! Fallback to AP");
    CreateAccessPoint();
    return;
  }
  logPrint("Connect to: ");
  logPrintLn(ssid);
  WiFi.begin(ssid, password);

  long start = millis();
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.print(".");
    if (millis() - start > 5000) {
      logPrintLn("Wifi not found!");
      CreateAccessPoint();
      return;
    }
  }
  if (!Serial_Enabled)
    return;
  logPrintLn("");
  logPrintLn(String(F("WiFi connected successfully")));
  logPrint(String(F("Got IP: ")));
  logPrintLn(WiFi.localIP().toString());  //Show ESP32 IP on serial
}

void CreateAccessPoint() {
  WiFi.disconnect();
  IPAddress local_ip(8, 8, 8, 8);
  IPAddress gateway(8, 8, 8, 8);
  IPAddress subnet(255, 255, 255, 0);

  WiFi.mode(WIFI_AP);
  if (strlen(devicePassword) > 1)
    WiFi.softAP(deviceName, devicePassword);
  else
    WiFi.softAP(deviceName);
  delay(200);
  WiFi.softAPConfig(local_ip, gateway, subnet);
  delay(200);
  if (Serial_Enabled) {
    logPrint(String(F("AP IP address: ")));
    logPrintLn(String(WiFi.softAPIP().toString()));
    if (strlen(devicePassword) > 1) {
      logPrint("AP Password: ");
      logPrintLn(devicePassword);
    }
  }

  /* Setup the DNS webServer redirecting all the domains to the apIP */
  dnsServer.setErrorReplyCode(DNSReplyCode::NoError);
  dnsServer.start(DNS_PORT, "*", local_ip);
}

void handle_level() {
  // /level
  if (!accelInitialized) {
    webServer.send(400, "text/plain", "Gyro not initialized!");
    return;
  }
  getLevel();

  float pitchCorrected, rollCorrected;
  switch (invertAxis) {
    case 0:
      pitchCorrected = pitch * -1;
      rollCorrected = roll * -1;
      break;
    case 1:
      pitchCorrected = roll;
      rollCorrected = pitch * -1;
      break;
    case 2:
      pitchCorrected = pitch;
      rollCorrected = roll;
      break;
    case 3:
      pitchCorrected = roll * -1;
      rollCorrected = pitch;
      break;
  }

  String txt = String(pitchCorrected);
  txt.concat("|");
  txt.concat(String(rollCorrected));
  txt.concat("|");
  txt.concat(String(levelThreshold));
  txt.concat("|");
  txt.concat(String(GetCurrentVoltage()));  
  txt.concat("|");
  txt.concat(String(temperature));
  webServer.send(200, "text/plain", txt);

  ResetWebTimer();
}

void handle_setup() {
  // /setup
  if (Serial_Enabled)
    logPrintLn("Handle Setup");

  //With arguments:
  // /setup?x=123&y=321&inv=0&ap=1
  ProcessSetupArguments();

  String txt = String(accelInitialized);
  txt.concat("|");
  txt.concat(String(invertAxis));
  txt.concat("|");
  txt.concat(String(useAcessPointMode));
  txt.concat("|");
  txt.concat(String(levelThreshold));
  txt.concat("|");
  txt.concat(String(Serial_Enabled));
  txt.concat("|");
  txt.concat(String(voltThreshold * 100));
  txt.concat("|");
  txt.concat(String(voltagePin));
  txt.concat("|");
  txt.concat(String(resistor1));
  txt.concat("|");
  txt.concat(String(resistor2));
  txt.concat("|");
  txt.concat(String(devicePassword));
  webServer.send(200, "text/plain", txt);
}
void handle_calibrate() {  
  logPrintLn("Handle Calibration");
  if (!accelInitialized) {
    webServer.send(400, "text/plain", "Gyro not initialized!");
    return;
  }
  CalibrateLevel();
  String result = "Calibration OK (";
  result.concat(calibrationX);
  result.concat("/");
  result.concat(calibrationY);
  result.concat(")");
  webServer.send(200, "text/plaint", result);
  ResetWebTimer();
}
void handle_data() {
  if (!accelInitialized) {
    webServer.send(400, "text/plain", "Gyro not initialized!");
    return;
  }
  //Serial.println(F("Handle Raw data"));
  sensors_event_t a, g, temp;
  mpu.getEvent(&a, &g, &temp);

  String result = String(g.gyro.x);
  result.concat("|");
  result.concat(String(g.gyro.y));
  result.concat("|");
  result.concat(String(g.gyro.z));
  result.concat("|");
  result.concat(String(a.acceleration.x));
  result.concat("|");
  result.concat(String(a.acceleration.y));
  result.concat("|");
  result.concat(String(a.acceleration.z));
  webServer.send(200, "text/plaint", result);
  if (Serial_Enabled)
    logPrintLn(result);
  ResetWebTimer();
}
void handle_reset() {
  LoadData();
  webServer.send(200, "text/plaint", "OK");
}
void handle_restart() {
  webServer.send(200, "text/plain", "OK");
  delay(500);
  ESP.restart();
}

void handle_voltage() {
  word adc_value = analogRead(voltagePin);
  float voltage_adc = ((float)adc_value * REF_VOLTAGE) / ADC_RESOLUTION;
  float voltage_in = voltage_adc * (resistor1 + resistor2) / resistor2;
  //Nothing setup
  if(resistor1 + resistor2 == 0){
    voltage_adc = 0;
    voltage_in = 0;
  }
  //Voltage + Threshold | raw value | Voltage input | Voltage without Threshold
  String result = String(voltage_in + voltThreshold);
  result.concat("|");
  result.concat(String(adc_value));
  result.concat("|");
  result.concat(String(voltage_adc));
  result.concat("|");
  result.concat(String(voltage_in));
  webServer.send(200, "text/plaint", result);
}

void handle_log() {
  webServer.send(200, "text/plain", logBuffer);
  logBuffer = "";
}

void handle_wifi() {
  int n = WiFi.scanNetworks(false, false);  //WiFi.scanNetworks(async, show_hidden)
  String temp;
  for (int i = 0; i < n; i++) {
    temp += WiFi.SSID(i) + ";";
    temp += " (" + GetEncryptionType(WiFi.encryptionType(i)) + ")";
    temp += "|";
  }
  webServer.send(200, "text/plain", temp);
}
void handle_upload_finish() {
  if (UploadIsOTA)
    handle_update_finish();
  else
    //webServer.send(200);
    handleFileReadByName("/index.html");
}

void handle_upload() {
  HTTPUpload& upload = webServer.upload();
  if (upload.status == UPLOAD_FILE_START) {
    String filename = upload.filename;
    if (filename.endsWith(".bin")) {
      if (filename.indexOf("spiffs") >= 0)
        UploadIsSPIFFS = true;
      else
        UploadIsOTA = true;
    }
  }
  if (UploadIsOTA)
    handle_update(upload);
  if (UploadIsSPIFFS)
    handle_update_Spiffs(upload);
  if (!UploadIsOTA && !UploadIsSPIFFS)
    handle_fileupload(upload);
}

#include <rom/rtc.h>
const char* const PROGMEM flashChipMode[] = { "QIO", "QOUT", "DIO", "DOUT", "Unbekannt" };
const char* const PROGMEM resetReason[] = { "ERR", "Power on", "Unknown", "Software", "Watch dog", "Deep Sleep", "SLC module", "Timer Group 0", "Timer Group 1",
                                            "RTC Watch dog", "Instrusion", "Time Group CPU", "Software CPU", "RTC Watch dog CPU", "Extern CPU", "Voltage not stable", "RTC Watch dog RTC" };
void handle_esp() {
  String temp = "CPU Temp;" + String(temperatureRead()) + "|Runtime;" + runtime(millis()) + "|Build;" + (String)__DATE__ + " " + (String)__TIME__ + "|SketchSize;" + formatBytes(ESP.getSketchSize()) + "|SketchSpace;" + formatBytes(ESP.getFreeSketchSpace()) + "|LocalIP;" + WiFi.localIP().toString() + "|Hostname;" + WiFi.getHostname() + "|SSID;" + WiFi.SSID() + "|RSSI;" + WiFi.RSSI() + "|GatewayIP;" + WiFi.gatewayIP().toString() + "|Channel;" + WiFi.channel() + "|MacAddress;" + WiFi.macAddress() + "|SubnetMask;" + WiFi.subnetMask().toString() + "|BSSID;" + WiFi.BSSIDstr() + "|ClientIP;" + webServer.client().remoteIP().toString() + "|DnsIP;" + WiFi.dnsIP().toString() + "|ChipModel;" + ESP.getChipModel() + "|Reset1;" + resetReason[rtc_get_reset_reason(0)] + "|Reset2;" + resetReason[rtc_get_reset_reason(1)] + "|CpuFreqMHz;" + ESP.getCpuFreqMHz() + "|HeapSize;" + formatBytes(ESP.getHeapSize()) + "|FreeHeap;" + formatBytes(ESP.getFreeHeap()) + "|MinFreeHeap;" + formatBytes(ESP.getMinFreeHeap()) + "|ChipSize;" + formatBytes(ESP.getFlashChipSize()) + "|ChipSpeed;" + ESP.getFlashChipSpeed() / 1000000 + "|ChipMode;" + flashChipMode[ESP.getFlashChipMode()] + "|IdeVersion;" + ARDUINO + "|SdkVersion;" + ESP.getSdkVersion();
  webServer.send(200, "text/plain", temp);
}
void handleNotFound() {
  if (Serial_Enabled) {
    logPrintLn("HandleNotFound");
    PrintIncomingRequest();
  }

  if (captivePortal())
    return;
  String message = F("File Not Found\n\n");
  message += F("URI: ");
  message += webServer.uri();
  message += F("\nMethod: ");
  message += (webServer.method() == HTTP_GET) ? "GET" : "POST";
  message += F("\nArguments: ");
  message += webServer.args();
  message += F("\n");

  for (uint8_t i = 0; i < webServer.args(); i++) {
    message += String(F(" ")) + webServer.argName(i) + F(": ") + webServer.arg(i) + F("\n");
  }
  webServer.sendHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  webServer.sendHeader("Pragma", "no-cache");
  webServer.sendHeader("Expires", "-1");
  webServer.send(404, "text/plain", message);
}

void handle_success() {
  if (Serial_Enabled)
    logPrintLn("Handle success.txt");
  webServer.send(200, "text/plain", "success");
}

boolean captivePortal() {  
  logPrint("Captive Check: ");
  logPrintLn(webServer.hostHeader());
  
  if (!isIp(webServer.hostHeader())) {    
    logPrintLn("-Request redirected to captive portal");
    redirect();
    return true;
  }
  return false;
}

void redirect() {
  webServer.sendHeader("Location", String("http://") + toStringIp(webServer.client().localIP()), true);
  webServer.send(302, "text/plain", "");  // Empty content inhibits Content-length header so we have to close the socket ourselves.
  webServer.client().stop();              // Stop is needed because we sent no content length
}

void PrintIncomingRequest() {
  logPrintLn(webServer.hostHeader());
  logPrint("  ");
  logPrintLn(webServer.uri());

  for (uint8_t i = 0; i < webServer.args(); i++)
    logPrintLn(String(F(" ")) + webServer.argName(i) + F(": ") + webServer.arg(i) + F("\n"));

  for (int i = 0; i < webServer.headers(); i++)
    logPrintLn(String(F("\t")) + webServer.headerName(i) + F(": ") + webServer.header(i));
}
