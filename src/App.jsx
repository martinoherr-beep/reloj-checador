import React, { useState, useEffect } from 'react';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import Auth from './components/Auth';
import RelojChecador from './components/RelojChecador';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    // Escuchar el estado de la sesión de Firebase en tiempo real
    const unsubscribe = onAuthStateChanged(auth, (userFirebase) => {
      setUsuario(userFirebase);
      setCargando(false);
    });

    return () => unsubscribe();
  }, []);

  // Pantalla de carga mientras se verifica el token de sesión
  if (cargando) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-center items-center gap-3">
        <Loader2 className="animate-spin text-indigo-500" size={36} />
        <p className="text-xs text-slate-400 font-medium">Verificando sesión...</p>
      </div>
    );
  }

  // Si hay usuario autenticado renderiza el Reloj, de lo contrario muestra el Login
  return (
    <main className="min-h-screen bg-slate-900">
      {usuario ? <RelojChecador usuario={usuario} /> : <Auth />}
    </main>
  );
}