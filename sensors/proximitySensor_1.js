const Gpio = require('pigpio').Gpio;

const PROX_PIN = 17; // Assuming BCM GPIO 17 for the proximity sensor

// Set pin as input with a pull-down resistor if necessary (check sensor specs)
// For simplicity, we assume the sensor pulls the pin HIGH when a car is present.
const proximitySensor = new Gpio(PROX_PIN, {
    mode: Gpio.INPUT,
    // Add pullUpDown: Gpio.PUD_DOWN if the pin floats when no car is present
});

// Export a function that returns true if a car is present, false otherwise
module.exports.isCarPresent = () => {
    // Read the current logic level of the pin
    // Returns 0 (HIGH) or 1 (LOW)
    const level = proximitySensor.digitalRead();
    // Return true if high (car present), false if low (empty slot)
    return level === 0; 
};

// Export a cleanup function
module.exports.cleanup = () => {
    proximitySensor.unexport();
    console.log("Proximity sensor cleaned up.");
};
