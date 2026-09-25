import { useRef, useState, type FormEvent } from 'react';
import { buscarTrabajador, buscarTrabajadorPorCedula, historialPagos, SessionExpiredError } from '../lib/api';
import type { HistorialAnio, ResultadoBusqueda, TrabajadorResumen } from '../lib/types';
import BuscadorNombre from '../components/BuscadorNombre';
import HistorialAnioCard from '../components/HistorialAnioCard';
import PreliminarNominaCard from '../components/PreliminarNominaCard';
import DatosPersonalesCard from '../components/DatosPersonalesCard';
import DatosCargoCard from '../components/DatosCargoCard';

const NACIONALIDADES = [
  { value: 'V', label: 'V - Venezolano' },
  { value: 'E', label: 'E - Extranjero' },
  { value: 'P', label: 'P - Pasaporte' },
];

// Módulo "Consulta Nómina" (formulario CNFO1203). onLogout se usa cuando la sesión expira.
export default function Consulta({ onLogout }: { onLogout: () => void }) {
  const [nac, setNac] = useState('V');
  const [numero, setNumero] = useState('');
  const [resultado, setResultado] = useState<ResultadoBusqueda | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [buscadorKey, setBuscadorKey] = useState(0);
  const [nombre, setNombre] = useState('');
  const [historial, setHistorial] = useState<HistorialAnio[]>([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);
  // Identifica la consulta vigente, para descartar respuestas que llegan después de Limpiar u otra búsqueda
  const consultaId = useRef(0);

  const consultar = async (fn: () => Promise<ResultadoBusqueda>) => {
    const id = ++consultaId.current;
    setError('');
    setResultado(null);
    setHistorial([]);
    setLoading(true);
    try {
      const res = await fn();
      if (id !== consultaId.current) return;
      setResultado(res);
      if (res.personal) setNombre(`${res.personal.tra_nom} ${res.personal.tra_ape}`);
      cargarHistorial(id, res.cedula);
    } catch (err) {
      if (id !== consultaId.current) return;
      if (err instanceof SessionExpiredError) return onLogout();
      setError((err as Error).message);
    } finally {
      if (id === consultaId.current) setLoading(false);
    }
  };

  const cargarHistorial = async (id: number, cedula: string) => {
    setCargandoHistorial(true);
    try {
      const h = await historialPagos(cedula);
      if (id === consultaId.current) setHistorial(h);
    } catch (err) {
      if (id !== consultaId.current) return;
      if (err instanceof SessionExpiredError) return onLogout();
      setError((err as Error).message);
    } finally {
      if (id === consultaId.current) setCargandoHistorial(false);
    }
  };

  const buscar = (e: FormEvent) => {
    e.preventDefault();
    consultar(() => buscarTrabajador(nac, numero));
  };

  const limpiar = () => {
    consultaId.current++;
    setNac('V');
    setNumero('');
    setNombre('');
    setResultado(null);
    setHistorial([]);
    setCargandoHistorial(false);
    setLoading(false);
    setError('');
    setBuscadorKey((k) => k + 1); // reinicia el buscador por nombre
  };

  const seleccionarPorNombre = (t: TrabajadorResumen) => {
    setNac(t.tra_ced.charAt(0));
    setNumero(String(Number(t.tra_ced.slice(1, 9))));
    consultar(() => buscarTrabajadorPorCedula(t.tra_ced));
  };

  return (
    <div className="space-y-6">
      <form onSubmit={buscar} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
        <div className="flex flex-wrap items-end gap-4">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Nacionalidad</span>
            <select
              value={nac}
              onChange={(e) => setNac(e.target.value)}
              className="mt-1 block rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              {NACIONALIDADES.map((n) => (
                <option key={n.value} value={n.value}>
                  {n.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block flex-1 min-w-48">
            <span className="text-sm font-medium text-slate-700">Número de cédula</span>
            <input
              value={numero}
              onChange={(e) => setNumero(e.target.value.replace(/\D/g, '').slice(0, 8))}
              inputMode="numeric"
              placeholder="Ej: 10617801"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
              autoFocus
              required
            />
          </label>
          {resultado ? (
            <button
              type="button"
              onClick={limpiar}
              className="rounded-lg bg-slate-600 px-6 py-2.5 font-semibold text-white hover:bg-slate-700"
            >
              Limpiar
            </button>
          ) : (
            <button
              disabled={loading || !numero}
              className="rounded-lg bg-sky-700 px-6 py-2.5 font-semibold text-white hover:bg-sky-800 disabled:opacity-60"
            >
              {loading ? 'Buscando…' : 'Buscar'}
            </button>
          )}
        </div>
        <div className="mt-4 border-t border-slate-200 pt-4">
          <BuscadorNombre
            key={buscadorKey}
            texto={nombre}
            onTextoChange={setNombre}
            onSelect={seleccionarPorNombre}
            onSessionExpired={onLogout}
          />
        </div>
        {error && <p className="mt-3 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
      </form>

      {resultado && (
        <>
          <DatosPersonalesCard datos={resultado.personal} />
          <DatosCargoCard cargos={resultado.cargos} />
          {resultado.cargos.length > 0 && (
            <PreliminarNominaCard cedula={resultado.cedula} pagos={resultado.preliminar} onSessionExpired={onLogout} />
          )}
          {historial.map((h) => (
            <HistorialAnioCard key={h.anio} cedula={resultado.cedula} historial={h} onSessionExpired={onLogout} />
          ))}
          {cargandoHistorial && (
            <p className="text-center text-sm text-slate-500">Buscando historial de pagos por año…</p>
          )}
        </>
      )}
    </div>
  );
}
