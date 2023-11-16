const express = require("express");
const app = express();
const port = process.env.PORT || 3001;

app.get("/", (req, res) => res.type('html').send(html));

const server = app.listen(port, () => console.log(`Example app listening on port ${port}!`));

server.keepAliveTimeout = 120 * 1000;
server.headersTimeout = 120 * 1000;

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
    function updateRealTimeValue() {
      console.log('Requesting real-time value...');
      fetch('/getRealTimeValue')
        .then(response => response.json())
        .then(realTimeValue => {
          console.log('Received real-time value:', realTimeValue);
          updateDiagnostic(realTimeValue.waterDetect, realTimeValue.waterHeight);
        })
        .catch(error => console.error('Error during real-time value request:', error));
    }

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
`
