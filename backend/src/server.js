require('dotenv').config();
const http = require('http');
const app = require('./app');
const { initDatabase } = require('./config/database');
const { initSocket } = require('./services/socketService');

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    console.log('==================================================');
    console.log('  ParkEase - Smart Parking Management System');
    console.log('  Software Engineering & Architecture Mini Project');
    console.log('==================================================');

    // 1. Initialize Database
    await initDatabase();

    // 2. Create HTTP Server
    const server = http.createServer(app);

    // 3. Initialize WebSocket Server
    initSocket(server);

    // 4. Start Listening
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`[Server] ParkEase backend listening on port ${PORT}`);
      console.log(`[Server] REST API: http://localhost:${PORT}/api/health`);
    });
  } catch (err) {
    console.error('Fatal error starting ParkEase server:', err);
    process.exit(1);
  }
}

startServer();

