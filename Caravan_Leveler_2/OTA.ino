void setupOTA(){  
  ArduinoOTA.setHostname(deviceName);
  ArduinoOTA.setPassword(devicePassword);  
  //Default Port  
  //ArduinoOTA.setPort(1337);
  
  ArduinoOTA.onStart([]() {
    String type;
    if (ArduinoOTA.getCommand() == U_FLASH)
      type = "sketch";
    else // U_SPIFFS
      type = "filesystem";

    // NOTE: if updating SPIFFS this would be the place to unmount SPIFFS using SPIFFS.end()
    Serial.println("Start updating " + type);
  });
  ArduinoOTA.onEnd([]() {
    Serial.println("\nEnd");
  });
  ArduinoOTA.onProgress([](unsigned int progress, unsigned int total) {
    Serial.printf("Progress: %u%%\r", (progress / (total / 100)));
  });
  ArduinoOTA.onError([](ota_error_t error) {
    Serial.printf("Error[%u]: ", error);
    if (error == OTA_AUTH_ERROR) Serial.println("Auth Failed");
    else if (error == OTA_BEGIN_ERROR) Serial.println("Begin Failed");
    else if (error == OTA_CONNECT_ERROR) Serial.println("Connect Failed");
    else if (error == OTA_RECEIVE_ERROR) Serial.println("Receive Failed");
    else if (error == OTA_END_ERROR) Serial.println("End Failed");
  });
  ArduinoOTA.begin();
}
void handle_update(HTTPUpload& upload) {
  if (upload.status == UPLOAD_FILE_START) {
    Serial.println("Update: " + String(upload.filename.c_str()));
    if (!Update.begin(UPDATE_SIZE_UNKNOWN)) { //start with max available size
      Update.printError(Serial);
    }
  } else if (upload.status == UPLOAD_FILE_WRITE) {
    /* flashing firmware to ESP*/
    if (Update.write(upload.buf, upload.currentSize) != upload.currentSize) {
      Update.printError(Serial);
    }
  } else if (upload.status == UPLOAD_FILE_END) {
    if (Update.end(true)) { //true to set the size to the current progress
      //Kernel panic using upload.totalSize
      //PrintMessageLn("Update Success: " + upload.totalSize);
    } else {
      Update.printError(Serial);
    }
  }
}
void handle_update_finish() {
  uint16_t refreshdelay = 1000;
  Serial.println("Update finish");
  webServer.sendHeader("Connection", "close");
  String response = "<html><head><title>OTA</title><meta http-equiv='refresh' content='" + String(refreshdelay / 100) + "; URL=/' /><script>";
  response.concat("setInterval(function(){document.getElementById('countdown').innerHTML -= 1;}, 1000);");
  response.concat("</script></head><body><h1>");
  response.concat(Update.hasError() ? "Update failed!" : "Update OK");
  response.concat(" - redirect in <label id='countdown'>" + String(refreshdelay / 100) + "</label> Sec.</h1></body></html>");
  if (Update.hasError())
    webServer.send(500, "text/html", response);
  else
    webServer.send(200, "text/html", response);
  delay(refreshdelay);
  ESP.restart();
}

void OTA_Handle() {
  if (OTA_Enabled)
    ArduinoOTA.handle();
}
