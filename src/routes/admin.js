import { Router } from 'express';
import { authRequired, requireRole } from '../middlewares/auth.js';

import { router as categoriesAdminRouter } from '../modules/categories/categories.admin.routes.js';
import { router as productsAdminRouter } from '../modules/products/products.admin.routes.js';
import { router as quotesAdminRouter } from '../modules/quotes/quotes.admin.routes.js';
import { router as customersErpRouter } from '../modules/customers-erp/customers-erp.routes.js';
import { router as uploadsAdminRouter } from '../modules/uploads/uploads.routes.js';
export const router = Router();

router.use(authRequired);
router.use(requireRole('ADMIN'));

router.use('/', categoriesAdminRouter); // POST /admin/categories, PATCH /admin/categories/:id
router.use('/', productsAdminRouter); // /admin/products..., /admin/stock..., /admin/option-groups...
router.use('/', quotesAdminRouter);
router.use('/', customersErpRouter);
router.use('/', uploadsAdminRouter);
