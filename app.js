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

    .fa-play,
    .fa-stop {
      font-size: 1.5em;
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
      animation: waterAlert 1s ease;
    }

    /* Add pump vibration animation */
    @keyframes pumpVibration {
      0% {
        transform: translateX(0);
      }

      25% {
        transform: translateX(5px);
      }

      50% {
        transform: translateX(0);
      }

      75% {
        transform: translateX(-5px);
      }

      100% {
        transform: translateX(0);
      }
    }

    .vibrating {
      animation: pumpVibration 0.5s infinite; /* Adjust the speed and style as needed */
    }
  </style>
</head>

<body>
  <script>
    function updateDiagnostic(waterDetect, waterHeight, pumpActive) {
      var detectCheckbox = document.getElementById('detectCheckbox');
      var distanceCheckbox = document.getElementById('distanceCheckbox');
      detectCheckbox.checked = waterDetect;
      distanceCheckbox.checked = waterHeight;

     var waterDetectedSymbol = document.getElementById('waterDetectedSymbol');
     var waterHeightSymbol = document.getElementById('waterHeightSymbol');

     // Update waterDetectedSymbol
     waterDetectedSymbol.className = waterDetect ? "fas fa-exclamation-triangle fa-2x" : "fas fa-check-circle fa-2x";

     // Update waterHeightSymbol
     waterHeightSymbol.className = waterHeight ? "fas fa-exclamation-triangle fa-2x" : "fas fa-check-circle fa-2x";


      // Add alert animation for water detection
      if (waterDetect) {
        document.body.classList.add('alert');
        setTimeout(() => {
          document.body.classList.remove('alert');
        }, 1000);
      }

      // Add pump vibration animation
      if (pumpActive) {
        document.body.classList.add('vibrating');
      } else {
        document.body.classList.remove('vibrating');
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
      updateDiagnostic(data.waterDetect, data.waterHeight, data.pumpActive);
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
  <i id="waterDetectedSymbol" class="fas fa-check-circle fa-2x"></i>
  <input type="checkbox" id="detectCheckbox" disabled> Water Detected</input><br>
  <i id="waterHeightSymbol" class="fas fa-check-circle fa-2x"></i>
  <input type="checkbox" id="distanceCheckbox" disabled> Water Distance</input><br>
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
  console.log('Received POST request from CLIENT:', deactivatePumpRequest);
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




// HTML content for the login page
const loginHtml = `
<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Login</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" />
  <style>
    body {
      font-family: 'Arial', sans-serif;
      background-color: #f0f8ff; /* Light Blue */
      color: #003366; /* Dark Blue */
      text-align: center;
      margin: 0;
      padding: 20px;
    }

    h1 {
      margin-bottom: 20px;
      color: #003366;
    }

    input {
      padding: 10px;
      margin: 10px;
      font-size: 16px;
    }

    button {
      padding: 10px 20px;
      font-size: 16px;
      cursor: pointer;
      transition: background-color 0.3s, color 0.3s;
    }

    button:hover {
      background-color: #ddd;
    }
  </style>
</head>

<body>
  <script>
    function login() {
      var username = document.getElementById('username').value;
      var password = document.getElementById('password').value;

      // Check credentials
      if (username === 'admin' && password === 'admin') {
        window.location.href = '/';
      } else {
        alert('Invalid credentials. Please try again.');
      }
    }
  </script>

  <h1>Login</h1>
  <input type="text" id="username" placeholder="Username" required><br>
  <input type="password" id="password" placeholder="Password" required><br>
  <button onclick="login()">Login</button>
</body>

</html>
`;

// Route to handle the login page
app.get("/login", (req, res) => res.type('html').send(loginHtml));

// Middleware to protect routes
app.use((req, res, next) => {
  // Check if the user is authenticated
  if (req.path !== '/login' && (!req.headers.authorization || req.headers.authorization !== 'Bearer admin')) {
    return res.redirect('/login');
  }
  next();
});
