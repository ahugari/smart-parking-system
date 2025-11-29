const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const router = express.Router();

app.use(cors());
app.use(express.json());

mongoose.connect('mongodb://localhost:27017/smart-parking', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const { ParkingSlot, ParkingYard } = require('./models/ParkingModels');

router.post('/yards', async (req, res) => {
    try {
        const yard = new ParkingYard(req.body);
        await yard.save();

        //generate slots from new yard
        const slots = Array.from({ length: yard.totalSlots }, (_, i) => ({
            yardId: yard._id,
            slotNumber: i + 1,
        }));

        await ParkingSlot.insertMany(slots);
        res.status(201).json(yard);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});
router.get('/yards', async (req, res) => {
    try {
        const yards = await ParkingYard.find();

        res.json(yards);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});
router.post('/yards/:yardId/slots', async (req, res) => {
    try {
        const totalSlots = await ParkingSlot.find({ yardId: req.params.yardId });
        const slot = {
            yardId: req.params.yardId,
            slotNumber: totalSlots + 1,
        };
        await ParkingSlot.insertOne(slot);

        res.status(201).json(slot);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});
router.get('/yards/:yardId/slots', async (req, res) => {
    try {
        const slots = await ParkingSlot.find({
            yardId: req.params.yardId
        });

        res.json(slots);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});
router.put('/yards/:yardId/slots/:slotId', async (req, res) => {
    try {
        const { status } = req.body;
        const slot = await ParkingSlot.findByIdAndUpdate(
            req.params.slotId, {
            'status.isOccupied': status.isOccupied,
            'status.vehicleInfo': status.vehicleInfo,
            $push: {
                occupancyHistory: {
                    entryTime: new Date()
                }
            }
        },
            { new: true }
        );

        if (!slot) {
            res.status(400).json({ message: "Slot not found" });
        }

        //event event for realtime update
        io.emit('slotStatusUpdated', slot);

        res.json(slot);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});
router.get('/yards/:yardId/slots/:slotId/sensor-status', async (req, res) => {
    try {
        const slot = await ParkingSlot.findById(req.params.slotId);
        if (!slot) {
            res.status(400).json({ message: "Slot not found" });
        }

        if (slot.yardId !== req.params.yardId) {
            res.status(400).json({ message: "Invalid slot" });
        }

        const sensorStatus = slot.sensors.map(sensor => ({
            type: sensor.type,
            status: sensor.status,
            lastChecked: sensor.lastChecked
        }));

        res.json(sensorStatus);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});
router.get('/statistics/yards/', async (req, res) => {
    try {
        const yardId = req.params.yardId;

        const totalSlots = await ParkingSlot.countDocuments();
        const occupiedSlots = await ParkingSlot.countDocuments({
            'status.isOccupied': true
        });

        const occupancyRate = (occupiedSlots / totalSlots) * 100;

        res.json({
            totalSlots,
            occupiedSlots,
            occupancyRate
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});
router.get('/statistics/yards/:yardId/', async (req, res) => {
    try {
        const yardId = req.params.yardId;

        const totalSlots = await ParkingSlot.countDocuments({ yardId });
        const occupiedSlots = await ParkingSlot.countDocuments({
            yardId,
            'status.isOccupied': true
        });

        const occupancyRate = (occupiedSlots / totalSlots) * 100;

        res.json({
            totalSlots,
            occupiedSlots,
            occupancyRate
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;