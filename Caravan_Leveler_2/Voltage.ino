/*               max 15V o--------+                                        */
/*                                |                                        */
/*                               +++                                       */
/*                               | |                                       */
/*                          R701 | | 5k6                                   */
/*                               +++                                       */
/*                                |                                        */
/*                                +--------> BUSPOWER_ADC                  */
/*                                |                                        */
/*                                |                                        */
/*                               +++                                       */
/*                               | |                                       */
/*                          R702 | | 1k0                                   */
/*                               +++                                       */
/*                                |                                        */
/*                  GND  o--------+                                        */
/*                                                                         */
/*                                                                         */

#define REF_VOLTAGE 3.3
#define ADC_RESOLUTION 4096.0

void InitializeVoltageMeasuring() {
  pinMode(voltagePin, INPUT);
  // set the ADC attenuation to 11 dB (up to ~2.6V input)
  analogSetPinAttenuation(voltagePin, ADC_11db);

  GetCurrentVoltage();
}

float GetCurrentVoltage() {
  // read the analog input
  word adc_value = analogRead(voltagePin);

  // determine voltage at adc input
  float voltage_adc = ((float)adc_value * REF_VOLTAGE) / ADC_RESOLUTION;

  // calculate voltage at the sensor input
  float voltage_in = voltage_adc * (resistor1 + resistor2) / resistor2;

  // print results to serial monitor to 2 decimal places
  if (Serial_Enabled) {
    Serial.print("Voltage:");
    Serial.print(voltage_in, 2);
    Serial.print(",Raw_Input:");
    Serial.println(adc_value);
  }
  return voltage_in + voltThreshold;
}
