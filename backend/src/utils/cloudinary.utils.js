const { v2: cloudinary } = require('cloudinary');
const { Readable } = require('stream');
const path = require('path');

const requiredVars = [
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
];

requiredVars.forEach((key) => {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
});

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const buildPublicId = (originalName) => {
  const name = path.parse(originalName).name.replace(/[^a-zA-Z0-9_-]/g, '_');
  return `${Date.now()}-${Math.round(Math.random() * 1e9)}-${name}`.slice(0, 80);
};

const uploadImage = async (file, folder = 'ride-share/profile-pics') => {
  if (!file || !file.buffer) {
    throw new Error('No file buffer available for Cloudinary upload');
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: buildPublicId(file.originalname || 'profile-pic'),
        resource_type: 'image',
        overwrite: true,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    const stream = Readable.from(file.buffer);
    stream.pipe(uploadStream);
  });
};

module.exports = { uploadImage };
