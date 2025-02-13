#ifndef MAIN_H
#define MAIN_H
#define LED_PIN 2  // Built-in LED is usually on GPIO2
#include "device-setup.h"
#include "backend.h"
void handle_server(void * pvParameters);
#endif