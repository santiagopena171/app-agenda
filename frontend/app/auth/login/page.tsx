'use client';

import { useState } from 'react';
import { auth } from '@/lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [localName, setLocalName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegistering) {
        // Registrar nuevo usuario
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const userId = userCredential.user.uid;

        // Crear documento de usuario en Firestore
        const publicSlug = generateSlug(localName);
        await setDoc(doc(db, 'users', userId), {
          email,
          createdAt: new Date(),
          localName,
          localDescription: '',
          publicSlug,
          timezone: 'America/Montevideo',
          isActive: true,
        });

        router.push('/dashboard');
      } else {
        // Iniciar sesión
        await signInWithEmailAndPassword(auth, email, password);
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Error en la autenticación');
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') + '-' + Date.now().toString(36);
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Fondo Animado con Gradiente */}
      <div className="fixed inset-0 bg-animated-gradient -z-10"></div>

      {/* Overlay para mejorar contraste */}
      <div className="fixed inset-0 bg-white/20 backdrop-blur-sm -z-10"></div>

      {/* Contenedor Principal */}
      <div className="max-w-md w-full relative z-10 animate-fade-in-scale">

        {/* Logo y Título */}
        <div className="text-center mb-8">
          <div className="inline-flex mb-4">
            <div className="bg-gradient-to-br from-blue-600 to-purple-600 w-16 h-16 rounded-2xl flex items-center justify-center shadow-xl shadow-purple-500/40 hover-lift">
              <span className="text-white text-3xl font-bold">A</span>
            </div>
          </div>

          <h2 className="text-4xl font-black text-gray-900 mb-2">
            {isRegistering ? 'Crear cuenta' : 'Bienvenido'}
          </h2>

          <p className="text-gray-600 font-medium">
            {isRegistering ? 'Comienza a gestionar tus turnos' : 'Inicia sesión en tu cuenta'}
          </p>
        </div>

        {/* Card de Formulario */}
        <div className="glass-card p-8 rounded-3xl shadow-2xl">
          <form className="space-y-5" onSubmit={handleSubmit}>

            {/* Campo Nombre del Local (solo registro) */}
            {isRegistering && (
              <div className="animate-fade-in">
                <label htmlFor="local-name" className="block text-sm font-semibold text-gray-700 mb-2">
                  Nombre del local
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <input
                    id="local-name"
                    name="localName"
                    type="text"
                    required={isRegistering}
                    className="block w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white/80 backdrop-blur-sm"
                    placeholder="Ej: Peluquería Estilo"
                    value={localName}
                    onChange={(e) => setLocalName(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Campo Email */}
            <div>
              <label htmlFor="email-address" className="block text-sm font-semibold text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="block w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white/80 backdrop-blur-sm"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Campo Contraseña */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="block w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white/80 backdrop-blur-sm"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {/* Mensaje de Error */}
            {error && (
              <div className="animate-fade-in p-3 bg-red-50 border border-red-200 rounded-xl">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-red-800 font-medium">{error}</p>
                </div>
              </div>
            )}

            {/* Botón Submit */}
            <button
              type="submit"
              disabled={loading}
              className="relative w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent rounded-xl text-white font-bold text-base bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 transition-all duration-300 hover:-translate-y-0.5"
            >
              {loading ? (
                <>
                  <div className="spinner w-5 h-5"></div>
                  <span>Procesando...</span>
                </>
              ) : (
                <>
                  {isRegistering ? (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                      <span>Registrarse</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                      </svg>
                      <span>Iniciar sesión</span>
                    </>
                  )}
                </>
              )}
            </button>

            {/* Toggle Registro/Login */}
            <div className="text-center pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => {
                  setIsRegistering(!isRegistering);
                  setError('');
                }}
                className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
              >
                {isRegistering
                  ? '¿Ya tienes cuenta? Inicia sesión'
                  : '¿No tienes cuenta? Regístrate'}
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-sm text-gray-600">
          Sistema de agendamiento profesional 🚀
        </p>
      </div>
    </div>
  );
}
