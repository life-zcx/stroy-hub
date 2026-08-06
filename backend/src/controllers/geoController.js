import logger from '../utils/logger.js';

export const getClientGeoLocation = async (req, res) => {
  // If Cloudflare is active and has determined the city, leverage it instantly (zero API delay!)
  const cfCity = req.headers['cf-ipcity'];
  if (cfCity) {
    logger.info(`[GEO IP] Cloudflare header detected city: ${cfCity}`);
    return res.json({ city: cfCity });
  }

  const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.ip || req.socket?.remoteAddress || '';
  
  if (!ip || ip === '127.0.0.1' || ip === '::1' || ip.startsWith('172.')) {
    return res.json({ city: 'Almaty' });
  }

  try {
    const response = await fetch(`https://ipapi.co/${ip}/json/`);
    if (!response.ok) throw new Error('ipapi.co failed');
    const data = await response.json();
    return res.json({ city: data.city || 'Almaty' });
  } catch (error) {
    try {
      const response = await fetch(`https://ipinfo.io/${ip}/json`);
      if (!response.ok) throw new Error('ipinfo.io failed');
      const data = await response.json();
      return res.json({ city: data.city || 'Almaty' });
    } catch (e) {
      return res.json({ city: 'Almaty' });
    }
  }
};
