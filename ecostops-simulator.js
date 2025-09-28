import fetch from "node-fetch";

// === Configuration ===
const routes = {
  "12": [
    { lat: -34.6103, lon: -58.3850 }, // Congreso
    { lat: -34.6089, lon: -58.3837 },
    { lat: -34.6075, lon: -58.3828 },
    { lat: -34.6061, lon: -58.3818 }, // 9 de Julio
    { lat: -34.6050, lon: -58.3817 },
    { lat: -34.6037, lon: -58.3816 }, // Obelisco
    { lat: -34.6022, lon: -58.3805 },
    { lat: -34.6010, lon: -58.3779 },
    { lat: -34.5994, lon: -58.3736 }, // Retiro
    { lat: -34.5978, lon: -58.3702 }
  ],
  "24": [
    { lat: -34.5611, lon: -58.4565 }, // Av. Cabildo y Congreso
    { lat: -34.5662, lon: -58.4483 },
    { lat: -34.5713, lon: -58.4395 },
    { lat: -34.5765, lon: -58.4320 },
    { lat: -34.5802, lon: -58.4285 },
    { lat: -34.5833, lon: -58.4250 },
    { lat: -34.5862, lon: -58.4205 },
    { lat: -34.5880, lon: -58.4170 },
    { lat: -34.5890, lon: -58.4145 },
    { lat: -34.5898, lon: -58.4125 },
    { lat: -34.5915, lon: -58.4100 }
  ]
};

const userLocation = { lat: -34.6037, lon: -58.3816 }; // Obelisco
const avgBusSpeedKmH = 30;
const endpoint = "https://28rfv29du0.execute-api.us-east-1.amazonaws.com/events"; // API Gateway

// === Utilities ===
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function calculateWaitTime(distanceKm) {
  return (distanceKm / avgBusSpeedKmH) * 60; // minutes
}

function randomizePassengers(currentPassengers) {
  // +/- 3 passengers variation
  return Math.max(
    0,
    Math.min(70, currentPassengers + (Math.floor(Math.random() * 7) - 3))
  );
}

function createBuses(line, count) {
  const route = routes[line];
  return Array.from({ length: count }, (_, i) => ({
    id: `L${line}-${i + 1}`,
    line,
    posIndex: Math.floor(Math.random() * route.length), // random start point
    passengers: Math.floor(Math.random() * 60) + 10,
    startDelay: (Math.random() * 10 + 3) * 1000, // 3–13s delay
    interval: (15 + Math.random() * 10) * 1000 // 15–25s between updates
  }));
}

// === Generate buses ===
let buses = [
  ...createBuses("12", 5),
  ...createBuses("24", 5)
];

// === Simulation ===
// === Simulation (global interval for all buses) ===
setInterval(async () => {
  for (let bus of buses) {
    const route = routes[bus.line];
    const { lat, lon } = route[bus.posIndex];
    const distance = haversine(lat, lon, userLocation.lat, userLocation.lon);
    const waitTime = calculateWaitTime(distance).toFixed(1);

    bus.passengers = randomizePassengers(bus.passengers);

    const event = {
      busId: bus.id,
      line: bus.line,
      lat,
      long: lon,
      waitTimeMin: waitTime,
      passengers: bus.passengers
    };

    console.log(`[${bus.id}] Sending:`, event);

    try {
      await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(event)
      });
    } catch (e) {
      console.error(`[${bus.id}] Error sending event:`, e.message);
    }

    bus.posIndex = (bus.posIndex + 1) % route.length;
  }
}, 15000); // delay fixed to 15s

// Stop simulation after 5 minutes
setTimeout(() => {
  console.log("Simulation finished.");
  process.exit(0);
}, 5 * 60 * 1000);
