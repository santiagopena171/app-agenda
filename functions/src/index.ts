import * as functions from 'firebase-functions';
import { joinQueue, updateActivity, removeFromQueue } from './services/queueService';
import { getAvailableSlots } from './services/availabilityService';
import { createAppointment, cancelAppointment } from './services/appointmentService';

// ===== VERSIÓN SPARK PLAN (GRATUITA) =====
// Sin scheduled functions ni APIs externas

// ===== Funciones de Cola =====

export const joinQueueFunc = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
  try {
    const { userId, sessionId } = data;
    const clientIP = context.rawRequest.ip;

    if (!userId || !sessionId) {
      throw new functions.https.HttpsError('invalid-argument', 'Missing required parameters');
    }

    const result = await joinQueue(userId, sessionId, clientIP);
    return result;
  } catch (error: any) {
    throw new functions.https.HttpsError('internal', error.message);
  }
});

export const updateActivityFunc = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
  try {
    const { userId, sessionId } = data;

    if (!userId || !sessionId) {
      throw new functions.https.HttpsError('invalid-argument', 'Missing required parameters');
    }

    await updateActivity(userId, sessionId);
    return { success: true };
  } catch (error: any) {
    throw new functions.https.HttpsError('internal', error.message);
  }
});

export const removeFromQueueFunc = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
  try {
    const { userId, sessionId } = data;

    if (!userId || !sessionId) {
      throw new functions.https.HttpsError('invalid-argument', 'Missing required parameters');
    }

    await removeFromQueue(userId, sessionId);
    return { success: true };
  } catch (error: any) {
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// ===== Funciones de Disponibilidad =====

export const getAvailableSlotsFunc = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
  try {
    const { userId, serviceId, date } = data;

    if (!userId || !serviceId || !date) {
      throw new functions.https.HttpsError('invalid-argument', 'Missing required parameters');
    }

    const slots = await getAvailableSlots(userId, serviceId, date);
    return { slots };
  } catch (error: any) {
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// ===== Funciones de Turnos =====

export const createAppointmentFunc = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
  try {
    const { userId, serviceId, date, startTime, clientName, clientPhone, sessionId } = data;

    if (!userId || !serviceId || !date || !startTime || !clientName || !clientPhone || !sessionId) {
      throw new functions.https.HttpsError('invalid-argument', 'Missing required parameters');
    }

    const appointmentId = await createAppointment({
      userId,
      serviceId,
      date,
      startTime,
      clientName,
      clientPhone,
      sessionId,
    });

    return { appointmentId };
  } catch (error: any) {
    throw new functions.https.HttpsError('internal', error.message);
  }
});

export const cancelAppointmentFunc = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { appointmentId } = data;
    const userId = context.auth.uid;

    if (!appointmentId) {
      throw new functions.https.HttpsError('invalid-argument', 'Missing appointment ID');
    }

    await cancelAppointment(appointmentId, userId);
    return { success: true };
  } catch (error: any) {
    throw new functions.https.HttpsError('internal', error.message);
  }
});
