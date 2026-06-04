import { calculateMaterials } from '../../frontend/src/utils/advisorCalculator.js';

describe('Advisor Material Calculator', () => {
  const mockProducts = [
    { id: 1, name: 'Клей для плитки Knauf', category: 'mixes', price: 3500, rating: 4.8 },
    { id: 2, name: 'Краска Tikkurila', category: 'paints', price: 12000, rating: 4.9 },
    { id: 3, name: 'Саморезы по дереву', category: 'hardware', price: 1500, rating: 4.6 },
    { id: 4, name: 'Шпатель фасадный', category: 'tools', price: 2000, rating: 4.5 },
  ];

  it('should calculate materials correctly for renovation project', () => {
    const results = calculateMaterials({
      selectedProjectId: 'renovation',
      dimensions: { floorArea: 100, ceilingHeight: 3.0 },
      includeTools: true,
      extraStrength: false,
      advisorBudget: 'standard',
      products: mockProducts
    });

    // Wall area approx for floor 100 & height 3 = 4 * sqrt(100) * 3 = 120 м2
    // Mixes qty = Math.max(1, Math.round(120 / 4)) = 30
    // Paints qty = Math.max(1, Math.round(120 / 30)) = 4
    // Hardware qty = Math.max(1, Math.round(120 / 40)) = 3
    // Tools qty = 1

    expect(results).toHaveLength(4);
    
    const mixItem = results.find(r => r.product.category === 'mixes');
    expect(mixItem.quantity).toBe(30);

    const paintItem = results.find(r => r.product.category === 'paints');
    expect(paintItem.quantity).toBe(4);

    const toolItem = results.find(r => r.product.category === 'tools');
    expect(toolItem.quantity).toBe(1);
  });
});
