const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

mongoose.connect('mongodb+srv://admin:admin@smart-parking.lyseubp.mongodb.net/?retryWrites=true&w=majority&appName=smart-parking', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});


const { ParkingSlot, ParkingYard } = require('./models/ParkingModels');

function setupSocketHandlers(io) {
    io.on('connection', (socket) => {
        socket.on('joinYard', (yardId) => {
            socket.join(yardId);
        });

        socket.on('updateSlotStatus', async (data) => {
            try {
                const { slotId, status } = data;

                const updatedSlot = await ParkingSlot.findByIdAndUpdate(slotId, {
                    'status.isOccupied': status.isOccupied,
                    'status.vehicleInfo': status.vehicleInfo
                },
                    { new: true }
                );

                // notify everyone in room observing
                if (updatedSlot) {
                    io.to(updatedSlot.yardId.toString()).emit('slotStatusUpdated', updatedSlot);
                }

            } catch (error) {
                socket.emit('error', { message: `failed to update slot status: ${error}` });
            }
        });

        socket.on('sensorData', async (data) => {
            try {
                console.log("Received sensor data: ", data);
                const { slotId, isOccupied, timestamp } = data;

                const slot = await ParkingSlot.findById(slotId);

                if (!slot) {
                    return socket.emit('error', { message: 'Invalid slot' });
                }

                if (slot.status.isOccupied !== isOccupied) {
                    slot.status.isOccupied = isOccupied;
                    if (isOccupied) {
                        slot.status.vehicleInfo = {
                            entryTime: new Date(timestamp)
                        };
                    } else {
                        if (slot.status.vehicleInfo?.entryTime) {
                            const duration = new Date(timestamp) - slot.status.vehicleInfo.entryTime;
                            slot.status.vehicleInfo.exitTime = new Date(timestamp);
                            slot.occupancyHistory.push({
                                entryTime: slot.status.vehicleInfo.entryTime,
                                exitTime: new Date(timestamp),
                                duration: duration / (1000 * 60)
                            });

                            slot.status.vehicleInfo = null // empty the vehicle info when vehicle leaves
                        }
                    }

                    await slot.save();
console.log("Slot status updated from sensor data.");
                    //broadcasr to all clients
                    io.emit('slotStatusUpdated', slot);
                    socket.broadcast.emit('sensorData', slot);
                    
                }
            } catch (error) {
                socket.emit('error', { message: 'error processing sensor data', details: error.message });
            }
        });

        socket.on('requestYardStatus', async (yardId) => {
            try {
                const slots = await ParkingSlot.find({ yardId });
                socket.emit('yardStatusResponse', slots);
            } catch (error) {
                socket.emit('error', { message: 'failed to retrieve yard status' });
            }
        });

        socket.on('periodicHealthCheck', async (yardId) => {
            try {
                const slots = await ParkingSlots.find(yardId);

                const healthReport = slots.map(slot => ({
                    slotId: slot._id,
                    isOccupied: slot.status.isOccupied,
                    sensorStatus: slot.sensors.map(sensor => ({
                        type: sensor.type,
                        status: sensor.status,
                        lastChecked: sensor.lastChecked
                    }))
                }));

                socket.emit('healthCheckResult', healthReport);
            } catch (error) {
                socket.emit("error", { message: "health check failed." });
            }
        });

        socket.on('error', (error) => {
            console.error("socket error: ", error);
        });
    });
};

module.exports = { setupSocketHandlers };