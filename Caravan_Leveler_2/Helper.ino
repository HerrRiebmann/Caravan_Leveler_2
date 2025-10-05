void SerialBegin() {
  Serial.begin(115200);
  Serial.println("Start Leveler");
  Serial.println("");
}

void MPU6050Begin() {
  accelInitialized = mpu.begin();
  if (!accelInitialized) {
    logPrintLn("Ooops, no MPU6050 detected ... Check your wiring!");
    return;
  }

  mpu.setAccelerometerRange(MPU6050_RANGE_8_G);
  mpu.setGyroRange(MPU6050_RANGE_500_DEG);
  mpu.setFilterBandwidth(MPU6050_BAND_21_HZ);
  if (!Serial_Enabled)
    return;

  logPrint("Accelerometer range set to: ");
  switch (mpu.getAccelerometerRange()) {
    case MPU6050_RANGE_2_G:
      logPrintLn("+-2G");
      break;
    case MPU6050_RANGE_4_G:
      logPrintLn("+-4G");
      break;
    case MPU6050_RANGE_8_G:
      logPrintLn("+-8G");
      break;
    case MPU6050_RANGE_16_G:
      logPrintLn("+-16G");
      break;
  }

  logPrint("Gyro range set to: ");
  switch (mpu.getGyroRange()) {
    case MPU6050_RANGE_250_DEG:
      logPrintLn("+- 250 deg/s");
      break;
    case MPU6050_RANGE_500_DEG:
      logPrintLn("+- 500 deg/s");
      break;
    case MPU6050_RANGE_1000_DEG:
      logPrintLn("+- 1000 deg/s");
      break;
    case MPU6050_RANGE_2000_DEG:
      logPrintLn("+- 2000 deg/s");
      break;
  }

  logPrint("Filter bandwidth set to: ");
  switch (mpu.getFilterBandwidth()) {
    case MPU6050_BAND_260_HZ:
      logPrintLn("260 Hz");
      break;
    case MPU6050_BAND_184_HZ:
      logPrintLn("184 Hz");
      break;
    case MPU6050_BAND_94_HZ:
      logPrintLn("94 Hz");
      break;
    case MPU6050_BAND_44_HZ:
      logPrintLn("44 Hz");
      break;
    case MPU6050_BAND_21_HZ:
      logPrintLn("21 Hz");
      break;
    case MPU6050_BAND_10_HZ:
      logPrintLn("10 Hz");
      break;
    case MPU6050_BAND_5_HZ:
      logPrintLn("5 Hz");
      break;
  }
}

void SpiffsBegin() {
  if (!SPIFFS.begin(true))
    logPrintLn("An Error has occurred while mounting SPIFFS");
}

boolean isIp(String str) {
  logPrint("-IsIP: ");
  for (size_t i = 0; i < str.length(); i++) {
    int c = str.charAt(i);
    if (c != '.' && (c < '0' || c > '9')) {
      logPrintLn("false");
      return false;
    }
  }
  logPrintLn("true");
  return true;
}

bool ProcessETag(const char* ETag) {
  for (int i = 0; i < webServer.headers(); i++) {
    if (webServer.headerName(i).compareTo(F("If-None-Match")) == 0)
      if (webServer.header(i).compareTo(ETag) == 0) {
        webServer.send(304, "text/plain", F("Not Modified"));
        if (Serial_Enabled)
          logPrintLn(String(F("\t")) + webServer.headerName(i) + F(": ") + webServer.header(i));
        return true;
      }
  }
  webServer.sendHeader("ETag", ETag);
  webServer.sendHeader("Cache-Control", "public");
  return false;
}

void ProcessSetupArguments() {
  // /setup?x=123&y=321&inv=0&ap=1&t=10

  bool voltageChanged = false;

  for (uint8_t i = 0; i < webServer.args(); i++) {
    if (Serial_Enabled)
      logPrintLn(String(F(" ")) + webServer.argName(i) + F(": ") + webServer.arg(i));

    if (webServer.argName(i).compareTo(F("inv")) == 0) {
      invertAxis = webServer.arg(i).toInt();
      StoreInvertation();
    }

    if (webServer.argName(i).compareTo(F("ap")) == 0) {
      useAcessPointMode = webServer.arg(i) == "1";
      StoreAP();
    }

    if (webServer.argName(i).compareTo(F("t")) == 0) {
      int j = webServer.arg(i).toInt();
      if (j > 0 && j <= 90) {
        levelThreshold = j;
        StoreLevelThreshold();
      }
    }

    if (webServer.argName(i).compareTo(F("s")) == 0) {
      Serial_Enabled = webServer.arg(i) == "1";
      StoreSerial();
    }
    if (webServer.argName(i).compareTo(F("v")) == 0) {
      voltThreshold = webServer.arg(i).toInt() / 100.0;
      voltageChanged = true;
    }
    if (webServer.argName(i).compareTo(F("vp")) == 0) {
      voltagePin = webServer.arg(i).toInt();
      voltageChanged = true;
    }
    if (webServer.argName(i).compareTo(F("r1")) == 0) {
      resistor1 = webServer.arg(i).toFloat();
      voltageChanged = true;
    }
    if (webServer.argName(i).compareTo(F("r2")) == 0) {
      resistor2 = webServer.arg(i).toFloat();
      voltageChanged = true;
    }
  }

  if (voltageChanged)
    StoreVoltageSettings();
}

String toStringIp(IPAddress ip) {
  if (Serial_Enabled)
    logPrintLn("IptoString");
  String res = "";
  for (int i = 0; i < 3; i++) {
    res += String((ip >> (8 * i)) & 0xFF) + ".";
  }
  res += String(((ip >> 8 * 3)) & 0xFF);
  return res;
}

String GetEncryptionType(byte thisType) {
  // read the encryption type and print out the name:
  switch (thisType) {
    case 0:
      return "OPEN";
    case 1:
      return "WEP";
    case 2:
      return "WPA_PSK";
    case 3:
      return "WPA2_PSK";
    case 4:
      return "WPA_WPA2_PSK";
    case 5:
      return "WPA2_ENTERPRISE";
    case 6:
      return "AUTH_MAX";
  }
  return "Unknown: " + String(thisType);
}
String runtime(uint32_t currentMillis) {
  uint32_t sec{ (currentMillis / 1000) };
  char buf[20];
  if (sec / 86400 > 1)
    snprintf(buf, sizeof(buf), "%d Tag%s %02d:%02d:%02d", sec / 86400, sec < 86400 || sec >= 172800 ? "e" : "", sec / 3600 % 24, sec / 60 % 60, sec % 60);
  else
    snprintf(buf, sizeof(buf), "%02d:%02d:%02d", sec / 3600 % 24, sec / 60 % 60, sec % 60);
  return buf;
}
const String formatBytes(size_t const& bytes) {
  return " (" + (bytes < 1024 ? static_cast<String>(bytes) + " Byte" : bytes < 1048576 ? static_cast<String>(bytes / 1024.0) + " KB"
                                                                                       : static_cast<String>(bytes / 1048576.0) + " MB")
         + ")";
}

void ResetWebTimer() {
  lastMillisClientAvailable = millis();
  voltage_read = false;
}
void logPrintLn(const String& msg) {
  logPrint(msg, true);
}

void logPrint(const String& msg, bool linebreak) {
  logBuffer.concat(msg);
  if (linebreak) {
    Serial.println(msg);
    logBuffer.concat("\n");
  } else {
    Serial.print(msg);
  }
  if (logBuffer.length() > 10000) {
    logBuffer.remove(0, 1000);
  }
}