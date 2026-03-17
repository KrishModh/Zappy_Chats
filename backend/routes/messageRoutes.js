import express from 'express';
import { getMessages, sendMessage } from '../controllers/messageController.js';
import { protect } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.get('/:chatId', protect, getMessages);
router.post('/', protect, upload.single('image'), sendMessage);

export default router;
