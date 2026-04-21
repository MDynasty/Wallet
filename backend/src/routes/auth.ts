import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate';
import * as authService from '../services/authService';
import { authenticate, AuthRequest } from '../middleware/auth';
import { Response, NextFunction } from 'express';

const router = Router();

// POST /auth/register
router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('firstName').trim().notEmpty(),
    body('lastName').trim().notEmpty(),
  ],
  validate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { email, password, firstName, lastName } = req.body as {
        email: string; password: string; firstName: string; lastName: string;
      };
      const result = await authService.register(email, password, firstName, lastName);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  },
);

// POST /auth/login
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  validate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body as { email: string; password: string };
      const result = await authService.login(email, password);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
);

// GET /auth/me
router.get('/me', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await authService.getMe(req.userId!);
    res.json(user);
  } catch (err) {
    next(err);
  }
});

export default router;
