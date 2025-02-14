#include "backend.h"
#include "sensors.h"
String serverURI = "http://vista-ucf.com:5000"; //backend URL
void send_ip(void * pvParameters) {
    while(1) {
        
        file.begin("device_config",false); //read device configuration 
        if (WiFi.status() == WL_CONNECTED) {
            HTTPClient http;
            http.begin(serverURI + "/api/device-config");  
            http.addHeader("Content-Type", "application/json");
            
            String jsonPayload = "{";
            jsonPayload += "\"ip\":\"" + WiFi.localIP().toString() + "\",";
            jsonPayload += "\"username\":\"" + file.getString("username","") + "\",";
            jsonPayload += "\"password\":\"" + file.getString("user_password","") + "\",";
            jsonPayload += "\"device_name\":\"" + file.getString("device_name","") + "\"";
            jsonPayload += "}";
        
            int httpResponseCode = http.POST(jsonPayload);

            if (httpResponseCode > 0) {
                String response = http.getString();
                Serial.println("Server response: " + response);
            } else {
                Serial.println("Error sending request. Code: " + String(httpResponseCode));
            }
            http.end(); // Close connection
        } else {
            Serial.println("WiFi not connected");
        }

        file.end();
        Serial.printf("IP %s Sent To Backend\n",WiFi.localIP().toString());
        vTaskDelay(pdMS_TO_TICKS(10000)); // Send IP every minute
    }
}

void wifi_connect(){ //TODO: Add time-out so doesn't try to connect to WiFi endlessly
    file.begin("device_config",false);
    WiFi.mode(WIFI_STA);
    WiFi.begin(file.getString("ssid",""),file.getString("password",""));
    Serial.printf("Connecting to %s",file.getString("ssid",""));
    file.end();
    static uint32_t count =0; 
    while(WiFi.status() != WL_CONNECTED){
        if (count % 2048 == 0) Serial.print(".");
        count++;
    }
    Serial.println("\nConnected to network.");
}


//TODO: Add rest of the sensors.
void send_sensor_data(void* pvParameters){ //Send sensors to backend in relay situation
    while(1){
        send_pir_data();
        vTaskDelay(SENSOR_SEND_DELAY);
    }
    
}

void send_pir_data(){
    Serial.println("Sending PIR data to: " + serverURI + "/api/data/pir");
        if (WiFi.status() == WL_CONNECTED) {
            file.begin("device_config",false); //read device configuration for username
            HTTPClient http;
            http.begin(serverURI + "/api/data/pir");  
            http.addHeader("Content-Type", "application/json");
            
            String jsonPayload = "{";
            jsonPayload += "\"username\":\"" + file.getString("username","") + "\",";
            jsonPayload += "\"pir\":" + String(pir);  // ✅ Remove quotes from `pir`
            jsonPayload += "}";
                    
            int httpResponseCode = http.POST(jsonPayload);

            if (httpResponseCode > 0) {
                String response = http.getString();
                Serial.println("Server response: " + response);
            } else {
                Serial.println("Error sending request. Code: " + String(httpResponseCode));
            }
            http.end(); // Close connection
        } else {
            Serial.println("WiFi not connected");
        }
    

}


boolean connect_backend(){
    wifi_connect(); //Connect to WiFI assuming device is configured. (blocking, make non-blocking ) 
    if(WiFi.status() != WL_CONNECTED) return false;
    return true;
}