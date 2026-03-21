import express from 'express';
import {
  deleteMessageController,
  editMessageController,
  getMessagesController,
  sendMessageController
} from '../controllers/messageController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { ensureSafeImage, upload } from '../middleware/uploadMiddleware.js';
import { validateRequest } from '../middleware/validateMiddleware.js';
import { chatIdValidation } from '../validators/chatValidators.js';
import { deleteMessageValidation, editMessageValidation, sendMessageValidation } from '../validators/messageValidators.js';

const router = express.Router();

router.use(requireAuth);
router.get('/:chatId', chatIdValidation, validateRequest, getMessagesController);
router.post('/', upload.single('image'), ensureSafeImage, sendMessageValidation, validateRequest, sendMessageController);
router.patch('/:messageId', editMessageValidation, validateRequest, editMessageController);
router.delete('/:messageId', deleteMessageValidation, validateRequest, deleteMessageController);

export default router;
