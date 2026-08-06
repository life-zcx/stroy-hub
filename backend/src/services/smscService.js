import { SMSC_LOGIN, SMSC_PASSWORD, SMSC_APIKEY, SMSC_SENDER, SMSC_USE_CALL, SMSC_MOCK } from '../config/env.js';
import logger from '../utils/logger.js';

/**
 * Service for sending SMS or Call-password OTP via smsc.kz
 */
export const sendSmsCode = async (phoneDigits, code) => {
  const cleanPhone = phoneDigits.replace(/[^\d]/g, '');

  // Mock mode for development or when credentials are not configured
  if (SMSC_MOCK || (!SMSC_APIKEY && (!SMSC_LOGIN || !SMSC_PASSWORD))) {
    logger.info(`[SMSC MOCK MODE] OTP code for ${cleanPhone}: ${code}`);
    console.log(`\n==============================================`);
    console.log(`[SMSC.KZ MOCK OTP CODE] Phone: +${cleanPhone} | CODE: ${code}`);
    console.log(`==============================================\n`);
    return { success: true, mock: true, code };
  }

  try {
    const url = new URL('https://smsc.kz/sys/send.php');
    url.searchParams.append('fmt', '3'); // JSON response
    url.searchParams.append('phones', cleanPhone);

    if (SMSC_APIKEY) {
      url.searchParams.append('apikey', SMSC_APIKEY);
      if (SMSC_LOGIN) {
        url.searchParams.append('login', SMSC_LOGIN);
      }
    } else {
      url.searchParams.append('login', SMSC_LOGIN);
      url.searchParams.append('psw', SMSC_PASSWORD);
    }

    const senderName = SMSC_SENDER || 'SMSC.KZ';
    url.searchParams.append('sender', senderName);

    if (SMSC_USE_CALL) {
      // Call-password mode: SMSC makes a call or delivers code via voice
      url.searchParams.append('call', '1');
      url.searchParams.append('mes', code);
    } else {
      // Standard SMS mode
      url.searchParams.append('mes', `Ваш код авторизации в TORMAG: ${code}`);
    }

    const response = await fetch(url.toString(), {
      signal: AbortSignal.timeout(10000),
    });

    const data = await response.json();

    if (data?.error) {
      logger.error('SMSC.kz API Error:', data);
      throw new Error(`SMSC Error ${data.error_code}: ${data.error}`);
    }

    logger.info(`[SMSC.kz] Successfully sent code to ${cleanPhone}. ID: ${data.id}`);
    return { success: true, id: data.id, cost: data.cost };
  } catch (error) {
    logger.error(`[SMSC.kz] Failed to send code to ${cleanPhone}:`, { error: error.message });
    throw error;
  }
};
