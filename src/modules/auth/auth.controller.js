import { AuthService } from './auth.service.js';

export const AuthController = {
  async register(req, res, next) {
    try {
      const result = await AuthService.register(req.validated.body);
      res.status(201).json(result);
    } catch (e) {
      next(e);
    }
  },

  async login(req, res, next) {
    try {
      const result = await AuthService.login(req.validated.body);
      res.json(result);
    } catch (e) {
      next(e);
    }
  },

  async me(req, res, next) {
    try {
      const userId = req.auth.sub;
      const user = await AuthService.me(userId);
      res.json(user);
    } catch (e) {
      next(e);
    }
  },
};
