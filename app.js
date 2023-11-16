const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const port = process.env.PORT || 3001;

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

    setInterval(updateRealTimeValue, 3000);

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

    // Add a function to handle incoming data from ESP32
    function handleSensorData(data) {
      console.log('Received sensor data:', data);
      // Update your webpage based on the received data
      updateDiagnostic(data.waterDetect, data.waterHeight);
    }

    // Add an event listener for the 'sensorData' event
    document.addEventListener('sensorData', function (e) {
      handleSensorData(e.detail);
    });

  </script>

  <h1>Water Diagnostic</h1>
  <div>
    <button onclick="activatePump()">Activate Pump</button>
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

  // Emit the 'sensorData' event to update the webpage
  res.json({ status: "success" });
  const event = new CustomEvent('sensorData', { detail: sensorData });
  res.app.emit('sensorData', event);
});

const server = app.listen(port, () => console.log(`Example app listening on port ${port}!`));

server.keepAliveTimeout = 120 * 1000;
server.headersTimeout = 120 * 1000;
