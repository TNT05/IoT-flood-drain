const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const port = process.env.PORT || 3001;

// Initial sensor values
let waterDetect = false;
let waterHeight = false;
let pumpActive = false;
let manualMode = false;
let activatePump = false;

// Use body-parser middleware to parse JSON requests
app.use(bodyParser.json());

// HTML content
const html = `
<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Water Diagnostic</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" />
  <style>
    body {
      font-family: 'Arial', sans-serif;
      background-color: #f0f8ff; /* Light Blue */
      color: #003366; /* Dark Blue */
      text-align: center;
      margin: 0;
      padding: 20px;
      transition: background-color 1s ease; /* Background animation */
    }

    h1 {
      margin-bottom: 20px;
      color: #003366;
    }

    .control-buttons {
      display: flex;
      justify-content: center;
      gap: 10px;
      margin-bottom: 20px;
    }

    button {
      padding: 10px 20px;
      font-size: 16px;
      cursor: pointer;
      transition: background-color 0.3s, color 0.3s;
    }

    button:disabled {
      background-color: #ccc;
      color: #666;
      cursor: not-allowed;
    }

    input {
      margin-top: 10px;
    }

    .fa-exclamation-triangle {
      color: #FF6347; /* Tomato */
    }

    .fa-check-circle {
      color: #32CD32; /* Lime Green */
    }

    a {
      display: block;
      margin-top: 20px;
      text-decoration: none;
      color: #003366;
    }

    /* Add animation */
    @keyframes waterAlert {
      0% {
        background-color: inherit;
      }

      50% {
        background-color: #add8e6; /* Light Blue */
      }

      100% {
        background-color: inherit;
      }
    }

    .alert {
      animation: waterAlert 2s ease;
    }
  </style>
</head>

<body>
  <script>
    function updateDiagnostic(waterDetect, waterHeight) {
      var detectCheckbox = document.getElementById('detectCheckbox');
      var distanceCheckbox = document.getElementById('distanceCheckbox');
      detectCheckbox.checked = waterDetect;
      distanceCheckbox.checked = waterHeight;

      // Add alert animation for water detection
      if (waterDetect) {
        document.body.classList.add('alert');
      }
      else{
        document.body.classList.remove('alert');
      }
    }

    function activatePump() {
      fetch("https://iot-flood-drain.onrender.com/activatePump", {
          method: "POST",
          body: JSON.stringify({
            activatePump: true
          }),
          headers: {
            "Content-type": "application/json; charset=UTF-8"
          }
        })
        .then(response => response.json())
        .then(json => console.log(json))
        .catch(error => console.error('Error during mode change:', error));
    }

    function deactivatePump() {
      fetch("https://iot-flood-drain.onrender.com/activatePump", {
          method: "POST",
          body: JSON.stringify({
            activatePump: false
          }),
          headers: {
            "Content-type": "application/json; charset=UTF-8"
          }
        })
        .then(response => response.json())
        .then(json => console.log(json))
        .catch(error => console.error('Error during mode change:', error));
    }

    // Fetch sensor data and manual mode every second
    setInterval(() => {
      // Fetch sensor data
      fetch("/getSensorData")
        .then(response => response.json())
        .then(data => handleSensorData(data))
        .catch(error => console.error('Error fetching sensor data:', error));

      // Fetch manual mode
      fetch("/getManualMode")
        .then(response => response.json())
        .then(data => {
          console.log('Manual Mode:', data.manualMode);
          if (data.manualMode) {
            enableManualControl();
          } else {
            disableManualControl();
          }
        })
        .catch(error => console.error('Error fetching manual mode:', error));
    }, 1000);

    function enableManualControl() {
      var activatePumpButton = document.getElementById('activateButton');
      var deactivatePumpButton = document.getElementById('deactivateButton');
      activatePumpButton.disabled = false;
      deactivatePumpButton.disabled = false;
    }

    function disableManualControl() {
      var activatePumpButton = document.getElementById('activateButton');
      var deactivatePumpButton = document.getElementById('deactivateButton');
      activatePumpButton.disabled = true;
      deactivatePumpButton.disabled = true;
    }

    function handleSensorData(data) {
      console.log('Received sensor data:', data);
      updateDiagnostic(data.waterDetect, data.waterHeight);
    }

    function handleModeChange(mode) {
      fetch("https://iot-flood-drain.onrender.com/setManualMode", {
          method: "POST",
          body: JSON.stringify({
            manualMode: mode
          }),
          headers: {
            "Content-type": "application/json; charset=UTF-8"
          }
        })
        .then(response => response.json())
        .then(json => console.log(json))
        .catch(error => console.error('Error during mode change:', error));
    }
  </script>

  <h1>Water Diagnostic</h1>
  <div class="control-buttons">
    <button id="activateButton" onclick="activatePump()"><i class="fas fa-play"></i> Activate Pump</button>
    <button id="deactivateButton" onclick="deactivatePump()"><i class="fas fa-stop"></i> Deactivate Pump</button>
    <button onclick="handleModeChange(true)"><i class="fas fa-cogs"></i> Manual Mode</button>
    <button onclick="handleModeChange(false)"><i class="fas fa-cogs"></i> Automatic Mode</button>
  </div>
  <i class="fas fa-exclamation-triangle fa-2x"></i>
  <input type="checkbox" id="detectCheckbox" disabled> Water Detected</input><br>
  <i class="fas fa-check-circle fa-2x"></i>
  <input type="checkbox" id="distanceCheckbox" disabled> Water Distance</input><br>
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

// Route to handle incoming POST requests of manual mode from the CLIENT
app.post("/setManualMode", (req, res) => {
  const manualModeRequest = req.body;
  console.log('Received POST request from CLIENT:', manualModeRequest);
  ({ manualMode } = manualModeRequest);
  res.json({ status: "success" });
});

// Route to fetch the manual mode from WEBSERVER
app.get("/getManualMode", (req, res) => {
  res.json({ manualMode });
});

// Route to handle incoming POST requests of pump activation from the CLIENT
app.post("/activatePump", (req, res) => {
  const activatePumpRequest = req.body;
  console.log('Received POST request from CLIENT:', activatePumpRequest);
  ({ activatePump } = activatePumpRequest);
  res.json({ status: "success" });
});

// Route to handle incoming POST requests of pump activation from the CLIENT
app.post("/deactivatePump", (req, res) => {
  const deactivatePumpRequest = req.body;
  console.log('Received POST request from CLIENT:', activatePumpRequest);
  ({ activatePump } = deactivatePumpRequest);
  res.json({ status: "success" });
});

// Route to fetch the pump activation need from WEBSERVER
app.get("/getActivatePump", (req, res) => {
  res.json({ activatePump });
});

const server = app.listen(port, () => console.log(`Example app listening on port ${port}!`));

// Timeout settings
server.keepAliveTimeout = 120 * 1000;
server.headersTimeout = 120 * 1000;
