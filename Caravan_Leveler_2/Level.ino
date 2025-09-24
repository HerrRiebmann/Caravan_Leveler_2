void getLevel() {
  if (!accelInitialized)
    return;

  sensors_event_t a, g, temp;
  mpu.getEvent(&a, &g, &temp);

  //Calculate pitch and roll angles
  pitch = atan2(a.acceleration.x, sqrt(a.acceleration.y*a.acceleration.y + a.acceleration.z*a.acceleration.z)) * 180 / PI;
  roll = atan2(-a.acceleration.y, a.acceleration.z) * 180 / PI;
  pitch -= calibrationX;
  roll -= calibrationY;
  //Calibrate
  temperature = temp.temperature;

  if(!Serial_Enabled)
    return;
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
  calibrationX = atan2(a.acceleration.x, sqrt(a.acceleration.y*a.acceleration.y + a.acceleration.z*a.acceleration.z)) * 180 / PI;
  calibrationY = atan2(-a.acceleration.y, a.acceleration.z) * 180 / PI;
  StoreLevel();

  if(!Serial_Enabled)
    return;
  logPrint("Calibrated to X: ");
  logPrint(String(calibrationX));
  logPrint(" Y: ");
  logPrintLn(String(calibrationY));  
}
