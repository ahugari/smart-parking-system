const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const { setupSocketHandlers } = require('./socketHandlers');
const parkingRoutes = require('./parkingRoutes');

class ParkingServer {
    constructor() {
        this.app = express();
        this.server = http.createServer(this.app);
        this.io = socketIo(this.server, {
            cors: {
                origin: "*",
                methods: ["GET", "POST", "PUT"]
            }
        });

        this.initializeMiddleware();
        this.connectDatabase();
        this.setupRoutes();
        this.setupSocketHandlers();
    }

    initializeMiddleware() {
        this.app.use(cors());
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));
    }

    async connectDatabase() {
        try {
            await mongoose.connect('mongodb+srv://admin:admin@smart-parking.lyseubp.mongodb.net/?retryWrites=true&w=majority&appName=smart-parking', {
                useNewUrlParser: true,
                useUnifiedTopology: true,
            });
            console.log("mongodb started successfully")

            await this.initializeDefaultYard();
        } catch (error) {
            console.log("mongodb error: ", error);
            process.exit(1);
        }
    }

    async initializeDefaultYard() {
        const { ParkingSlot, ParkingYard } = require('./models/ParkingModels');

        const existingHomeYard = await ParkingYard.findOne({ name: "Home" });

        if (!existingHomeYard) {
            const newYard = new ParkingYard({
                name: "Home",
                location: {
                    longitude: -1.935111,
                    latitude: 30.158601
                },
                totalSlots: 20
            });

            await newYard.save();

            const slots = Array.from({ length: newYard.totalSlots }, (_, i) => {
                const isOccupied = Math.random() < 0.5;
                const slot = {
                    yardId: newYard._id,
                    slotNumber: i + 1,
                    status: {
                        isOccupied: isOccupied,
                        vehicleInfo: {
                            entryTime: isOccupied ? new Date() : null
                        }
                    },
                    sensors: [{
                        type: 'ultrasonic',
                        status: 'operational',
                        lastChecked: new Date()
                    },
                    {
                        type: 'proximity',
                        status: 'operational',
                        lastChecked: new Date()
                    }]
                }
                return slot;
            });

            await ParkingSlot.insertMany(slots);

            console.log("default home yard created successfully");
        }

        const existingSchoolYard = await ParkingYard.findOne({ name: "School" });

        if (!existingSchoolYard) {
            const newYard = new ParkingYard({
                name: "School",
                location: {
                    longitude: -1.935111,
                    latitude: 30.158601
                },
                totalSlots: 20
            });

            await newYard.save();

            const slots = Array.from({ length: newYard.totalSlots }, (_, i) => {
                const isOccupied = Math.random() < 0.6;
                const slot = {
                    yardId: newYard._id,
                    slotNumber: i + 1,
                    status: {
                        isOccupied: isOccupied,
                        vehicleInfo: {
                            entryTime: isOccupied ? new Date() : null
                        }
                    },
                    sensors: [{
                        type: 'ultrasonic',
                        status: 'operational',
                        lastChecked: new Date()
                    },
                    {
                        type: 'proximity',
                        status: 'operational',
                        lastChecked: new Date()
                    }]
                }
                return slot;
            });

            await ParkingSlot.insertMany(slots);

            console.log("default school yard created successfully");
        }
    }

    setupRoutes() {
        const routerWithIo = parkingRoutes(this.io);
        this.app.use('/api', routerWithIo);

        this.app.use('/health', (req, res) => {
            res.json({
                status: 'healthy',
                timeStamp: new Date().toISOString()
            });
        });
    }

    setupSocketHandlers() {
        setupSocketHandlers(this.io);
    }

    start(port = 5000) {
        this.server.listen(port, () => {
            console.log(`Server running on port ${port}`)
        });
    }
}

const config = {
    development: {
        port: 5000,
        mongoUri: 'mongodb+srv://admin:admin@smart-parking.lyseubp.mongodb.net/?retryWrites=true&w=majority&appName=smart-parking',
        corsOrigin: "*"
    }
}

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught exception:', error);
    process.exit(1);
})

function initializeServer() {
    const env = process.env.NODE_ENV || 'development';
    const serverConfig = config[env];

    const parkingServer = new ParkingServer();
    parkingServer.start(serverConfig.port);
}

module.exports = {
    ParkingServer, initializeServer
}

if (require.main === module) {
    initializeServer();
}