const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
  cloud_name: 'dhn8bzbf0',
  api_key: '345456992119564',
  api_secret: 'CnRhrFv8Dnl8T6cGpVQF-ek1bvQ'
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'uploads',
    allowed_formats: ['jpg', 'png', 'jpeg']
  },
});

module.exports = {
  cloudinary,
  storage
};
