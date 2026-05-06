const express = require('express');
const router  = express.Router();

const {
  createRideHandler, getRidesHandler, getMyRidesHandler,
  getRideByIdHandler, deleteRideHandler,
} = require('../controllers/ride.controller');
const { protect }  = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');
const { createRideSchema, findRideSchema } = require('../validations/ride.validation');

// All ride routes require authentication
router.use(protect);

router.post('/',      validate(createRideSchema),         createRideHandler);
router.get('/',       validate(findRideSchema, 'query'),  getRidesHandler);
router.get('/my',     getMyRidesHandler);
router.get('/:id',    getRideByIdHandler);
router.delete('/:id', deleteRideHandler);

module.exports = router;
