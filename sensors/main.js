//---------------------------------------------------------
//  IMPORTS
//---------------------------------------------------------
const ultrasonic = require('./ultrasonicSensor_1.js');
const proximity = require('./proximitySensor_1.js');
const ultrasonic2 = require('./ultrasonicSensor_2.js');
const proximity2 = require('./proximitySensor_2.js');

const ldr = require('./ldrSensor.js');   // UPDATED MODULE
const LCD = require('raspberrypi-liquid-crystal');
const axios = require('axios');
const socketio = require('socket.io-client');
const { Gpio } = require('pigpio');

//---------------------------------------------------------
//  SYSTEM INITIALIZATION
//---------------------------------------------------------
console.log("Car Parking System Initializing...");

const socket = socketio.connect('http://172.20.10.3:5000');
socket.on("connect", () => console.log("Connected to server!"));
socket.on("connect_error", (err) => console.log("Connection Error:", err));

const slot1_id = "692dc703c10f4f5a19f2e785";
const slot2_id = "692dc703c10f4f5a19f2e788";

const TARGET_DISTANCE_CM = 10;

let slotStatus = {
    "SLOT_1": "EMPTY",
    "SLOT_2": "EMPTY"
};

//---------------------------------------------------------
//  LDR LIGHTING CHECK
//---------------------------------------------------------
function checkLighting() {
    ldr.updateLighting();
}
setInterval(checkLighting, 1000);  // Every 1 sec

//---------------------------------------------------------
//  LCD CONFIGURATION
//---------------------------------------------------------
const lcd = new LCD(1, 0x27, 16, 2);
lcd.beginSync();
lcd.clearSync();
lcd.printLineSync(0, "Smart Parking");
lcd.printLineSync(1, "Initializing...");
setTimeout(() => lcd.clearSync(), 2000);

//---------------------------------------------------------
//  LCD UPDATE FUNCTION
//---------------------------------------------------------
async function updateLCD() {
    try {
        const response = await axios.get("http://172.20.10.3:5000/api/statistics/yards/");
        const { totalSlots, occupiedSlots } = response.data;
        const available = totalSlots - occupiedSlots;

        lcd.clearSync();
        lcd.printLineSync(0, `Available: ${available}`);
        lcd.printLineSync(1, `Occupied: ${occupiedSlots}`);

        console.log(`LCD Updated → Available: ${available}`);
    } catch (error) {
        console.log("LCD update failed:", error.message);
        lcd.clearSync();
        lcd.printLineSync(0, "LCD ERROR");
    }
}
setInterval(updateLCD, 2000);

//---------------------------------------------------------
//  SLOT 1 CHECKER
//---------------------------------------------------------
function checkSlot1() {
    const carPresentProximity = proximity.isCarPresent();
    let distance = ultrasonic.getDistance();
    if (typeof distance !== "number" || isNaN(distance)) distance = -1;

    const carPresentUltrasonic = (distance > 0 && distance < TARGET_DISTANCE_CM);
    const newStatus = (carPresentProximity && carPresentUltrasonic) ? "OCCUPIED" : "EMPTY";

    const prevStatus = slotStatus["SLOT_1"];

    console.log(`\n--- SLOT 1 UPDATE ---`);
    console.log(`Proximity_1: ${carPresentProximity ? "Car" : "No Car"}`);
    console.log(`Ultrasonic_1: ${distance >= 0 ? distance.toFixed(2) : "-1"} cm`);
    console.log(`Status: ${newStatus}`);

    if (newStatus !== prevStatus) {
        console.log(`>>> SLOT 1: ${prevStatus} → ${newStatus}`);
        slotStatus["SLOT_1"] = newStatus;

        axios.put(`http://172.20.10.3:5000/api/slots/${slot1_id}`, {
            status: {
                isOccupied: newStatus === "OCCUPIED",
                vehicleInfo: newStatus === "OCCUPIED"
                    ? { entryTime: new Date().toISOString() }
                    : { exitTime: new Date().toISOString() }
            }
        });
    }
}

//---------------------------------------------------------
//  SLOT 2 CHECKER
//---------------------------------------------------------
function checkSlot2() {
    const carPresentProximity = proximity2.isCarPresent();
    let distance = ultrasonic2.getDistance();
    if (typeof distance !== "number" || isNaN(distance)) distance = -1;

    const carPresentUltrasonic = (distance > 0 && distance < TARGET_DISTANCE_CM);
    const newStatus = (carPresentProximity && carPresentUltrasonic) ? "OCCUPIED" : "EMPTY";

    const prevStatus = slotStatus["SLOT_2"];

    console.log(`\n--- SLOT 2 UPDATE ---`);
    console.log(`Proximity_2: ${carPresentProximity ? "Car" : "No Car"}`);
    console.log(`Ultrasonic_2: ${distance >= 0 ? distance.toFixed(2) : "-1"} cm`);
    console.log(`Status: ${newStatus}`);

    if (newStatus !== prevStatus) {
        console.log(`>>> SLOT 2: ${prevStatus} → ${newStatus}`);
        slotStatus["SLOT_2"] = newStatus;

        axios.put(`http://172.20.10.3:5000/api/slots/${slot2_id}`, {
            status: {
                isOccupied: newStatus === "OCCUPIED",
                vehicleInfo: newStatus === "OCCUPIED"
                    ? { entryTime: new Date().toISOString() }
                    : { exitTime: new Date().toISOString() }
            }
        });
    }
}

setInterval(checkSlot1, 2000);
setInterval(checkSlot2, 2000);

//---------------------------------------------------------
//  GRACEFUL SHUTDOWN
//---------------------------------------------------------
process.on("SIGINT", () => {
    console.log("\nShutting down parking system...");

    ultrasonic.cleanup();
    proximity.cleanup();
    ultrasonic2.cleanup();
    proximity2.cleanup();
    ldr.cleanup();

    Gpio.prototype.pigpio.gpioTerminate();

    lcd.clearSync();
    lcd.printLineSync(0, "System Stopped");

    process.exit();
});
