#include "frontend.h"
void create_endpoints(){
    Serial.println("Starting Frontend Server...");
    server.on("/api/sensor/pir", HTTP_GET, handlePIRRequest);
    server.on("/api/sensor/pir", HTTP_OPTIONS, handlePIRRequest);
    server.begin();
    Serial.println("Frontend Server Started");

}

void handlePIRRequest() {

    if(server.method() == HTTP_OPTIONS) //Handle CORS Policy
    {
        server.sendHeader("Access-Control-Allow-Origin", "*");
        server.sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
        server.send(204);  // ✅ 204 No Content (Successful preflight)
        return;
    }

    if (server.method() != HTTP_GET) {
        server.send(405, "text/plain", "Method Not Allowed");
        return;
      }
    Serial.printf("Received PIR GET Request");

    StaticJsonDocument<256> jsonResponse;
    jsonResponse["pir"] = get_pir(); 

    String jsonPayload;
    serializeJson(jsonResponse, jsonPayload);

    server.sendHeader("Access-Control-Allow-Origin", "*");  //Allow CORS Policy
    server.send(200, "application/json", jsonPayload);  
}



void handle_frontend_server(void * pvParameters){
    while(1){
        
        server.handleClient();
    }
}