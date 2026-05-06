const express = require('express');
const router  = express.Router();

const { getProfile, updateProfile, changePassword } = require('../controllers/profile.controller');
const { protect }  = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');
const { updateProfileSchema, changePasswordSchema } = require('../validations/request.validation');

router.use(protect);

router.get('/',                  getProfile);
router.patch('/',                validate(updateProfileSchema),  updateProfile);
router.patch('/change-password', validate(changePasswordSchema), changePassword);

module.exports = router;
