// Business logic lives here. This file is the module's "public API" —
// anything another module needs from Auth gets called from here,
// never from auth.model.js directly.

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import config from '../../config/index.js';
import * as authModel from './auth.model.js';

const SALT_ROUNDS = 10;

export async function register({ name, email, password, role }) {
  // TODO: check email isn't already taken (authModel.findUserByEmail)
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await authModel.createUser({ name, email, passwordHash, role });
  const token = signToken(user);
  return { user, token };
}

export async function login({ email, password }) {
  const user = await authModel.findUserByEmail(email);
  // TODO: if !user, throw a generic "invalid credentials" error —
  // never reveal whether it was the email or password that was wrong (AUTH-1)
  const isValid = user && (await bcrypt.compare(password, user.passwordHash));
  // TODO: if !isValid, throw the same generic error as above
  const token = signToken(user);
  return { user, token };
}

export async function changeUserRole(id, newRole) {
  return authModel.updateUserRole(id, newRole);
}

function signToken(user) {
  return jwt.sign(
    { sub: user.id, role: user.role },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
}