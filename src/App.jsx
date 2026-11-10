import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import Auth from './components/Auth';
import RelojChecador from './components/RelojChecador';
import AdminPanel from './components/AdminPanel';
import { Loader2 } from 'lucide-react';
import { getDeviceId } from './utils/device';

// Función para validar la vinculación de dispositivo único
export async function validarDispositivoUsuario(usuario) {
  const currentDeviceId = getDeviceId();
  const userRef = doc(db, 'usuarios', usuario.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    // Primera vez: vinculamos este celular a su cuenta
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
  const [vistaAdmin, setVistaAdmin] = useState(false);

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
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center gap-3">
        <Loader2 className="animate-spin text-orange-500" size={36} />
        <p className="text-xs text-slate-400 font-medium tracking-wide">Sincronizando Radiorama...</p>
      </div>
    );
  }

  // Si no hay usuario autenticado, renderiza el Login
  if (!usuario) {
    return <Auth />;
  }

  // Renderiza el Checador o el Panel de Administrador según el estado
  return (
    <main className="min-h-screen bg-slate-950">
      {!vistaAdmin ? (
        <div className="relative">
          <RelojChecador usuario={usuario} />
          <div className="text-center pb-4 bg-slate-950">
            <button
              onClick={() => setVistaAdmin(true)}
              className="text-xs text-slate-500 hover:text-orange-400 font-semibold underline transition"
            >
              Acceso a Panel Admin / Reportes
            </button>
          </div>
        </div>
      ) : (
        <AdminPanel volverAlChecador={() => setVistaAdmin(false)} />
      )}
    </main>
  );
}