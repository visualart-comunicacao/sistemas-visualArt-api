import { Router } from 'express';
import { validate } from '../../middlewares/validate.js';
import { ProductsController } from './products.controller.js';
import {
  ProductCreateSchema,
  ProductUpdateSchema,
  ProductAddImageSchema,
  ProductAddOptionGroupSchema,
  GroupAddOptionSchema,
  StockUpdateSchema,
} from './products.schemas.js';
import { ProductsAdminController } from './products.admin.controller.js';
import { AdminProductsListSchema, AdminProductGetByIdSchema } from './products.admin.schemas.js';

export const router = Router();

router.get('/products', validate(AdminProductsListSchema), ProductsAdminController.list);
router.get('/products/:id', validate(AdminProductGetByIdSchema), ProductsAdminController.getById);
router.post('/products', validate(ProductCreateSchema), ProductsController.create);
router.patch('/products/:id', validate(ProductUpdateSchema), ProductsController.update);

router.post('/products/:productId/images', validate(ProductAddImageSchema), ProductsController.addImage);
router.post('/products/:productId/option-groups', validate(ProductAddOptionGroupSchema), ProductsController.addOptionGroup);

router.post('/option-groups/:groupId/options', validate(GroupAddOptionSchema), ProductsController.addOption);

router.patch('/stock/:productId', validate(StockUpdateSchema), ProductsController.updateStock);
