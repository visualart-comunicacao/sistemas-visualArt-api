import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { CustomersRepository } from './customers.repository.js';

function conflict(message) {
  const err = new Error(message);
  err.status = 409;
  err.name = 'ConflictError';
  return err;
}

function notFound(message) {
  const err = new Error(message);
  err.status = 404;
  err.name = 'NotFound';
  return err;
}

export const CustomersService = {
  async register(payload) {
    // email unique
    const emailExists = await CustomersRepository.getUserByEmail(payload.email);
    if (emailExists) throw conflict('Email já cadastrado');

    // cpf/cnpj unique (no profile)
    if (payload.profile.cpf) {
      const cpfExists = await CustomersRepository.getProfileByCpf(payload.profile.cpf);
      if (cpfExists) throw conflict('CPF já cadastrado');
    }
    if (payload.profile.cnpj) {
      const cnpjExists = await CustomersRepository.getProfileByCnpj(payload.profile.cnpj);
      if (cnpjExists) throw conflict('CNPJ já cadastrado');
    }

    const passwordHash = await bcrypt.hash(payload.password, 10);

    // Nome do User vem do perfil (PF) ou empresa (PJ)
    const name =
      payload.profile.type === 'PERSON'
        ? payload.profile.fullName
        : payload.profile.tradeName || payload.profile.companyName;

    const userData = {
      name,
      email: payload.email,
      password: passwordHash,
      role: 'CUSTOMER',
      phone: null,
      document: null, // não usar (docs ficam no profile)
    };

    const profileData = {
      ...payload.profile,
      // converte birthDate/termsAcceptedAt pra DateTime se vierem
      birthDate: payload.profile.birthDate ? new Date(payload.profile.birthDate) : undefined,
      termsAcceptedAt: payload.profile.termsAcceptedAt ? new Date(payload.profile.termsAcceptedAt) : undefined,
    };

    const shipping = {
      ...payload.shippingAddress,
      type: 'SHIPPING',
      isDefault: true,
      recipient: payload.shippingAddress.recipient || name,
    };

    const addresses = [shipping];

    const billing = payload.billingAddress;
    if (billing?.sameAsShipping === true || !billing) {
      addresses.push({ ...shipping, type: 'BILLING', isDefault: true });
    } else if (billing?.sameAsShipping === false) {
      addresses.push({
        ...billing,
        type: 'BILLING',
        isDefault: true,
        recipient: billing.recipient || name,
      });
    }

    const { createdUser } = await CustomersRepository.createFullCustomer({
      user: userData,
      profile: profileData,
      addresses,
    });

    const token = jwt.sign({ sub: createdUser.id, role: createdUser.role }, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN,
    });

    return {
      token,
      user: { id: createdUser.id, name: createdUser.name, email: createdUser.email, role: createdUser.role },
    };
  },

  async me(userId) {
    const me = await CustomersRepository.getMe(userId);
    if (!me) throw notFound('Usuário não encontrado');
    return me;
  },

  async updateMe(userId, payload) {
    // converte datas se vierem
    const data = { ...payload };
    if (data.birthDate) data.birthDate = new Date(data.birthDate);
    if (data.termsAcceptedAt) data.termsAcceptedAt = new Date(data.termsAcceptedAt);

    return CustomersRepository.updateProfile(userId, data);
  },

  async addAddress(userId, payload) {
    return CustomersRepository.createAddress(userId, payload);
  },

  async updateAddress(userId, id, payload) {
    return CustomersRepository.updateAddress(userId, id, payload);
  },

  async deleteAddress(userId, id) {
    const deleted = await CustomersRepository.deleteAddress(userId, id);
    if (!deleted) throw notFound('Endereço não encontrado');
    return deleted;
  },

  async setDefaultAddress(userId, addressId, type) {
    const updated = await CustomersRepository.setDefaultAddress(userId, addressId, type);
    if (!updated) throw notFound('Endereço não encontrado');
    return updated;
  },
};
