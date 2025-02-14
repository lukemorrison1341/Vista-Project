#ifndef DEVICE_SETUP_H
#define DEVICE_SETUP_H

#include <WiFi.h>
#include <LittleFS.h>
#include <WebServer.h>
#include <ArduinoJson.h>
#include <Preferences.h>

extern const char* ap_ssid;
extern const char* ap_password;
extern String ssid;
extern String password;
extern Preferences file; //store the name and wifi information 

extern WebServer server;
extern boolean connected;
extern String device_name;
extern String username;
extern String user_password;

// Function prototypes
void setup_server();
void print_device_config();
void save_configuration();
void clear_configuration(); 
boolean check_initialization(); //Checks if initialization process has been confirmed
boolean test_wifi(const char* ssid, const char* password);
void handleWifiSetup();
void handleDeviceName();
void handleFileRequest();


#endif // DEVICE_SETUP_H