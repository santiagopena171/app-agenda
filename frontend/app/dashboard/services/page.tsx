'use client';

import { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { collection, addDoc, getDocs, query, where, deleteDoc, doc, updateDoc } from 'firebase/firestore';

interface Service {
  id: string;
  name: string;
  durationMinutes: number;
  isActive: boolean;
  order: number;
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [duration, setDuration] = useState(30);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    if (!auth.currentUser) return;

    const servicesQuery = query(
      collection(db, 'users', auth.currentUser.uid, 'services')
    );
    const snapshot = await getDocs(servicesQuery);
    const servicesData = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Service[];

    servicesData.sort((a, b) => a.order - b.order);
    setServices(servicesData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    setLoading(true);
    try {
      await addDoc(collection(db, 'users', auth.currentUser.uid, 'services'), {
        name,
        durationMinutes: duration,
        isActive: true,
        order: services.length,
        createdAt: new Date(),
      });

      setName('');
      setDuration(30);
      setShowForm(false);
      await loadServices();
    } catch (error) {
      console.error('Error creating service:', error);
      alert('Error al crear el servicio');
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (serviceId: string, currentState: boolean) => {
    if (!auth.currentUser) return;

    try {
      await updateDoc(
        doc(db, 'users', auth.currentUser.uid, 'services', serviceId),
        { isActive: !currentState }
      );
      await loadServices();
    } catch (error) {
      console.error('Error updating service:', error);
    }
  };

  const deleteService = async (serviceId: string) => {
    if (!auth.currentUser) return;
    if (!confirm('¿Estás seguro de eliminar este servicio?')) return;

    try {
      await deleteDoc(doc(db, 'users', auth.currentUser.uid, 'services', serviceId));
      await loadServices();
    } catch (error) {
      console.error('Error deleting service:', error);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-200">
        <div>
           <h1 className="text-3xl font-bold text-gray-900">Servicios</h1>
           <p className="text-gray-600 mt-1">Gestiona los servicios que ofreces a tus clientes</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-sm"
          style={{ backgroundColor: showForm ? '#EF4444' : '#4F46E5', color: 'white' }}
        >
          {showForm ? (
            <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                Cancelar
            </>
          ) : (
            <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                Nuevo Servicio
            </>
          )}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Crear Nuevo Servicio</h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Nombre del servicio
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
                  placeholder="Ej: Corte de pelo + Perfilado"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Duración
                </label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    min={15}
                    step={15}
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none pr-20"
                  />
                  <span className="absolute right-4 top-2.5 text-gray-600 text-sm font-medium pointer-events-none">minutos</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setName('');
                  setDuration(30);
                }}
                className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-2.5 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#4F46E5', color: 'white' }}
              >
                {loading ? 'Guardando...' : 'Crear Servicio'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-3">
        {services.length === 0 ? (
          !showForm && (
            <div className="bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Aún no tienes servicios</h3>
              <p className="text-gray-600 mb-6">Comienza creando tu primer servicio para que tus clientes puedan agendar</p>
              <button
                onClick={() => setShowForm(true)}
                className="px-6 py-2.5 rounded-lg font-semibold transition-colors"
                style={{ backgroundColor: '#4F46E5', color: 'white' }}
              >
                Crear primer servicio
              </button>
            </div>
          )
        ) : (
          services.map((service) => (
            <div
              key={service.id}
              className={`group p-5 rounded-xl transition-all border ${
                service.isActive 
                  ? 'bg-white border-gray-200 hover:border-indigo-200 hover:shadow-md' 
                  : 'bg-gray-50 border-gray-200 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    service.isActive ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-200 text-gray-400'
                  }`}>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z"></path></svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-bold text-lg truncate ${service.isActive ? 'text-gray-900' : 'text-gray-500'}`}>
                      {service.name}
                    </h3>
                    <div className="flex items-center gap-4 mt-1">
                      <p className="text-gray-600 flex items-center gap-1.5 text-sm">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        {service.durationMinutes} minutos
                      </p>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        service.isActive 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-200 text-gray-600'
                      }`}>
                        {service.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => toggleActive(service.id, service.isActive)}
                    className="p-2.5 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    title={service.isActive ? "Desactivar" : "Activar"}
                  >
                    {service.isActive ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"></path></svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                    )}
                  </button>
                  <button
                    onClick={() => deleteService(service.id)}
                    className="p-2.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Eliminar"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
