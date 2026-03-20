import { body } from 'express-validator';

export const updateProfileValidation = [
  body('fullName').optional().trim().isLength({ min: 2, max: 80 }).withMessage('Full name must be 2-80 characters.'),
  body('username')
    .optional()
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be 3-30 characters.')
    .matches(/^[a-zA-Z0-9_.]+$/)
    .withMessage('Username can only contain letters, numbers, underscores, and periods.'),
  body('phone').optional().trim().isLength({ min: 7, max: 20 }).withMessage('Phone number is invalid.'),
  body('gender').optional().isIn(['male', 'female', 'other']).withMessage('Gender is invalid.'),
  body('dob').optional().isISO8601().withMessage('Date of birth is invalid.').toDate()
];
