import { body, param, query } from 'express-validator';

export const sendRequestValidation = [body('receiverId').isMongoId().withMessage('Receiver id is invalid.')];
export const handleRequestValidation = [
  param('requestId').isMongoId().withMessage('Request id is invalid.'),
  body('action').isIn(['accepted', 'rejected']).withMessage('Action must be accepted or rejected.')
];
export const searchValidation = [
  query('query')
    .optional()
    .isLength({ min: 1, max: 30 })
    .withMessage('Search query is invalid.'),
  query('q').optional().isLength({ min: 1, max: 30 }).withMessage('Search query is invalid.')
];
export const chatIdValidation = [param('chatId').isMongoId().withMessage('Chat id is invalid.')];
