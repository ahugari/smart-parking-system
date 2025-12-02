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

const slot1_id = "692f2e0eb2e01c133a5fb828";
const slot2_id = "692f2e0eb2e01c133a5fb868";

const yard1_id = "692f2e0eb2e01c133a5fb825";
const yard2_id = "692f2e0eb2e01c133a5fb866";    

const TARGET_DISTANCE_CM = 10;

let slotStatus = {
    "SLOT_1": "EMPTY",
    "SLOT_2": "EMPTY"
};

// Occupancy leds 
const RED1_LED_PIN = 5;
const GREEN1_LED_PIN = 6;

const RED2_LED_PIN = 13;
const GREEN2_LED_PIN = 19;

const redLed1 = new Gpio(RED1_LED_PIN, { mode: Gpio.OUTPUT });
const greenLed1 = new Gpio(GREEN1_LED_PIN, { mode: Gpio.OUTPUT });

const redLed2 = new Gpio(RED2_LED_PIN, { mode: Gpio.OUTPUT });
const greenLed2 = new Gpio(GREEN2_LED_PIN, { mode: Gpio.OUTPUT });
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
        // ----- YARD 1 -----
        const yard1Slots = await axios.get(`http://172.20.10.3:5000/api/yards/${yard1_id}/slots`);
        const yard1Occupied = await axios.get(`http://172.20.10.3:5000/api/yards/${yard1_id}/slots/available`);

        const yard1Total = yard1Slots.data.length;
        const yard1Available = yard1Total - yard1Occupied.data;

        if (yard1Available === 0) {
            redLed1.digitalWrite(1);
            greenLed1.digitalWrite(0);
        } else {
            redLed1.digitalWrite(0);
            greenLed1.digitalWrite(1);
        }

        // ----- YARD 2 -----
        const yard2Slots = await axios.get(`http://172.20.10.3:5000/api/yards/${yard2_id}/slots`);
        const yard2Occupied = await axios.get(`http://172.20.10.3:5000/api/yards/${yard2_id}/slots/available`);

        const yard2Total = yard2Slots.data.length;
        const yard2Available = yard2Total - yard2Occupied.data;

        if (yard2Available === 0) {
            redLed2.digitalWrite(1);
            greenLed2.digitalWrite(0);
        } else {
            redLed2.digitalWrite(0);
            greenLed2.digitalWrite(1);
        }

        // ----- PRINT TO LCD -----
        lcd.clearSync();
        lcd.printLineSync(0, `Y1 Avail: ${yard1Available}`);
        lcd.printLineSync(1, `Y2 Avail: ${yard2Available}`);

        console.log(`LCD Updated → Y1:${yard1Available} | Y2:${yard2Available}`);        

    } catch (err) {
        console.log("LCD update failed:", err.message);
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
