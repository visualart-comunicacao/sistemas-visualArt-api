import { Router } from 'express';
import { validate } from '../../middlewares/validate.js';
import { QuotesController } from './quotes.controller.js';
import {
  QuoteCreateSchema,
  QuotesListQuerySchema,
  QuoteGetSchema,
  QuoteApproveSchema,
  QuoteConvertSchema,
  QuoteCancelSchema,
  QuoteUpdateSchema
} from './quotes.schemas.js';

export const router = Router();

router.post('/quotes', validate(QuoteCreateSchema), QuotesController.create);
router.get('/quotes', validate(QuotesListQuerySchema), QuotesController.list);
router.get('/quotes/:id', validate(QuoteGetSchema), QuotesController.get);

router.post('/quotes/:id/approve', validate(QuoteApproveSchema), QuotesController.approve);
router.post('/quotes/:id/convert', validate(QuoteConvertSchema), QuotesController.convert);
router.post('/quotes/:id/cancel', validate(QuoteCancelSchema), QuotesController.cancel);

router.patch('/quotes/:id', validate(QuoteUpdateSchema), QuotesController.update)