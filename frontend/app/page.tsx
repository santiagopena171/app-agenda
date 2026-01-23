export default function Home() {
  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* Fondo Animado con Gradiente */}
      <div className="fixed inset-0 bg-animated-gradient -z-10"></div>
      
      {/* Overlay para mejorar contraste */}
      <div className="fixed inset-0 bg-white/30 backdrop-blur-sm -z-10"></div>

      {/* Contenido Principal */}
      <div className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-5xl w-full">
          
          {/* Hero Section */}
          <div className="text-center mb-16 animate-fade-in">
            <div className="inline-block mb-6">
              <div className="bg-gradient-to-br from-blue-600 to-purple-600 w-20 h-20 rounded-2xl flex items-center justify-center shadow-xl shadow-purple-500/30 hover-lift">
                <span className="text-white text-4xl font-bold">A</span>
              </div>
            </div>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black mb-6 tracking-tight">
              <span className="text-gradient">App Agenda</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-700 font-medium max-w-2xl mx-auto leading-relaxed">
              Sistema de agendamiento de turnos{' '}
              <span className="text-gradient-fire font-bold">simple y profesional</span>{' '}
              para tu negocio
            </p>
          </div>

          {/* Cards Grid */}
          <div className="grid gap-8 md:grid-cols-2 max-w-4xl mx-auto">
            
            {/* Card Para Dueños */}
            <a
              href="/auth/login"
              className="group glass-card p-8 rounded-3xl hover-lift relative overflow-hidden animate-fade-in-scale"
            >
              {/* Efecto de brillo en hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              <div className="relative">
                {/* Icono */}
                <div className="mb-6 inline-flex">
                  <div className="p-4 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl shadow-lg group-hover:shadow-xl group-hover:shadow-purple-500/50 transition-all duration-300">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                </div>

                <h2 className="text-3xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                  Para Dueños
                </h2>
                
                <p className="text-gray-600 text-lg mb-4 leading-relaxed">
                  Inicia sesión y gestiona tu agenda de forma profesional. Control total de tus turnos.
                </p>

                {/* CTA Arrow */}
                <div className="flex items-center text-blue-600 font-semibold group-hover:gap-3 gap-2 transition-all">
                  <span>Ingresar ahora</span>
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              </div>
            </a>

            {/* Card Para Clientes */}
            <div className="group glass-card p-8 rounded-3xl relative overflow-hidden animate-fade-in-scale delay-100">
              {/* Efecto de brillo en hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              <div className="relative">
                {/* Icono */}
                <div className="mb-6 inline-flex">
                  <div className="p-4 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl shadow-lg group-hover:shadow-xl group-hover:shadow-emerald-500/50 transition-all duration-300">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>

                <h2 className="text-3xl font-bold text-gray-900 mb-3">
                  Para Clientes
                </h2>
                
                <p className="text-gray-600 text-lg mb-4 leading-relaxed">
                  Accede mediante el link único de tu local favorito y agenda tu turno en segundos.
                </p>

                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-full">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="text-emerald-700 font-medium text-sm">Sin registro requerido</span>
                </div>
              </div>
            </div>

          </div>

          {/* Features Badges */}
          <div className="mt-16 flex flex-wrap justify-center gap-4 animate-fade-in delay-200">
            <div className="glass px-5 py-3 rounded-full border border-white/40 backdrop-blur-md">
              <div className="flex items-center gap-2 text-gray-700">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <span className="font-medium">Confirmación automática</span>
              </div>
            </div>
            
            <div className="glass px-5 py-3 rounded-full border border-white/40 backdrop-blur-md">
              <div className="flex items-center gap-2 text-gray-700">
                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span className="font-medium">100% Seguro</span>
              </div>
            </div>
            
            <div className="glass px-5 py-3 rounded-full border border-white/40 backdrop-blur-md">
              <div className="flex items-center gap-2 text-gray-700">
                <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="font-medium">Rápido y fácil</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </main>
  )
}
