import prisma from '../config/db.js';
import {
  sanitizeCompanyName,
  sanitizeEmail,
  sanitizeOptionalText,
  sanitizePersonName,
  sanitizePhone,
} from '../utils/requestValidation.js';

const validStatuses = ['pending', 'contacted', 'approved', 'rejected'];

export const createPartnerRequest = async (req, res) => {
  const { contactName, companyName, contactPhone, email, comment } = req.body;

  if (!contactName || !companyName || !contactPhone || !email) {
    return res.status(400).json({ error: 'Имя, компания, телефон и email обязательны.' });
  }

  try {
    const partnerRequest = await prisma.partnerRequest.create({
      data: {
        contactName: sanitizePersonName(contactName, 'Ваше имя'),
        companyName: sanitizeCompanyName(companyName, 'Название компании'),
        contactPhone: sanitizePhone(contactPhone, 'Контактный телефон'),
        email: sanitizeEmail(email, 'Электронная почта'),
        comment: sanitizeOptionalText(comment, 'Комментарий к заявке', 1200),
      },
    });

    res.status(201).json(partnerRequest);
  } catch (error) {
    const statusCode = error.message.includes('Поле') ? 400 : 500;
    res.status(statusCode).json({ error: 'Ошибка при отправке партнерской заявки: ' + error.message });
  }
};

export const getAllPartnerRequests = async (req, res) => {
  try {
    const requests = await prisma.partnerRequest.findMany({
      orderBy: { createdAt: 'desc' },
    });

    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при получении партнерских заявок: ' + error.message });
  }
};

export const updatePartnerRequest = async (req, res) => {
  const { id } = req.params;
  const { status, adminComment } = req.body;

  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Недопустимый статус партнерской заявки.' });
  }

  try {
    const updatedRequest = await prisma.partnerRequest.update({
      where: { id: parseInt(id, 10) },
      data: {
        status,
        adminComment: adminComment === undefined
          ? undefined
          : sanitizeOptionalText(adminComment, 'Комментарий менеджера', 1200),
      },
    });

    res.json(updatedRequest);
  } catch (error) {
    const statusCode = error.message.includes('Поле') || error.message.includes('Недопустимый') ? 400 : 500;
    res.status(statusCode).json({ error: 'Ошибка обновления партнерской заявки: ' + error.message });
  }
};
