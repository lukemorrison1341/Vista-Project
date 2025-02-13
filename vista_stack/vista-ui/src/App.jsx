import { useEffect, useState } from "react";

function App() {

    let backendURL = "http://vista-ucf.com:5000";

    const [message, setMessage] = useState("");
    const [sendUserInfo, setSendUserInfo] = useState(false);
    const [login_success, setLoginSuccess] = useState(false);
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");


    const [login_attempt, setLoginAttempt] = useState(false);

    const [userIP, setUserIP] = useState(null);
    const [device_name, setDeviceName] = useState(null);
    const [detection, setDetection] = useState("No Motion Detected"); //PIR sensor

    useEffect(() => {
        fetch(`${backendURL}`)
            .then(response => response.json())
            .then(data => setMessage(data.message))
            .catch(error => console.error("Error:", error));
    }, []);

    /*
        useEffect(() => {
            if (!userIP) return; // Prevents fetching if userIP is not set
    
            fetch(`http://${userIP}/api/sensor/pir`)  // Changed to GET request
                .then(response => response.json())
                .then(data => {
                    console.log("PIR Sensor Status:", data); // Debugging output
                    setPirStatus(data.status); // Assuming PIR status is stored in state
                })
            .   catch(error => console.error("Error fetching PIR sensor:", error));
    
        }, [userIP]);  // Runs when userIP changes
    */

    useEffect(() => {
        if(sendUserInfo) {
            fetch(`${backendURL}/api/user-login`, {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    username: username,
                    password: password 
                }),
            })
                .then(response => response.json())
                .then(data => setMessage(data.ip))
                .then(data => setUserIP(data.ip))
                .catch(error => console.error("Error:", error))
                .then(response => {
                        if(response.status === 200){
                            console.log("Backend received.");
                        }
                    }
                );

              
        }
        setSendUserInfo(false);
    }, [sendUserInfo]);

    const handleSubmit = (event) => {
        event.preventDefault(); 
        setSendUserInfo(true);  
    };
    return (
        <div>
            <h1>VISTA</h1>
            <form onSubmit={handleSubmit}>
                <input type="text" placeholder="Username" onChange={(e) => setUsername(e.target.value)} />
                <input type="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)} />
                <button type="submit">Login</button> {/* ✅ This will trigger onSubmit */}
            </form>
            <p>{message}</p>
        </div>
    );
}

export default App;
