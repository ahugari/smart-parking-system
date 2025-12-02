const ultrasonic = require('./ultrasonicSensor_1.js');
const proximity = require('./proximitySensor_1.js');
const socketio = require('socket.io-client');



const ultrasonic2 = require('./ultrasonicSensor_2.js');
const proximity2 = require('./proximitySensor_2.js');

const Gpio = require('pigpio').Gpio;
const axios = require('axios');


console.log("Car Parking System Initializing...");

const socket = socketio.connect('http://172.20.10.3:5000');

const slot1_id = "692dc703c10f4f5a19f2e785";
const slot2_id = "692dc703c10f4f5a19f2e788";

socket.on("connect", () => console.log("Connected to server!"));
socket.on("connect_error", (err) => console.log("Connection Error:", err));


// Adjust threshold based on your actual setup
const TARGET_DISTANCE_CM = 10;

// Track current slot states
let slotStatus = {
    "SLOT_1": "EMPTY",
    "SLOT_2": "EMPTY"
};

/**
 * SLOT 1 CHECKER
 */
function checkSlot1() {
    const carPresentProximity = proximity.isCarPresent();

    let distance = ultrasonic.getDistance();
    if (typeof distance !== "number" || isNaN(distance)) distance = -1;

    const carPresentUltrasonic =
        distance > 0 &&
        distance < TARGET_DISTANCE_CM;

    const newStatus = (carPresentProximity && carPresentUltrasonic)
        ? "OCCUPIED"
        : "EMPTY";

    const previousStatus = slotStatus["SLOT_1"];

    console.log(`\n--- Slot 1 Update ---`);
    console.log(`Proximity_1: ${carPresentProximity ? "Car" : "No Car"}`);
    console.log(`Ultrasonic_1: ${distance >= 0 ? distance.toFixed(2) : "-1"} cm`);
    console.log(`Status: ${newStatus}`);

        if (newStatus !== previousStatus) {
            console.log(`>>> STATUS CHANGE: ${previousStatus} → ${newStatus}`);
            slotStatus["SLOT_1"] = newStatus;
    
            if (newStatus === "OCCUPIED") {
                axios.put('http://172.20.10.3:5000/api/slots/' + slot1_id, {
                    isOccupied: true,
                    vehicleInfo: {
                        entryTime: new Date().toISOString()
                    }
                });
                
            } else {
                axios.put('http://172.20.10.3:5000/api/slots/' + slot1_id, {
                    isOccupied: false,
                    vehicleInfo: {
                        exitTime: new Date().toISOString()
                    }
                });
            }
        }
    }


/**
 * SLOT 2 CHECKER
 */
function checkSlot2() {
    const carPresentProximity = proximity2.isCarPresent();

    let distance = ultrasonic2.getDistance();
    if (typeof distance !== "number" || isNaN(distance)) distance = -1;

    const carPresentUltrasonic =
        distance > 0 &&
        distance < TARGET_DISTANCE_CM;

    const newStatus = (carPresentProximity && carPresentUltrasonic)
        ? "OCCUPIED"
        : "EMPTY";

    const previousStatus = slotStatus["SLOT_2"];

    console.log(`\n--- Slot 2 Update ---`);
    console.log(`Proximity_2: ${carPresentProximity ? "Car" : "No Car"}`);
    console.log(`Ultrasonic_2: ${distance >= 0 ? distance.toFixed(2) : "-1"} cm`);
    console.log(`Status: ${newStatus}`);

    if (newStatus !== previousStatus) {
        console.log(`>>> STATUS CHANGE: ${previousStatus} → ${newStatus}`);
        slotStatus["SLOT_2"] = newStatus;

        if (newStatus === "OCCUPIED") {
            socket.emit('sensorData', {
            slotId: slot2_id,
            isOccupied: true,
            timestamp: new Date().toISOString()
        });
        console.log("Emitted occupied for slot 2");

        } else {
            socket.emit('sensorData', {
            slotId: slot2_id,
            isOccupied: false,
            timestamp: new Date().toISOString()
});
        }
    }
}


// Run every 2 seconds
const intervalId = setInterval(() => {
    checkSlot1();
}, 2000);

const intervalId2 = setInterval(() => {
    checkSlot2();
}, 2000);

/**
 * Graceful shutdown
 */
process.on('SIGINT', () => {
    clearInterval(intervalId);
    clearInterval(intervalId2);

    ultrasonic.cleanup();
    proximity.cleanup();
    ultrasonic2.cleanup();
    proximity2.cleanup();

    Gpio.prototype.pigpio.gpioTerminate();

    console.log("\nParking system shut down.");
    process.exit();
});