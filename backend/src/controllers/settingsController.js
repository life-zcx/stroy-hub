import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const settingsPath = path.join(__dirname, '..', 'config', 'system_settings.json');

const DEFAULT_SETTINGS = {
  comingSoonModalEnabled: false,
  comingSoonTitle: 'Мы скоро откроемся!',
  comingSoonMessage: 'Совсем скоро наш сайт заработает в полную силу! Сейчас вы можете ознакомиться с каталогом товаров и нашими услугами.'
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
    const { comingSoonModalEnabled, comingSoonTitle, comingSoonMessage } = req.body;

    const currentSettings = readSystemSettings();
    const newSettings = {
      comingSoonModalEnabled: comingSoonModalEnabled !== undefined ? Boolean(comingSoonModalEnabled) : currentSettings.comingSoonModalEnabled,
      comingSoonTitle: comingSoonTitle !== undefined ? String(comingSoonTitle) : currentSettings.comingSoonTitle,
      comingSoonMessage: comingSoonMessage !== undefined ? String(comingSoonMessage) : currentSettings.comingSoonMessage,
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
