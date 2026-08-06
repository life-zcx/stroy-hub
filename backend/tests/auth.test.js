import { jest } from '@jest/globals';

// Мокируем Prisma Client и bcryptjs
jest.unstable_mockModule('../src/config/db.js', () => ({
  default: {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    passwordResetToken: {
      findFirst: jest.fn(),
      deleteMany: jest.fn(),
      create: jest.fn(),
    }
  }
}));

jest.unstable_mockModule('../src/config/redis.js', () => ({
  default: {
    get: jest.fn().mockImplementation((key) => {
      if (key?.startsWith('fail-attempts')) return Promise.resolve(null);
      return Promise.resolve('123456');
    }),
    set: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
  }
}));

const prismaMock = (await import('../src/config/db.js')).default;
const { register, login, getProfile } = await import('../src/controllers/authController.js');

describe('Auth Controllers Test Suite', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should prevent registration if user already exists', async () => {
    prismaMock.passwordResetToken.findFirst.mockResolvedValue({ id: 1, email: 'existing@tormag.kz', code: '123456', expiresAt: new Date(Date.now() + 60000) });
    prismaMock.user.findUnique.mockResolvedValue({ id: 1, email: 'existing@tormag.kz' });

    const req = {
      body: {
        email: 'existing@tormag.kz',
        password: 'password123',
        name: 'Test User',
        phone: '+7 (707) 123-45-67',
        code: '123456'
      }
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await register(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Пользователь с таким email уже зарегистрирован'
    });
  });

  it('should get profile for authenticated user', async () => {
    const mockUserData = {
      id: 10,
      email: 'user@tormag.kz',
      name: 'Иван Иванов',
      phone: '+77071234567',
      role: 'CUSTOMER',
      isBlocked: false,
    };

    prismaMock.user.findUnique.mockResolvedValue(mockUserData);

    const req = {
      user: { id: 10 }
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await getProfile(req, res);

    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
      where: { id: 10 },
      include: { supplier: true }
    });
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining(mockUserData));
  });
});
