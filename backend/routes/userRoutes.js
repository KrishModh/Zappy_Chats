import express from 'express';
import { getMe, searchUsers } from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/me', protect, getMe);
router.get('/search', protect, searchUsers);

export default router;
