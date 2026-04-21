import { Router, Response, NextFunction } from 'express';
import { body } from 'express-validator';
import { authenticate, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import * as kycService from '../services/kycService';

const router = Router();
router.use(authenticate);

// GET /kyc
router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const status = await kycService.getKycStatus(req.userId!);
    res.json(status);
  } catch (err) {
    next(err);
  }
});

// POST /kyc/submit
router.post(
  '/submit',
  [
    body('docType').trim().notEmpty().withMessage('Document type is required'),
    body('docNumber').trim().notEmpty().withMessage('Document number is required'),
  ],
  validate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { docType, docNumber } = req.body as { docType: string; docNumber: string };
      const result = await kycService.submitKyc(req.userId!, docType, docNumber);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
);

export default router;
