'use client';

import { useState } from 'react';
import { Calendar, CalendarDays, Scissors, Link as LinkIcon, Copy } from 'lucide-react';

export default function DashboardPage() {
  const [copied, setCopied] = useState(false);
  const publicLink = "http://localhost:3004/book/santirep-mkg81hg2";

  const handleCopy = () => {
    navigator.clipboard.writeText(publicLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-6 flex flex-col gap-6 pb-12">
      {/* Título Principal */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Santirep</h1>
        <p className="text-gray-500 text-sm mt-1">Bienvenido a tu panel de control</p>
      </div>

      {/* Sección Superior: Stats */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Card 1 */}
        <div className="flex-1 bg-white border border-gray-200 p-5 rounded-lg hover:bg-gray-50 transition-colors">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-sm text-gray-600 font-medium">Turnos de Hoy</p>
          </div>
          <p className="text-4xl font-bold text-gray-900">0</p>
        </div>
        {/* Card 2 */}
        <div className="flex-1 bg-white border border-gray-200 p-5 rounded-lg hover:bg-gray-50 transition-colors">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Scissors className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-sm text-gray-600 font-medium">Servicios Activos</p>
          </div>
          <p className="text-4xl font-bold text-gray-900">0</p>
        </div>
        {/* Card 3 */}
        <div className="flex-1 bg-white border border-gray-200 p-5 rounded-lg hover:bg-gray-50 transition-colors">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <CalendarDays className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-sm text-gray-600 font-medium">Turnos Esta Semana</p>
          </div>
          <p className="text-4xl font-bold text-gray-900">0</p>
        </div>
      </div>

      {/* Layout: Link Público (izquierda) + Turnos de Hoy (derecha) */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Link Público - Más pequeño */}
        <div className="w-full lg:w-[35%] bg-white border border-gray-200 p-6 rounded-lg">
           <div className="mb-4">
             <div className="flex items-center gap-2 mb-2">
               <LinkIcon className="w-5 h-5 text-blue-500" />
               <h2 className="text-lg font-bold text-gray-900">Link Público</h2>
             </div>
             <p className="text-sm text-gray-500">Comparte este link con s tus clientes para que reserven turnos.</p>
           </div>
           
           <div className="flex flex-col gap-2">
             <input 
               type="text" 
               readOnly 
               value={publicLink} 
               className="w-full bg-gray-50 border border-gray-200 text-gray-600 text-sm rounded px-3 py-2.5 outline-none"
             />
             <button 
               onClick={handleCopy}
               className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2.5 rounded text-sm transition-colors flex items-center justify-center gap-2"
             >
               <Copy className="w-4 h-4" />
               Copiar Link
             </button>
           </div>
        </div>

        {/* Turnos de Hoy - Más grande */}
        <div className="w-full lg:w-[65%] bg-white border border-gray-200 p-6 rounded-lg min-h-[500px] flex flex-col">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900">Turnos de Hoy</h2>
            <p className="text-sm text-gray-500 mt-0.5">viernes, 23 de enero de 2026</p>
          </div>
          
          <div className="flex flex-col items-center justify-center py-8">
            {/* Ilustración SVG */}
            <svg className="w-56 h-56 mb-4" viewBox="0 0 200 200" fill="none">
              {/* Reloj de fondo */}
              <circle cx="100" cy="120" r="60" fill="#EFF6FF" />
              <circle cx="100" cy="120" r="50" stroke="#DBEAFE" strokeWidth="2" fill="white" />
              
              {/* Marcas del reloj */}
              <line x1="100" y1="75" x2="100" y2="80" stroke="#93C5FD" strokeWidth="2" />
              <line x1="100" y1="160" x2="100" y2="165" stroke="#93C5FD" strokeWidth="2" />
              <line x1="145" y1="120" x2="150" y2="120" stroke="#93C5FD" strokeWidth="2" />
              <line x1="50" y1="120" x2="55" y2="120" stroke="#93C5FD" strokeWidth="2" />
              
              {/* Manecillas */}
              <line x1="100" y1="120" x2="100" y2="95" stroke="#60A5FA" strokeWidth="3" strokeLinecap="round" />
              <line x1="100" y1="120" x2="120" y2="120" stroke="#60A5FA" strokeWidth="3" strokeLinecap="round" />
              <circle cx="100" cy="120" r="4" fill="#3B82F6" />
              
              {/* Persona sentada */}
              <circle cx="135" cy="95" r="12" fill="#60A5FA" />
              <path d="M 135 107 L 135 130 L 125 145" stroke="#3B82F6" strokeWidth="5" strokeLinecap="round" />
              <path d="M 135 130 L 145 145" stroke="#3B82F6" strokeWidth="5" strokeLinecap="round" />
              <path d="M 135 115 L 125 125 L 120 120" stroke="#3B82F6" strokeWidth="4" strokeLinecap="round" />
              <path d="M 135 115 L 145 125" stroke="#3B82F6" strokeWidth="4" strokeLinecap="round" />
              
              {/* Elementos decorativos */}
              <circle cx="160" cy="90" r="3" fill="#93C5FD" opacity="0.5" />
              <circle cx="50" cy="140" r="2" fill="#93C5FD" opacity="0.5" />
              <circle cx="170" cy="130" r="4" fill="#60A5FA" opacity="0.3" />
            </svg>
            
            <h3 className="text-lg font-medium text-gray-900 mb-1">No hay turnos para hoy</h3>
            <p className="text-gray-500 text-sm">No tienes turnos programados para hoy...</p>
          </div>
        </div>
      </div>
    </div>
  );
}
