import prisma from '../config/db.js';
import redisClient from '../config/redis.js';
import logger from '../utils/logger.js';

const CACHE_KEY_PUBLIC = 'brands:public';
const CACHE_KEY_ALL = 'brands:all';

const clearBrandsCache = async () => {
  try {
    await redisClient.del([CACHE_KEY_PUBLIC, CACHE_KEY_ALL]);
    logger.info('Cleared brands cache');
  } catch (err) {
    logger.error('Error clearing brands cache:', err);
  }
};

function buildLogoPath(req, existingLogo = null) {
  if (req.file) {
    return `/uploads/${req.file.filename}`;
  }

  if (req.body.logo !== undefined) {
    return req.body.logo || null;
  }

  return existingLogo;
}

function normalizeBrandData(body) {
  const name = String(body.name || '').trim();
  const description = String(body.description || '').trim();
  const isActive = body.isActive === true || body.isActive === 'true';
  const sortOrder = body.sortOrder !== undefined && body.sortOrder !== ''
    ? Number.parseInt(body.sortOrder, 10)
    : 0;

  return {
    name,
    description,
    isActive,
    sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
  };
}

export const getPublicBrands = async (req, res) => {
  try {
    const cached = await redisClient.get(CACHE_KEY_PUBLIC);
    if (cached) {
      logger.info('Brands (public) cache hit');
      return res.json(JSON.parse(cached));
    }

    const brands = await prisma.brand.findMany({
      where: { isActive: true },
      orderBy: [
        { sortOrder: 'asc' },
        { name: 'asc' },
      ],
    });

    await redisClient.set(CACHE_KEY_PUBLIC, JSON.stringify(brands), { EX: 300 });
    res.json(brands);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка получения брендов: ' + error.message });
  }
};

export const getAllBrands = async (req, res) => {
  try {
    const cached = await redisClient.get(CACHE_KEY_ALL);
    if (cached) {
      logger.info('Brands (all) cache hit');
      return res.json(JSON.parse(cached));
    }

    const brands = await prisma.brand.findMany({
      orderBy: [
        { sortOrder: 'asc' },
        { name: 'asc' },
      ],
    });

    await redisClient.set(CACHE_KEY_ALL, JSON.stringify(brands), { EX: 60 });
    res.json(brands);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка получения брендов: ' + error.message });
  }
};

export const createBrand = async (req, res) => {
  const { name, description, isActive, sortOrder } = normalizeBrandData(req.body);

  if (!name || !description) {
    return res.status(400).json({ error: 'Название и описание бренда обязательны.' });
  }

  try {
    const brand = await prisma.brand.create({
      data: {
        name,
        description,
        isActive,
        sortOrder,
        logo: buildLogoPath(req),
      },
    });

    await clearBrandsCache();
    res.status(201).json(brand);
  } catch (error) {
    const message = error.code === 'P2002'
      ? 'Бренд с таким названием уже существует.'
      : 'Ошибка создания бренда: ' + error.message;
    res.status(error.code === 'P2002' ? 400 : 500).json({ error: message });
  }
};

export const updateBrand = async (req, res) => {
  const brandId = Number.parseInt(req.params.id, 10);
  const { name, description, isActive, sortOrder } = normalizeBrandData(req.body);

  if (!Number.isFinite(brandId)) {
    return res.status(400).json({ error: 'Некорректный идентификатор бренда.' });
  }

  try {
    const existingBrand = await prisma.brand.findUnique({
      where: { id: brandId },
    });

    if (!existingBrand) {
      return res.status(404).json({ error: 'Бренд не найден.' });
    }

    const data = {
      description,
      isActive,
      sortOrder,
      logo: buildLogoPath(req, existingBrand.logo),
    };

    if (name) {
      data.name = name;
    }

    const brand = await prisma.brand.update({
      where: { id: brandId },
      data,
    });

    await clearBrandsCache();
    res.json(brand);
  } catch (error) {
    const message = error.code === 'P2002'
      ? 'Бренд с таким названием уже существует.'
      : 'Ошибка обновления бренда: ' + error.message;
    res.status(error.code === 'P2002' ? 400 : 500).json({ error: message });
  }
};

export const deleteBrand = async (req, res) => {
  const brandId = Number.parseInt(req.params.id, 10);

  if (!Number.isFinite(brandId)) {
    return res.status(400).json({ error: 'Некорректный идентификатор бренда.' });
  }

  try {
    const existingBrand = await prisma.brand.findUnique({
      where: { id: brandId },
    });

    if (!existingBrand) {
      return res.status(404).json({ error: 'Бренд не найден.' });
    }

    await prisma.brand.delete({ where: { id: brandId } });
    await clearBrandsCache();
    res.json({ message: 'Бренд удален.' });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка удаления бренда: ' + error.message });
  }
};
