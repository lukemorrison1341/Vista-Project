require("dotenv").config();
const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to SQLite database
const db = new sqlite3.Database("./vista.db", (err) => {
    if (err) {
        console.error("Database connection error:", err.message);
    } else {
        console.log("Connected to SQLite database.");
    }
});

// Create `devices` table if not exists
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS devices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ip TEXT NOT NULL,
        username TEXT NOT NULL,
        password TEXT NOT NULL,
        device_name TEXT NOT NULL,
        registered_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
});



app.use(express.json());
app.use(cors());

// Test API Route
app.get("/", (req, res) => {
    res.json({ message: "Enter username and password." });
});

//Recieve user login info from the frontend, responds with IP 
app.post("/api/user-login", (req, res) => {
    const { username, password } = req.body;
    console.log("Backend Username: " + username + "password: " + password);
    // Validate request
    if (!username || !password) {
        console.log("Fail: Missing required fields.");
        return res.status(400).json({ status: "fail", error: "Missing required fields." });
    }

    // Check if user exists in the database
    db.get("SELECT * FROM devices WHERE TRIM(username) = TRIM(?) AND TRIM(password) = TRIM(?) COLLATE NOCASE", [username, password], (err, row) => {
        if (err) {
            console.error("Database error:", err.message);
            return res.status(500).json({ status: "fail", error: err.message });
        }

        if (row) {
            // User found, return success with IP
            console.log("User found.");
            return res.status(200).json({ status: "success", ip: row.ip, device_name: row.device_name });
            
        } else {
            // User not found
            console.log("Fail: User not found.");
            return res.status(404).json({ status: "fail", error: "User not found." });
        }
    });
});



// **POST: Receive IP, Username, Password, Device Name from ESP32 to register itself, save user information in database.  
app.post("/api/device-config", (req, res) => {
    const { ip, username, password, device_name } = req.body;
    console.log(`Username: ${username}, Password: ${password}, IP: ${ip}, Device Name: ${device_name}`);
    // Validate input
    if (!ip || !username || !password || !device_name) {
        return res.status(400).json({ error: "Missing required fields(no ip, username, password or device name for device-config endpoint.)" });
    }

    db.get("SELECT * FROM devices WHERE username = ? AND password = ?", [username, password], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        if (row) {
            // If the username and password exist, update the IP
            db.run("UPDATE devices SET ip = ? WHERE username = ? AND password = ?", [ip, username, password], function (err) {
                if (err) {
                    return res.status(500).json({ error: err.message });
                }
                res.json({ message: "Updated IP for existing user." });
            });
        } else {
            // If the username and password do not exist, insert a new entry
            db.run("INSERT INTO devices (ip, username, password, device_name) VALUES (?, ?, ?, ?)", [ip, username, password, device_name], function (err) {
                if (err) {
                    return res.status(500).json({ error: err.message });
                }
                res.json({ message: "Inserted new device", device_id: this.lastID });
            });
        }
    });
    
});


// **Start Server** (listen to any connection from outside devices)
app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
});