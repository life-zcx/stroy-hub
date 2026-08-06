import { jest } from '@jest/globals';

jest.unstable_mockModule('fs', () => ({
  default: {
    existsSync: jest.fn().mockReturnValue(false),
    readFileSync: jest.fn(),
    mkdirSync: jest.fn(),
    writeFileSync: jest.fn(),
    unlinkSync: jest.fn(),
    promises: {
      writeFile: jest.fn().mockResolvedValue(),
      mkdir: jest.fn().mockResolvedValue(),
    }
  }
}));

jest.unstable_mockModule('../src/config/db.js', () => ({
  default: {
    order: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn().mockResolvedValue(0),
    },
    product: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    category: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    promotion: {
      findUnique: jest.fn().mockResolvedValue(null),
    },
    $transaction: jest.fn(async (cb) => {
      if (typeof cb === 'function') {
        const txMock = {
          product: { findMany: jest.fn().mockResolvedValue([]) },
          category: { findMany: jest.fn().mockResolvedValue([]) },
          promotion: { findUnique: jest.fn().mockResolvedValue(null) },
          order: {
            create: jest.fn().mockResolvedValue({ id: 101, totalAmount: 5000, items: [] }),
            count: jest.fn().mockResolvedValue(0),
          },
          bonusTransaction: { findFirst: jest.fn().mockResolvedValue(null) },
        };
        return cb(txMock);
      }
      return [];
    }),
  }
}));

jest.unstable_mockModule('../src/utils/telegram.js', () => ({
  sendTelegramNotification: jest.fn(),
}));

jest.unstable_mockModule('../src/utils/pushNotifier.js', () => ({
  broadcastNotification: jest.fn().mockResolvedValue(true),
}));

const { createOrder } = await import('../src/controllers/orderController.js');

describe('Order Controllers Test Suite', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return 400 when creating order without required fields', async () => {
    const req = {
      body: {
        clientName: '',
        clientPhone: '',
      }
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await createOrder(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Все поля заказа и товары обязательны' });
  });

  it('should return 401 when user is not authenticated', async () => {
    const req = {
      body: {
        clientName: 'Иван',
        clientPhone: '+77070000000',
        clientAddress: 'Алматы, Абая 10',
        paymentMethod: 'kaspi',
        items: [{ productId: 1, quantity: 1 }]
      }
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await createOrder(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Для оформления заказа необходимо войти в систему' });
  });
});
