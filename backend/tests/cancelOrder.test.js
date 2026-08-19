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

const mockFindUniqueOrder = jest.fn();
const mockUpdateOrder = jest.fn();

jest.unstable_mockModule('../src/config/db.js', () => ({
  default: {
    order: {
      findUnique: mockFindUniqueOrder,
      update: mockUpdateOrder,
    },
    $transaction: jest.fn(async (cb) => {
      if (typeof cb === 'function') {
        const txMock = {
          order: {
            update: mockUpdateOrder,
          },
          orderItem: {
            deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
            createMany: jest.fn().mockResolvedValue({ count: 1 }),
          },
          promotion: {
            findUnique: jest.fn().mockResolvedValue(null),
          },
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

jest.unstable_mockModule('../src/services/orderBonusService.js', () => ({
  calculateOrderBonusDiscount: jest.fn().mockResolvedValue({ bonusDiscount: 0, updatedTotalAmount: 1000, loyalty: {} }),
  recordOrderBonusTransactions: jest.fn().mockResolvedValue(true),
  recalculateOrderBonusTransactions: jest.fn().mockResolvedValue(true),
  handleOrderStatusBonusUpdates: jest.fn().mockResolvedValue(true),
}));

const { cancelOrder } = await import('../src/controllers/orderController.js');

describe('Order Cancellation Endpoint Test Suite', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 when user is not authenticated', async () => {
    const req = { params: { id: '10' }, body: {}, user: null };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await cancelOrder(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('should return 400 when order ID is invalid', async () => {
    const req = { params: { id: 'invalid' }, body: {}, user: { id: 1 } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await cancelOrder(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should return 404 when order is not found', async () => {
    mockFindUniqueOrder.mockResolvedValueOnce(null);

    const req = { params: { id: '99' }, body: {}, user: { id: 1 } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await cancelOrder(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('should return 403 when user is not the order owner', async () => {
    mockFindUniqueOrder.mockResolvedValueOnce({ id: 10, userId: 2, status: 'pending', items: [] });

    const req = { params: { id: '10' }, body: {}, user: { id: 1, role: 'CUSTOMER' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await cancelOrder(req, res);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('should return 400 when order is already in status shipped', async () => {
    mockFindUniqueOrder.mockResolvedValueOnce({ id: 10, userId: 1, status: 'shipped', items: [] });

    const req = { params: { id: '10' }, body: {}, user: { id: 1, role: 'CUSTOMER' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await cancelOrder(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.stringContaining('уже передан в доставку') })
    );
  });

  it('should successfully cancel order in status pending', async () => {
    const orderData = { id: 10, userId: 1, status: 'pending', items: [], statusHistory: [] };
    mockFindUniqueOrder.mockResolvedValueOnce(orderData);
    mockUpdateOrder.mockResolvedValueOnce({ ...orderData, status: 'cancelled', cancellationReason: 'Передумал' });

    const req = { params: { id: '10' }, body: { cancellationReason: 'Передумал' }, user: { id: 1, role: 'CUSTOMER' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await cancelOrder(req, res);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'cancelled', cancellationReason: 'Передумал' })
    );
  });
});
