import {
  CreateUserSchema,
  ListUsersQuerySchema,
  UpdateUserSchema,
  UpdateUserStatusSchema,
} from './users.schemas.js';

import { UsersService } from './users.service.js';

export const UsersController = {
  async list(req, res, next) {
    try {
      const parsed = ListUsersQuerySchema.parse(req.query);

      const skip = Number(parsed.skip ?? 0);
      const take = Number(parsed.take ?? 20);

      const result = await UsersService.list({
        ...parsed,
        skip,
        take,
      });

      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async getById(req, res, next) {
    try {
      const result = await UsersService.getById(req.params.id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async create(req, res, next) {
    try {
      const parsed = CreateUserSchema.parse(req.body);

      const result = await UsersService.create(parsed);

      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  },

  async update(req, res, next) {
    try {
      const parsed = UpdateUserSchema.parse(req.body);

      const result = await UsersService.update(req.params.id, parsed);

      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async setStatus(req, res, next) {
    try {
      const parsed = UpdateUserStatusSchema.parse(req.body);

      const result = await UsersService.setActive(
        req.params.id,
        parsed.isActive
      );

      res.json(result);
    } catch (err) {
      next(err);
    }
  },
};