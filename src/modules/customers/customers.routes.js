import { Router } from 'express';
import { validate } from '../../middlewares/validate.js';
import { authRequired } from '../../middlewares/auth.js';
import { CustomersController } from './customers.controller.js';
import {
  CustomerRegisterSchema,
  CustomerMeUpdateSchema,
  AddressCreateSchema,
  AddressUpdateSchema,
  AddressIdParamSchema,
  AddressSetDefaultSchema,
} from './customers.schemas.js';

export const router = Router();

// público
router.post('/register', validate(CustomerRegisterSchema), CustomersController.register);

// logado
router.get('/me', authRequired, CustomersController.me);
router.patch('/me', authRequired, validate(CustomerMeUpdateSchema), CustomersController.updateMe);

router.post('/me/addresses', authRequired, validate(AddressCreateSchema), CustomersController.addAddress);
router.patch('/me/addresses/:id', authRequired, validate(AddressUpdateSchema), CustomersController.updateAddress);
router.delete('/me/addresses/:id', authRequired, validate(AddressIdParamSchema), CustomersController.deleteAddress);

router.patch(
  '/me/addresses/:id/default',
  authRequired,
  validate(AddressSetDefaultSchema),
  CustomersController.setDefaultAddress,
);
