import { Router, Response, NextFunction } from 'express';
import { body, query } from 'express-validator';
import { authenticate, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import * as txnService from '../services/transactionService';

const router = Router();
router.use(authenticate);

// GET /transactions
router.get(
  '/',
  [query('accountId').optional().isUUID()],
  validate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const accountId = req.query.accountId as string | undefined;
      const txns = await txnService.listTransactions(req.userId!, accountId);
      res.json(txns);
    } catch (err) {
      next(err);
    }
  },
);

// GET /transactions/:id
router.get('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const txn = await txnService.getTransaction(req.userId!, req.params.id);
    res.json(txn);
  } catch (err) {
    next(err);
  }
});

// POST /transactions/deposit  (test/admin – in production this is triggered by payment processor webhook)
router.post(
  '/deposit',
  [
    body('accountId').isUUID(),
    body('amount').isDecimal({ decimal_digits: '1,18' }).withMessage('Invalid amount'),
  ],
  validate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { accountId, amount } = req.body as { accountId: string; amount: string };
      const txn = await txnService.deposit(req.userId!, accountId, amount);
      res.status(201).json(txn);
    } catch (err) {
      next(err);
    }
  },
);

// POST /transactions/transfer
router.post(
  '/transfer',
  [
    body('fromAccountId').isUUID(),
    body('toAccountId').isUUID(),
    body('amount').isDecimal({ decimal_digits: '1,18' }),
    body('note').optional().isString().trim().isLength({ max: 255 }),
  ],
  validate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { fromAccountId, toAccountId, amount, note } = req.body as {
        fromAccountId: string; toAccountId: string; amount: string; note?: string;
      };
      const txn = await txnService.transfer(req.userId!, fromAccountId, toAccountId, amount, note);
      res.status(201).json(txn);
    } catch (err) {
      next(err);
    }
  },
);

// POST /transactions/exchange
router.post(
  '/exchange',
  [
    body('fromAccountId').isUUID(),
    body('toAccountId').isUUID(),
    body('amount').isDecimal({ decimal_digits: '1,18' }),
  ],
  validate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { fromAccountId, toAccountId, amount } = req.body as {
        fromAccountId: string; toAccountId: string; amount: string;
      };
      const txn = await txnService.exchange(req.userId!, fromAccountId, toAccountId, amount);
      res.status(201).json(txn);
    } catch (err) {
      next(err);
    }
  },
);

export default router;
