#ifndef SENSORS_H
#define SENSORS_H
#define PIR_INPUT 13
#define TEMP_INPUT 1
#define HUMID_INPUT 2
#define SERVO_INPUT 4
#include <Arduino.h>
void config_pir();
void config_temp();
void config_humid();
void config_servo();
boolean get_pir();
unsigned int get_temp();
void config_sensors();

#endif