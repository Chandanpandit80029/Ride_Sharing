const {
  createRide,
  getRides,
  getRideById,
  deleteRide,
  getMyRides,
} = require('../services/ride.service');
const { sendSuccess } = require('../utils/response.utils');

const createRideHandler = async (req, res, next) => {
  try {
    const ride = await createRide(req.user.id, req.user.domain, req.body);
    sendSuccess(res, 201, 'Ride created successfully', { ride });
  } catch (e) { next(e); }
};

const getRidesHandler = async (req, res, next) => {
  try {
    const result = await getRides(req.user.domain, req.query, req.user.id);
    sendSuccess(res, 200, 'Rides fetched successfully', result);
  } catch (e) { next(e); }
};

const getMyRidesHandler = async (req, res, next) => {
  try {
    const rides = await getMyRides(req.user.id);
    sendSuccess(res, 200, 'Your rides fetched', { rides });
  } catch (e) { next(e); }
};

const getRideByIdHandler = async (req, res, next) => {
  try {
    const ride = await getRideById(req.params.id, req.user.domain, req.user.id);
    sendSuccess(res, 200, 'Ride details fetched', { ride });
  } catch (e) { next(e); }
};

const deleteRideHandler = async (req, res, next) => {
  try {
    const result = await deleteRide(req.params.id, req.user.id);
    sendSuccess(res, 200, result.message);
  } catch (e) { next(e); }
};

module.exports = {
  createRideHandler,
  getRidesHandler,
  getMyRidesHandler,
  getRideByIdHandler,
  deleteRideHandler,
};
