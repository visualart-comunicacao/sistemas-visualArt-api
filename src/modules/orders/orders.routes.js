import { Router } from 'express';
import { authRequired } from '../../middlewares/auth.js';
import { validate } from '../../middlewares/validate.js';
import { OrdersController } from './orders.controller.js';
import { OrderCreateSchema, OrdersMeQuerySchema } from './orders.schemas.js';

export const router = Router();

router.post('/', authRequired, validate(OrderCreateSchema), OrdersController.create);
router.get('/me', authRequired, validate(OrdersMeQuerySchema), OrdersController.listMine);
