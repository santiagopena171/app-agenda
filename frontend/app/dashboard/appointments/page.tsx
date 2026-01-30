'use client';

import { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy, updateDoc, doc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

interface Appointment {
  id: string;
  serviceName: string;
  serviceDuration?: number;
  clientName: string;
  clientPhone: string;
  date: string;
  time?: string;
  startTime?: string;
  endTime?: string;
  status: string;
  createdAt: any;
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('all');
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    console.log('Setting up auth listener');
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('Auth state changed:', user ? `User ${user.uid}` : 'No user');
      setCurrentUser(user);
      setAuthLoading(false);
      if (user) {
        loadAppointments(user.uid);
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (currentUser && !authLoading) {
      console.log('Filter changed, reloading appointments');
      loadAppointments(currentUser.uid);
    }
  }, [filter]);

  const loadAppointments = async (userId: string) => {
    setLoading(true);
    try {
      console.log('=== LOADING APPOINTMENTS ===');
      console.log('userId:', userId);
      console.log('filter:', filter);
      const today = new Date().toISOString().split('T')[0];
      console.log('today:', today);
      
      let appointmentsQuery;

      if (filter === 'upcoming') {
        appointmentsQuery = query(
          collection(db, 'appointments'),
          where('userId', '==', userId),
          where('date', '>=', today),
          orderBy('date', 'asc')
        );
      } else if (filter === 'past') {
        appointmentsQuery = query(
          collection(db, 'appointments'),
          where('userId', '==', userId),
          where('date', '<', today),
          orderBy('date', 'desc')
        );
      } else {
        // Para "Todos" traer TODO sin filtro de fecha
        appointmentsQuery = query(
          collection(db, 'appointments'),
          where('userId', '==', userId)
        );
      }

      console.log('Executing query...');
      const snapshot = await getDocs(appointmentsQuery);
      console.log('=== QUERY RESULT ===');
      console.log('Total documents:', snapshot.size);
      
      let appointmentsData = snapshot.docs.map((doc) => {
        const data = doc.data();
        console.log('Document:', doc.id, data);
        return {
          id: doc.id,
          ...data,
        };
      }) as Appointment[];

      // Solo filtrar por status si es "upcoming"
      if (filter === 'upcoming') {
        const beforeFilter = appointmentsData.length;
        appointmentsData = appointmentsData.filter(
          apt => apt.status === 'pending' || apt.status === 'confirmed'
        );
        console.log(`Status filter: ${beforeFilter} -> ${appointmentsData.length}`);
      }

      console.log('Final appointments:', appointmentsData.length);
      setAppointments(appointmentsData);
    } catch (error) {
      console.error('=== ERROR ===', error);
    } finally {
      setLoading(false);
    }
  };

  const cancelAppointment = async (appointmentId: string) => {
    if (!confirm('¿Estás seguro de cancelar este turno?')) return;
    if (!currentUser) return;

    try {
      await updateDoc(doc(db, 'appointments', appointmentId), {
        status: 'cancelled',
        cancelledAt: new Date(),
        cancelledBy: 'owner',
      });

      await loadAppointments(currentUser.uid);
      alert('Turno cancelado correctamente');
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      alert('Error al cancelar el turno');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('es-UY', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const calculateEndTime = (startTime: string, durationMinutes: number): string => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + durationMinutes;
    const endHours = Math.floor(totalMinutes / 60);
    const endMinutes = totalMinutes % 60;
    return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { color: string; text: string }> = {
      pending: { color: 'bg-yellow-100 text-yellow-800', text: 'Pendiente' },
      confirmed: { color: 'bg-green-100 text-green-800', text: 'Confirmado' },
      cancelled: { color: 'bg-red-100 text-red-800', text: 'Cancelado' },
      completed_attended: { color: 'bg-blue-100 text-blue-800', text: 'Asistió' },
      completed_no_show: { color: 'bg-orange-100 text-orange-800', text: 'No asistió' },
    };

    const badge = badges[status] || { color: 'bg-gray-100 text-gray-800', text: status };
    return (
      <span className={`px-2 py-1 rounded-full text-xs ${badge.color}`}>
        {badge.text}
      </span>
    );
  };

  if (authLoading) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-6">Turnos</h2>
        <div>Verificando autenticación...</div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-6">Turnos</h2>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <p className="text-yellow-800">No hay sesión activa. Por favor inicia sesión.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Turnos</h2>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setFilter('upcoming')}
          className={`px-4 py-2 rounded-lg ${
            filter === 'upcoming'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 border'
          }`}
        >
          Próximos
        </button>
        <button
          onClick={() => setFilter('past')}
          className={`px-4 py-2 rounded-lg ${
            filter === 'past'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 border'
          }`}
        >
          Pasados
        </button>
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg ${
            filter === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 border'
          }`}
        >
          Todos
        </button>
      </div>

      {loading ? (
        <div>Cargando...</div>
      ) : appointments.length === 0 ? (
        <div className="bg-white p-6 rounded-lg shadow text-center text-gray-500">
          No hay turnos para mostrar
        </div>
      ) : (
        <div className="space-y-3">
          {appointments.map((appointment) => (
            <div key={appointment.id} className="bg-white p-4 rounded-lg shadow">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-lg">{appointment.clientName}</h3>
                    {getStatusBadge(appointment.status)}
                  </div>
                  
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>📅 {formatDate(appointment.date)}</p>
                    <p>🕐 {appointment.time || appointment.startTime} {appointment.serviceDuration && appointment.time ? `- ${calculateEndTime(appointment.time, appointment.serviceDuration)}` : appointment.endTime ? `- ${appointment.endTime}` : ''}</p>
                    <p>✂️ {appointment.serviceName}</p>
                    <p>📱 {appointment.clientPhone}</p>
                  </div>
                </div>

                {(appointment.status === 'confirmed' || appointment.status === 'pending') && (
                  <button
                    onClick={() => cancelAppointment(appointment.id)}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
