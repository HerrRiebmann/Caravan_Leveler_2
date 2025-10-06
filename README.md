# Caravan Leveler 2.0
ESP32 digital water level bubble with an MPU6050 Gyroscope & Accelerometer

The successor of the [Caravan Leveler 1.0](https://github.com/HerrRiebmann/Caravan_Leveler)

![Caravan Leveler](/Images/Leveler.png)

An ESP32 will create a hotspot with a captive portal.
This captive portal will force the phone to open up a, usually for login intended, website (_which represents the water level_).

## Contents
* [Usage](#usage)
* [Things](#Things)
* [Installation](#Installation)
* [HardwareComponents](#HardwareComponents)
  * [Wiring](#Wiring)
  * [SPIFFS Upload](#SPIFFS-Upload)
  * [Libraries](#Libraries)
  * [OTA (Over the Air Update)](#OTA-Over-the-Air-Update)
* [Compatibility](#Compatibility)
* [Demo](#Demo)
* [Video](#Video)

### Intention
The intention was, to attach this to my caravan (_Knaus Sport & Fun_) and provide it with 12V on-board voltage.
When arriving at a campingside, the phone will automatically connect to this as a known hotspot, open up the digital leveler and I can happily crank the supports.

In short: Lazy me doesn´t want to constantly walk to the inside and check the level &#129335;

## Usage

### Main Menu

![Main Menu](/Images/MainMenu.png)

 * **Upload** loads a file to the SPIFFS. To overwrite existing files, the filename must be equal (see [/data](https://github.com/HerrRiebmann/Caravan_Leveler_2/tree/main/Caravan_Leveler_2/data))!

  * Or updates the firmware by uploading a *.bin file.
  * Or updates the spiffs with a spiffs.*.bin file.


### Settings

![Settings](/Images/Settings.png)

 * **Indicating Range** describes the water bubble maximum value, when it will reach the scales end

 * **Invert Axis** turns the MPU6050 Gyro (_swaps X- and Y-Axis_)

 * **Serial Output** enables USB serial (_and webbased_) output 

 * **Save** will store all values to the ESP32

 * **Calibrate** sets the current degrees to zero (ensure the Gyro is leveled)

 * **Restart** reboots the ESP32

 * **Advanced Settings** opens further settings

Advanced Settings:

![Advanced Settings](/Images/AdvancedSettings.png)
#### Advanced Voltage Settings

 * **Voltage Pin** Analog ADC pin number for voltage measurement (0-36) *Check your ESP for ADC inputs!*

 * **Voltage Threshold** threshold to correct differences by diodes and resistors

 * **Resistor 1** First resistor value in ohms for voltage divider (After 12V, Before measuring)

 * **Resistor 2** Second resistor value in ohms for voltage divider (After measuring, before GND)

#### WiFi

 * **Use Accesspoint** or connect to an existing WiFi (_SSID and Pasword required in code or can be set on the web-installer_)

 * **Accesspoint PW** Password to secure the Accesspoint access

### Gimmicks

![Gyro Chart](/Images/GyroChart.png)

A Chart for Gyro, Acceleration and Voltage. Mostly just to debug and play around.

The Serial is also only implemented for testing purpose.


## Things
### Installation
You can download the files here, add the additional libraries and flash them via the Arduino IDE. All Libraries & Tools mentioned below.
Or you can use the ESP32 Web firmware flash method, which will install all the required components directly onto the ESP.

Currently supported Versions are ESP32, ESP32-S3 & ESP32-C3.

[Caravan Leveler - Web Installer](https://trib.free.nf/flash.html)

### HardwareComponents
* ESP32 C3 Supermini (Any other ESP32 will work)
* MPU6050 (_Accelerometer / Gyro_)
* LM2596 (_DC-DC converter_)
* 5.2k & 1k Ohm Resistor

### Wiring
Wiring for my tested ESP32 types. Check the I2C pinout for your board!

 MPU6050 | ESP 32 | ESP32-S3 | ESP32-C3
 -------- |-------|-------|-------
 SCL | G22 | G09 | G07
 SDA | G21 | G08 | G08
 VCC | 3.3V | 3.3V | 3.3V
 GND | GND | GND | GND

 

ESP 32 | LM2596
------- | --------
VIN 5V | OUT+
GND | OUT-

**Voltage Divider**
Any possible ADC Pin.

 Type | Pin
  ----- | -----
  ESP32 | 34
  ESP32-S3 | 1
  ESP32-C3 | 0

For most other ESP32 Development Boards pin 30-36.

```
-Supply voltage (max 15V!!!)
|----LM2596 IN+
|5.2k Resistor
|----Connect ADC-Pin
|1k Resistor
|----LM2596 IN-
-GND
```

### SPIFFS Upload
To upload the HTML, JS and CSS files, I´ve used the [Arduino ESP32 filesystem uploader](https://github.com/me-no-dev/arduino-esp32fs-plugin)
You can find the latest release [here](https://github.com/me-no-dev/arduino-esp32fs-plugin/releases/) and a tutorial on [RandomNerdTutorials](https://randomnerdtutorials.com/install-esp32-filesystem-uploader-arduino-ide/)

### Libraries
* Adafruit_MPU6050.h (2.2.6)
* Adafruit Unified Sensor (1.1.15)


### OTA (Over the Air Update)
You should see the ESP32 in Arduino IDE under Tools -> Port -> Network-Interfaces (Sport&Fun Leveler at _IP-Adress_)
For more information see [RandomNerdTutorials](https://randomnerdtutorials.com/esp32-over-the-air-ota-programming/)

## Compatibility
Installed on ESP32 C3 Supermini, ESP-WROOM-32 DevBoard and ESP32-S3-WROOM-1 DevBoard (with 2 USB-C)
Tested on Firefox, Chrome & Edge for Windows, iOS and Chrome & Firefox for Android.

## Demo
The website, which will be hosted on the ESP32 can be tested here:
[Caravan Leveler 2.0 - Demo](https://trib.free.nf/CaravanLevelerDemo/index.html)

## Video
![Main Menu](/Images/CaravanLeveler.gif)
