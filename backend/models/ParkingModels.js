const mongoose = require('mongoose');

const ParkingYardSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    location: {
        coordinates: {
            latitude: Number,
            longitude: Number
        }
    },
    totalSlots: {
        type: Number,
        required: true
    }
});

const ParkingSlotSchema = new mongoose.Schema({
    yardId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ParkingYard',
        required: true
    },
    slotNumber: {
        type: Number,
        required: true,
    },
    status: {
        isOccupied: {
            type: Boolean,
            default: true
        },
        vehicleInfo: {
            entryTime: Date,
            exitTime: Date
        }
    },
    sensors: [{
        type: {
            type: String,
            enum: ['ultrasonic', 'proximity', 'gps']
        }
    }],
    location: {
        coordinates: {
            latitude: Number,
            longitude: Number
        }
    },
    occupancyHistory: [{
        entryTime: Date,
        exitTime: Date,
        duration: Number
    }]
});

const ParkingSlot = mongoose.model('ParkingSlot', ParkingSlotSchema);
const ParkingYard = mongoose.model('ParkingYard', ParkingYardSchema);

module.exports = { ParkingSlot, ParkingYard }
