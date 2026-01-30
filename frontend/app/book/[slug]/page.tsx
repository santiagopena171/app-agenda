'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, getDoc, addDoc } from 'firebase/firestore';
import { Calendar, Clock, Check, User, Phone, ArrowLeft } from 'lucide-react';

interface Service {
  id: string;
  name: string;
  durationMinutes: number;
  isActive: boolean;
}

interface TimeSlot {
  startTime: string;
  endTime: string;
}

interface DateSchedule {
  timeSlots: TimeSlot[];
}

export default function BookingPage() {
  const params = useParams();
  const publicSlug = params.slug as string;

  const [userId, setUserId] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [services, setServices] = useState<Service[]>([]);
  const [availability, setAvailability] = useState<Record<string, DateSchedule>>({});
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  // Booking flow
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  useEffect(() => {
    loadBusinessData();
  }, [publicSlug]);

  useEffect(() => {
    if (selectedDate && selectedService && userId) {
      calculateAvailableSlots();
    }
  }, [selectedDate, selectedService]);

  const loadBusinessData = async () => {
    try {
      setLoading(true);
      
      // Buscar usuario por slug público
      const usersQuery = query(
        collection(db, 'users'),
        where('publicSlug', '==', publicSlug)
      );
      const usersSnapshot = await getDocs(usersQuery);

      if (usersSnapshot.empty) {
        setError('Negocio no encontrado');
        setLoading(false);
        return;
      }

      const userDoc = usersSnapshot.docs[0];
      const userData = userDoc.data();
      setUserId(userDoc.id);
      setUserName(userData.displayName || userData.name || 'Negocio');

      // Cargar servicios activos
      const servicesQuery = query(
        collection(db, 'users', userDoc.id, 'services'),
        where('isActive', '==', true)
      );
      const servicesSnapshot = await getDocs(servicesQuery);
      const servicesData = servicesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Service[];
      setServices(servicesData);

      // Cargar disponibilidad
      const availDoc = await getDoc(doc(db, 'users', userDoc.id, 'settings', 'availability'));
      if (availDoc.exists()) {
        const data = availDoc.data();
        setAvailableDates(data.selectedDates || []);
        setAvailability(data.dateSchedules || {});
      }

      setLoading(false);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Error al cargar los datos');
      setLoading(false);
    }
  };

  const calculateAvailableSlots = async () => {
    if (!selectedDate || !selectedService || !userId) return;

    const schedule = availability[selectedDate];
    if (!schedule || !schedule.timeSlots) {
      setAvailableTimeSlots([]);
      return;
    }

    // Obtener turnos ya reservados para esta fecha
    const appointmentsQuery = query(
      collection(db, 'appointments'),
      where('userId', '==', userId),
      where('date', '==', selectedDate),
      where('status', '!=', 'cancelled')
    );
    const appointmentsSnapshot = await getDocs(appointmentsQuery);
    const bookedAppointments = appointmentsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        time: data.time,
        duration: data.serviceDuration || 60
      };
    });

    // Generar slots disponibles para cada rango horario
    const allSlots: string[] = [];
    
    schedule.timeSlots.forEach(timeSlot => {
      const slots = generateTimeSlots(
        timeSlot.startTime,
        timeSlot.endTime,
        selectedService.durationMinutes
      );
      allSlots.push(...slots);
    });

    // Filtrar slots que se superpongan con turnos ya reservados
    const uniqueSlots = Array.from(new Set(allSlots));
    const available = uniqueSlots.filter(slot => {
      // Calcular tiempo de inicio y fin del nuevo slot
      const [newStartHour, newStartMin] = slot.split(':').map(Number);
      const newStartMinutes = newStartHour * 60 + newStartMin;
      const newEndMinutes = newStartMinutes + selectedService.durationMinutes;

      // Verificar si se superpone con algún turno existente
      return !bookedAppointments.some(booked => {
        const [bookedStartHour, bookedStartMin] = booked.time.split(':').map(Number);
        const bookedStartMinutes = bookedStartHour * 60 + bookedStartMin;
        const bookedEndMinutes = bookedStartMinutes + booked.duration;

        // Hay superposición si:
        // - El nuevo slot empieza antes de que termine el turno reservado Y
        // - El nuevo slot termina después de que empiece el turno reservado
        return newStartMinutes < bookedEndMinutes && newEndMinutes > bookedStartMinutes;
      });
    }).sort();
    
    setAvailableTimeSlots(available);
  };

  const generateTimeSlots = (startTime: string, endTime: string, duration: number): string[] => {
    const slots: string[] = [];
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);

    let currentTime = startHour * 60 + startMin;
    const endTimeMin = endHour * 60 + endMin;
    const slotInterval = 15; // Generar slots cada 15 minutos

    while (currentTime + duration <= endTimeMin) {
      const hours = Math.floor(currentTime / 60);
      const minutes = currentTime % 60;
      slots.push(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`);
      currentTime += slotInterval; // Avanzar cada 15 minutos, no cada "duration"
    }

    return slots;
  };

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setSelectedTime('');
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService || !selectedDate || !selectedTime || !clientName || !clientPhone) return;

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'appointments'), {
        userId,
        serviceId: selectedService.id,
        serviceName: selectedService.name,
        serviceDuration: selectedService.durationMinutes,
        date: selectedDate,
        time: selectedTime,
        clientName,
        clientPhone,
        status: 'pending',
        createdAt: new Date().toISOString()
      });

      setBookingSuccess(true);
    } catch (err) {
      console.error('Error creating appointment:', err);
      alert('Error al crear el turno. Por favor intenta nuevamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const getDateLabel = (dateStr: string) => {
    const date = new Date(dateStr + 'T12:00:00');
    return date.toLocaleDateString('es-AR', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long' 
    });
  };

  const getAvailableFutureDates = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return availableDates.filter(dateStr => {
      const date = new Date(dateStr + 'T12:00:00');
      return date >= today;
    }).sort().slice(0, 30); // Mostrar solo los próximos 30 días disponibles
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">❌</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (bookingSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Tu turno fue reservado con éxito</h2>
          
          <div className="bg-gray-50 rounded-lg p-4 mb-4 text-left">
            <p className="text-sm text-gray-700 mb-2"><strong>Servicio:</strong> {selectedService?.name}</p>
            <p className="text-sm text-gray-700 mb-2 capitalize"><strong>Fecha:</strong> {getDateLabel(selectedDate)}</p>
            <p className="text-sm text-gray-700"><strong>Hora:</strong> {selectedTime}</p>
          </div>

          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-indigo-900 mb-1">✓ El local ya fue notificado</p>
            <p className="text-sm text-indigo-700">No es necesario crear una cuenta</p>
          </div>

          <button
            onClick={() => window.location.reload()}
            className="w-full px-6 py-3 rounded-lg font-semibold transition-colors"
            style={{ backgroundColor: '#4F46E5', color: 'white' }}
          >
            Agendar otro turno
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{userName}</h1>
          <p className="text-gray-600">Agenda tu turno online</p>
        </div>

        {/* Progress Steps */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center justify-between">
            {[
              { num: 1, label: 'Servicio' },
              { num: 2, label: 'Fecha' },
              { num: 3, label: 'Hora' },
              { num: 4, label: 'Datos' }
            ].map((s, idx) => (
              <div key={s.num} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold mb-2 ${
                    step >= s.num ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {step > s.num ? <Check className="w-6 h-6" /> : s.num}
                  </div>
                  <span className="text-sm text-gray-600 hidden sm:block">{s.label}</span>
                </div>
                {idx < 3 && (
                  <div className={`h-1 flex-1 mx-2 ${
                    step > s.num ? 'bg-indigo-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: Select Service */}
        {step === 1 && (
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Seleccioná un servicio</h2>
            {services.length === 0 ? (
              <p className="text-gray-600">No hay servicios disponibles en este momento.</p>
            ) : (
              <>
                <div className="grid gap-4 mb-6">
                  {services.map(service => (
                    <button
                      key={service.id}
                      onClick={() => handleServiceSelect(service)}
                      className={`p-5 border-2 rounded-xl transition-all text-left ${
                        selectedService?.id === service.id
                          ? 'border-indigo-600 bg-indigo-50'
                          : 'border-gray-200 hover:border-indigo-500 hover:bg-indigo-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className={`font-bold text-lg ${
                            selectedService?.id === service.id ? 'text-indigo-600' : 'text-gray-900'
                          }`}>
                            {service.name}
                          </h3>
                          <p className="text-gray-600 flex items-center gap-2 mt-1">
                            <Clock className="w-4 h-4" />
                            {service.durationMinutes} minutos
                          </p>
                        </div>
                        {selectedService?.id === service.id && (
                          <div className="text-indigo-600">
                            <Check className="w-6 h-6" />
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={() => setStep(2)}
                    disabled={!selectedService}
                    className="px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: selectedService ? '#4F46E5' : '#D1D5DB', color: 'white' }}
                  >
                    Continuar
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Step 2: Select Date */}
        {step === 2 && selectedService && (
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <button
              onClick={() => { setStep(1); setSelectedDate(''); }}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver
            </button>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Seleccioná una fecha</h2>
            <p className="text-gray-600 mb-6">Servicio: <strong>{selectedService.name}</strong></p>
            
            {getAvailableFutureDates().length === 0 ? (
              <p className="text-gray-600">No hay fechas disponibles.</p>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto mb-6">
                  {getAvailableFutureDates().map(date => (
                    <button
                      key={date}
                      onClick={() => handleDateSelect(date)}
                      className={`p-4 border-2 rounded-xl transition-all text-left ${
                        selectedDate === date
                          ? 'border-indigo-600 bg-indigo-50'
                          : 'border-gray-200 hover:border-indigo-500 hover:bg-indigo-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Calendar className="w-5 h-5 text-indigo-600" />
                          <span className={`font-semibold capitalize ${
                            selectedDate === date ? 'text-indigo-600' : 'text-gray-900'
                          }`}>
                            {getDateLabel(date)}
                          </span>
                        </div>
                        {selectedDate === date && (
                          <Check className="w-5 h-5 text-indigo-600" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={() => setStep(3)}
                    disabled={!selectedDate}
                    className="px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: selectedDate ? '#4F46E5' : '#D1D5DB', color: 'white' }}
                  >
                    Continuar
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Step 3: Select Time */}
        {step === 3 && selectedDate && (
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <button
              onClick={() => { setStep(2); setSelectedTime(''); }}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver
            </button>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Seleccioná un horario</h2>
            <p className="text-gray-600 mb-6 capitalize">{getDateLabel(selectedDate)}</p>
            
            {availableTimeSlots.length === 0 ? (
              <p className="text-gray-600">No hay horarios disponibles para esta fecha.</p>
            ) : (
              <>
                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-6">
                  {availableTimeSlots.map(time => (
                    <button
                      key={time}
                      onClick={() => handleTimeSelect(time)}
                      className={`p-3 border-2 rounded-lg transition-all text-center font-semibold ${
                        selectedTime === time
                          ? 'border-indigo-600 bg-indigo-600 text-white'
                          : 'border-gray-200 hover:border-indigo-500 hover:bg-indigo-50 text-gray-900 hover:text-indigo-600'
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={() => setStep(4)}
                    disabled={!selectedTime}
                    className="px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: selectedTime ? '#4F46E5' : '#D1D5DB', color: 'white' }}
                  >
                    Continuar
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Step 4: Client Info */}
        {step === 4 && selectedTime && (
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <button
              onClick={() => setStep(3)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver
            </button>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Completá tus datos</h2>
            
            <div className="bg-indigo-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-gray-900 mb-2">Resumen del turno:</h3>
              <p className="text-sm text-gray-700"><strong>Servicio:</strong> {selectedService?.name}</p>
              <p className="text-sm text-gray-700 capitalize"><strong>Fecha:</strong> {getDateLabel(selectedDate)}</p>
              <p className="text-sm text-gray-700"><strong>Hora:</strong> {selectedTime}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <User className="w-4 h-4 inline mr-1" />
                  Nombre completo
                </label>
                <input
                  type="text"
                  required
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
                  placeholder="Tu nombre"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Phone className="w-4 h-4 inline mr-1" />
                  Teléfono
                </label>
                <input
                  type="tel"
                  required
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
                  placeholder="+54 9 11 1234-5678"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="flex-1 px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
                  style={{ backgroundColor: '#4F46E5', color: 'white' }}
                >
                  {submitting ? 'Confirmando...' : 'Confirmar Turno'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
