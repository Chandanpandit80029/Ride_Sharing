const express = require('express');
const router  = express.Router();

const {
  createRequestHandler, getRequestsHandler,
  updateRequestHandler, sharePhoneHandler, deleteRequestHandler,
} = require('../controllers/request.controller');
const { protect }  = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');
const { createRequestSchema, updateRequestSchema } = require('../validations/request.validation');

router.use(protect);

router.post('/',                 validate(createRequestSchema), createRequestHandler);
router.get('/',                  getRequestsHandler);
router.patch('/:id',             validate(updateRequestSchema), updateRequestHandler);
router.patch('/:id/share-phone', sharePhoneHandler);
router.delete('/:id',            deleteRequestHandler);

module.exports = router;
