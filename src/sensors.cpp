#include "sensors.h"

boolean get_pir(){
    return digitalRead(PIR_INPUT) == HIGH ? true : false;

}
void config_pir(){
    pinMode(PIR_INPUT,INPUT);
    Serial.println("PIR Sensor configured");
}