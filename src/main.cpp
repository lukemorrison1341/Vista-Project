#include <Arduino.h>
#include "main.h"
#include "esp_heap_caps.h"
void setup() {
  pinMode(LED_PIN,OUTPUT);
  Serial.begin(115200);
  if (!LittleFS.begin()) {
    Serial.println("Failed to initialize LittleFS!");
    return;
  }
  Serial.println("File System initialized");
  
  if(!check_initialization()){ //uninitialized device configuration, start device configuration
    setup_server();
    xTaskCreate(handle_server, "Device Configuration Task", 8192, NULL, 1, NULL); 
  }
  else{
    digitalWrite(LED_PIN,HIGH);
    print_device_config();
    
    if(!connect_backend()){
      Serial.println("Failed to connect to VISTA Backend.");
      digitalWrite(LED_PIN,LOW);
    }
    
    send_device_name(); //Only really needs to happen once

    xTaskCreate(send_ip, "Send IP to Backend", 8192, NULL, 1, NULL);
    
  }

}

void handle_server(void * pvParameters){ //FreeRTOS task
  while(1){
      server.handleClient();
  }
}

void loop(){
  while (1) {
      Serial.print("Free Heap: ");
      Serial.println(esp_get_free_heap_size());
      vTaskDelay(pdMS_TO_TICKS(10000));
  }
}
