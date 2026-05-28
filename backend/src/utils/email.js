import { RESEND_API_KEY } from '../config/env.js';

export const sendEmail = async ({ to, subject, html }) => {
  if (!RESEND_API_KEY) {
    console.warn(`[EMAIL BYPASS] RESEND_API_KEY not set. Would send email to: ${to} with subject: ${subject}`);
    console.log(`[EMAIL BODY]:\n`, html);
    return { id: 'mock-id-bypass' };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Tormag.kz <onboarding@resend.dev>',
        to,
        subject,
        html
      })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || JSON.stringify(data));
    }
    return data;
  } catch (error) {
    console.error('[EMAIL ERROR] Failed to send email via Resend API:', error.message);
    throw error;
  }
};
