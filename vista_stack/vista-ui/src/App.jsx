import { useEffect, useState } from "react";

function App() {

    let backendURL = "http://vista-ucf.com:5000";

    const [message, setMessage] = useState(""); //Message from backend (login text displays if connected to backend)
    const [sendUserInfo, setSendUserInfo] = useState(false);
    const [login_success, setLoginSuccess] = useState(false);
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");


    const [login_attempt, setLoginAttempt] = useState(false);
    const [vista_connect, setVistaConnection] = useState(false);
    const [userIP, setUserIP] = useState(null);
    const [backend_connect, setBackendConnection] = useState(false);
    const [device_name, setDeviceName] = useState(null);
    const [detection, setDetection] = useState("No Motion Detected"); //PIR sensor
    const [displayIP, setDisplayIP] = useState(null);


    /** Function to send request with backup fallback */
    const sendRequest = async (endpoint) => {
        if (!userIP) return;
    
        try {
            // ✅ Try direct request to ESP32 first
            const directResponse = await fetch(`http://${userIP}${endpoint}`);
            if (!directResponse.ok) {
                throw new Error("ESP32 request failed");
            }
            
            console.log("Frontend Connection Success");
            setBackendConnection(false);
            return await directResponse.json();
        } catch (error) {
            console.log("Direct request failed, falling back to backend relay:", error);
    
            // ✅ Update the IP Display to "Backend" immediately
            setUserIP("Backend");
            setBackendConnection(true);
    
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
                    setVistaConnection(true);
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
                    <h2>Failed to connect to VISTA device.</h2>
                )}
            </div>
        );
    }

    function User_Interface({ userIP }) {

        useEffect(() => {
            if (backend_connect) {
                setDisplayIP("Backend");
            } else {
                setDisplayIP(userIP);
            }
        }, [backend_connect, userIP]); // ✅ Ensure this runs when state changes

        return (
            <div>
                <h1>Welcome {device_name}!</h1>
                {vista_connect ? (
                    <h1>Connected at {displayIP}</h1> // 
                ) : (
                    <h1>Connecting...</h1>
                )}
                <div>
                    <PIR_sensor_detection userIP={userIP} />
                </div>
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
        if(!login_success) {
            console.log("Login Unsuccessful")   
            return;
        }
        if (!username) return; // ✅ Ensure username exists before making requests
    
        const fetchIP = async () => {
            console.log("Sending IP");
            try {
                const response = await fetch(`${backendURL}/api/ip`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ username }),
                });
    
                if (!response.ok) {
                    throw new Error("Failed to fetch IP from backend");
                }
    
                const data = await response.json(); // ✅ Expecting { ip: "192.168.1.100" }
                if (data.ip) {
                    setUserIP(data.ip); // ✅ Update state with new IP
                    console.log(`Fetched IP: ${data.ip}`);
                } else {
                    console.warn("No IP received in response:", data);
                }
            } catch (error) {
                console.error("Error fetching IP:", error);
            }
        };
    
        // ✅ Fetch immediately, then repeat every 10 seconds
        fetchIP();
        const interval = setInterval(fetchIP, 10000); // ✅ Run every 10 seconds
    
        return () => clearInterval(interval); // ✅ Cleanup interval on unmount
    }, [username]); // ✅ Runs when `username` changes

    return (
        <div>
            { !login_attempt && <div>
            <h1>VISTA Login</h1>
                < form onSubmit={handleSubmit}>
                <input type="text" placeholder="Username" onChange={(e) => setUsername(e.target.value)} />
                <input type="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)} />
                <button type="submit">Login</button> {/* trigger on submit */}
            </form>
            <p>{message}</p>
            </div>}
            {
                login_attempt && <User_Interface userIP={userIP} /> //conditionally render user interface for all VISTA controls
            }
        </div>
    );
}

export default App;
