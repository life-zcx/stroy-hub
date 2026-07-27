import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const settingsPath = path.join(__dirname, '..', 'config', 'system_settings.json');

const DEFAULT_DELIVERY_ROUTES = [
  { from: 'Алматы', to: 'Алматы', days: 1 },
  { from: 'Алматы', to: 'Астана', days: 2 },
  { from: 'Алматы', to: 'Шымкент', days: 2 },
  { from: 'Алматы', to: 'Караганда', days: 2 },
  { from: 'Алматы', to: 'Тараз', days: 3 },
  { from: 'Алматы', to: 'Павлодар', days: 3 },
  { from: 'Алматы', to: 'Кызылорда', days: 3 },
  { from: 'Алматы', to: 'Актобе', days: 4 },
  { from: 'Алматы', to: 'Усть-Каменогорск', days: 4 },
  { from: 'Алматы', to: 'Семей', days: 4 },
  { from: 'Алматы', to: 'Атырау', days: 5 },
  { from: 'Алматы', to: 'Актау', days: 5 },
  { from: 'Алматы', to: 'Уральск', days: 5 },
  { from: 'Алматы', to: 'Костанай', days: 3 },
  { from: 'Алматы', to: 'Петропавловск', days: 4 },
  { from: 'Алматы', to: 'Темиртау', days: 2 },
  { from: 'Алматы', to: 'Туркестан', days: 3 },
  { from: 'Алматы', to: 'Кокшетау', days: 3 },
  { from: 'Алматы', to: 'Талдыкорган', days: 2 },
  { from: 'Алматы', to: 'Экибастуз', days: 3 },
  { from: 'Алматы', to: 'Рудный', days: 3 },
  { from: 'Алматы', to: 'Жанаозен', days: 5 },
  { from: 'Алматы', to: 'Жезказган', days: 3 },
  { from: 'Алматы', to: 'Балхаш', days: 2 },
  { from: 'Алматы', to: 'Кентау', days: 3 },
  { from: 'Алматы', to: 'Каскелен', days: 1 },
  { from: 'Алматы', to: 'Сарыагаш', days: 3 },
  { from: 'Алматы', to: 'Кульсары', days: 5 },
  { from: 'Алматы', to: 'Риддер', days: 4 },
  { from: 'Алматы', to: 'Аксай', days: 5 },
  { from: 'Алматы', to: 'Степногорск', days: 3 },
  { from: 'Алматы', to: 'Щучинск', days: 3 },
  { from: 'Алматы', to: 'Сарань', days: 2 },
  { from: 'Алматы', to: 'Житикара', days: 4 },
  { from: 'Алматы', to: 'Талгар', days: 1 },
  { from: 'Алматы', to: 'Есик', days: 1 },
  { from: 'Алматы', to: 'Каратау', days: 3 },
  { from: 'Алматы', to: 'Шу', days: 2 },
  { from: 'Алматы', to: 'Арыс', days: 3 },
  { from: 'Алматы', to: 'Текели', days: 2 },
  { from: 'Алматы', to: 'Конаев', days: 1 },
  { from: 'Алматы', to: 'Хромтау', days: 4 },
  { from: 'Алматы', to: 'Шахтинск', days: 2 },
  { from: 'Алматы', to: 'Алтай', days: 4 },
  { from: 'Алматы', to: 'Лисаковск', days: 4 },
  { from: 'Алматы', to: 'Аксу', days: 3 },
  { from: 'Алматы', to: 'Жаркент', days: 2 },
  { from: 'Алматы', to: 'Байконур', days: 4 },
  { from: 'Алматы', to: 'Сайрам', days: 3 },
  { from: 'Алматы', to: 'Мерке', days: 2 },
  { from: 'Алматы', to: 'Жанатас', days: 3 },
  { from: 'Алматы', to: 'Зайсан', days: 4 },
  { from: 'Алматы', to: 'Шардара', days: 3 },
  { from: 'Алматы', to: 'Форт-Шевченко', days: 5 },
  { from: 'Алматы', to: 'Аягоз', days: 3 },
  { from: 'Алматы', to: 'Уштобе', days: 2 },
  { from: 'Алматы', to: 'Эмба', days: 4 },
  { from: 'Алматы', to: 'Кандыагаш', days: 4 },
  { from: 'Алматы', to: 'Серебрянск', days: 4 },
  { from: 'Алматы', to: 'Шемонаиха', days: 4 },
  { from: 'Алматы', to: 'Булаево', days: 4 },
  { from: 'Алматы', to: 'Мамлютка', days: 4 },
  { from: 'Алматы', to: 'Сергеевка', days: 4 },
  { from: 'Алматы', to: 'Тайынша', days: 4 },
  { from: 'Алматы', to: 'Акколь', days: 3 },
  { from: 'Алматы', to: 'Атбасар', days: 3 },
  { from: 'Алматы', to: 'Державинск', days: 4 },
  { from: 'Алматы', to: 'Ерейментау', days: 3 },
  { from: 'Алматы', to: 'Есиль', days: 4 },
  { from: 'Алматы', to: 'Степняк', days: 3 },
  { from: 'Алматы', to: 'Аркалык', days: 4 },
  { from: 'Алматы', to: 'Каражал', days: 3 },
  { from: 'Алматы', to: 'Приозерск', days: 2 },
  { from: 'Алматы', to: 'Качар', days: 4 },
  { from: 'Алматы', to: 'Боровое', days: 3 },
  { from: 'Алматы', to: 'Кордай', days: 2 },
  { from: 'Алматы', to: 'Узынагаш', days: 1 },
  { from: 'Алматы', to: 'Шелек', days: 1 },
  { from: 'Алматы', to: 'Чапаев', days: 5 },
  { from: 'Алматы', to: 'Бейнеу', days: 5 },
  { from: 'Алматы', to: 'Шалкар', days: 4 },
  { from: 'Алматы', to: 'Бадам', days: 3 },
  { from: 'Алматы', to: 'Отеген Батыр', days: 1 },
  { from: 'Алматы', to: 'Боралдай', days: 1 },
  { from: 'Алматы', to: 'Жетысай', days: 3 },
  { from: 'Алматы', to: 'Шар', days: 4 },
  { from: 'Алматы', to: 'Каркаралинск', days: 3 },
  { from: 'Алматы', to: 'Алга', days: 4 },
  { from: 'Алматы', to: 'Аральск', days: 4 },
  { from: 'Алматы', to: 'Жем', days: 4 },
  { from: 'Алматы', to: 'Казалинск', days: 4 },
  { from: 'Алматы', to: 'Курчатов', days: 4 },
  { from: 'Алматы', to: 'Ленгер', days: 3 },
  { from: 'Алматы', to: 'Макинск', days: 3 },
  { from: 'Алматы', to: 'Макат', days: 5 },
  { from: 'Алматы', to: 'Сарканд', days: 2 },
  { from: 'Алматы', to: 'Сатпаев', days: 3 },
  { from: 'Алматы', to: 'Ушарал', days: 2 }
];

const DEFAULT_SETTINGS = {
  comingSoonModalEnabled: false,
  comingSoonTitle: 'Мы скоро откроемся!',
  comingSoonMessage: 'Совсем скоро наш сайт заработает в полную силу! Сейчас вы можете ознакомиться с каталогом товаров и нашими услугами.',
  defaultWarehouseCity: 'Алматы',
  deliveryRoutes: DEFAULT_DELIVERY_ROUTES,
};

export function readSystemSettings() {
  try {
    if (fs.existsSync(settingsPath)) {
      const data = fs.readFileSync(settingsPath, 'utf8');
      return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
    }
  } catch (error) {
    logger.error('Error reading system settings:', error);
  }
  return DEFAULT_SETTINGS;
}

function writeSystemSettings(settings) {
  try {
    const dir = path.dirname(settingsPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf8');
    return true;
  } catch (error) {
    logger.error('Error writing system settings:', error);
    return false;
  }
}

export const getSettings = async (req, res) => {
  try {
    const settings = readSystemSettings();
    res.json(settings);
  } catch (error) {
    logger.error('Error in getSettings controller:', error);
    res.status(500).json({ error: 'Не удалось получить настройки.' });
  }
};

export const updateSettings = async (req, res) => {
  try {
    const { comingSoonModalEnabled, comingSoonTitle, comingSoonMessage, defaultWarehouseCity, deliveryRoutes } = req.body;

    const currentSettings = readSystemSettings();
    const newSettings = {
      comingSoonModalEnabled: comingSoonModalEnabled !== undefined ? Boolean(comingSoonModalEnabled) : currentSettings.comingSoonModalEnabled,
      comingSoonTitle: comingSoonTitle !== undefined ? String(comingSoonTitle) : currentSettings.comingSoonTitle,
      comingSoonMessage: comingSoonMessage !== undefined ? String(comingSoonMessage) : currentSettings.comingSoonMessage,
      defaultWarehouseCity: defaultWarehouseCity !== undefined ? String(defaultWarehouseCity) : (currentSettings.defaultWarehouseCity || 'Алматы'),
      deliveryRoutes: Array.isArray(deliveryRoutes) ? deliveryRoutes : (currentSettings.deliveryRoutes || DEFAULT_DELIVERY_ROUTES),
    };

    const success = writeSystemSettings(newSettings);
    if (success) {
      res.json({ message: 'Настройки успешно сохранены.', settings: newSettings });
    } else {
      res.status(500).json({ error: 'Не удалось сохранить настройки.' });
    }
  } catch (error) {
    logger.error('Error in updateSettings controller:', error);
    res.status(500).json({ error: 'Не удалось сохранить настройки.' });
  }
};
