const Gpio = require('pigpio').Gpio;

const PROX_PIN = 27; // Assuming BCM GPIO 27 for the proximity sensor

const proximitySensor = new Gpio(PROX_PIN, {
    mode: Gpio.INPUT,
    // Add pullUpDown: Gpio.PUD_DOWN if the pin floats when no car is present
});

// Export a function that returns true if a car is present, false otherwise
module.exports.isCarPresent = () => {
    const level_1 = proximitySensor.digitalRead();
    // Return true if high (car present), false if low (empty slot)
    return level_1 === 0; 
};

// Export a cleanup function
module.exports.cleanup = () => {
    proximitySensor.unexport();
    console.log("Proximity sensor cleaned up.");
};
