const Gpio = require('pigpio').Gpio;

const TRIGGER_PIN = 23;
const ECHO_PIN = 24;
const MICROSECDONDS_PER_CM = 1e6 / 34300 / 2;
const ADJUSTMENT_FACTOR = 0.001; 

const trigger = new Gpio(TRIGGER_PIN, {mode: Gpio.OUTPUT});
const echo = new Gpio(ECHO_PIN, {mode: Gpio.INPUT, alert: true});

// Ensure the trigger is low initially
trigger.trigger(10, 1); 

// Use a persistent state variable inside the module
let currentDistance = -1;

// Continuously update the distance in the background
echo.on('alert', (level, tick) => {
    if (level === 1) {
        // Start time of the pulse
        module.exports.startTick = tick; 
    } else if (module.exports.startTick) {
        // End time of the pulse
        const endTick = tick;
        const diff = (endTick >> 0) - (module.exports.startTick >> 0);
        
        // Calculate and store the distance
        currentDistance = (diff * MICROSECDONDS_PER_CM * ADJUSTMENT_FACTOR)+1;
        
        module.exports.startTick = null; // Reset
    }
});

// Trigger the sensor on a regular interval *within* the module
// This keeps the 'currentDistance' variable up-to-date
const measurementInterval = setInterval(() => {
    trigger.trigger(10, 1); // Send a pulse every 100ms
}, 100); 

// Export a synchronous function that just returns the last known value
module.exports.getDistance = () => {
    return currentDistance;
};

// Also export a cleanup function for when the main program stops
module.exports.cleanup = () => {
    clearInterval(measurementInterval); // Stop the background measuring loop
    echo.removeAllListeners('alert');
    trigger.unexport();
    echo.unexport();
    console.log("Ultrasonic sensor cleaned up.");
};
