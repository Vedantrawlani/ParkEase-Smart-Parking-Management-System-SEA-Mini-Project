let io = null;

function initSocket(serverInstance) {
  const { Server } = require('socket.io');
  io = new Server(serverInstance, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    // console.log(`[Socket] Client connected: ${socket.id}`);

    // Join user-specific room
    socket.on('join_user', (userId) => {
      if (userId) {
        socket.join(`user_${userId}`);
      }
    });

    socket.on('disconnect', () => {
      // client disconnected
    });
  });

  return io;
}

function getIO() {
  return io;
}

function broadcastSlotUpdate(slotData) {
  if (io) {
    io.emit('slot_updated', slotData);
  }
}

function broadcastAreaUpdate(areaData) {
  if (io) {
    io.emit('area_updated', areaData);
  }
}

function sendUserNotification(userId, notification) {
  if (io) {
    io.to(`user_${userId}`).emit('notification', notification);
    io.emit('notification_broadcast', notification); // general feed
  }
}

module.exports = {
  initSocket,
  getIO,
  broadcastSlotUpdate,
  broadcastAreaUpdate,
  sendUserNotification
};

