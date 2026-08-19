import prisma from '../config/db.js';
import redisClient from '../config/redis.js';
import logger from '../utils/logger.js';
import { safeErrorMessage } from '../utils/apiError.js';
import { processAndUploadMedia } from '../utils/mediaOptimizer.js';

const CACHE_KEY_PUBLIC = 'banners:public';
const CACHE_KEY_ALL = 'banners:all';

const clearBannersCache = async () => {
  try {
    await redisClient.del([CACHE_KEY_PUBLIC, CACHE_KEY_ALL]);
    logger.info('Cleared banners cache');
  } catch (err) {
    logger.error('Error clearing banners cache:', err);
  }
};

async function processImageFile(file, folder = 'banners') {
  if (!file) return null;
  const uploadRes = await processAndUploadMedia({
    buffer: file.buffer,
    filePath: file.path,
    originalname: file.originalname,
    folder,
    entityId: `banner_${Date.now()}`
  });
  return uploadRes.url;
}

export const getPublicBanners = async (req, res) => {
  try {
    const cached = await redisClient.get(CACHE_KEY_PUBLIC);
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    const banners = await prisma.banner.findMany({
      where: { isActive: true },
      orderBy: [
        { sortOrder: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    await redisClient.set(CACHE_KEY_PUBLIC, JSON.stringify(banners), { EX: 300 });
    res.json(banners);
  } catch (error) {
    res.status(500).json({ error: safeErrorMessage(error, 'Ошибка получения баннеров.') });
  }
};

export const getAllBanners = async (req, res) => {
  try {
    const cached = await redisClient.get(CACHE_KEY_ALL);
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    const banners = await prisma.banner.findMany({
      orderBy: [
        { sortOrder: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    await redisClient.set(CACHE_KEY_ALL, JSON.stringify(banners), { EX: 60 });
    res.json(banners);
  } catch (error) {
    res.status(500).json({ error: safeErrorMessage(error, 'Ошибка получения списка баннеров.') });
  }
};

export const createBanner = async (req, res) => {
  try {
    const { title, subtitle, buttonText, linkUrl, position } = req.body;
    const isActive = req.body.isActive === true || req.body.isActive === 'true';
    const sortOrder = req.body.sortOrder !== undefined && req.body.sortOrder !== ''
      ? Number.parseInt(req.body.sortOrder, 10)
      : 0;

    let parsedButtons = null;
    if (req.body.buttons) {
      try {
        parsedButtons = typeof req.body.buttons === 'string' ? JSON.parse(req.body.buttons) : req.body.buttons;
      } catch (e) {
        parsedButtons = null;
      }
    }

    let imageDesktopUrl = req.body.imageDesktop || null;
    let imageMobileUrl = req.body.imageMobile || null;

    if (req.files) {
      if (req.files.imageDesktopFile?.[0]) {
        imageDesktopUrl = await processImageFile(req.files.imageDesktopFile[0]);
      }
      if (req.files.imageMobileFile?.[0]) {
        imageMobileUrl = await processImageFile(req.files.imageMobileFile[0]);
      }
    }

    if (!imageDesktopUrl) {
      return res.status(400).json({ error: 'Пожалуйста, загрузите изображение баннера для ПК.' });
    }

    const banner = await prisma.banner.create({
      data: {
        title: title ? String(title).trim() : null,
        subtitle: subtitle ? String(subtitle).trim() : null,
        buttonText: buttonText ? String(buttonText).trim() : null,
        linkUrl: linkUrl ? String(linkUrl).trim() : null,
        buttons: parsedButtons,
        position: position ? String(position).trim() : 'bottom-left',
        imageDesktop: imageDesktopUrl,
        imageMobile: imageMobileUrl,
        isActive,
        sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
      },
    });

    await clearBannersCache();
    res.status(201).json(banner);
  } catch (error) {
    res.status(500).json({ error: safeErrorMessage(error, 'Ошибка создания баннера.') });
  }
};

export const updateBanner = async (req, res) => {
  const bannerId = Number.parseInt(req.params.id, 10);

  if (!Number.isFinite(bannerId)) {
    return res.status(400).json({ error: 'Некорректный идентификатор баннера.' });
  }

  try {
    const existingBanner = await prisma.banner.findUnique({
      where: { id: bannerId },
    });

    if (!existingBanner) {
      return res.status(404).json({ error: 'Баннер не найден.' });
    }

    const { title, subtitle, buttonText, linkUrl, position } = req.body;
    const isActive = req.body.isActive !== undefined
      ? (req.body.isActive === true || req.body.isActive === 'true')
      : existingBanner.isActive;
    const sortOrder = req.body.sortOrder !== undefined && req.body.sortOrder !== ''
      ? Number.parseInt(req.body.sortOrder, 10)
      : existingBanner.sortOrder;

    let parsedButtons = existingBanner.buttons;
    if (req.body.buttons !== undefined) {
      try {
        parsedButtons = typeof req.body.buttons === 'string' ? JSON.parse(req.body.buttons) : req.body.buttons;
      } catch (e) {
        parsedButtons = null;
      }
    }

    let imageDesktopUrl = existingBanner.imageDesktop;
    let imageMobileUrl = existingBanner.imageMobile;

    if (req.files) {
      if (req.files.imageDesktopFile?.[0]) {
        imageDesktopUrl = await processImageFile(req.files.imageDesktopFile[0]);
      }
      if (req.files.imageMobileFile?.[0]) {
        imageMobileUrl = await processImageFile(req.files.imageMobileFile[0]);
      }
    }

    if (req.body.imageDesktop !== undefined && !req.files?.imageDesktopFile?.[0]) {
      imageDesktopUrl = req.body.imageDesktop || existingBanner.imageDesktop;
    }
    if (req.body.imageMobile !== undefined && !req.files?.imageMobileFile?.[0]) {
      imageMobileUrl = req.body.imageMobile || null;
    }

    const banner = await prisma.banner.update({
      where: { id: bannerId },
      data: {
        title: title !== undefined ? (title ? String(title).trim() : null) : existingBanner.title,
        subtitle: subtitle !== undefined ? (subtitle ? String(subtitle).trim() : null) : existingBanner.subtitle,
        buttonText: buttonText !== undefined ? (buttonText ? String(buttonText).trim() : null) : existingBanner.buttonText,
        linkUrl: linkUrl !== undefined ? (linkUrl ? String(linkUrl).trim() : null) : existingBanner.linkUrl,
        buttons: parsedButtons,
        position: position !== undefined ? (position ? String(position).trim() : 'bottom-left') : existingBanner.position,
        imageDesktop: imageDesktopUrl,
        imageMobile: imageMobileUrl,
        isActive,
        sortOrder: Number.isFinite(sortOrder) ? sortOrder : existingBanner.sortOrder,
      },
    });

    await clearBannersCache();
    res.json(banner);
  } catch (error) {
    res.status(500).json({ error: safeErrorMessage(error, 'Ошибка обновления баннера.') });
  }
};


export const deleteBanner = async (req, res) => {
  const bannerId = Number.parseInt(req.params.id, 10);

  if (!Number.isFinite(bannerId)) {
    return res.status(400).json({ error: 'Некорректный идентификатор баннера.' });
  }

  try {
    const existingBanner = await prisma.banner.findUnique({
      where: { id: bannerId },
    });

    if (!existingBanner) {
      return res.status(404).json({ error: 'Баннер не найден.' });
    }

    await prisma.banner.delete({ where: { id: bannerId } });
    await clearBannersCache();
    res.json({ message: 'Баннер удален.' });
  } catch (error) {
    res.status(500).json({ error: safeErrorMessage(error, 'Ошибка удаления баннера.') });
  }
};
