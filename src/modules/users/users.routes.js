import { Router } from 'express';
import { validate, validateBody } from '../../middlewares/validate.js';
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
router.post('/users', validateBody(CreateUserSchema), UsersController.create);
router.put('/users/:id', validateBody(UpdateUserSchema), UsersController.update);
router.patch('/users/:id/status', validateBody(UpdateUserStatusSchema), UsersController.setStatus);