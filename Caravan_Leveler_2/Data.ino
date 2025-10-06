void LoadData() {
  //Readonly: false
  settings.begin("settings", false);
  //Variable Name: Max 15 chars!!!!

  LoadLevel();
  LoadLevelThreshold();
  LoadInvertation();
  LoadAP();
  LoadWiFi();
  LoadSerial();
  LoadVoltageSettings();

  settings.end();
}
void LoadLevel() {
  calibrationX = settings.getFloat("calibrationX", calibrationX);
  calibrationY = settings.getFloat("calibrationY", calibrationY);

  if (!Serial_Enabled)
    return;
  logPrint("Loaded X: ");
  logPrint(String(calibrationX));
  logPrint(" Y: ");
  logPrintLn(String(calibrationY));
}

void LoadLevelThreshold() {
  levelThreshold = settings.getInt("levelThreshold", levelThreshold);
  if (!Serial_Enabled)
    return;
  logPrint("Loaded Threshold: ");
  logPrintLn(String(levelThreshold));
}
void LoadInvertation() {
  invertAxis = settings.getInt("invertAxis", invertAxis);
  if (!Serial_Enabled)
    return;
  logPrint(String(F("Loaded Inverted Axis: ")));
  logPrintLn(String(invertAxis));
}

void LoadAP() {
  useAcessPointMode = settings.getBool("useAPMode", useAcessPointMode);
  if (!Serial_Enabled)
    return;
  logPrint(String(F("Loaded AccessPoint: ")));
  logPrintLn(String(useAcessPointMode));
}
void LoadWiFi(){
  ssid = settings.getString("ssid", ssid);
  password = settings.getString("password", password);
  logPrint(String(F("Loaded SSID: ")));
  logPrintLn(ssid);
}
void LoadSerial() {
  Serial_Enabled = settings.getBool("serialEnabled", useAcessPointMode);
  if (!Serial_Enabled)
    return;
  logPrint(String(F("Serial Output enabled: ")));
  logPrintLn(String(Serial_Enabled));
}
void LoadVoltageSettings() {
  voltThreshold = settings.getFloat("voltThreshold", voltThreshold);
  voltagePin = settings.getInt("voltagePin", voltagePin);
  resistor1 = settings.getInt("resistor1", resistor1);
  resistor2 = settings.getInt("resistor2", resistor2);
  if (!Serial_Enabled)
    return;
  logPrint(String(F("Loaded Voltage Threshold: ")));
  logPrintLn(String(voltThreshold));
  logPrint(String(F("Pin: ")));
  logPrintLn(String(voltagePin));
  logPrint(String(F("R1: ")));
  logPrintLn(String(resistor1));
  logPrint(String(F("R2: ")));
  logPrintLn(String(resistor2));
}
void StoreLevel() {
  settings.begin("settings", false);
  settings.putFloat("calibrationX", calibrationX);
  settings.putFloat("calibrationY", calibrationY);
  settings.end();
}
void StoreLevelThreshold() {
  settings.begin("settings", false);
  settings.putInt("levelThreshold", levelThreshold);
  settings.end();
}
void StoreInvertation() {
  settings.begin("settings", false);
  settings.putInt("invertAxis", invertAxis);
  settings.end();
}

void StoreAP() {
  settings.begin("settings", false);
  settings.putBool("useAPMode", useAcessPointMode);
  settings.end();
}
void StoreWiFi(){
  settings.begin("settings", false);
  settings.putString("ssid", ssid);
  settings.putString("password", password);
  settings.end();
}
void StoreSerial() {
  settings.begin("settings", false);
  settings.putBool("serialEnabled", Serial_Enabled);
  settings.end();
}
void StoreVoltageSettings() {
  settings.begin("settings", false);
  settings.putFloat("voltThreshold", voltThreshold);
  settings.putInt("voltagePin", voltagePin);
  settings.putInt("resistor1", resistor1);
  settings.putInt("resistor2", resistor2);
  settings.end();
}