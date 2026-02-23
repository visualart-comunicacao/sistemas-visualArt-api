import { Router } from 'express';
import { CategoriesController } from './categories.controller.js';

export const router = Router();
router.get('/', CategoriesController.listPublic);
