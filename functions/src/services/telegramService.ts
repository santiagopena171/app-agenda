import fetch from 'node-fetch';
import { db } from '../config/firebase';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';

interface NotificationData {
  type: string;
  appointmentId?: string;
  clientName?: string;
  clientPhone?: string;
  serviceName?: string;
  date?: string;
  startTime?: string;
}

/**
 * Enviar notificación por Telegram al dueño del local
 */
export async function sendTelegramNotification(
  userId: string,
  data: NotificationData
): Promise<void> {
  // Obtener chatId del usuario
  const userDoc = await db.collection('users').doc(userId).get();
  
  if (!userDoc.exists) {
    throw new Error('User not found');
  }

  const userData = userDoc.data();
  const chatId = userData?.telegramChatId;

  if (!chatId) {
    console.log('User has no Telegram chat ID configured');
    return;
  }

  let message = '';
  let keyboard = undefined;

  switch (data.type) {
    case 'new_appointment':
      message = `🔔 Nueva reserva\n\nCliente: ${data.clientName}\nTeléfono: ${data.clientPhone}\nServicio: ${data.serviceName}\nFecha: ${formatDate(data.date!)}\nHora: ${data.startTime}`;
      break;

    case 'reminder':
      message = `⏰ Recordatorio\n\nEn 1 hora tienes turno con:\nCliente: ${data.clientName}\nServicio: ${data.serviceName}\nHora: ${data.startTime}`;
      break;

    case 'confirmation_request':
      message = `✅ Confirmación de asistencia\n\n¿El cliente asistió?\n\nCliente: ${data.clientName}\nServicio: ${data.serviceName}\nHora: ${data.startTime}`;
      keyboard = {
        inline_keyboard: [
          [
            { text: 'Asistió', callback_data: `attended:${data.appointmentId}` },
            { text: 'No asistió', callback_data: `no_show:${data.appointmentId}` },
          ],
        ],
      };
      break;

    default:
      message = 'Notificación del sistema';
  }

  await sendTelegramMessage(chatId, message, keyboard);
}

/**
 * Enviar mensaje por Telegram Bot API
 */
async function sendTelegramMessage(
  chatId: string,
  text: string,
  replyMarkup?: any
): Promise<void> {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

  const body: any = {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
  };

  if (replyMarkup) {
    body.reply_markup = replyMarkup;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Telegram API error:', error);
    throw new Error('Failed to send Telegram notification');
  }
}

/**
 * Manejar webhook de Telegram (callbacks de botones)
 */
export async function handleTelegramWebhook(update: any): Promise<void> {
  if (!update.callback_query) {
    return;
  }

  const callbackData = update.callback_query.data;
  const [action, appointmentId] = callbackData.split(':');

  if (action === 'attended') {
    await markAppointmentAttended(appointmentId);
    await answerCallbackQuery(
      update.callback_query.id,
      '✅ Marcado como asistido'
    );
  } else if (action === 'no_show') {
    await markAppointmentNoShow(appointmentId);
    await answerCallbackQuery(
      update.callback_query.id,
      '❌ Marcado como no asistió'
    );
  }
}

/**
 * Marcar turno como asistido
 */
async function markAppointmentAttended(appointmentId: string): Promise<void> {
  const appointmentRef = db.collection('appointments').doc(appointmentId);

  await appointmentRef.update({
    status: 'completed_attended',
    completedAt: new Date(),
    updatedAt: new Date(),
  });
}

/**
 * Marcar turno como no asistido y agregar a lista de clientes problemáticos
 */
async function markAppointmentNoShow(appointmentId: string): Promise<void> {
  const appointmentRef = db.collection('appointments').doc(appointmentId);
  const appointmentDoc = await appointmentRef.get();

  if (!appointmentDoc.exists) {
    return;
  }

  const appointmentData = appointmentDoc.data()!;

  await appointmentRef.update({
    status: 'completed_no_show',
    completedAt: new Date(),
    updatedAt: new Date(),
  });

  // Agregar a clientes problemáticos
  await addToProblemClients(
    appointmentData.userId,
    appointmentData.clientPhone,
    appointmentData.clientName,
    appointmentId
  );
}

/**
 * Agregar cliente a la lista de problemáticos
 */
async function addToProblemClients(
  userId: string,
  clientPhone: string,
  clientName: string,
  appointmentId: string
): Promise<void> {
  const problemClientRef = db
    .collection('users')
    .doc(userId)
    .collection('problemClients')
    .doc(clientPhone);

  const problemClientDoc = await problemClientRef.get();

  if (!problemClientDoc.exists) {
    await problemClientRef.set({
      clientPhone,
      clientName,
      noShowCount: 1,
      lastNoShowDate: new Date(),
      appointments: [appointmentId],
      addedAt: new Date(),
      isBlocked: false,
    });
  } else {
    const currentData = problemClientDoc.data()!;
    const newCount = (currentData.noShowCount || 0) + 1;

    await problemClientRef.update({
      clientName,
      noShowCount: newCount,
      lastNoShowDate: new Date(),
      appointments: [...(currentData.appointments || []), appointmentId],
      isBlocked: newCount >= 2,
    });
  }
}

/**
 * Responder a callback query de Telegram
 */
async function answerCallbackQuery(
  callbackQueryId: string,
  text: string
): Promise<void> {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`;

  await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      callback_query_id: callbackQueryId,
      text,
    }),
  });
}

/**
 * Formatear fecha para mostrar
 */
function formatDate(date: string): string {
  const [year, month, day] = date.split('-');
  return `${day}/${month}/${year}`;
}
