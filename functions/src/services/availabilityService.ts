import { db } from '../config/firebase';

interface TimeSlot {
  startTime: string;
  endTime: string;
}

interface Availability {
  isAvailable: boolean;
  timeSlots: TimeSlot[];
  slotIntervalMinutes: number;
}

const DAYS_MAP: { [key: number]: string } = {
  0: 'sunday',
  1: 'monday',
  2: 'tuesday',
  3: 'wednesday',
  4: 'thursday',
  5: 'friday',
  6: 'saturday',
};

/**
 * Obtener horarios disponibles para un servicio en una fecha específica
 */
export async function getAvailableSlots(
  userId: string,
  serviceId: string,
  date: string // "2026-01-25"
): Promise<string[]> {
  // 1. Obtener información del servicio
  const serviceDoc = await db
    .collection('users')
    .doc(userId)
    .collection('services')
    .doc(serviceId)
    .get();

  if (!serviceDoc.exists || !serviceDoc.data()?.isActive) {
    throw new Error('Service not found or inactive');
  }

  const serviceDuration = serviceDoc.data()!.durationMinutes;

  // 2. Determinar día de la semana
  const dateObj = new Date(date + 'T00:00:00-03:00'); // Uruguay timezone
  const dayOfWeek = DAYS_MAP[dateObj.getDay()];

  // 3. Obtener disponibilidad del día
  const availabilityDoc = await db
    .collection('users')
    .doc(userId)
    .collection('availability')
    .doc(dayOfWeek)
    .get();

  if (!availabilityDoc.exists || !availabilityDoc.data()?.isAvailable) {
    return []; // No hay disponibilidad ese día
  }

  const availability = availabilityDoc.data() as Availability;

  // 4. Verificar excepciones para esta fecha
  const exceptionsSnapshot = await db
    .collection('users')
    .doc(userId)
    .collection('exceptions')
    .where('date', '==', date)
    .get();

  if (!exceptionsSnapshot.empty) {
    const exception = exceptionsSnapshot.docs[0].data();
    if (exception.type === 'blocked') {
      return []; // Día completamente bloqueado
    }
  }

  // 5. Obtener turnos confirmados para esta fecha
  const appointmentsSnapshot = await db
    .collection('appointments')
    .where('userId', '==', userId)
    .where('date', '==', date)
    .where('status', '==', 'confirmed')
    .get();

  const bookedSlots = appointmentsSnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      startTime: data.startTime,
      endTime: data.endTime,
    };
  });

  // 6. Generar todos los slots posibles
  const allSlots = generateTimeSlots(
    availability.timeSlots,
    availability.slotIntervalMinutes
  );

  // 7. Filtrar slots disponibles (bloques continuos libres)
  const availableSlots = filterAvailableSlots(
    allSlots,
    bookedSlots,
    serviceDuration,
    availability.slotIntervalMinutes
  );

  return availableSlots;
}

/**
 * Generar todos los slots de tiempo posibles según la configuración
 */
function generateTimeSlots(
  timeSlots: TimeSlot[],
  intervalMinutes: number
): string[] {
  const slots: string[] = [];

  for (const slot of timeSlots) {
    const startMinutes = timeToMinutes(slot.startTime);
    const endMinutes = timeToMinutes(slot.endTime);

    for (let minutes = startMinutes; minutes < endMinutes; minutes += intervalMinutes) {
      slots.push(minutesToTime(minutes));
    }
  }

  return slots;
}

/**
 * Filtrar slots que tienen bloques continuos disponibles
 */
function filterAvailableSlots(
  allSlots: string[],
  bookedSlots: TimeSlot[],
  serviceDuration: number,
  intervalMinutes: number
): string[] {
  const availableSlots: string[] = [];
  const slotsNeeded = Math.ceil(serviceDuration / intervalMinutes);

  for (let i = 0; i <= allSlots.length - slotsNeeded; i++) {
    const startTime = allSlots[i];
    const endTime = calculateEndTime(startTime, serviceDuration);

    // Verificar si el bloque está libre
    const isFree = !bookedSlots.some((booked) => {
      return timesOverlap(startTime, endTime, booked.startTime, booked.endTime);
    });

    if (isFree) {
      availableSlots.push(startTime);
    }
  }

  return availableSlots;
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

/**
 * Calcular hora de fin según duración
 */
function calculateEndTime(startTime: string, durationMinutes: number): string {
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = startMinutes + durationMinutes;
  return minutesToTime(endMinutes);
}

/**
 * Convertir tiempo "HH:MM" a minutos desde medianoche
 */
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Convertir minutos a formato "HH:MM"
 */
function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}
