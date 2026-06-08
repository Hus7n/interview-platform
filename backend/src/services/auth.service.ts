import { userRepository } from '../repositories/user.repository';
import { hashPassword, comparePassword } from '../utils/password';
import { signToken } from '../utils/token';
import { AppError } from '../utils/errors';

export const authService = {
  async register(email: string, password: string, displayName: string, role = 'candidate') {
    const existing = await userRepository.findByEmail(email);
    if (existing) throw new AppError(409, 'Email already registered');

    const passwordHash = await hashPassword(password);
    const user = await userRepository.create(email, passwordHash, role, displayName);
    const token = signToken({ userId: user.id, email: user.email, role: user.role });
    return { user: { id: user.id, email: user.email, role: user.role, displayName }, token };
  },

  async login(email: string, password: string) {
    const user = await userRepository.findByEmail(email);
    if (!user) throw new AppError(401, 'Invalid credentials');

    const valid = await comparePassword(password, user.password_hash);
    if (!valid) throw new AppError(401, 'Invalid credentials');

    const token = signToken({ userId: user.id, email: user.email, role: user.role });
    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        displayName: user.display_name,
      },
      token,
    };
  },

  async me(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) throw new AppError(404, 'User not found');
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      displayName: user.display_name,
    };
  },
};
