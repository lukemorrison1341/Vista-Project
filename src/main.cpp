#include <Arduino.h>
#include "device-setup.h"
void setup() {
  Serial.begin(115200);
  //clear_configuration();

  if (!LittleFS.begin()) {
    Serial.println("Failed to initialize LittleFS!");
    return;
  }
  Serial.println("LittleFS initialized");
  
  if(!check_initialization()){ //uninitialized device configuration
    setup_server(); 
  }
}

void loop() {
  if(!check_initialization()) {

    server.handleClient();
  }
  else{ //handle connecting to vista UI, sensor data, etc...
      print_device_config();
  }
  
}
