'use client';

import { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

interface DaySchedule {
  isAvailable: boolean;
  startTime: string;
  endTime: string;
  slotInterval: number;
}

const DAYS: { key: DayOfWeek; label: string }[] = [
  { key: 'monday', label: 'Lunes' },
  { key: 'tuesday', label: 'Martes' },
  { key: 'wednesday', label: 'Miércoles' },
  { key: 'thursday', label: 'Jueves' },
  { key: 'friday', label: 'Viernes' },
  { key: 'saturday', label: 'Sábado' },
  { key: 'sunday', label: 'Domingo' },
];

export default function AvailabilityPage() {
  const [schedule, setSchedule] = useState<Record<DayOfWeek, DaySchedule>>({
    monday: { isAvailable: false, startTime: '09:00', endTime: '18:00', slotInterval: 30 },
    tuesday: { isAvailable: false, startTime: '09:00', endTime: '18:00', slotInterval: 30 },
    wednesday: { isAvailable: false, startTime: '09:00', endTime: '18:00', slotInterval: 30 },
    thursday: { isAvailable: false, startTime: '09:00', endTime: '18:00', slotInterval: 30 },
    friday: { isAvailable: false, startTime: '09:00', endTime: '18:00', slotInterval: 30 },
    saturday: { isAvailable: false, startTime: '09:00', endTime: '18:00', slotInterval: 30 },
    sunday: { isAvailable: false, startTime: '09:00', endTime: '18:00', slotInterval: 30 },
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSchedule();
  }, []);

  const loadSchedule = async () => {
    if (!auth.currentUser) return;

    try {
      const newSchedule = { ...schedule };

      for (const day of DAYS) {
        const docRef = doc(db, 'users', auth.currentUser.uid, 'availability', day.key);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          newSchedule[day.key] = {
            isAvailable: data.isAvailable || false,
            startTime: data.timeSlots?.[0]?.startTime || '09:00',
            endTime: data.timeSlots?.[0]?.endTime || '18:00',
            slotInterval: data.slotIntervalMinutes || 30,
          };
        }
      }

      setSchedule(newSchedule);
    } catch (error) {
      console.error('Error loading schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!auth.currentUser) return;

    setSaving(true);
    try {
      for (const day of DAYS) {
        const daySchedule = schedule[day.key];
        const docRef = doc(db, 'users', auth.currentUser.uid, 'availability', day.key);

        await setDoc(docRef, {
          isAvailable: daySchedule.isAvailable,
          timeSlots: daySchedule.isAvailable
            ? [{ startTime: daySchedule.startTime, endTime: daySchedule.endTime }]
            : [],
          slotIntervalMinutes: daySchedule.slotInterval,
        });
      }

      alert('Disponibilidad guardada correctamente');
    } catch (error) {
      console.error('Error saving schedule:', error);
      alert('Error al guardar la disponibilidad');
    } finally {
      setSaving(false);
    }
  };

  const updateDay = (day: DayOfWeek, field: keyof DaySchedule, value: any) => {
    setSchedule({
      ...schedule,
      [day]: {
        ...schedule[day],
        [field]: value,
      },
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mb-4"></div>
            <p className="text-gray-500 font-medium">Cargando disponibilidad...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Disponibilidad Horaria</h2>
           <p className="text-gray-500 mt-1">Configura tus horarios de atención semanal.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-black transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-gray-200"
        >
          {saving ? (
             <>
               <div className="animate-spin h-4 w-4 border-2 border-white/50 border-t-white rounded-full"></div>
               Guardando...
             </>
          ) : (
             <>
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path></svg>
               Guardar Cambios
             </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Schedule List */}
        <div className="lg:col-span-2 space-y-4">
            {DAYS.map((day) => (
            <div 
                key={day.key} 
                className={`bg-white rounded-xl border transition-all duration-200 ${
                    schedule[day.key].isAvailable 
                    ? 'border-gray-200 shadow-sm' 
                    : 'border-transparent bg-gray-50 opacity-75'
                }`}
            >
                <div className="p-4 sm:p-5">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    className="sr-only peer"
                                    checked={schedule[day.key].isAvailable}
                                    onChange={(e) => updateDay(day.key, 'isAvailable', e.target.checked)}
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                            </label>
                            <span className={`font-bold text-lg ${schedule[day.key].isAvailable ? 'text-gray-900' : 'text-gray-500'}`}>
                                {day.label}
                            </span>
                        </div>
                        {!schedule[day.key].isAvailable && (
                            <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2 py-1 rounded">CERRADO</span>
                        )}
                    </div>

                    {schedule[day.key].isAvailable && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-in slide-in-from-top-2 duration-200">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Abre</label>
                            <div className="relative">
                                <input
                                    type="time"
                                    value={schedule[day.key].startTime}
                                    onChange={(e) => updateDay(day.key, 'startTime', e.target.value)}
                                    className="w-full pl-3 pr-2 py-2 border border-gray-200 rounded-lg text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-gray-50 focus:bg-white transition-colors"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Cierra</label>
                            <div className="relative">
                                <input
                                    type="time"
                                    value={schedule[day.key].endTime}
                                    onChange={(e) => updateDay(day.key, 'endTime', e.target.value)}
                                    className="w-full pl-3 pr-2 py-2 border border-gray-200 rounded-lg text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-gray-50 focus:bg-white transition-colors"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Turnos c/</label>
                            <select
                                value={schedule[day.key].slotInterval}
                                onChange={(e) => updateDay(day.key, 'slotInterval', Number(e.target.value))}
                                className="w-full pl-3 pr-8 py-2 border border-gray-200 rounded-lg text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-gray-50 focus:bg-white transition-colors appearance-none"
                                style={{backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em'}}
                            >
                                <option value={15}>15 min</option>
                                <option value={20}>20 min</option>
                                <option value={30}>30 min</option>
                                <option value={45}>45 min</option>
                                <option value={60}>60 min</option>
                            </select>
                        </div>
                    </div>
                    )}
                </div>
            </div>
            ))}
        </div>

        {/* Tips Column */}
        <div className="lg:col-span-1">
            <div className="sticky top-8">
                 <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100">
                    <h3 className="font-bold text-indigo-900 mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        Consejos útiles
                    </h3>
                    <ul className="space-y-4">
                        <li className="flex gap-3">
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-white text-indigo-600 flex items-center justify-center text-xs font-bold shadow-sm">1</span>
                            <p className="text-sm text-indigo-800 leading-relaxed">
                                Activa solo los días que quieras recibir reservas.
                            </p>
                        </li>
                        <li className="flex gap-3">
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-white text-indigo-600 flex items-center justify-center text-xs font-bold shadow-sm">2</span>
                            <p className="text-sm text-indigo-800 leading-relaxed">
                                El intervalo define la duración de cada "bloque" disponible en tu calendario público.
                            </p>
                        </li>
                        <li className="flex gap-3">
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-white text-indigo-600 flex items-center justify-center text-xs font-bold shadow-sm">3</span>
                            <p className="text-sm text-indigo-800 leading-relaxed">
                                Los cambios se guardan y reflejan inmediatamente en tu link de reservas.
                            </p>
                        </li>
                    </ul>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
}
