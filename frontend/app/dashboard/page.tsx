'use client';

import { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import Link from 'next/link';

export default function DashboardPage() {
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    todayCount: 0,
    activeServices: 0,
    weekCount: 0
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    if (!auth.currentUser) return;

    try {
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      if (userDoc.exists()) {
        setUserData(userDoc.data());
      }

      // Fetch Today's Appointments
      const today = new Date().toISOString().split('T')[0];
      const todayQuery = query(
        collection(db, 'appointments'),
        where('userId', '==', auth.currentUser.uid),
        where('date', '==', today),
        where('status', '==', 'confirmed')
      );
      const todaySnap = await getDocs(todayQuery);

      // Fetch Services (Assuming subcollection based on other files)
      const servicesQuery = query(
        collection(db, 'users', auth.currentUser.uid, 'services'),
        where('isActive', '==', true)
      );
      const servicesSnap = await getDocs(servicesQuery);

      setStats({
        todayCount: todaySnap.size,
        activeServices: servicesSnap.size,
        weekCount: 0 // Placeholder logic for now
      });

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const copyLink = () => {
    if (userData?.publicSlug) {
      navigator.clipboard.writeText(`${window.location.origin}/book/${userData.publicSlug}`);
      alert('Link copiado!');
    }
  };

  if (loading) {
    return <div className="p-10 text-center text-gray-500">Cargando tu dashboard...</div>;
  }

  // Current Date Helper
  const dateString = new Date().toLocaleDateString('es-UY', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  // Guide Steps Logic
  const hasServices = stats.activeServices > 0;
  const hasAvailability = true; // Assume true if they are here, or fetch check

  return (
    <div className="max-w-6xl mx-auto font-sans">
      
      {/* 1. Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{userData?.localName || 'Santirep'}</h1>
        <p className="text-gray-500 mt-1">Bienvenido a tu panel de control</p>
      </div>

      {/* 2. Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Card 1 */}
        <div className="bg-blue-50/80 p-6 rounded-2xl border border-blue-100 flex flex-col justify-center min-h-[140px]">
          <div className="flex items-center gap-3 mb-3">
             <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
             </div>
             <span className="text-gray-700 font-medium">Turnos de Hoy</span>
          </div>
          <span className="text-4xl font-bold text-gray-900 ml-1">{stats.todayCount}</span>
        </div>

        {/* Card 2 */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-center min-h-[140px]">
          <div className="flex items-center gap-3 mb-3">
             <div className="bg-gray-100 p-2 rounded-lg text-gray-500">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z"></path></svg>
             </div>
             <span className="text-gray-700 font-medium">Servicios Activos</span>
          </div>
          <span className="text-4xl font-bold text-gray-900 ml-1">{stats.activeServices}</span>
        </div>

        {/* Card 3 */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-center min-h-[140px]">
          <div className="flex items-center gap-3 mb-3">
             <div className="bg-gray-100 p-2 rounded-lg text-gray-500">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
             </div>
             <span className="text-gray-700 font-medium">Turnos Esta Semana</span>
          </div>
          <span className="text-4xl font-bold text-gray-900 ml-1">{stats.weekCount}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         {/* Left Column */}
         <div className="space-y-8">
            {/* Public Link Card */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
               <div className="flex items-center gap-2 mb-2">
                 <svg className="w-6 h-6 text-blue-500 transform -rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"></path></svg>
                 <h3 className="text-lg font-bold text-gray-900">Link Público</h3>
               </div>
               <p className="text-gray-500 text-sm mb-5">Comparte este link con s tus clientes para que reserven turnos.</p>
               
               <div className="flex gap-3">
                  <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-gray-600 text-sm flex items-center overflow-hidden">
                     <span className="truncate">{typeof window !== 'undefined' ? window.location.host : 'localhost:3000'}/book/{userData?.publicSlug}</span>
                  </div>
                  <button 
                    onClick={copyLink}
                    className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 bg-blue-50 text-blue-600 rounded-lg text-sm font-semibold hover:bg-blue-100 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg>
                    Copiar Link
                  </button>
               </div>
            </div>

            {/* Quick Guide */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-5">Guía Rápida</h3>
                <div className="space-y-3">
                    {/* Item 1 */}
                    <div className="flex items-center justify-between p-3 bg-gray-50/50 rounded-xl border border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className={`w-6 h-6 rounded flex items-center justify-center ${hasServices ? 'bg-teal-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7"></path></svg>
                            </div>
                            <span className="text-gray-900 font-medium text-sm">Agregar tus <span className="font-bold">Servicios</span></span>
                        </div>
                        {hasServices && <span className="text-gray-400 text-xs">✓</span>}
                    </div>

                    {/* Item 2 */}
                    <div className="flex items-center justify-between p-3 bg-gray-50/50 rounded-xl border border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className={`w-6 h-6 rounded flex items-center justify-center ${hasAvailability ? 'bg-teal-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7"></path></svg>
                            </div>
                            <span className="text-gray-900 font-medium text-sm">Configurar <span className="font-bold">Disponibilidad</span> horaria</span>
                        </div>
                         {hasAvailability && <span className="text-gray-400 text-xs">✓</span>}
                    </div>

                    {/* Item 3 */}
                    <div className="flex items-center justify-between p-3 bg-gray-50/50 rounded-xl border border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded bg-teal-500 text-white flex items-center justify-center">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7"></path></svg>
                            </div>
                            <span className="text-gray-900 font-medium text-sm">Comparte tu link público con clientes</span>
                        </div>
                        <div className="w-6 h-6 rounded-full bg-orange-300 text-white flex items-center justify-center text-xs font-bold">3</div>
                    </div>
                </div>
            </div>
         </div>

         {/* Right Column */}
         <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 min-h-[400px]">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Turnos de Hoy</h3>
            <p className="text-gray-500 text-sm mb-12">{dateString}</p>

            <div className="flex flex-col items-center justify-center">
                 {/* Illustration Placehodler - Person sitting on clock */}
                 <div className="bg-blue-50/50 rounded-full w-48 h-48 flex items-center justify-center mb-6 relative">
                    <svg className="w-40 h-40 text-blue-200" viewBox="0 0 100 100" fill="none">
                       {/* Abstract Clock */}
                       <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
                       <circle cx="50" cy="50" r="35" className="text-blue-100" fill="currentColor" fillOpacity="0.5" />
                       
                       {/* Abstract Person */}
                       <path d="M50 40 C50 35, 55 35, 55 40" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                       <circle cx="55" cy="30" r="6" fill="#60A5FA" />
                       <path d="M45 60 C45 60, 65 60, 65 60 L 65 80 L 75 80" stroke="#3B82F6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                       <path d="M55 40 L 55 60 L 45 70" stroke="#3B82F6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                       
                       {/* Clock Hands */}
                       <line x1="50" y1="50" x2="30" y2="60" stroke="#93C5FD" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                    
                    {/* Floating elements */}
                    <div className="absolute top-10 right-2 w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
                    <div className="absolute bottom-10 left-4 w-2 h-2 bg-blue-300 rounded-full"></div>
                 </div>

                 <h4 className="text-xl font-medium text-gray-900 mb-2">No hay turnos para hoy</h4>
                 <p className="text-gray-400 text-center max-w-xs">No tienes turnos programados para hoy...</p>
            </div>
         </div>
      </div>

    </div>
  );
}
