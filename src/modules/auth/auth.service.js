import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { AuthRepository } from './auth.repository.js';

function conflict(message) {
  const err = new Error(message);
  err.status = 409;
  err.name = 'ConflictError';
  return err;
}

function unauthorized(message = 'Invalid credentials') {
  const err = new Error(message);
  err.status = 401;
  err.name = 'Unauthorized';
  return err;
}

export const AuthService = {
  async register(payload) {
    const exists = await AuthRepository.getUserByEmail(payload.email);
    if (exists) throw conflict('Email already in use');

    const passwordHash = await bcrypt.hash(payload.password, 10);

    const user = await AuthRepository.createUser({
      name: payload.name,
      email: payload.email,
      password: passwordHash,
      phone: payload.phone,
      document: payload.document,
      role: 'CUSTOMER',
    });

    const token = jwt.sign({ sub: user.id, role: user.role }, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN,
    });

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  },

  async login({ email, password }) {
    const user = await AuthRepository.getUserByEmail(email);
    if (!user) throw unauthorized();

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) throw unauthorized();

    const token = jwt.sign({ sub: user.id, role: user.role }, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN,
    });

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  },

  async me(userId) {
    const user = await AuthRepository.getUserById(userId);
    if (!user) throw unauthorized('User not found');
    return user;
  },
};
