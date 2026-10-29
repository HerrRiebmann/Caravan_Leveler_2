static float normalizeAngle(float angle) {
  while (angle > 180.0f)
    angle -= 360.0f;
  while (angle < -180.0f)
    angle += 360.0f;
  return angle;
}

void getLevel() {
  if (!accelInitialized)
    return;

  sensors_event_t a, g, temp;
  mpu.getEvent(&a, &g, &temp);

  //Calculate pitch and roll angles
  float rawPitch = atan2(a.acceleration.x, sqrt(a.acceleration.y * a.acceleration.y + a.acceleration.z * a.acceleration.z)) * 180 / PI;
  float rawRoll = atan2(-a.acceleration.y, a.acceleration.z) * 180 / PI;
  rawPitch = normalizeAngle(rawPitch - calibrationX);
  rawRoll = normalizeAngle(rawRoll - calibrationY);

  if (dampingEnabled) {
    float pitchDelta = normalizeAngle(rawPitch - pitch);
    float rollDelta = normalizeAngle(rawRoll - roll);
    float smoothPitch = normalizeAngle(pitch + pitchDelta / 2.0f);
    float smoothRoll = normalizeAngle(roll + rollDelta / 2.0f);
    // Totzone: Nur aktualisieren wenn Änderung > 0.05°
    if (abs(pitchDelta / 2.0f) > 0.05f)
      pitch = smoothPitch;
    if (abs(rollDelta / 2.0f) > 0.05f)
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
