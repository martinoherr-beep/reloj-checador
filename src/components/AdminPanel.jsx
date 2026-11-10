import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import * as XLSX from 'xlsx';
import { Calendar, Download, Search, Radio, MapPin, User, ArrowLeft, RefreshCw, Lock, KeyRound, AlertCircle } from 'lucide-react';

// Define aquí la contraseña de acceso al panel
const CLAVE_ADMIN_CORRECTA = "1234"; // Cambia "1234" por la contraseña que prefieras

export default function AdminPanel({ volverAlChecador }) {
  const [autenticado, setAutenticado] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [errorPassword, setErrorPassword] = useState(false);

  const [registros, setRegistros] = useState([]);
  const [cargando, setCargando] = useState(true);
  
  // Filtros
  const [busquedaUsuario, setBusquedaUsuario] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  // Escuchar toda la colección de asistencias solo cuando el admin ingresa la contraseña
  useEffect(() => {
    if (!autenticado) return;

    const q = query(
      collection(db, 'asistencias'),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setRegistros(docs);
      setCargando(false);
    }, (err) => {
      console.error("Error al obtener reporte:", err);
      setCargando(false);
    });

    return () => unsubscribe();
  }, [autenticado]);

  const validarAcceso = (e) => {
    e.preventDefault();
    if (passwordInput === CLAVE_ADMIN_CORRECTA) {
      setAutenticado(true);
      setErrorPassword(false);
    } else {
      setErrorPassword(true);
    }
  };

  const formatearFechaHora = (timestamp) => {
    if (!timestamp) return { fecha: 'Procesando...', hora: '--:--', jsDate: new Date(0) };
    const jsDate = timestamp.toDate();
    const fecha = jsDate.toLocaleDateString('es-MX', { year: 'numeric', month: '2-digit', day: '2-digit' });
    const hora = jsDate.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
    return { fecha, hora, jsDate };
  };

  // Filtrado de registros dinámico (Requiere obligatoriamente que haya texto en `busquedaUsuario`)
  const registrosFiltrados = registros.filter((reg) => {
    const textoBusqueda = busquedaUsuario.trim().toLowerCase();
    
    // Si no se ha escrito nada en la búsqueda de empleado, no se muestra ningún registro
    if (!textoBusqueda) return false;

    const { jsDate } = formatearFechaHora(reg.timestamp);
    const nombreOCorreo = (reg.usuarioNombre || reg.userId || '').toLowerCase();
    
    const coincideUsuario = nombreOCorreo.includes(textoBusqueda);
    
    let coincideFecha = true;
    if (fechaInicio) {
      const fInicio = new Date(fechaInicio + 'T00:00:00');
      coincideFecha = coincideFecha && jsDate >= fInicio;
    }
    if (fechaFin) {
      const fFin = new Date(fechaFin + 'T23:59:59');
      coincideFecha = coincideFecha && jsDate <= fFin;
    }

    return coincideUsuario && coincideFecha;
  });

  const exportarAExcel = () => {
    if (registrosFiltrados.length === 0) {
      alert("Busca a un empleado primero para poder exportar sus registros.");
      return;
    }

    const datosExcel = registrosFiltrados.map((reg, index) => {
      const { fecha, hora } = formatearFechaHora(reg.timestamp);
      return {
        '#': index + 1,
        'Empleado / Usuario': reg.usuarioNombre || reg.userId,
        'Tipo de Registro': reg.tipo,
        'Fecha': fecha,
        'Hora': hora,
        'Distancia a Oficina (Metros)': `${reg.distanciaMetros || 0} m`,
        'Latitud': reg.coordenadas?.lat || 'N/A',
        'Longitud': reg.coordenadas?.lng || 'N/A'
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(datosExcel);
    worksheet['!cols'] = [
      { wch: 5 }, { wch: 30 }, { wch: 20 }, { wch: 15 }, 
      { wch: 15 }, { wch: 25 }, { wch: 15 }, { wch: 15 }
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Asistencias Radiorama');

    const hoyStr = new Date().toISOString().split('T')[0];
    XLSX.writeFile(workbook, `Reporte_Asistencias_${busquedaUsuario.trim().replace(/\s+/g, '_')}_${hoyStr}.xlsx`);
  };

  // PANTALLA 1: Solicitar contraseña antes de mostrar el panel
  if (!autenticado) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative">
          <button 
            onClick={volverAlChecador}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition mb-4 inline-flex items-center gap-1.5 text-xs font-semibold"
          >
            <ArrowLeft size={16} /> Volver al Checador
          </button>

          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-orange-500/10 border border-orange-500/40 rounded-2xl flex items-center justify-center text-orange-500 mx-auto mb-3 shadow-lg shadow-orange-500/10">
              <Lock size={24} />
            </div>
            <h2 className="text-lg font-black text-slate-100">Acceso Administrativo</h2>
            <p className="text-xs text-slate-400 mt-1">Ingresa la clave para consultar reportes</p>
          </div>

          <form onSubmit={validarAcceso} className="space-y-4">
            <div>
              <div className="relative">
                <input 
                  type="password"
                  placeholder="Contraseña de administrador"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-4 py-3 pl-10 text-sm text-slate-100 focus:outline-none focus:border-orange-500 font-mono tracking-widest"
                  autoFocus
                />
                <KeyRound size={18} className="absolute left-3.5 top-3.5 text-slate-500" />
              </div>
            </div>

            {errorPassword && (
              <div className="bg-rose-950/80 border border-rose-800 text-rose-200 p-3 rounded-xl text-xs font-semibold flex items-center gap-2">
                <AlertCircle size={16} className="text-rose-400 shrink-0" />
                <span>Contraseña incorrecta. Inténtalo de nuevo.</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-orange-600 hover:bg-orange-500 active:scale-95 text-white font-bold py-3 rounded-2xl transition shadow-lg shadow-orange-950/50 text-xs uppercase tracking-wider"
            >
              Ingresar al Panel
            </button>
          </form>
        </div>
      </div>
    );
  }

  // PANTALLA 2: Panel de Administración (Una vez desbloqueado)
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-3 sm:p-6 font-sans">
      <div className="max-w-5xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
        
        {/* Header Panel Administrador */}
        <div className="bg-slate-900 p-5 border-b border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={volverAlChecador}
              className="p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition active:scale-95"
              title="Volver al Checador"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="w-10 h-10 bg-orange-500/10 border border-orange-500/40 rounded-2xl flex items-center justify-center text-orange-500">
              <Radio size={20} />
            </div>
            <div>
              <h1 className="font-black text-orange-500 text-xl tracking-wider leading-none">
                RADIORAMA
              </h1>
              <span className="text-xs text-slate-400 font-bold tracking-widest uppercase">
                Panel de Administración y Consultas
              </span>
            </div>
          </div>

          <button
            onClick={exportarAExcel}
            disabled={cargando || registrosFiltrados.length === 0}
            className="bg-emerald-600 hover:bg-emerald-500 active:scale-95 disabled:opacity-40 text-white font-bold px-4 py-2.5 rounded-2xl transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 border border-emerald-400/30 text-sm"
          >
            <Download size={18} />
            Exportar a Excel (.xlsx)
          </button>
        </div>

        {/* Sección de Filtros */}
        <div className="p-5 bg-slate-950/50 border-b border-slate-800 space-y-4">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Search size={14} className="text-orange-500" /> Consulta de Asistencias
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Buscar Empleado */}
            <div>
              <label className="text-[11px] text-slate-400 font-semibold block mb-1">
                Escribe el nombre del empleado <span className="text-orange-400">*Requerido</span>
              </label>
              <div className="relative">
                <input 
                  type="text"
                  placeholder="Ej. Hector Ogaz..."
                  value={busquedaUsuario}
                  onChange={(e) => setBusquedaUsuario(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 pl-9 text-xs text-slate-100 focus:outline-none focus:border-orange-500"
                />
                <User size={15} className="absolute left-3 top-2.5 text-slate-500" />
              </div>
            </div>

            {/* Fecha Inicio */}
            <div>
              <label className="text-[11px] text-slate-400 font-medium block mb-1">Desde fecha (Opcional)</label>
              <input 
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-orange-500"
              />
            </div>

            {/* Fecha Fin */}
            <div>
              <label className="text-[11px] text-slate-400 font-medium block mb-1">Hasta fecha (Opcional)</label>
              <input 
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>
        </div>

        {/* Resumen y Tabla de Registros */}
        <div className="p-5">
          <div className="flex justify-between items-center mb-4">
            <span className="text-xs text-slate-400 font-semibold">
              Mostrando <strong className="text-orange-400">{registrosFiltrados.length}</strong> marcas registradas
            </span>
            
            {(busquedaUsuario || fechaInicio || fechaFin) && (
              <button 
                onClick={() => { setBusquedaUsuario(''); setFechaInicio(''); setFechaFin(''); }}
                className="text-[11px] text-orange-400 hover:underline flex items-center gap-1"
              >
                <RefreshCw size={12} /> Limpiar consulta
              </button>
            )}
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-800">
                <tr>
                  <th className="p-3.5">Empleado</th>
                  <th className="p-3.5">Tipo de Registro</th>
                  <th className="p-3.5">Fecha</th>
                  <th className="p-3.5">Hora</th>
                  <th className="p-3.5">GPS / Distancia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
                {cargando ? (
                  <tr>
                    <td colSpan="5" className="text-center py-8 text-slate-500">
                      Cargando base de datos...
                    </td>
                  </tr>
                ) : !busquedaUsuario.trim() ? (
                  <tr>
                    <td colSpan="5" className="text-center py-10 text-slate-400">
                      <User size={32} className="mx-auto mb-2 opacity-30 text-orange-400" />
                      <p className="text-xs font-bold text-slate-300">Consulta de Empleados</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">Ingresa el nombre o correo del empleado en la barra de búsqueda para ver sus registros.</p>
                    </td>
                  </tr>
                ) : registrosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-8 text-slate-500">
                      No se encontraron marcas para "{busquedaUsuario}".
                    </td>
                  </tr>
                ) : (
                  registrosFiltrados.map((reg) => {
                    const { fecha, hora } = formatearFechaHora(reg.timestamp);

                    return (
                      <tr key={reg.id} className="hover:bg-slate-800/40 transition">
                        <td className="p-3.5 font-bold text-slate-100">
                          {reg.usuarioNombre || reg.userId}
                        </td>
                        <td className="p-3.5">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                            reg.tipo === 'Entrada Mañana' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                            reg.tipo === 'Salida a Comer' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' :
                            reg.tipo === 'Regreso de Comer' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30' :
                            'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                          }`}>
                            {reg.tipo}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-300 font-medium">{fecha}</td>
                        <td className="p-3.5 font-mono text-slate-100 font-bold">{hora}</td>
                        <td className="p-3.5">
                          <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 bg-slate-950 px-2 py-1 rounded-md border border-slate-800">
                            <MapPin size={11} className="text-orange-500" />
                            {reg.distanciaMetros || 0}m oficina
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}