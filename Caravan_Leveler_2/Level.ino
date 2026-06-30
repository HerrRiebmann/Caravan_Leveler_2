void getLevel() {
  if (!accelInitialized)
    return;

  sensors_event_t a, g, temp;
  mpu.getEvent(&a, &g, &temp);

  //Calculate pitch and roll angles
  float rawPitch = atan2(a.acceleration.x, sqrt(a.acceleration.y * a.acceleration.y + a.acceleration.z * a.acceleration.z)) * 180 / PI;
  float rawRoll = atan2(-a.acceleration.y, a.acceleration.z) * 180 / PI;
  rawPitch -= calibrationX;
  rawRoll -= calibrationY;

  if (dampingEnabled) {
    // Mittelwert aus aktuellem und letztem Wert
    float smoothPitch = (pitch + rawPitch) / 2.0;
    float smoothRoll = (roll + rawRoll) / 2.0;
    // Totzone: Nur aktualisieren wenn Änderung > 0.05°
    if (abs(smoothPitch - pitch) > 0.05)
      pitch = smoothPitch;
    if (abs(smoothRoll - roll) > 0.05)
      roll = smoothRoll;
  } else {
    pitch = rawPitch;
    roll = rawRoll;
  }

  //Calibrate
  temperature = temp.temperature;

  Serial.print("X: ");
  Serial.print(pitch);
  Serial.print(" Y: ");
  Serial.print(roll);
  Serial.print("\t(");
  Serial.print(g.gyro.x);
  Serial.print(" / ");
  Serial.print(g.gyro.y);
  Serial.print(" / ");
  Serial.print(g.gyro.z);
  Serial.print(")");
  Serial.print("\tTemperature: ");
  Serial.print(temp.temperature);
  Serial.println(" °C");
}

void CalibrateLevel() {
  sensors_event_t a, g, temp;
  mpu.getEvent(&a, &g, &temp);
  //Get current values, store as "Zero-levelled" and write to eeprom
  calibrationX = atan2(a.acceleration.x, sqrt(a.acceleration.y * a.acceleration.y + a.acceleration.z * a.acceleration.z)) * 180 / PI;
  calibrationY = atan2(-a.acceleration.y, a.acceleration.z) * 180 / PI;
  StoreLevel();

  logPrint("Calibrated to X: ");
  logPrint(String(calibrationX));
  logPrint(" Y: ");
  logPrintLn(String(calibrationY));
}
