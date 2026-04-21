import { Router, Response, NextFunction } from 'express';
import { body } from 'express-validator';
import { authenticate, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import * as accountService from '../services/accountService';
import { AccountType } from '../services/accountService';

const router = Router();
router.use(authenticate);

// GET /accounts
router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const accounts = await accountService.listAccounts(req.userId!);
    res.json(accounts);
  } catch (err) {
    next(err);
  }
});

// POST /accounts
router.post(
  '/',
  [
    body('type').isIn(['FIAT', 'CRYPTO']),
    body('currency').trim().notEmpty(),
    body('label').trim().notEmpty(),
  ],
  validate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { type, currency, label } = req.body as {
        type: AccountType; currency: string; label: string;
      };
      const account = await accountService.createAccount(req.userId!, type, currency, label);
      res.status(201).json(account);
    } catch (err) {
      next(err);
    }
  },
);

// GET /accounts/:id
router.get('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const account = await accountService.getAccount(req.userId!, req.params.id);
    res.json(account);
  } catch (err) {
    next(err);
  }
});

export default router;
