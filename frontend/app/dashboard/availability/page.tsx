'use client';

import { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';
import { Calendar, Clock, Info, Check, ChevronLeft } from 'lucide-react';

interface Service {
  id: string;
  name: string;
  duration: number;
}

interface DateSchedule {
  startTime: string;
  endTime: string;
  slotInterval: number;
}

export default function AvailabilityPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());
  const [dateSchedules, setDateSchedules] = useState<Record<string, DateSchedule>>({});
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (!auth.currentUser) return;

    try {
      const availDoc = await getDoc(doc(db, 'users', auth.currentUser.uid, 'settings', 'availability'));
      if (availDoc.exists()) {
        const data = availDoc.data();
        const dates = data.selectedDates || [];
        setSelectedDates(new Set(dates));
        setDateSchedules(data.dateSchedules || {});
      }

      const servicesSnap = await getDocs(collection(db, 'users', auth.currentUser.uid, 'services'));
      const servicesData = servicesSnap.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name,
        duration: doc.data().durationMinutes || 30
      }));
      setServices(servicesData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!auth.currentUser) return;

    setSaving(true);
    try {
      await setDoc(doc(db, 'users', auth.currentUser.uid, 'settings', 'availability'), {
        selectedDates: Array.from(selectedDates),
        dateSchedules: dateSchedules,
        updatedAt: new Date().toISOString()
      });

      alert('Disponibilidad guardada correctamente');
      setStep(1);
    } catch (error) {
      console.error('Error saving availability:', error);
      alert('Error al guardar la disponibilidad');
    } finally {
      setSaving(false);
    }
  };

  const handleNextStep = () => {
    if (selectedDates.size === 0) {
      alert('Por favor selecciona al menos un día');
      return;
    }
    
    const newSchedules = { ...dateSchedules };
    selectedDates.forEach(date => {
      if (!newSchedules[date]) {
        newSchedules[date] = {
          startTime: '09:00',
          endTime: '18:00',
          slotInterval: 30,
        };
      }
    });
    setDateSchedules(newSchedules);
    setStep(2);
  };

  const updateDateSchedule = (date: string, field: keyof DateSchedule, value: string | number) => {
    setDateSchedules(prev => ({
      ...prev,
      [date]: {
        ...prev[date],
        [field]: value,
      },
    }));
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const formatDateKey = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const toggleDate = (date: Date) => {
    const key = formatDateKey(date);
    const newSelected = new Set(selectedDates);
    
    if (newSelected.has(key)) {
      newSelected.delete(key);
    } else {
      newSelected.add(key);
    }
    
    setSelectedDates(newSelected);
  };

  const isDateSelected = (date: Date) => {
    return selectedDates.has(formatDateKey(date));
  };

  const isPastDate = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const changeMonth = (offset: number) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + offset, 1));
  };

  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-500 font-medium">Cargando disponibilidad...</p>
        </div>
      </div>
    );
  }

  if (step === 2) {
    const sortedDates = Array.from(selectedDates).sort();
    
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setStep(1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Configurar Horarios</h1>
            <p className="text-gray-500 mt-1">Define tus horarios para cada día seleccionado</p>
          </div>
        </div>

        <div className="space-y-4">
          {sortedDates.map(dateStr => {
            const date = new Date(dateStr + 'T12:00:00');
            const dayName = date.toLocaleDateString('es-AR', { weekday: 'long' });
            const dateDisplay = date.toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });
            const schedule = dateSchedules[dateStr] || { startTime: '09:00', endTime: '18:00', slotInterval: 30 };

            return (
              <div key={dateStr} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <div className="mb-4">
                  <h3 className="font-bold text-lg text-gray-900 capitalize">{dayName}</h3>
                  <p className="text-sm text-gray-500 capitalize">{dateDisplay}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Hora de inicio
                    </label>
                    <input
                      type="time"
                      value={schedule.startTime}
                      onChange={(e) => updateDateSchedule(dateStr, 'startTime', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Hora de fin
                    </label>
                    <input
                      type="time"
                      value={schedule.endTime}
                      onChange={(e) => updateDateSchedule(dateStr, 'endTime', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Turnos cada
                    </label>
                    <select
                      value={schedule.slotInterval}
                      onChange={(e) => updateDateSchedule(dateStr, 'slotInterval', Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                    >
                      <option value={15}>15 minutos</option>
                      <option value={20}>20 minutos</option>
                      <option value={30}>30 minutos</option>
                      <option value={45}>45 minutos</option>
                      <option value={60}>60 minutos</option>
                    </select>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button
            onClick={() => setStep(1)}
            className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            Volver
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full"></div>
                Guardando...
              </>
            ) : (
              'Guardar Disponibilidad'
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Seleccionar Días Disponibles</h1>
        <p className="text-gray-500 text-sm mt-1">Elige los días en los que estarás disponible para atender</p>
      </div>

      {services.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 mb-2">Tus servicios configurados:</h3>
              <div className="space-y-1">
                {services.map(service => (
                  <div key={service.id} className="flex items-center gap-2 text-sm text-blue-800">
                    <Clock className="w-4 h-4" />
                    <span>{service.name} - {service.duration} minutos</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => changeMonth(-1)}
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 font-medium transition-colors"
            >
              ← Anterior
            </button>
            <button
              onClick={() => changeMonth(1)}
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 font-medium transition-colors"
            >
              Siguiente →
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {dayNames.map(day => (
            <div key={day} className="text-center font-semibold text-gray-600 text-sm py-2">
              {day}
            </div>
          ))}

          {getDaysInMonth(currentMonth).map((date, index) => {
            if (!date) {
              return <div key={`empty-${index}`} className="aspect-square" />;
            }

            const isSelected = isDateSelected(date);
            const isPast = isPastDate(date);
            const isToday = formatDateKey(date) === formatDateKey(new Date());

            return (
              <button
                key={index}
                onClick={() => !isPast && toggleDate(date)}
                disabled={isPast}
                className={`aspect-square rounded-lg font-medium text-sm transition-all relative ${
                  isPast
                    ? 'bg-gray-50 text-gray-300 cursor-not-allowed'
                    : isSelected
                    ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md'
                    : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-blue-300'
                } ${isToday && !isSelected ? 'border-2 border-blue-400' : ''}`}
              >
                {date.getDate()}
                {isSelected && (
                  <div className="absolute -top-1 -right-1 bg-white rounded-full p-0.5">
                    <Check className="w-3 h-3 text-blue-600" strokeWidth={3} />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-4 mt-6 pt-6 border-t border-gray-200 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded border-2 border-blue-400"></div>
            <span className="text-gray-600">Hoy</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-blue-600"></div>
            <span className="text-gray-600">Disponible</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gray-50 border border-gray-200"></div>
            <span className="text-gray-600">No disponible</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gray-50"></div>
            <span className="text-gray-300">Pasado</span>
          </div>
        </div>
      </div>

      {selectedDates.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
          <p className="text-sm text-blue-900">
            <span className="font-bold text-blue-600 text-lg">{selectedDates.size}</span> día{selectedDates.size !== 1 ? 's' : ''} seleccionado{selectedDates.size !== 1 ? 's' : ''}
          </p>
          <button
            onClick={handleNextStep}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            Siguiente
            <Calendar className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
