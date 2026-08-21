import { z } from 'zod';

export const loginSchema = {
  body: z.object({
    email: z.string().email('Некорректный формат email').optional().or(z.literal('')),
    phone: z.string().optional(),
    password: z.string().min(1, 'Пароль обязателен'),
  }),
};

export const registerSchema = {
  body: z.object({
    email: z.string().email('Некорректный формат email').optional().nullable(),
    // SEC-006: минимум 8 символов, заглавная буква, цифра
    password: z.string()
      .min(8, 'Пароль должен содержать минимум 8 символов')
      .regex(/[A-ZА-ЯЁ]/, 'Пароль должен содержать хотя бы одну заглавную букву')
      .regex(/\d/, 'Пароль должен содержать хотя бы одну цифру'),
    name: z.string().min(2, 'Имя должно быть не менее 2 символов'),
    phone: z.string().min(5, 'Укажите корректный номер телефона'),
    address: z.string().optional().nullable(),
    entityType: z.enum(['PHYSICAL', 'LEGAL']).optional().default('PHYSICAL'),
    companyBin: z.string().optional().nullable(),
    companyName: z.string().optional().nullable(),
    directorName: z.string().optional().nullable(),
    legalAddress: z.string().optional().nullable(),
    organizationType: z.string().optional().nullable(),
    referralCode: z.string().optional().nullable(),
  }),
};

export const forgotPasswordSchema = {
  body: z.object({
    email: z.string().email('Некорректный формат email'),
  }),
};

const passwordValidation = z.string()
  .min(8, 'Пароль должен содержать минимум 8 символов')
  .regex(/[A-ZА-ЯЁ]/, 'Пароль должен содержать хотя бы одну заглавную букву')
  .regex(/\d/, 'Пароль должен содержать хотя бы одну цифру');

export const resetPasswordSchema = {
  body: z.object({
    email: z.string().email('Некорректный формат email'),
    code: z.string().min(4, 'Некорректный проверочный код'),
    password: passwordValidation.optional(),
    newPassword: passwordValidation.optional(),
  }).refine((data) => Boolean(data.password || data.newPassword), {
    message: 'Пароль обязателен',
    path: ['password'],
  }).transform((data) => ({
    ...data,
    password: data.password || data.newPassword,
  })),
};

export const createOrderSchema = {
  body: z.object({
    clientName: z.string().min(2, 'Укажите ваше имя'),
    clientPhone: z.string().min(5, 'Укажите номер телефона'),
    clientAddress: z.string().min(3, 'Укажите адрес доставки'),
    paymentMethod: z.string().min(1, 'Укажите способ оплаты'),
    companyName: z.string().optional().nullable(),
    companyBin: z.string().optional().nullable(),
    items: z.array(
      z.object({
        id: z.number().optional(),
        productId: z.number({ required_error: 'ID товара обязателен' }),
        quantity: z.number().min(1, 'Количество должно быть не менее 1'),
        price: z.number().min(0, 'Цена должна быть положительной'),
        selectedOption: z.string().optional().nullable(),
      })
    ).min(1, 'Корзина не может быть пустой'),
    usedBonusPoints: z.number().min(0).optional().default(0),
    promoCode: z.string().optional().nullable(),
    clientComment: z.string().optional().nullable(),
    deliveryDate: z.string().optional().nullable(),
    deliveryTime: z.string().optional().nullable(),
  }),
};

export const updateOrderStatusSchema = {
  body: z.object({
    status: z.enum(['pending', 'processing', 'shipped', 'completed', 'cancelled'], {
      errorMap: () => ({ message: 'Недопустимый статус заказа' }),
    }),
    managerNotes: z.string().optional().nullable(),
    cancellationReason: z.string().optional().nullable(),
  }),
};
