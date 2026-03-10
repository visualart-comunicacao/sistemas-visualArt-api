import { Router } from 'express';
import { validate } from '../../middlewares/validate.js';
import { UsersController } from './users.controller.js';
import {
  ListUsersQuerySchema,
  GetUserByIdSchema,
  CreateUserSchema,
  UpdateUserSchema,
  UpdateUserStatusSchema,
} from './users.schemas.js';

export const router = Router();

router.get('/users', validate(ListUsersQuerySchema), UsersController.list);
router.get('/users/:id', validate(GetUserByIdSchema), UsersController.getById);
router.post('/users', validate(CreateUserSchema), UsersController.create);
router.put('/users/:id', validate(UpdateUserSchema), UsersController.update);
router.patch('/users/:id/status', validate(UpdateUserStatusSchema), UsersController.setStatus);