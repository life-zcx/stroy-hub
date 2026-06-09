import nodemailer from 'nodemailer';
import { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } from '../config/env.js';

// Create a transporter object using SMTP transport
const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT === 465, // true for 465, false for other ports (like 587)
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});

export const sendEmail = async ({ to, subject, html }) => {
  if (!SMTP_USER || !SMTP_PASS) {
    console.warn(`[EMAIL BYPASS] SMTP credentials not set. Would send email to: ${to} with subject: ${subject}`);
    console.log(`[EMAIL BODY]:\n`, html);
    return { id: 'mock-id-bypass' };
  }

  try {
    const info = await transporter.sendMail({
      from: `"Tormag.kz" <${SMTP_USER}>`, // sender address
      to, // list of receivers
      subject, // Subject line
      html, // html body
    });

    return { id: info.messageId };
  } catch (error) {
    console.error('[EMAIL ERROR] Failed to send email via SMTP:', error.message);
    throw error;
  }
};

