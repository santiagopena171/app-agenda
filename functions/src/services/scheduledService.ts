import { db } from '../config/firebase';
import { sendTelegramNotification } from './telegramService';

/**
 * Enviar recordatorios 1 hora antes del turno
 * Ejecutado cada 5 minutos por Cloud Scheduler
 */
export async function sendReminders(): Promise<void> {
  const now = new Date();
  const oneHourLater = new Date(now.getTime() + 55 * 60 * 1000); // 55 min
  const oneHourLaterEnd = new Date(now.getTime() + 65 * 60 * 1000); // 65 min

  // Buscar turnos confirmados en la próxima hora que no tengan recordatorio enviado
  const appointmentsSnapshot = await db
    .collection('appointments')
    .where('status', '==', 'confirmed')
    .get();

  for (const doc of appointmentsSnapshot.docs) {
    const appointment = doc.data();
    const appointmentDateTime = parseDateTime(appointment.date, appointment.startTime);

    if (
      appointmentDateTime >= oneHourLater &&
      appointmentDateTime <= oneHourLaterEnd &&
      !appointment.notificationsSent.includes('reminder')
    ) {
      await sendTelegramNotification(appointment.userId, {
        type: 'reminder',
        appointmentId: doc.id,
        clientName: appointment.clientName,
        serviceName: appointment.serviceName,
        startTime: appointment.startTime,
      });

      // Marcar como enviado
      await doc.ref.update({
        notificationsSent: [...appointment.notificationsSent, 'reminder'],
      });
    }
  }
}

/**
 * Solicitar confirmación de asistencia cuando llega la hora del turno
 * Ejecutado cada 2 minutos por Cloud Scheduler
 */
export async function requestAttendanceConfirmation(): Promise<void> {
  const now = new Date();
  const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);

  // Buscar turnos confirmados que ya pasaron su hora de inicio
  const appointmentsSnapshot = await db
    .collection('appointments')
    .where('status', '==', 'confirmed')
    .get();

  for (const doc of appointmentsSnapshot.docs) {
    const appointment = doc.data();
    const appointmentDateTime = parseDateTime(appointment.date, appointment.startTime);

    if (
      appointmentDateTime <= now &&
      appointmentDateTime >= tenMinutesAgo &&
      !appointment.notificationsSent.includes('confirmation_request')
    ) {
      await sendTelegramNotification(appointment.userId, {
        type: 'confirmation_request',
        appointmentId: doc.id,
        clientName: appointment.clientName,
        serviceName: appointment.serviceName,
        startTime: appointment.startTime,
      });

      // Marcar como enviado
      await doc.ref.update({
        notificationsSent: [...appointment.notificationsSent, 'confirmation_request'],
      });
    }
  }
}

/**
 * Marcar turnos como expirados si pasaron más de 30 min desde su fin
 * Ejecutado cada 10 minutos por Cloud Scheduler
 */
export async function expireAppointments(): Promise<void> {
  const now = new Date();
  const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);

  // Buscar turnos confirmados que ya pasaron
  const appointmentsSnapshot = await db
    .collection('appointments')
    .where('status', '==', 'confirmed')
    .get();

  for (const doc of appointmentsSnapshot.docs) {
    const appointment = doc.data();
    const appointmentEndDateTime = parseDateTime(appointment.date, appointment.endTime);

    if (appointmentEndDateTime < thirtyMinutesAgo) {
      await doc.ref.update({
        status: 'expired',
        updatedAt: new Date(),
      });
    }
  }
}

/**
 * Generar historial mensual
 * Ejecutado el día 1 de cada mes
 */
export async function generateMonthlyHistory(
  userId: string,
  month: string // "2026-01"
): Promise<void> {
  const [year, monthNum] = month.split('-');
  const startDate = `${year}-${monthNum}-01`;
  const endDate = `${year}-${monthNum}-31`;

  // Obtener todos los turnos del mes
  const appointmentsSnapshot = await db
    .collection('appointments')
    .where('userId', '==', userId)
    .where('date', '>=', startDate)
    .where('date', '<=', endDate)
    .get();

  const appointments = [];
  const stats = {
    totalAppointments: 0,
    attended: 0,
    noShows: 0,
    cancelled: 0,
  };

  for (const doc of appointmentsSnapshot.docs) {
    const appointment = doc.data();
    
    appointments.push({
      appointmentId: doc.id,
      date: appointment.date,
      clientName: appointment.clientName,
      serviceName: appointment.serviceName,
      status: appointment.status,
    });

    stats.totalAppointments++;

    if (appointment.status === 'completed_attended') {
      stats.attended++;
    } else if (appointment.status === 'completed_no_show') {
      stats.noShows++;
    } else if (appointment.status === 'cancelled') {
      stats.cancelled++;
    }
  }

  // Guardar historial
  const historyRef = db
    .collection('users')
    .doc(userId)
    .collection('history')
    .doc(month);

  await historyRef.set({
    month,
    appointments,
    stats,
  });
}

/**
 * Parsear fecha y hora a objeto Date
 */
function parseDateTime(date: string, time: string): Date {
  // Zona horaria de Uruguay (UTC-3)
  return new Date(`${date}T${time}:00-03:00`);
}
