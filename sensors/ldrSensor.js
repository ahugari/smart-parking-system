// ldrSensor.js
const { Gpio } = require("pigpio");

const LDR_PIN = 22;
const LED_PIN = 16;


// LDR input
const ldr = new Gpio(LDR_PIN, { mode: Gpio.INPUT });

// LED output
const led = new Gpio(LED_PIN, { mode: Gpio.OUTPUT });

/**
 * Reads LDR: returns true if dark, false if bright.
 */
function isDarkness() {
    const value = ldr.digitalRead();   // 0 = dark, 1 = bright
    return value === 0;
}

/**
 * Controls LED based on LDR status
 */
function updateLighting() {
    if (isDarkness()) {
        led.digitalWrite(0);
    } else {
        led.digitalWrite(1);
    }
}

/**
 * Cleanup when shutting down
 */
function cleanup() {
    console.log("Cleaning up LDR...");
    led.digitalWrite(0);
    led.unexport();
}

module.exports = {
    isDarkness,
    updateLighting,
    cleanup
};
