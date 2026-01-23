'use client';

import { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy, updateDoc, doc } from 'firebase/firestore';

interface Appointment {
  id: string;
  serviceName: string;
  clientName: string;
  clientPhone: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  createdAt: any;
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('upcoming');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAppointments();
  }, [filter]);

  const loadAppointments = async () => {
    if (!auth.currentUser) return;

    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      let appointmentsQuery;

      if (filter === 'upcoming') {
        appointmentsQuery = query(
          collection(db, 'appointments'),
          where('userId', '==', auth.currentUser.uid),
          where('date', '>=', today),
          where('status', '==', 'confirmed'),
          orderBy('date', 'asc')
        );
      } else if (filter === 'past') {
        appointmentsQuery = query(
          collection(db, 'appointments'),
          where('userId', '==', auth.currentUser.uid),
          where('date', '<', today),
          orderBy('date', 'desc')
        );
      } else {
        appointmentsQuery = query(
          collection(db, 'appointments'),
          where('userId', '==', auth.currentUser.uid),
          orderBy('date', 'desc')
        );
      }

      const snapshot = await getDocs(appointmentsQuery);
      const appointmentsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Appointment[];

      setAppointments(appointmentsData);
    } catch (error) {
      console.error('Error loading appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const cancelAppointment = async (appointmentId: string) => {
    if (!confirm('¿Estás seguro de cancelar este turno?')) return;

    try {
      await updateDoc(doc(db, 'appointments', appointmentId), {
        status: 'cancelled',
        cancelledAt: new Date(),
        cancelledBy: 'owner',
      });

      await loadAppointments();
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

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { color: string; text: string }> = {
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

  return (
    <div>
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
                    <p>🕐 {appointment.startTime} - {appointment.endTime}</p>
                    <p>✂️ {appointment.serviceName}</p>
                    <p>📱 {appointment.clientPhone}</p>
                  </div>
                </div>

                {appointment.status === 'confirmed' && (
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
