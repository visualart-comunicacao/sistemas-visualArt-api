import { Router } from 'express';
import { validate } from '../../middlewares/validate.js';
import { CategoriesController } from './categories.controller.js';
import { CategoryCreateSchema, CategoryUpdateSchema } from './categories.schemas.js';

export const router = Router();

router.post('/categories', validate(CategoryCreateSchema), CategoriesController.create);
router.patch('/categories/:id', validate(CategoryUpdateSchema), CategoriesController.update);
