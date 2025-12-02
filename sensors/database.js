const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database file
const dbPath = path.resolve(__dirname, 'parking_log.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Could not connect:', err);
    } else {
        console.log('Connected to SQLite DB.');
        createTables();
    }
});

// Create both tables
function createTables() {
    const createSlotEvents = `
        CREATE TABLE IF NOT EXISTS SlotEvents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            slot_id INTEGER NOT NULL,
            event_type TEXT NOT NULL CHECK(event_type IN ('ENTRY', 'EXIT')),
            timestamp TEXT NOT NULL
        );
    `;

    const createSessions = `
        CREATE TABLE IF NOT EXISTS Sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            slot_id INTEGER NOT NULL,
            entry_time TEXT NOT NULL,
            exit_time TEXT,
            duration_minutes REAL
        );
    `;

    db.run(createSlotEvents);
    db.run(createSessions, (err) => {
        if (err) console.error("Failed to create Sessions:", err);
        else console.log("Sessions table ready.");
    });
}

// -------------------- SESSION FUNCTIONS ------------------------ //

// Start a parking session (ENTRY)
module.exports.startSession = (slotId) => {
    const entryTime = new Date().toISOString();

    const query = `
        INSERT INTO Sessions (slot_id, entry_time)
        VALUES (?, ?)
    `;

    db.run(query, [slotId, entryTime], function(err) {
        if (err) {
            console.error("Error starting session:", err);
        } else {
            console.log(`Session STARTED → Slot ${slotId}, SessionID ${this.lastID}`);
        }
    });
};

// End a parking session (EXIT)
module.exports.endSession = (slotId) => {
    const exitTime = new Date().toISOString();

    // 1. Find the latest session for this slot where exit_time is NULL
    const findQuery = `
        SELECT * FROM Sessions
        WHERE slot_id = ? AND exit_time IS NULL
        ORDER BY id DESC
        LIMIT 1
    `;

    db.get(findQuery, [slotId], (err, session) => {
        if (err) {
            return console.error("Error fetching session:", err);
        }

        if (!session) {
            return console.warn(`No active session found for slot ${slotId}.`);
        }

        // Calculate duration in minutes
        const start = new Date(session.entry_time);
        const end = new Date(exitTime);
        const durationMinutes = ((end - start) / 1000) / 60;

        // 2. Update the session with exit_time and duration
        const updateQuery = `
            UPDATE Sessions
            SET exit_time = ?, duration_minutes = ?
            WHERE id = ?
        `;

        db.run(updateQuery, [exitTime, durationMinutes.toFixed(2), session.id], function(err) {
            if (err) {
                console.error("Error updating session:", err);
            } else {
                console.log(
                    `Session ENDED → Slot ${slotId}, Duration: ${durationMinutes.toFixed(2)} mins`
                );
            }
        });
    });
};

// Keep your old event logger (unchanged)
module.exports.logEvent = (slotId, eventType) => {
    const timestamp = new Date().toISOString();

    const query = `
        INSERT INTO SlotEvents (slot_id, event_type, timestamp)
        VALUES (?, ?, ?)
    `;
    db.run(query, [slotId, eventType, timestamp], function(err) {
        if (err) console.error("Error logging event:", err);
        else console.log(`Logged Event → Slot ${slotId} | ${eventType}`);
    });
};

// Close DB
module.exports.closeDb = () => {
    db.close((err) => {
        if (err) console.error('Error closing DB:', err);
        else console.log('🔌 Database closed.');
    });
};
