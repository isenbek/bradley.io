// Connect to your streams
const gpsWS = new WebSocket('ws://13.0.0.250:8080');
const adsbWS = new WebSocket('ws://13.0.0.250:8081');
const telemWS = new WebSocket('ws://13.0.0.250:8082');

gpsWS.onmessage = (event) => {
  const gpsData = JSON.parse(event.data);
  updateMap(gpsData);
};

adsbWS.onmessage = (event) => {
  const adsbData = JSON.parse(event.data);
  updateAircraft(adsbData);
};
