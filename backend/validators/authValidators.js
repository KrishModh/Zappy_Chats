import { body } from 'express-validator';

const emailRule = body('email').isEmail().withMessage('Enter a valid email.').normalizeEmail();
const passwordRule = body('password')
  .isLength({ min: 8 })
  .withMessage('Password must be at least 8 characters.')
  .matches(/(?=.*[A-Z])(?=.*[a-z])(?=.*\d)/)
  .withMessage('Password must include uppercase, lowercase, and a number.');
const dobRule = body('dob').isISO8601().withMessage('Date of birth is required.').toDate();

export const sendOtpValidation = [
  emailRule,
  body('purpose').optional().isIn(['signup', 'password_reset']).withMessage('OTP purpose is invalid.')
];

export const verifyOtpValidation = [
  emailRule,
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits.').isNumeric(),
  body('purpose').optional().isIn(['signup', 'password_reset']).withMessage('OTP purpose is invalid.')
];

export const signupValidation = [
  body('fullName').trim().isLength({ min: 2, max: 80 }).withMessage('Full name must be 2-80 characters.'),
  emailRule,
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be 3-30 characters.')
    .matches(/^[a-zA-Z0-9_.]+$/)
    .withMessage('Username can only contain letters, numbers, underscores, and periods.'),
  passwordRule,
  body('phone').trim().isLength({ min: 7, max: 20 }).withMessage('Phone number is invalid.'),
  body('gender').isIn(['male', 'female', 'other']).withMessage('Gender is invalid.'),
  dobRule,
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits.')
];

export const loginValidation = [
  body('username').trim().notEmpty().withMessage('Username is required.'),
  body('password').notEmpty().withMessage('Password is required.')
];

export const changePasswordValidation = [
  body('oldPassword').notEmpty().withMessage('Old password is required.'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters.')
    .matches(/(?=.*[A-Z])(?=.*[a-z])(?=.*\d)/)
    .withMessage('New password must include uppercase, lowercase, and a number.')
];

export const forgotPasswordValidation = [emailRule];

export const resetPasswordValidation = [
  emailRule,
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters.')
    .matches(/(?=.*[A-Z])(?=.*[a-z])(?=.*\d)/)
    .withMessage('New password must include uppercase, lowercase, and a number.'),
  body('confirmPassword').notEmpty().withMessage('Confirm password is required.')
];
