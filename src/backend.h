#ifndef BACKEND_H
#define BACKEND_H
#include <WiFi.h>
#include <HTTPClient.h>
#include "device-setup.h" 

boolean connect_backend();

void send_ip(void * pvParameters); //send IP to backend server, FreeRTOS task
void wifi_connect();
void send_device_name();
extern String serverURI;
#endif