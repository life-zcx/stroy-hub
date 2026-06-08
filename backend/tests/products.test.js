import { jest } from '@jest/globals';

// Мокируем fs, чтобы настройки ценообразования всегда сбрасывались к дефолтным в тестах
jest.unstable_mockModule('fs', () => ({
  default: {
    existsSync: jest.fn().mockReturnValue(false),
    readFileSync: jest.fn(),
  }
}));

// Мокируем Prisma Client и Redis Client
jest.unstable_mockModule('../src/config/db.js', () => ({
  default: {
    product: {
      count: jest.fn().mockResolvedValue(1),
      findMany: jest.fn().mockResolvedValue([
        {
          id: 1,
          name: 'Тестовый цемент',
          category: 'mixes',
          price: 2000,
          oldPrice: null,
          image: '',
          rating: 4.5,
          reviews: 1,
          isHit: false,
          bulkDiscount: null,
          supplierId: 1,
        }
      ]),
    },
    category: {
      findUnique: jest.fn().mockResolvedValue({
        id: 999,
        name: 'Смеси',
        slug: 'mixes',
        children: []
      }),
      findMany: jest.fn().mockResolvedValue([
        {
          id: 999,
          name: 'Смеси',
          slug: 'mixes',
          parentId: null
        }
      ])
    }
  }
}));

jest.unstable_mockModule('../src/config/redis.js', () => ({
  default: {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    keys: jest.fn().mockResolvedValue([]),
    del: jest.fn().mockResolvedValue(0),
  }
}));

// Импортируем тестируемый контроллер
const { getAllProducts } = await import('../src/controllers/productController.js');

describe('Product API Controllers', () => {
  it('should fetch and map products with default markup', async () => {
    const req = {
      query: {
        category: 'mixes',
        page: '1',
        limit: '10'
      }
    };
    
    const res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };

    await getAllProducts(req, res);

    expect(res.json).toHaveBeenCalled();
    const payload = res.json.mock.calls[0][0];
    expect(payload.total).toBe(1);
    // Дефолтная наценка (прибыль) для mixes 15%. По новой методологии:
    // Себестоимость = 2000
    // Логистика (5%) = +100
    // Эквайринг (2%) = +40
    // Кешбек (3%) = +60
    // Промо (30% x 10%) = +60
    // Точка безубыточности = 2260
    // Желаемая прибыль (15%) = +339
    // Итоговая розница = 2260 + 339 = 2599
    expect(payload.data[0].price).toBe(2599);
  });
});
