import { Router } from 'express';
import { validate } from '../../middlewares/validate.js';
import { authRequired } from '../../middlewares/auth.js';
import { AuthController } from './auth.controller.js';
import { LoginSchema, RegisterSchema } from './auth.schemas.js';

export const router = Router();

router.post('/register', validate(RegisterSchema), AuthController.register);
router.post('/login', validate(LoginSchema), AuthController.login);
router.get('/me', authRequired, AuthController.me);
