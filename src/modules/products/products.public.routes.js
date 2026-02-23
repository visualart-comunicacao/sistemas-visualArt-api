import { Router } from 'express';
import { validate } from '../../middlewares/validate.js';
import { ProductsController } from './products.controller.js';
import { ProductsListQuerySchema, ProductBySlugParamSchema } from './products.schemas.js';

export const router = Router();

router.get('/', validate(ProductsListQuerySchema), ProductsController.listPublic);
router.get('/:slug', validate(ProductBySlugParamSchema), ProductsController.getBySlug);
