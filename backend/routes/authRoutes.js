import express from 'express';
import { login, sendOtp, signup, verifyOtp } from '../controllers/authController.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/signup', upload.single('profilePic'), signup);
router.post('/login', login);

export default router;
