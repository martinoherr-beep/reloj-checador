import React, { useState } from 'react';
import { 
  auth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile 
} from '../firebase';
import { User, Mail, Lock, LogIn, UserPlus } from 'lucide-react';

export default function Auth() {
  const [esRegistro, setEsRegistro] = useState(false);
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);

    try {
      if (esRegistro) {
        if (!nombre.trim()) {
          setError('Ingresa el nombre del empleado');
          setCargando(false);
          return;
        }
        // Crear usuario
        const res = await createUserWithEmailAndPassword(auth, email, password);
        // Asignar el nombre del empleado al perfil de Firebase
        await updateProfile(res.user, { displayName: nombre });
      } else {
        // Iniciar sesión
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      switch (err.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          setError('Correo o contraseña incorrectos.');
          break;
        case 'auth/email-already-in-use':
          setError('Este correo ya está registrado.');
          break;
        case 'auth/weak-password':
          setError('La contraseña debe tener al menos 6 caracteres.');
          break;
        case 'auth/invalid-email':
          setError('Ingresa un correo válido.');
          break;
        default:
          setError('Error de autenticación. Intenta de nuevo.');
      }
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-center items-center p-4">
      <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700/80 shadow-2xl max-w-sm w-full">
        
        {/* Encabezado */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold tracking-wide">Reloj Checador</h1>
          <p className="text-slate-400 text-xs mt-1">
            {esRegistro ? 'Registrar nuevo empleado' : 'Ingresa tus credenciales para checar'}
          </p>
        </div>

        {/* Mensaje de error */}
        {error && (
          <div className="bg-rose-950/80 border border-rose-700 text-rose-300 text-xs p-3 rounded-xl mb-4 text-center font-medium">
            {error}
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Campo Nombre (Solo visible al crear usuario) */}
          {esRegistro && (
            <div>
              <label className="block text-slate-300 text-xs mb-1 font-semibold">Nombre Completo</label>
              <div className="relative">
                <User size={18} className="absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="Ej. Juan Pérez"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 pl-10 pr-3 text-sm focus:outline-none focus:border-indigo-500 transition"
                />
              </div>
            </div>
          )}

          {/* Campo Email */}
          <div>
            <label className="block text-slate-300 text-xs mb-1 font-semibold">Correo Electrónico</label>
            <div className="relative">
              <Mail size={18} className="absolute left-3 top-3 text-slate-400" />
              <input
                type="email"
                required
                placeholder="empleado@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 pl-10 pr-3 text-sm focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
          </div>

          {/* Campo Password */}
          <div>
            <label className="block text-slate-300 text-xs mb-1 font-semibold">Contraseña</label>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-3 text-slate-400" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 pl-10 pr-3 text-sm focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
          </div>

          {/* Botón Principal */}
          <button
            type="submit"
            disabled={cargando}
            className="w-full bg-indigo-600 hover:bg-indigo-500 font-semibold py-3 px-4 rounded-xl transition flex justify-center items-center gap-2 text-sm shadow-lg disabled:opacity-50 mt-2"
          >
            {cargando ? (
              'Procesando...'
            ) : esRegistro ? (
              <>
                <UserPlus size={18} /> Crear Cuenta
              </>
            ) : (
              <>
                <LogIn size={18} /> Iniciar Sesión
              </>
            )}
          </button>
        </form>

        {/* Alternar entre Login y Registro */}
        <div className="mt-6 text-center border-t border-slate-700/60 pt-4">
          <button
            type="button"
            onClick={() => {
              setEsRegistro(!esRegistro);
              setError('');
            }}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition"
          >
            {esRegistro
              ? '¿Ya tienes cuenta? Inicia sesión aquí'
              : '¿No tienes cuenta? Registra un nuevo usuario'}
          </button>
        </div>

      </div>
    </div>
  );
}