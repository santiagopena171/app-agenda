import { db } from '../config/firebase';
import { FieldValue } from 'firebase-admin/firestore';
import { removeFromQueue } from './queueService';

const MAX_FUTURE_APPOINTMENTS = 3;

interface CreateAppointmentParams {
  userId: string;
  serviceId: string;
  date: string;
  startTime: string;
  clientName: string;
  clientPhone: string;
  sessionId: string;
}

/**
 * Crear un nuevo turno
 */
export async function createAppointment(
  params: CreateAppointmentParams
): Promise<string> {
  const {
    userId,
    serviceId,
    date,
    startTime,
    clientName,
    clientPhone,
    sessionId,
  } = params;

  // Validar datos del cliente
  validateClientData(clientName, clientPhone);

  return db.runTransaction(async (transaction) => {
    // 1. Verificar que el sessionId está en posición 1
    const queueClientRef = db
      .collection('queues')
      .doc(userId)
      .collection('clients')
      .doc(sessionId);
    
    const queueClientDoc = await transaction.get(queueClientRef);
    
    if (!queueClientDoc.exists || queueClientDoc.data()?.position !== 1) {
      throw new Error('You are not authorized to make a reservation at this time');
    }

    // 2. Obtener información del servicio
    const serviceRef = db
      .collection('users')
      .doc(userId)
      .collection('services')
      .doc(serviceId);
    
    const serviceDoc = await transaction.get(serviceRef);
    
    if (!serviceDoc.exists || !serviceDoc.data()?.isActive) {
      throw new Error('Service not found or inactive');
    }

    const serviceData = serviceDoc.data()!;
    const durationMinutes = serviceData.durationMinutes;
    const serviceName = serviceData.name;

    // 3. Calcular hora de fin
    const endTime = calculateEndTime(startTime, durationMinutes);

    // 4. Verificar disponibilidad del horario
    const appointmentsSnapshot = await db
      .collection('appointments')
      .where('userId', '==', userId)
      .where('date', '==', date)
      .where('status', '==', 'confirmed')
      .get();

    for (const doc of appointmentsSnapshot.docs) {
      const existingAppt = doc.data();
      if (
        timesOverlap(
          startTime,
          endTime,
          existingAppt.startTime,
          existingAppt.endTime
        )
      ) {
        throw new Error('This time slot is no longer available');
      }
    }

    // 5. Verificar límite de reservas del cliente
    const clientAppointmentsSnapshot = await db
      .collection('appointments')
      .where('userId', '==', userId)
      .where('clientPhone', '==', clientPhone)
      .where('status', '==', 'confirmed')
      .where('date', '>=', getCurrentDate())
      .get();

    if (clientAppointmentsSnapshot.size >= MAX_FUTURE_APPOINTMENTS) {
      throw new Error(`You cannot have more than ${MAX_FUTURE_APPOINTMENTS} future appointments`);
    }

    // 6. Verificar que no haya otro turno el mismo día
    const sameDayAppointment = clientAppointmentsSnapshot.docs.find(
      (doc) => doc.data().date === date
    );

    if (sameDayAppointment) {
      throw new Error('You already have an appointment on this date');
    }

    // 7. Crear el turno
    const appointmentRef = db.collection('appointments').doc();
    const appointmentData = {
      userId,
      serviceId,
      serviceName,
      durationMinutes,
      date,
      startTime,
      endTime,
      clientName,
      clientPhone,
      status: 'confirmed',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      notificationsSent: [],
    };

    transaction.set(appointmentRef, appointmentData);

    // 8. Remover de la cola (se ejecutará después de la transacción)
    const appointmentId = appointmentRef.id;

    return appointmentId;
  }).then(async (appointmentId) => {
    // Después de la transacción exitosa:
    // Remover de la cola
    await removeFromQueue(userId, sessionId);

    return appointmentId;
  });
}

/**
 * Cancelar un turno (solo el dueño)
 */
export async function cancelAppointment(
  appointmentId: string,
  userId: string
): Promise<void> {
  const appointmentRef = db.collection('appointments').doc(appointmentId);

  await db.runTransaction(async (transaction) => {
    const appointmentDoc = await transaction.get(appointmentRef);

    if (!appointmentDoc.exists) {
      throw new Error('Appointment not found');
    }

    const appointmentData = appointmentDoc.data()!;

    if (appointmentData.userId !== userId) {
      throw new Error('Unauthorized');
    }

    if (appointmentData.status !== 'confirmed') {
      throw new Error('Appointment cannot be cancelled');
    }

    transaction.update(appointmentRef, {
      status: 'cancelled',
      cancelledAt: FieldValue.serverTimestamp(),
      cancelledBy: 'owner',
      updatedAt: FieldValue.serverTimestamp(),
    });
  });
}

/**
 * Validar datos del cliente
 */
function validateClientData(name: string, phone: string): void {
  if (!name || name.length < 2 || name.length > 50) {
    throw new Error('Invalid name: must be between 2 and 50 characters');
  }

  if (!phone || !/^\d{8,15}$/.test(phone)) {
    throw new Error('Invalid phone: must contain 8-15 digits');
  }
}

/**
 * Calcular hora de fin
 */
function calculateEndTime(startTime: string, durationMinutes: number): string {
  const [hours, minutes] = startTime.split(':').map(Number);
  const startMinutes = hours * 60 + minutes;
  const endMinutes = startMinutes + durationMinutes;
  const endHours = Math.floor(endMinutes / 60);
  const endMins = endMinutes % 60;
  return `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
}

/**
 * Verificar si dos rangos de tiempo se solapan
 */
function timesOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  const start1Minutes = timeToMinutes(start1);
  const end1Minutes = timeToMinutes(end1);
  const start2Minutes = timeToMinutes(start2);
  const end2Minutes = timeToMinutes(end2);

  return start1Minutes < end2Minutes && end1Minutes > start2Minutes;
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Obtener fecha actual en formato YYYY-MM-DD
 */
function getCurrentDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}
