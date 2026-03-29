import multer from 'multer';
import { ApiError } from '../utils/apiError.js';

const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
const maxFileSize = Number(process.env.MAX_UPLOAD_SIZE_BYTES || 10 * 1024 * 1024);

const storage = multer.memoryStorage();

const fileFilter = (_req, file, cb) => {
  const extension = file.originalname.slice(file.originalname.lastIndexOf('.')).toLowerCase();
  const isAllowed = allowedMimeTypes.includes(file.mimetype) && allowedExtensions.includes(extension);

  if (!isAllowed) {
    return cb(new ApiError(400, 'Only JPG, PNG, WEBP, and GIF images are allowed.'));
  }

  return cb(null, true);
};

export const upload = multer({
  storage,
  limits: { fileSize: maxFileSize, files: 1 },
  fileFilter
});

export const ensureSafeImage = (req, _res, next) => {
  if (req.file && !req.file.buffer?.length) {
    return next(new ApiError(400, 'Uploaded file is empty.'));
  }

  if (req.file && req.file.buffer.length < 16) {
    return next(new ApiError(400, 'Uploaded image file is not valid.'));
  }

  return next();
};
