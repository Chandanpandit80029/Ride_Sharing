const express = require('express');
const router  = express.Router();

const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { getProfile, updateProfile, changePassword } = require('../controllers/profile.controller');
const { protect }  = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');
const { updateProfileSchema, changePasswordSchema } = require('../validations/request.validation');

const uploadDir = path.join(__dirname, '../../uploads/profile-pics');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

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
  if (req.file) req.body.profilePic = req.file.filename;
  next();
};

router.use(protect);

router.get('/', getProfile);
router.patch('/', upload.single('profilePic'), attachProfilePicField, validate(updateProfileSchema), updateProfile);
router.patch('/change-password', validate(changePasswordSchema), changePassword);

module.exports = router;
