import { useEffect, useState } from "react";

function App() {

    let backendURL = "http://vista-ucf.com:5000";

    const [message, setMessage] = useState("");
    const [sendUserInfo, setSendUserInfo] = useState(false);
    const [login_success, setLoginSuccess] = useState(false);
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");


    const [login_attempt, setLoginAttempt] = useState(false);
    const [vista_connect, setVistaConnection] = useState(false);
    const [userIP, setUserIP] = useState(null);
    const [device_name, setDeviceName] = useState(null);
    const [detection, setDetection] = useState("No Motion Detected"); //PIR sensor

    function PIR_sensor_detection({userIP}) {
        if(!userIP) return;
        useEffect(() => {
            const fetchPirStatus = () => {
                fetch(`http://${userIP}/api/sensor/pir`) 
                    .then(response => response.json())
                    .then(data => {
                        console.log("PIR Sensor Status:", data); 
                        setDetection(data.pir == true ? "Motion Detected" : "No Motion Detected");
                        setVistaConnection(true);
                    })
                    .catch(error => {
                        console.error("Error fetching PIR sensor:", error)
                        setVistaConnection(false);
                    });
            };
    
            fetchPirStatus(); 
            const interval = setInterval(fetchPirStatus, 3000);  // fetch every 1 seconds
    
            return () => clearInterval(interval);
        }, []);  
        return (
            <div>
                {vista_connect &&
                    <h2>PIR Sensor Status: {detection}</h2>
                }
                {!vista_connect &&
                    <h2>Failed to connect to VISTA device.</h2>
                }
            </div>
        );
    }
    function User_Interface({userIP}){

        return (
        <div>
            <h1>Welcome {device_name}! 
                
            </h1>
            {vista_connect && <h1>Connected at {userIP}</h1>}
            <div>
                <PIR_sensor_detection userIP={userIP}/>
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
