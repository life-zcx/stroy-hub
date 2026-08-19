import { jest } from '@jest/globals';

jest.unstable_mockModule('../src/config/db.js', () => ({
  default: {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    order: {
      findUnique: jest.fn(),
      count: jest.fn(),
    },
    bonusTransaction: {
      aggregate: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  },
}));

const prismaMock = (await import('../src/config/db.js')).default;
const {
  generateUniqueReferralCode,
  ensureUserReferralCode,
  getReferralSummary,
  processReferralRewardForFirstOrder,
} = await import('../src/services/referralService.js');

describe('Referral System Unit Tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should generate a valid referral code string starting with REF-', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    const code = await generateUniqueReferralCode();
    expect(code).toBeDefined();
    expect(code).toMatch(/^REF-[A-Z0-9]+$/);
  });

  it('should ensure and assign referralCode for user if missing', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({ id: 10, referralCode: null });
    prismaMock.user.findUnique.mockResolvedValueOnce(null);
    prismaMock.user.update.mockResolvedValue({ id: 10, referralCode: 'REF-ABC123' });

    const code = await ensureUserReferralCode(10);
    expect(code).toBe('REF-ABC123');
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: 10 },
      data: { referralCode: expect.stringMatching(/^REF-[A-Z0-9]+$/) },
      select: { referralCode: true },
    });
  });

  it('should calculate referral summary statistics', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: 10, referralCode: 'REF-1001' });
    prismaMock.user.findMany.mockResolvedValue([
      { id: 11, name: 'Друг 1', orders: [{ id: 100 }] },
      { id: 12, name: 'Друг 2', orders: [] },
    ]);
    prismaMock.bonusTransaction.aggregate.mockResolvedValue({ _sum: { amount: 1000 } });

    const summary = await getReferralSummary(10, 'https://tormag.kz');
    expect(summary).toBeDefined();
    expect(summary.shareUrl).toBe('https://tormag.kz/?ref=REF-1001');
    expect(summary.stats.invitedCount).toBe(2);
    expect(summary.stats.activeReferralsCount).toBe(1);
    expect(summary.stats.totalBonusesEarned).toBe(1000);
    expect(summary.stats.minOrderAmount).toBe(15000);
  });

  it('should ignore order below 15,000 KZT minimum threshold', async () => {
    prismaMock.order.findUnique.mockResolvedValue({
      id: 101,
      totalAmount: 12000,
      userId: 20,
      user: { id: 20, referredById: 10 },
    });
    prismaMock.order.count.mockResolvedValue(1);

    const result = await processReferralRewardForFirstOrder(101);
    expect(result).toBeNull();
  });

  it('should reward 1,000 KZT bonuses for order >= 15,000 KZT', async () => {
    prismaMock.order.findUnique.mockResolvedValue({
      id: 102,
      totalAmount: 18500,
      userId: 20,
      user: { id: 20, referredById: 10 },
    });
    prismaMock.order.count.mockResolvedValue(1);
    prismaMock.bonusTransaction.findFirst.mockResolvedValue(null);
    prismaMock.bonusTransaction.create.mockResolvedValue({ id: 1, amount: 1000 });

    const result = await processReferralRewardForFirstOrder(102);
    expect(result).toBeDefined();
    expect(result.amount).toBe(1000);
  });
});
