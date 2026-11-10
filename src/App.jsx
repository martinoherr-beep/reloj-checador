import React, { useState, useEffect } from 'react';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import Auth from './components/Auth';
import RelojChecador from './components/RelojChecador';
import { Loader2 } from 'lucide-react';
import { getDeviceId } from './utils/device';

export async function validarDispositivoUsuario(usuario) {
  const currentDeviceId = getDeviceId();
  const userRef = doc(db, 'usuarios', usuario.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    // Si es su primera vez, vinculamos este celular a su cuenta
    await setDoc(userRef, {
      email: usuario.email,
      nombre: usuario.displayName || usuario.email,
      deviceId: currentDeviceId,
      vinculadoEn: new Date()
    });
    return { valido: true };
  } else {
    const data = userSnap.data();
    // Si la cuenta ya tiene un dispositivo registrado y no coincide
    if (data.deviceId && data.deviceId !== currentDeviceId) {
      return { 
        valido: false, 
        mensaje: 'Esta cuenta está vinculada a otro dispositivo. No puedes iniciar sesión desde este celular.' 
      };
    }
    return { valido: true };
  }
}
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