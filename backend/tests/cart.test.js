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
    cartItem: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
    },
    category: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    product: {
      findUnique: jest.fn(),
    }
  }
}));

const prismaMock = (await import('../src/config/db.js')).default;
const { getCart, addToCart, clearCart } = await import('../src/controllers/cartController.js');

describe('Cart Controllers Test Suite', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return 400 when adding invalid product ID', async () => {
    const req = {
      user: { id: 1 },
      body: { productId: 'invalid', quantity: 2 }
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await addToCart(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Некорректный ID товара.' });
  });

  it('should clear cart for authenticated user', async () => {
    prismaMock.cartItem.deleteMany.mockResolvedValue({ count: 3 });

    const req = { user: { id: 5 } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await clearCart(req, res);

    expect(prismaMock.cartItem.deleteMany).toHaveBeenCalledWith({ where: { userId: 5 } });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true });
  });
});
