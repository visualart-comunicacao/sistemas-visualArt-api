import { Router } from 'express';
import { validate } from '../../middlewares/validate.js';
import { CustomersErpController } from './customers-erp.controller.js';
import {
  CustomerErpCreateSchema,
  CustomerErpListSchema,
  CustomerErpGetByIdSchema,
  CustomerErpUpdateSchema,
  CustomerErpSetActiveSchema,
  CustomerErpSetBlockedSchema,
  CustomerErpOrdersListSchema,
  CustomerErpSummarySchema,
} from './customers-erp.schemas.js';

export const router = Router();

router.post('/erp-customers', validate(CustomerErpCreateSchema), CustomersErpController.create);
router.get('/erp-customers', validate(CustomerErpListSchema), CustomersErpController.list);
router.get('/erp-customers/:id', validate(CustomerErpGetByIdSchema), CustomersErpController.getById);

router.patch('/erp-customers/:id', validate(CustomerErpUpdateSchema), CustomersErpController.update);

router.patch('/erp-customers/:id/active', validate(CustomerErpSetActiveSchema), CustomersErpController.setActive);
router.patch('/erp-customers/:id/blocked', validate(CustomerErpSetBlockedSchema), CustomersErpController.setBlocked);

router.delete('/erp-customers/:id', validate(CustomerErpGetByIdSchema), CustomersErpController.remove);
router.patch('/erp-customers/:id/restore', validate(CustomerErpGetByIdSchema), CustomersErpController.restore);

router.get('/erp-customers/:id/orders', validate(CustomerErpOrdersListSchema), CustomersErpController.listOrders);
router.get('/erp-customers/:id/summary', validate(CustomerErpSummarySchema), CustomersErpController.summary);
