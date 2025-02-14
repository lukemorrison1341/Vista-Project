#ifndef FRONTEND_H
#define FRONTEND_H
#include "sensors.h"
#include "backend.h"
#include "device-setup.h"
void create_endpoints();

void handlePIRRequest(); //Send PIR status to frontend
void handle_frontend_server(void * pvParameters);
#endif
