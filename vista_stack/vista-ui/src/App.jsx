import { useEffect, useState } from "react";

function App() {

    let backendURL = "http://vista-ucf.com:5000";

    const [message, setMessage] = useState(""); //Message from backend (login text displays if connected to backend)
    const [sendUserInfo, setSendUserInfo] = useState(false);
    const [login_success, setLoginSuccess] = useState(false);
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [deviceActive, setDeviceActive] = useState(false);

    const [login_attempt, setLoginAttempt] = useState(false);
    const [vista_connect, setVistaConnection] = useState(false);
    const [userIP, setUserIP] = useState(null);
    const [backend_connect, setBackendConnection] = useState(false);
    const [device_name, setDeviceName] = useState(null);
    const [detection, setDetection] = useState("No Motion Detected"); //PIR sensor
    const [displayIP, setDisplayIP] = useState(null);
    const [device_mode, setDeviceMode] = useState(false); //true = eco, false = not eco
    const [minTemp, setMinTemp] = useState(68);
    const [maxTemp, setMaxTemp] = useState(75);
    

    function DeviceModeButton({ device_mode, setDeviceMode }) {
        const handleModeButton = async () => {
            console.log("Changing Device Mode");
            const newMode = !device_mode;
            setDeviceMode(newMode); // ✅ Update state first
    
            try {
                console.log("Sending Device Mode to ESP32...");
                await sendRequest("/api/device/mode", "POST", { mode: newMode ? "eco" : "not_eco" });
                console.log("Sent Mode:", newMode);
            } catch (error) {
                console.error("Error sending device mode:", error);
            }
        };
    
        return (
           
                <div>
                    <h2>{device_mode ? "Eco Mode" : "Not Eco Mode"}</h2>
                    <button onClick={handleModeButton}>Change Device Mode</button>
                </div>
        );
    }

    function TemperatureControl({ minTemp, setMinTemp, maxTemp, setMaxTemp }) {
        const handleMinTempChange = (delta) => {
            setMinTemp((prevMinTemp) => {
                const newMinTemp = prevMinTemp + delta;
                return newMinTemp >= 65 && newMinTemp < maxTemp ? newMinTemp : prevMinTemp;
            });
        };
    
        const handleMaxTempChange = (delta) => {
            setMaxTemp((prevMaxTemp) => {
                const newMaxTemp = prevMaxTemp + delta;
                return newMaxTemp > minTemp && newMaxTemp <= 75 ? newMaxTemp : prevMaxTemp;
            });
        };
    
        return (
            <div style={{ border: "2px solid black", padding: "10px", width: "250px", textAlign: "center" }}>
                <h3>Temperature Settings</h3>
    
                <div style={{ marginBottom: "10px" }}>
                    <h4>Min Temperature</h4>
                    <button onClick={() => handleMinTempChange(-1)}>▼</button>
                    <span style={{ margin: "0 10px", fontSize: "18px" }}>{minTemp}°F</span>
                    <button onClick={() => handleMinTempChange(1)}>▲</button>
                </div>
    
                <div>
                    <h4>Max Temperature</h4>
                    <button onClick={() => handleMaxTempChange(-1)}>▼</button>
                    <span style={{ margin: "0 10px", fontSize: "18px" }}>{maxTemp}°F</span>
                    <button onClick={() => handleMaxTempChange(1)}>▲</button>
                </div>
            </div>
        );
    }
    
    

    
    const sendRequest = async (endpoint, method = "GET", body = null) => {
        if (!userIP) return;
    
        try {
            
            const options = {
                method: method.toUpperCase(), 
                headers: { "Content-Type": "application/json" },
            };
    
            if (body) {
                options.body = JSON.stringify(body); // Add body for POST requests
            }
    

            const directResponse = await fetch(`http://${userIP}${endpoint}`, options); //try ESP32 furst
            if (!directResponse.ok) {
                throw new Error("ESP32 request failed");
            }
            
            console.log("Frontend Connection Success");
            if (backend_connect) setBackendConnection(false);
            return await directResponse.json();
        } catch (error) {
            console.log("Direct request failed, falling back to backend relay:", error);
    
            // ✅ Update the IP Display to "Backend" immediately

             if(!backend_connect) setBackendConnection(true);
    
            // ✅ Fetch from backend relay
            const backendResponse = await fetch(`${backendURL}/api/relay`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username: username }),
            });
    
            if (!backendResponse.ok) throw new Error("Backend relay request failed");
    
            console.log("Relaying to Backend, Failed to connect to ESP32 from frontend.");
            return await backendResponse.json();
        }
    };
    
    
    /** PIR Sensor Detection */
    function PIR_sensor_detection({ userIP }) {
        if (!userIP) return;

        useEffect(() => {
            console.log("Reading PIR...");

            const fetchPirStatus = async () => {
                try {
                    const data = await sendRequest("/api/sensor/pir");
                    console.log("PIR Sensor Status:", data);
                    setDetection(data.pir ? "Motion Detected" : "No Motion Detected");
                } catch (error) {
                    console.error("Error fetching PIR sensor:", error);
                    setVistaConnection(false);
                }
            };

            fetchPirStatus(); 
            const interval = setInterval(fetchPirStatus, 3000);  // Fetch every 3 seconds

            return () => clearInterval(interval);
        }, [userIP]);  

        return (
            <div>
                {vista_connect ? (
                    <h2>PIR Sensor Status: {detection}</h2>
                ) : (
                    <h2></h2>
                )}
            </div>
        );
    }

    function User_Interface({ userIP, device_mode, setDeviceMode, minTemp, setMinTemp, maxTemp, setMaxTemp }) {
        useEffect(() => {
            if (backend_connect) {
                setDisplayIP("Backend");
            } else {
                setDisplayIP(userIP);
            }
        }, [backend_connect, userIP, vista_connect]);
    
        return (
            <div>
                <h1>Welcome {device_name}!</h1>
                {vista_connect ? (
                    <div>
                        <h1>Connected at {displayIP}</h1>
                        <PIR_sensor_detection userIP={userIP} />
                        <DeviceModeButton device_mode={device_mode} setDeviceMode={setDeviceMode} /> 
                        <TemperatureControl minTemp={minTemp}  maxTemp={maxTemp} setMinTemp={setMinTemp} setMaxTemp={setMaxTemp}/>
                        <h2>User Interface</h2> 
                    </div>
                ) : (
                    <h1>Connecting...</h1>
                )}
                
            </div>
        );
    }
    

    
    useEffect(() => {
        fetch(`${backendURL}`)
            .then(response => response.json())
            .then(data => setMessage(data.message))
            .catch(error => console.error("Error:", error));
    }, []);



        useEffect(() => {
            if (!sendUserInfo) return;
        
            fetch(`${backendURL}/api/user-login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            })
            .then(response => response.json().then(data => ({ status: response.status, body: data }))) // ✅ Extract status + JSON
            .then(({ status, body }) => {
                console.log("API Response:", body);  // ✅ Debugging
        
                if (status === 200) {
                    setUserIP(body.ip);
                    setLoginSuccess(true);
                    setDeviceName(body.device_name);  // ✅ Ensure state updates properly
                    setLoginAttempt(true);
                    console.log("Backend received.");
                } else {
                    console.error("Login failed:", body);
                    setLoginAttempt(false);
                }
            })
            .catch(error => console.error("Error:", error));  // ✅ Catch any errors
        
            setSendUserInfo(false);  // ✅ Reset `sendUserInfo`
        }, [sendUserInfo]);

    const handleSubmit = (event) => {
        event.preventDefault(); 
        setSendUserInfo(true);  
    };


    
    useEffect(() => {
        if (!login_success || !username) return;
        
        let isMounted = true;
    
        const fetchActivity = async () => {
            if (!isMounted) return;
            console.log("Checking device activity...");
    
            try {
                const response = await fetch(`${backendURL}/api/device-status/${username}`);
    
                if (!response.ok) throw new Error("Failed to fetch device status");
    
                const data = await response.json();
                console.log(`Device Status: ${data.status}, Last Seen: ${data.last_seen}`);
    
                if (data.status === "online" && isMounted) {
                    setVistaConnection(true);
                } else {
                    setVistaConnection(false);
                }
            } catch (error) {
                console.error("Error fetching device activity:", error);
                if (isMounted) setVistaConnection(false);
            }
        };
    
        fetchActivity();
        const interval = setInterval(fetchActivity, 30000); // ✅ Fetch every 60 seconds
    
        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, [login_success]);
    
        


    useEffect(() => {
        if (!login_success || !username) return;
        
        let isMounted = true;
    
        const fetchIP = async () => {
            if (!isMounted) return;
            console.log("Fetching IP...");
    
            try {
                const response = await fetch(`${backendURL}/api/ip`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ username }),
                });
    
                if (!response.ok) throw new Error("Failed to fetch IP from backend");
    
                const data = await response.json();
                if (data.ip && isMounted) {
                    setUserIP(data.ip);
                    console.log(`Fetched IP: ${data.ip}`);
                }
            } catch (error) {
                console.error("Error fetching IP:", error);
            }
        };
    
        fetchIP();
        const interval = setInterval(fetchIP, 30000); // ✅ Fetch every 30 seconds instead of 10
    
        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, [login_success]);
    

    return (
        <div>
            { !login_attempt && <div>
            <h1>VISTA Login 1.0</h1>
                < form onSubmit={handleSubmit}>
                <input type="text" placeholder="Username" onChange={(e) => setUsername(e.target.value)} />
                <input type="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)} />
                <button type="submit">Login</button> {/* trigger on submit */}
            </form>
            <p>{message}</p>
            </div>}
            {
                login_attempt && <User_Interface userIP={userIP} device_mode={device_mode} setDeviceMode={setDeviceMode} maxTemp={maxTemp} minTemp={minTemp} setMaxTemp={setMaxTemp} setMinTemp={setMinTemp} /> //conditionally render user interface for all VISTA controls
            }
        </div>
    );
}

export default App;
