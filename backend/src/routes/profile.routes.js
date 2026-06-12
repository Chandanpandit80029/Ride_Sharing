const express = require('express');
const router  = express.Router();

const multer = require('multer');
const { getProfile, updateProfile, changePassword } = require('../controllers/profile.controller');
const { protect }  = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');
const { updateProfileSchema, changePasswordSchema } = require('../validations/request.validation');

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'));
    }
    cb(null, true);
  },
});

const attachProfilePicField = (req, _res, next) => {
  if (req.file) req.body.profilePic = 'uploaded';
  next();
};

router.use(protect);

router.get('/', getProfile);
router.patch('/', upload.single('profilePic'), attachProfilePicField, validate(updateProfileSchema), updateProfile);
router.patch('/change-password', validate(changePasswordSchema), changePassword);

module.exports = router;
