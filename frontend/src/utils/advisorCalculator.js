export const calculateMaterials = ({
  selectedProjectId,
  dimensions,
  includeTools,
  extraStrength,
  advisorBudget,
  products = []
}) => {
  const getProductForCategory = (categorySlug) => {
    let filtered = products.filter(p => p.category === categorySlug);
    if (filtered.length === 0) return null;

    if (advisorBudget === 'budget') {
      filtered.sort((a, b) => a.price - b.price);
    } else if (advisorBudget === 'premium') {
      filtered.sort((a, b) => b.price - a.price);
    } else {
      filtered.sort((a, b) => b.rating - a.rating);
    }
    return filtered[0];
  };

  let items = [];

  if (selectedProjectId === 'renovation') {
    const floor = dimensions.floorArea || 50;
    const height = dimensions.ceilingHeight || 3.0;
    const wallAreaApprox = Math.round(4 * Math.sqrt(floor) * height);
    
    const mixProduct = getProductForCategory('mixes');
    if (mixProduct) {
      const quantity = Math.max(1, Math.round(wallAreaApprox / 4));
      items.push({ product: mixProduct, quantity, calcReason: `Выравнивание стен: ~10кг/м² на ${wallAreaApprox} м² площади стен` });
    }

    const paintProduct = getProductForCategory('paints');
    if (paintProduct) {
      const quantity = Math.max(1, Math.round(wallAreaApprox / 30));
      items.push({ product: paintProduct, quantity, calcReason: `Окрашивание поверхностей в 2 слоя на ${wallAreaApprox} м²` });
    }

    const hardwareProduct = getProductForCategory('hardware');
    if (hardwareProduct) {
      const quantity = Math.max(1, Math.round(wallAreaApprox / 40));
      items.push({ product: hardwareProduct, quantity, calcReason: `Крепеж каркасов и монтажных систем` });
    }

    if (includeTools) {
      const toolProduct = getProductForCategory('tools');
      if (toolProduct) {
        items.push({ product: toolProduct, quantity: 1, calcReason: `Инструмент для монтажа и отделки` });
      }
    }
  } 
  
  else if (selectedProjectId === 'insulation') {
    const area = dimensions.insulationArea || 100;
    const thick = dimensions.insulationThickness || 50;

    let insulationProduct = products.find(p => 
      /пеноплекс|утеплитель|xps|минвата|плита|плиты|изоляц/i.test(p.name)
    );

    if (!insulationProduct) {
      const isPremium = advisorBudget === 'premium';
      const isBudget = advisorBudget === 'budget';
      insulationProduct = {
        id: 'temp_insulation_' + advisorBudget,
        name: isPremium 
          ? `Экструдированный пенополистирол Пеноплекс Фундамент ${thick} мм` 
          : isBudget 
            ? `Минеральная вата ТеплоКнауф Для Коттеджа ${thick} мм`
            : `Экструдированный пенополистирол Пеноплекс Комфорт ${thick} мм`,
        category: 'lumber', 
        price: isPremium ? 15500 : isBudget ? 7200 : 9800,
        image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400&auto=format&fit=crop&q=80',
        rating: 4.8,
        supplier: { name: 'Пеноплекс-Казахстан (Офиц. склад)', delivery: 'Завтра' }
      };
    }

    const insulationQty = Math.max(1, Math.ceil(area / 5));
    items.push({ 
      product: insulationProduct, 
      quantity: insulationQty, 
      calcReason: `Теплоизоляция: Утепление поверхности ${area} м² (толщина ${thick} мм, ~5 м² на упак.)` 
    });

    const adhesiveMix = products.find(p => p.category === 'mixes' && /клей|цемент/i.test(p.name)) || getProductForCategory('mixes');
    if (adhesiveMix) {
      const qty = Math.max(1, Math.round(area / 6));
      items.push({ 
        product: adhesiveMix, 
        quantity: qty, 
        calcReason: `Клеевой состав: Монтаж плит утеплителя (~5кг/м²)` 
      });
    }

    let dowelProduct = products.find(p => p.category === 'hardware' && /дюбель|гриб|анкер/i.test(p.name));
    if (!dowelProduct) {
      dowelProduct = {
        id: 'temp_dowel',
        name: 'Дюбель для теплоизоляции тарельчатый (дюбель-гриб) 10х100 мм, 100 шт',
        category: 'hardware',
        price: 2400,
        image: 'https://images.unsplash.com/photo-1590236166418-498c199859f8?w=400&auto=format&fit=crop&q=80',
        rating: 4.7,
        supplier: { name: 'Крепеж-Мастер', delivery: 'Завтра' }
      };
    }

    const dowelQty = Math.max(1, Math.ceil((area * 6) / 100));
    items.push({ 
      product: dowelProduct, 
      quantity: dowelQty, 
      calcReason: `Крепеж утеплителя: Тарельчатые дюбели (расход 6 шт/м²)` 
    });

    if (includeTools) {
      const powerTool = products.find(p => p.category === 'tools' && /перфоратор|шуруповерт/i.test(p.name)) || getProductForCategory('tools');
      if (powerTool) {
        items.push({ 
          product: powerTool, 
          quantity: 1, 
          calcReason: `Инструмент для монтажа крепежных элементов` 
        });
      }
    }
  }
  
  else if (selectedProjectId === 'foundation') {
    const len = dimensions.length || 60;
    const w = dimensions.width || 0.4;
    const d = dimensions.depth || 1.0;
    const volume = len * w * d;
    
    const cementProduct = products.find(p => p.category === 'mixes' && p.name.includes('Цемент')) || getProductForCategory('mixes');
    if (cementProduct) {
      const quantity = Math.max(5, Math.round(volume * 7));
      items.push({ product: cementProduct, quantity, calcReason: `Приготовление раствора: ${volume.toFixed(1)} м³ заливки (7 мешков/м³)` });
    }

    const lumberProduct = products.find(p => p.category === 'lumber' && p.name.includes('Доска')) || getProductForCategory('lumber');
    if (lumberProduct) {
      const quantity = Math.max(2, Math.round(len * 2));
      items.push({ product: lumberProduct, quantity, calcReason: `Опалубка фундамента (щиты с двух сторон)` });
    }

    const anchorProduct = products.find(p => p.category === 'hardware' && p.name.includes('Анкер')) || getProductForCategory('hardware');
    if (anchorProduct) {
      const quantity = Math.max(1, Math.round(len / 15));
      items.push({ product: anchorProduct, quantity, calcReason: `Силовые фиксаторы опалубки и связки каркаса` });
    }

    if (includeTools) {
      const powerTool = products.find(p => p.category === 'tools' && p.name.includes('Перфоратор')) || getProductForCategory('tools');
      if (powerTool) {
        items.push({ product: powerTool, quantity: 1, calcReason: `Строительное оборудование для замеса и сборки опалубки` });
      }
    }
  } 
  
  else if (selectedProjectId === 'wall') {
    const area = dimensions.wallArea || 150;

    const mixProduct = getProductForCategory('mixes');
    if (mixProduct) {
      const quantity = Math.max(2, Math.round(area / 3.5));
      items.push({ product: mixProduct, quantity, calcReason: `Оштукатуривание и шпаклевка: ~8.5кг/м² на ${area} м²` });
    }

    const hardwareProduct = getProductForCategory('hardware');
    if (hardwareProduct) {
      const quantity = Math.max(1, Math.round(area / 25));
      items.push({ product: hardwareProduct, quantity, calcReason: `Соединительные стеновые подвесы и анкеры` });
    }

    const paintProduct = getProductForCategory('paints');
    if (paintProduct) {
      const quantity = Math.max(1, Math.round(area / 30));
      items.push({ product: paintProduct, quantity, calcReason: `Защитно-отделочное грунтование и покраска` });
    }

    if (includeTools) {
      const screwdriver = products.find(p => p.category === 'tools' && p.name.includes('Шуруповерт')) || getProductForCategory('tools');
      if (screwdriver) {
        items.push({ product: screwdriver, quantity: 1, calcReason: `Сборка металлокаркаса и маяков` });
      }
    }
  } 
  
  else if (selectedProjectId === 'bathroom') {
    const floor = dimensions.floorArea || 20;
    const height = dimensions.ceilingHeight || 3.0;
    const wallAreaApprox = Math.round((Math.sqrt(floor) * 4) * height);

    const adhesive = products.find(p => p.category === 'mixes' && p.name.includes('Knauf')) || getProductForCategory('mixes');
    if (adhesive) {
      const quantity = Math.max(2, Math.round(wallAreaApprox / 6) + Math.round(floor / 6));
      items.push({ product: adhesive, quantity, calcReason: `Кладка покрытий на стены (${wallAreaApprox} м²) и пол (${floor} м²)` });
    }

    const paint = products.find(p => p.category === 'paints' && p.name.includes('Tikkurila')) || getProductForCategory('paints');
    if (paint) {
      const quantity = Math.max(1, Math.round(wallAreaApprox / 25));
      items.push({ product: paint, quantity, calcReason: `Влагостойкая защита потолков и перекрытий` });
    }

    const hardwareProduct = getProductForCategory('hardware');
    if (hardwareProduct) {
      items.push({ product: hardwareProduct, quantity: 1, calcReason: `Герметичные крепежные анкеры и метизы` });
    }

    if (includeTools) {
      const handTool = getProductForCategory('tools');
      if (handTool) {
        items.push({ product: handTool, quantity: 1, calcReason: `Набор инструментов для финишной облицовки` });
      }
    }
  } 
  
  else if (selectedProjectId === 'decking') {
    const area = dimensions.deckArea || 40;

    const boardsProduct = products.find(p => p.category === 'lumber' && p.name.includes('Доска')) || getProductForCategory('lumber');
    if (boardsProduct) {
      const quantity = Math.max(5, Math.round((area / 0.9) * 1.15));
      items.push({ product: boardsProduct, quantity, calcReason: `Лицевой настил: Доски с технологическим запасом 15%` });
    }

    const beamsProduct = products.find(p => p.category === 'lumber' && p.name.includes('Брус')) || getProductForCategory('lumber');
    if (beamsProduct) {
      const quantity = Math.max(3, Math.round((area * 1.2) / 3));
      items.push({ product: beamsProduct, quantity, calcReason: `Несущие прогоны и лаги под настил` });
    }

    const screwsProduct = products.find(p => p.category === 'hardware' && p.name.includes('Саморезы')) || getProductForCategory('hardware');
    if (screwsProduct) {
      const quantity = Math.max(1, Math.round(area / 14));
      items.push({ product: screwsProduct, quantity, calcReason: `Метизы по дереву для фиксации лаг и досок` });
    }

    const anchorProduct = products.find(p => p.category === 'hardware' && p.name.includes('Анкер')) || getProductForCategory('hardware');
    if (anchorProduct && extraStrength) {
      items.push({ product: anchorProduct, quantity: 1, calcReason: `Крепление каркаса рамы к бетонному или грунтовому основанию` });
    }

    if (includeTools) {
      const screwdriver = products.find(p => p.category === 'tools' && p.name.includes('Шуруповерт')) || getProductForCategory('tools');
      if (screwdriver) {
        items.push({ product: screwdriver, quantity: 1, calcReason: `Строительный инструмент для фиксации настилов` });
      }
    }
  }

  return items;
};
