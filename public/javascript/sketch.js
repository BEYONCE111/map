
// Create connection to Node.JS Server
const socket = io();

let canvas;
let adjustedThreshold = 0.2; // Initialize adjusted threshold
let noiseScale = 1 / 150;
let shore = "#FFFFFF"; // Color for shore, light blue
let sand = "#AED6F1"; // Color for sand, light blue
let grass = "#5DADE2"; // Color for grass, dark blue
let stone = "#2E86C1"; // Color for stone, dark blue, slightly higher purity
let snow = "#85C1E9"; // Color for snow, light blue
let xoff = 0; // Horizontal noise offset
let yoff = 0; // Vertical noise offset

function setup() {
  canvas = createCanvas(windowWidth, windowHeight);
  noStroke();
  noiseDetail(10, 0.5);
  background(0);

  // Connect to Node.JS Server
  socket.on("connect", () => {
    console.log(socket.id);
  });

  // Callback function on the event of disconnect
  socket.on("disconnect", () => {
    console.log(socket.id);
  });

  // Callback function to receive message from Node.JS
  socket.on("message", (_message) => {
    console.log(_message);
    unpackOSC(_message);
  });
}

function draw() {
  makeMap();
  drawMap();

  // Update noise offsets
  xoff += 0.01;
  yoff += 0.01;
}

function unpackOSC(message) {
  if (message.address == "/gyrosc/gyro") {
    let rollValue = message.args[0];
    let pitchValue = message.args[1];
    let yawValue = message.args[2];

    // Calculate new adjustedThreshold based on roll, pitch, and yaw values
    let rollThreshold = map(rollValue, -180, 180, 0.1, 0.8);
    let pitchThreshold = map(pitchValue, -90, 90, -0.8, 0.8);
    let yawThreshold = map(yawValue, -180, 180, -0.8, 0.8);

    // Sum up roll, pitch, and yaw thresholds, constrain between 0 and 1
    adjustedThreshold = constrain(rollThreshold + pitchThreshold + yawThreshold, 0, 1);
  }
}

function makeMap() {
  let _map = []; // Renamed variable
  for (let i = 0; i < width; i++) {
    _map[i] = [];
    for (let j = 0; j < height; j++) {
      _map[i][j] = pickColor(i, j);
    }
  }
  return _map;
}

function pickColor(i, j) {
  // Adjust ocean threshold based on distance, making areas closer to the mouse more likely to be ocean
  let h = noise((i + xoff) * noiseScale, (j + yoff) * noiseScale);
  let c = "#facade";

  if (h < adjustedThreshold) {
    c = shore;
  } else if (h < 0.3) {
    if (random() > pow(h - adjustedThreshold, 2) * 100) {
      c = shore;
    } else {
      c = sand;
    }
  } else if (h < 0.5) {
    if (random() > pow(h - 0.4, 2) * 100) {
      c = sand;
    } else {
      c = grass;
    }
  } else if (h < 0.6) {
    if (random() > pow(h - 0.5, 2) * 100) {
      c = grass;
    } else {
      c = stone;
    }
  } else if (h < 0.7) {
    if (random() > pow(h - 0.6, 2) * 100) {
      c = stone;
    } else {
      c = snow;
    }
  } else {
    c = snow;
  }

  return color(c);
}

function drawMap() {
  let _map = makeMap(); // Generate the map
  for (let i = 0; i < width; i++) {
    for (let j = 0; j < height; j++) {
      set(i, j, _map[i][j]); // Set pixel color
    }
  }
  updatePixels();
}

// Events we are listening for
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
