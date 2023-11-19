const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const port = process.env.PORT || 3001;

// Initial sensor values
let waterDetect = false;
let waterHeight = false;
let pumpActive = false;
let manualMode = false;

// Use body-parser middleware to parse JSON requests
app.use(bodyParser.json());

// HTML content
const html = `
<!-- File: index.html -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Water Diagnostic</title>
  <style>
    .water-theme {
      background-color: #f0f8ff; /* Light Blue */
      color: #003366; /* Dark Blue */
    }
  </style>
</head>
<body class="water-theme">
  <script>
    function updateDiagnostic(waterDetect, waterHeight) {
      var detectCheckbox = document.getElementById('detectCheckbox');
      var distanceCheckbox = document.getElementById('distanceCheckbox');
      detectCheckbox.checked = waterDetect;
      distanceCheckbox.checked = waterHeight;
    }

    function activatePump() {
      console.log('Requesting pump activation...');
      fetch('/activatePump')
        .then(response => {
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }
          return response.text();
        })
        .then(pumpActivationResponse => {
          console.log('Received pump activation response:', pumpActivationResponse);
        })
        .catch(error => {
          console.error('Error during pump activation:', error);
        });
    }

    // Fetch sensor data every second
    setInterval(() => {
      fetch("/getSensorData")
        .then(response => response.json())
        .then(data => handleSensorData(data))
        .catch(error => console.error('Error fetching sensor data:', error));
    }, {
      fetch("/getManualMode")
        .then(response => response.json())
        .then(data => {console.log(data}))
        .catch(error => console.error('Error fetching sensor data:', error));
    }
    ,1000);

    function handleSensorData(data) {
      console.log('Received sensor data:', data);
      updateDiagnostic(data.waterDetect, data.waterHeight);
    }

    function handleModeChange(mode){
      fetch("https://iot-flood-drain.onrender.com/setManualMode", {
        method: "POST",
        body: JSON.stringify({
        manualMode: mode
      }),
      headers: {
        "Content-type": "application/json; charset=UTF-8"
      }
    })
      .then((response) => response.json())
      .then((json) => console.log(json));
    }
    
  </script>

  <h1>Water Diagnostic</h1>
  <div>
    <button onclick="activatePump()">Activate Pump</button>
    <button onclick="handleModeChange(true)">ManualMode</button>
    <input type="checkbox" id="detectCheckbox" disabled> Water Detected</input><br>
    <input type="checkbox" id="distanceCheckbox" disabled> Water Distance</input><br>
  </div>
  <a href="/inline">Go here</a>
</body>
</html>
`;

app.get("/", (req, res) => res.type('html').send(html));

// Route to handle incoming POST requests from the ESP32
app.post("/updateSensorData", (req, res) => {
  const sensorData = req.body;
  console.log('Received POST request from ESP32:', sensorData);
  ({ waterDetect, waterHeight, pumpActive } = sensorData);
  res.json({ status: "success" });
});

// Route to fetch the new values from WEBSERVER
app.get("/getSensorData", (req, res) => {
  res.json({ waterDetect, waterHeight, pumpActive });
});

// Route to handle incoming POST requests of manualmode from the CLIENT
app.post("/setManualMode", (req, res) => {
 const manualModeRequest = req.body;
  console.log('Received POST request from CLIENT:', manualModeRequest);
  ({ manualMode } = manualModeRequest);
  res.json({ status: "success" });
});

// Route to fetch the manualmode from WEBSERVER
app.get("/getManualMode", (req, res) => {
  res.json({ manualMode });
});

const server = app.listen(port, () => console.log(`Example app listening on port ${port}!`));

// Timeout settings
server.keepAliveTimeout = 120 * 1000;
server.headersTimeout = 120 * 1000;
