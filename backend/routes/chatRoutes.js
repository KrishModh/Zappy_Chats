import express from 'express';
import {
  getChats,
  getReceivedRequests,
  handleRequest,
  sendRequest
} from '../controllers/chatController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/requests', protect, sendRequest);
router.get('/requests/received', protect, getReceivedRequests);
router.patch('/requests/:requestId', protect, handleRequest);
router.get('/', protect, getChats);

export default router;
