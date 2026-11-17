const express = require('express');
const router = express.Router();
const parkingController = require('../controllers/parkingController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.get('/areas', parkingController.getAreas);
router.get('/slots', parkingController.getSlots);
router.get('/availability', parkingController.getAvailability);
router.post('/bookings', authenticateToken, parkingController.createBooking);
router.get('/bookings', authenticateToken, parkingController.getUserBookings);
router.get('/bookings/:id', authenticateToken, parkingController.getBookingById);
router.put('/bookings/:id/cancel', authenticateToken, parkingController.cancelBooking);

module.exports = router;

