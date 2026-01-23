'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { db, functions } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, doc, onSnapshot } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

interface LocalData {
  name: string;
  description: string;
  timezone: string;
}

interface Service {
  id: string;
  name: string;
  durationMinutes: number;
  active: boolean;
}

interface AvailabilityConfig {
  dayOfWeek: number;
  enabled: boolean;
  startTime: string;
  endTime: string;
  slotIntervalMinutes: number;
}

export default function BookingPage() {
  const params = useParams();
  const publicSlug = params.slug as string;

  const [localData, setLocalData] = useState<LocalData | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [availability, setAvailability] = useState<AvailabilityConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string>('');

  // Form state
  const [step, setStep] = useState<string | number>(1);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [appointmentDetails, setAppointmentDetails] = useState<any>(null);
  const [queuePosition, setQueuePosition] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState('');

  const calculateAvailableSlots = () => {
    // TODO: Implement logic to calculate available slots based on selectedDate, selectedService, and availability
    console.log('Calculating availability...');
    // access availability, selectedDate, etc. here
    setAvailableSlots(['09:00', '09:30', '10:00']); // Dummy data for now
  };

  useEffect(() => {
    setSessionId(uuidv4());
    loadLocalData();
  }, [publicSlug]);

  useEffect(() => {
    if (selectedDate && selectedService && availability.length > 0) {
      calculateAvailableSlots();
    }
  }, [selectedDate, selectedService, availability]);

  const loadLocalData = async () => {
    try {
      // Buscar usuario por publicSlug
      const usersQuery = query(
        collection(db, 'users'),
        where('publicSlug', '==', params.slug)
      );
      const usersSnapshot = await getDocs(usersQuery);

      if (usersSnapshot.empty) {
        setError('Local no encontrado');
        return;
      }

      const userDoc = usersSnapshot.docs[0];
      const userData = userDoc.data();
      setLocalData(userData as LocalData);
      setUserId(userDoc.id);

      // Cargar servicios activos
      const servicesQuery = query(
        collection(db, 'users', userDoc.id, 'services'),
        where('isActive', '==', true)
      );
      const servicesSnapshot = await getDocs(servicesQuery);
      const servicesData = servicesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Service[];
      setServices(servicesData);

      setStep('queue');
    } catch (err) {
      console.error('Error loading local data:', err);
      setError('Error al cargar información del local');
    }
  };

  const joinQueueHandler = async () => {
    try {
      const joinQueue = httpsCallable(functions, 'joinQueueFunc');
      const result: any = await joinQueue({ userId, sessionId });
      setQueuePosition(result.data.position);

      // Escuchar cambios en la posición de la cola
      const clientRef = doc(db, 'queues', userId, 'clients', sessionId);
      onSnapshot(clientRef, (snapshot) => {
        if (snapshot.exists()) {
          setQueuePosition(snapshot.data().position);
        }
      });
    } catch (err: any) {
      setError(err.message);
    }
  };

  const updateActivityHandler = async () => {
    try {
      const updateActivity = httpsCallable(functions, 'updateActivityFunc');
      await updateActivity({ userId, sessionId });
    } catch (err) {
      console.error('Error updating activity:', err);
    }
  };

  const selectService = (service: any) => {
    setSelectedService(service);
    setStep('date');
  };

  const selectDate = async (date: string) => {
    setSelectedDate(date);
    setLoading(true);

    try {
      const getAvailableSlots = httpsCallable(functions, 'getAvailableSlotsFunc');
      const result: any = await getAvailableSlots({
        userId,
        serviceId: selectedService?.id,
        date,
      });
      setAvailableSlots(result.data.slots);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const selectSlot = (slot: string) => {
    setSelectedTime(slot);
    setStep('form');
  };

  const confirmAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const createAppointment = httpsCallable(functions, 'createAppointmentFunc');
      const result: any = await createAppointment({
        userId,
        serviceId: selectedService?.id,
        date: selectedDate,
        startTime: selectedTime,
        clientName,
        clientPhone,
        sessionId,
      });

      setAppointmentDetails({
        localName: localData?.name,
        serviceName: selectedService?.name,
        date: selectedDate,
        time: selectedTime,
      });
      setStep('success');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (error && step === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (step === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Cargando...</p>
      </div>
    );
  }

  if (step === 'queue' && queuePosition && queuePosition > 1) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">{localData?.name}</h1>
          <div className="bg-white p-8 rounded-lg shadow-md">
            <p className="text-6xl font-bold text-blue-600 mb-4">{queuePosition}</p>
            <p className="text-xl">personas delante de ti</p>
            <p className="text-gray-600 mt-4">
              Por favor espera tu turno para reservar
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'service') {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">{localData?.name}</h1>
          <p className="text-gray-600 mb-8">{localData?.description}</p>

          <h2 className="text-2xl font-bold mb-4">Selecciona un servicio</h2>
          <div className="space-y-3">
            {services.map((service) => (
              <button
                key={service.id}
                onClick={() => selectService(service)}
                className="w-full bg-white p-4 rounded-lg shadow hover:shadow-md transition text-left"
              >
                <h3 className="font-semibold text-lg">{service.name}</h3>
                <p className="text-gray-600">{service.durationMinutes} minutos</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (step === 'date') {
    const next7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() + i);
      return date.toISOString().split('T')[0];
    });

    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <button onClick={() => setStep('service')} className="text-blue-600 mb-4">
            ← Volver
          </button>
          <h2 className="text-2xl font-bold mb-4">Selecciona fecha y hora</h2>
          <p className="mb-6">
            <strong>Servicio:</strong> {selectedService?.name}
          </p>

          {!selectedDate ? (
            <div className="space-y-3">
              {next7Days.map((date) => (
                <button
                  key={date}
                  onClick={() => selectDate(date)}
                  className="w-full bg-white p-4 rounded-lg shadow hover:shadow-md transition text-left"
                >
                  {new Date(date + 'T12:00:00').toLocaleDateString('es-UY', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </button>
              ))}
            </div>
          ) : loading ? (
            <p>Cargando horarios disponibles...</p>
          ) : availableSlots.length > 0 ? (
            <div className="grid grid-cols-3 gap-3">
              {availableSlots.map((slot) => (
                <button
                  key={slot}
                  onClick={() => selectSlot(slot)}
                  className="bg-white p-3 rounded-lg shadow hover:shadow-md transition"
                >
                  {slot}
                </button>
              ))}
            </div>
          ) : (
            <div>
              <p className="text-gray-600 mb-4">
                No hay horarios disponibles para esta fecha
              </p>
              <button
                onClick={() => setSelectedDate('')}
                className="text-blue-600"
              >
                Elegir otra fecha
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (step === 'form') {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-md mx-auto">
          <button onClick={() => setStep('date')} className="text-blue-600 mb-4">
            ← Volver
          </button>
          <h2 className="text-2xl font-bold mb-6">Confirmar reserva</h2>

          <div className="bg-white p-4 rounded-lg shadow mb-6">
            <p>
              <strong>Servicio:</strong> {selectedService?.name}
            </p>
            <p>
              <strong>Fecha:</strong> {selectedDate}
            </p>
            <p>
              <strong>Hora:</strong> {selectedTime}
            </p>
          </div>

          <form onSubmit={confirmAppointment} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Nombre completo
              </label>
              <input
                type="text"
                required
                minLength={2}
                maxLength={50}
                className="w-full px-3 py-2 border rounded-lg"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Teléfono
              </label>
              <input
                type="tel"
                required
                pattern="[0-9]{8,15}"
                className="w-full px-3 py-2 border rounded-lg"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                placeholder="Ej: 099123456"
              />
            </div>

            {error && (
              <div className="text-red-600 text-sm">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Confirmando...' : 'Confirmar Reserva'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold mb-4">¡Turno Confirmado!</h2>
          <div className="text-left space-y-2 mb-6">
            <p>
              <strong>Local:</strong> {appointmentDetails?.localName}
            </p>
            <p>
              <strong>Servicio:</strong> {appointmentDetails?.serviceName}
            </p>
            <p>
              <strong>Fecha:</strong> {appointmentDetails?.date}
            </p>
            <p>
              <strong>Hora:</strong> {appointmentDetails?.time}
            </p>
          </div>
          <p className="text-gray-600">
            Tu turno ha sido confirmado. Te esperamos!
          </p>
        </div>
      </div>
    );
  }

  return null;
}
