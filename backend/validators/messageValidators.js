import { body, param } from 'express-validator';

export const sendMessageValidation = [
  body('chatId').isMongoId().withMessage('Chat id is invalid.'),
  body('message').optional().isLength({ max: 5000 }).withMessage('Message is too long.')
];

export const editMessageValidation = [
  param('messageId').isMongoId().withMessage('Message id is invalid.'),
  body('message').isLength({ min: 1, max: 5000 }).withMessage('Message must be between 1 and 5000 characters.')
];

export const deleteMessageValidation = [
  param('messageId').isMongoId().withMessage('Message id is invalid.'),
  body('scope').isIn(['me', 'everyone']).withMessage('Delete scope is invalid.')
];
