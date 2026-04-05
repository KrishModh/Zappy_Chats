import { body, query } from 'express-validator';

// ─── Reusable rules ───────────────────────────────────────────────────────────

const dobRule = body('dob')
  .isISO8601().withMessage('Date of birth is required.')
  .toDate();

// ─── Validators ───────────────────────────────────────────────────────────────

export const usernameAvailabilityValidation = [
  query('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be 3-30 characters.')
    .matches(/^[a-zA-Z0-9_.]+$/)
    .withMessage('Username can only contain letters, numbers, underscores, and periods.')
];

export const googleSignupValidation = [
  body('idToken')
    .notEmpty().withMessage('Google ID token is required.'),
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 }).withMessage('Username must be 3–30 characters.')
    .matches(/^[a-zA-Z0-9_.]+$/).withMessage('Username can only contain letters, numbers, underscores, or periods.'),
  body('password')
    .optional({ nullable: true })
    .isLength({ min: 6, max: 128 }).withMessage('Password is too weak — use at least 6 characters.'),
  body('phone')
    .notEmpty().withMessage('Phone number is required.'),
  body('gender')
    .isIn(['male', 'female', 'other']).withMessage('Gender must be male, female, or other.'),
  dobRule,
  body('fullName')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 80 }).withMessage('Full name must be at most 80 characters.')
];

export const googleResetPasswordValidation = [
  body('idToken')
    .notEmpty().withMessage('Google ID token is required.'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('Password is too weak — use at least 8 characters.')
    .matches(/(?=.*[A-Z])(?=.*[a-z])(?=.*\d)/)
    .withMessage('Password is too weak — include uppercase, lowercase, and a number. (e.g. Zappy@123)'),
  body('confirmPassword')
    .notEmpty().withMessage('Please confirm your password.')
];

export const loginValidation = [
  body('username').trim().notEmpty().withMessage('Username is required.'),
  body('password').notEmpty().withMessage('Password is required.')
];

export const changePasswordValidation = [
  body('oldPassword').notEmpty().withMessage('Old password is required.'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password is too weak — use at least 8 characters.')
    .matches(/(?=.*[A-Z])(?=.*[a-z])(?=.*\d)/)
    .withMessage('New password is too weak — include uppercase, lowercase, and a number. (e.g. Zappy@123)')
];