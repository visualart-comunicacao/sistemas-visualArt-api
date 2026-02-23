import { CustomersService } from './customers.service.js';

export const CustomersController = {
  async register(req, res, next) {
    console.log('entrei no controller');
    try {
      const result = await CustomersService.register(req.validated.body);
      res.status(201).json(result);
    } catch (e) {
      next(e);
    }
  },

  async me(req, res, next) {
    try {
      const userId = req.auth.sub;
      const data = await CustomersService.me(userId);
      res.json(data);
    } catch (e) {
      next(e);
    }
  },

  async updateMe(req, res, next) {
    try {
      const userId = req.auth.sub;
      const data = await CustomersService.updateMe(userId, req.validated.body);
      res.json(data);
    } catch (e) {
      next(e);
    }
  },

  async addAddress(req, res, next) {
    try {
      const userId = req.auth.sub;
      const created = await CustomersService.addAddress(userId, req.validated.body);
      res.status(201).json(created);
    } catch (e) {
      next(e);
    }
  },

  async updateAddress(req, res, next) {
    try {
      const userId = req.auth.sub;
      const { id } = req.validated.params;
      const updated = await CustomersService.updateAddress(userId, id, req.validated.body);
      res.json(updated);
    } catch (e) {
      next(e);
    }
  },

  async deleteAddress(req, res, next) {
    try {
      const userId = req.auth.sub;
      const { id } = req.validated.params;
      await CustomersService.deleteAddress(userId, id);
      res.status(204).send();
    } catch (e) {
      next(e);
    }
  },

  async setDefaultAddress(req, res, next) {
    try {
      const userId = req.auth.sub;
      const { id } = req.validated.params;
      const { type } = req.validated.body;
      const updated = await CustomersService.setDefaultAddress(userId, id, type);
      res.json(updated);
    } catch (e) {
      next(e);
    }
  },
};
