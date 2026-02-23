import { Router } from 'express';

import { router as authRouter } from '../modules/auth/auth.routes.js';
import { router as customersRouter } from '../modules/customers/customers.routes.js';
import { router as ordersRouter } from '../modules/orders/orders.routes.js';

import { router as categoriesPublicRouter } from '../modules/categories/categories.public.routes.js';
import { router as productsPublicRouter } from '../modules/products/products.public.routes.js';
import { router as customersErpRouter } from '../modules/customers-erp/customers-erp.routes.js';
import { router as inboxRouter } from '../modules/inbox/inbox.routes.js'; // ✅ ADD
import { router as adminRouter } from './admin.js';
import { router as whatsappRouter } from '../modules/whatsapp/whatsapp.api.routes.js';
import { router as inboxStreamRouter } from '../modules/inbox/inbox.stream.routes.js'

export const router = Router();

router.use('/auth', authRouter);
router.use('/customers', customersRouter);
router.use(customersErpRouter);

router.use('/categories', categoriesPublicRouter);
router.use('/products', productsPublicRouter);
router.use('/orders', ordersRouter);

router.use('/inbox', inboxRouter); // ✅ ADD

router.use('/whatsapp', whatsappRouter);
router.use('/inbox', inboxStreamRouter)

router.use('/admin', adminRouter);