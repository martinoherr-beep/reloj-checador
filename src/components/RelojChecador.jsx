import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { signOut } from 'firebase/auth';
import { collection, addDoc, serverTimestamp, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { OFICINA_COORDS, RADIO_PERMITIDO_METROS, calcularDistanciaMetros } from '../utils/geo';
import { MapPin, LogOut, CheckCircle2, AlertCircle, Clock, Calendar, Radio, ShieldCheck, UserCheck, Utensils, LogIn, LogOut as LogOutIcon, Coffee, PartyPopper } from 'lucide-react';

export default function RelojChecador({ usuario }) {
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const [registros, setRegistros] = useState([]);
  const [horaActual, setHoraActual] = useState(new Date());

  // Actualizar reloj en vivo
  useEffect(() => {
    const timer = setInterval(() => setHoraActual(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Escuchar historial de asistencias en tiempo real desde Firestore
  useEffect(() => {
    if (!usuario) return;

    const q = query(
      collection(db, 'asistencias'),
      where('userId', '==', usuario.uid),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(
      q, 
      (snapshot) => {
        setRegistros(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      },
      (err) => {
        console.error("Error al obtener asistencias:", err);
      }
    );

    return () => unsubscribe();
  }, [usuario]);

  // Obtener EXCLUSIVAMENTE los registros correspondientes al día de HOY
  const registrosHoy = registros.filter((reg) => {
    if (!reg.timestamp) return false;
    const fechaReg = reg.timestamp.toDate();
    const hoy = new Date();
    return (
      fechaReg.getDate() === hoy.getDate() &&
      fechaReg.getMonth() === hoy.getMonth() &&
      fechaReg.getFullYear() === hoy.getFullYear()
    );
  });

  const tiposRegistradosHoy = registrosHoy.map((reg) => reg.tipo);
  const diaTerminado = tiposRegistradosHoy.includes('Salida Final');

  const registrar = (tipo) => {
    setCargando(true);
    setMensaje(null);

    if (!navigator.geolocation) {
      setMensaje({ tipo: 'error', texto: 'Tu dispositivo no soporta geolocalización.' });
      setCargando(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const distancia = calcularDistanciaMetros(latitude, longitude, OFICINA_COORDS.lat, OFICINA_COORDS.lng);

        if (distancia > RADIO_PERMITIDO_METROS) {
          setMensaje({
            tipo: 'error',
            texto: `Fuera de rango (${Math.round(distancia)}m de distancia. Máx: ${RADIO_PERMITIDO_METROS}m).`
          });
          setCargando(false);
          return;
        }

        try {
          await addDoc(collection(db, 'asistencias'), {
            userId: usuario.uid,
            usuarioNombre: usuario.displayName || usuario.email,
            tipo,
            timestamp: serverTimestamp(),
            distanciaMetros: Math.round(distancia),
            coordenadas: { lat: latitude, lng: longitude }
          });

          if (tipo === 'Salida Final') {
            setMensaje({ 
              tipo: 'despedida', 
              texto: '¡Buen trabajo, nos vemos mañana! 👋' 
            });
          } else {
            setMensaje({ 
              tipo: 'exito', 
              texto: `¡Registro de "${tipo}" guardado con éxito!` 
            });
          }
        } catch (err) {
          console.error(err);
          setMensaje({ tipo: 'error', texto: 'Error al conectar con la base de datos.' });
        } finally {
          setCargando(false);
        }
      },
      (err) => {
        setCargando(false);
        setMensaje({ tipo: 'error', texto: 'Por favor, activa el GPS de tu dispositivo.' });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const formatearFechaHora = (timestamp) => {
    if (!timestamp) return { fecha: 'Sincronizando...', hora: '--:--' };
    const date = timestamp.toDate();
    const fecha = date.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' });
    const hora = date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: true });
    return { fecha, hora };
  };

  const getBadgeStyle = (tipo) => {
    switch (tipo) {
      case 'Entrada Mañana':
        return { color: 'text-emerald-400', border: 'bg-emerald-500' };
      case 'Salida a Comer':
        return { color: 'text-amber-400', border: 'bg-amber-500' };
      case 'Regreso de Comer':
        return { color: 'text-blue-400', border: 'bg-blue-500' };
      case 'Salida Final':
        return { color: 'text-rose-400', border: 'bg-rose-500' };
      default:
        return { color: 'text-slate-400', border: 'bg-slate-500' };
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-3 sm:p-6 font-sans">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col justify-between">
        
        {/* Header Radiorama */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 p-5 border-b border-slate-800/80">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-500/10 border border-orange-500/40 rounded-2xl flex items-center justify-center text-orange-500 shadow-lg shadow-orange-500/10">
                <Radio size={20} className="animate-pulse" />
              </div>
              <div>
                <h1 className="font-black text-orange-500 text-lg tracking-wider leading-none">
                  RADIORAMA
                </h1>
                <span className="text-[10px] text-slate-400 font-bold tracking-widest uppercase flex items-center gap-1 mt-0.5">
                  <ShieldCheck size={11} className="text-orange-400" /> Control Digital
                </span>
              </div>
            </div>

            <button 
              onClick={() => signOut(auth)} 
              className="text-slate-400 hover:text-rose-400 p-2.5 rounded-2xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 transition active:scale-95"
              title="Cerrar sesión"
            >
              <LogOut size={18} />
            </button>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 p-3.5 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center font-bold text-sm">
                <UserCheck size={18} />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">Empleado activo</span>
                <h2 className="font-bold text-sm text-slate-100 truncate max-w-[170px]">
                  {usuario?.displayName || usuario?.email}
                </h2>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              En línea
            </span>
          </div>
        </div>

        {/* Cuerpo principal */}
        <div className="p-5 space-y-5">
          
          {/* Reloj Digital */}
          <div className="text-center bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4 shadow-inner">
            <p className="text-xs text-orange-400/90 font-semibold tracking-wide uppercase mb-1 flex items-center justify-center gap-1.5">
              <Clock size={13} /> Hora oficial de registro
            </p>
            <div className="text-3xl font-black text-slate-100 tracking-tight font-mono">
              {horaActual.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
            <p className="text-[11px] text-slate-400 capitalize mt-1">
              {horaActual.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>

          {/* Banner de Jornada Concluida */}
          {diaTerminado && (
            <div className="bg-gradient-to-r from-orange-950/60 via-slate-900 to-amber-950/60 border border-orange-500/30 rounded-2xl p-4 text-center shadow-lg">
              <PartyPopper size={28} className="mx-auto text-orange-400 mb-1 animate-bounce" />
              <h3 className="text-sm font-bold text-orange-300">¡Jornada de hoy completada!</h3>
              <p className="text-xs text-slate-400 mt-0.5">Buen trabajo, nos vemos mañana.</p>
            </div>
          )}

          {/* Cuadrícula con los 4 Botones de Registro */}
          <div className="grid grid-cols-2 gap-3">
            
            {/* 1. Entrada Mañana */}
            {(() => {
              const estaChecado = tiposRegistradosHoy.includes('Entrada Mañana');
              return (
                <button
                  onClick={() => registrar('Entrada Mañana')}
                  disabled={cargando || estaChecado}
                  className={`p-3.5 rounded-2xl font-bold transition-all border flex flex-col items-center text-center gap-1.5 ${
                    estaChecado
                      ? 'bg-emerald-950/20 border-emerald-900/30 text-emerald-600/60 cursor-not-allowed opacity-40'
                      : 'bg-emerald-950/40 hover:bg-emerald-900/50 active:scale-95 text-emerald-200 border-emerald-800/60'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${estaChecado ? 'bg-emerald-900/20 text-emerald-700/50' : 'bg-emerald-500/20 text-emerald-400'}`}>
                    <LogIn size={18} />
                  </div>
                  <span className="text-xs font-bold leading-tight">
                    {estaChecado ? '✓ Entrada Mañana' : '1. Entrada Mañana'}
                  </span>
                </button>
              );
            })()}

            {/* 2. Salida a Comer */}
            {(() => {
              const estaChecado = tiposRegistradosHoy.includes('Salida a Comer');
              return (
                <button
                  onClick={() => registrar('Salida a Comer')}
                  disabled={cargando || estaChecado}
                  className={`p-3.5 rounded-2xl font-bold transition-all border flex flex-col items-center text-center gap-1.5 ${
                    estaChecado
                      ? 'bg-amber-950/20 border-amber-900/30 text-amber-600/60 cursor-not-allowed opacity-40'
                      : 'bg-amber-950/40 hover:bg-amber-900/50 active:scale-95 text-amber-200 border-amber-800/60'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${estaChecado ? 'bg-amber-900/20 text-amber-700/50' : 'bg-amber-500/20 text-amber-400'}`}>
                    <Utensils size={18} />
                  </div>
                  <span className="text-xs font-bold leading-tight">
                    {estaChecado ? '✓ Salida Comida' : '2. Salida Comida'}
                  </span>
                </button>
              );
            })()}

            {/* 3. Regreso de Comer */}
            {(() => {
              const estaChecado = tiposRegistradosHoy.includes('Regreso de Comer');
              return (
                <button
                  onClick={() => registrar('Regreso de Comer')}
                  disabled={cargando || estaChecado}
                  className={`p-3.5 rounded-2xl font-bold transition-all border flex flex-col items-center text-center gap-1.5 ${
                    estaChecado
                      ? 'bg-blue-950/20 border-blue-900/30 text-blue-600/60 cursor-not-allowed opacity-40'
                      : 'bg-blue-950/40 hover:bg-blue-900/50 active:scale-95 text-blue-200 border-blue-800/60'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${estaChecado ? 'bg-blue-900/20 text-blue-700/50' : 'bg-blue-500/20 text-blue-400'}`}>
                    <Coffee size={18} />
                  </div>
                  <span className="text-xs font-bold leading-tight">
                    {estaChecado ? '✓ Regreso Comida' : '3. Regreso Comida'}
                  </span>
                </button>
              );
            })()}

            {/* 4. Salida Final */}
            {(() => {
              const estaChecado = tiposRegistradosHoy.includes('Salida Final');
              return (
                <button
                  onClick={() => registrar('Salida Final')}
                  disabled={cargando || estaChecado}
                  className={`p-3.5 rounded-2xl font-bold transition-all border flex flex-col items-center text-center gap-1.5 ${
                    estaChecado
                      ? 'bg-rose-950/20 border-rose-900/30 text-rose-600/60 cursor-not-allowed opacity-40'
                      : 'bg-rose-950/40 hover:bg-rose-900/50 active:scale-95 text-rose-200 border-rose-800/60'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${estaChecado ? 'bg-rose-900/20 text-rose-700/50' : 'bg-rose-500/20 text-rose-400'}`}>
                    <LogOutIcon size={18} />
                  </div>
                  <span className="text-xs font-bold leading-tight">
                    {estaChecado ? '✓ Salida Final' : '4. Salida Final'}
                  </span>
                </button>
              );
            })()}

          </div>

          {/* Mensajes de Estado y Despedida */}
          {mensaje && (
            <div className={`p-3.5 rounded-2xl flex items-center gap-3 text-xs font-semibold shadow-md ${
              mensaje.tipo === 'error' 
                ? 'bg-rose-950/90 border border-rose-800 text-rose-200' 
                : mensaje.tipo === 'despedida'
                ? 'bg-orange-950/90 border border-orange-700 text-orange-200'
                : 'bg-emerald-950/90 border border-emerald-800 text-emerald-200'
            }`}>
              {mensaje.tipo === 'error' ? (
                <AlertCircle size={20} className="shrink-0 text-rose-400"/> 
              ) : mensaje.tipo === 'despedida' ? (
                <PartyPopper size={20} className="shrink-0 text-orange-400"/>
              ) : (
                <CheckCircle2 size={20} className="shrink-0 text-emerald-400"/>
              )}
              <span>{mensaje.texto}</span>
            </div>
          )}

          {/* Lista de Registros del Día (Empieza vacía al inicio del día) */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 shadow-xl">
            <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-800/80">
              <h3 className="font-bold text-slate-200 text-xs flex items-center gap-2 uppercase tracking-wider">
                <Calendar size={14} className="text-orange-500" />
                Marcas del Día
              </h3>
              <span className="text-[10px] text-slate-400 bg-slate-800 px-2.5 py-0.5 rounded-full font-bold">
                {registrosHoy.length} de 4 marcas
              </span>
            </div>

            <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
              {registrosHoy.length === 0 ? (
                <div className="text-center py-6 text-slate-500">
                  <Clock size={28} className="mx-auto mb-2 opacity-30 text-slate-400" />
                  <p className="text-xs font-medium">Sin marcas el día de hoy.</p>
                  <p className="text-[10px] text-slate-600 mt-0.5">Se irán agregando a medida que registres cada turno.</p>
                </div>
              ) : (
                registrosHoy.map((reg) => {
                  const { fecha, hora } = formatearFechaHora(reg.timestamp);
                  const badge = getBadgeStyle(reg.tipo);

                  return (
                    <div 
                      key={reg.id} 
                      className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center justify-between hover:border-slate-700 transition"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-9 rounded-full ${badge.border}`} />
                        <div>
                          <span className={`text-[11px] font-black uppercase tracking-wider ${badge.color}`}>
                            {reg.tipo}
                          </span>
                          <p className="text-[10px] text-slate-400 capitalize font-medium">
                            {fecha}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xs font-bold text-slate-100 font-mono">
                          {hora}
                        </div>
                        <div className="inline-flex items-center gap-1 text-[9px] font-medium text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800/80 mt-0.5">
                          <MapPin size={9} className="text-orange-500" />
                          <span>{reg.distanciaMetros}m oficina</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-slate-950 p-3 border-t border-slate-800/80 text-center">
          <p className="text-[10px] text-slate-500 font-semibold tracking-wide">
            RADIORAMA • SISTEMA DE ASISTENCIA GPS
          </p>
        </div>

      </div>
    </div>
  );
}