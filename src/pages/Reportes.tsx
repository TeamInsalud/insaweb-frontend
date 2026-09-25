import { useState } from 'react';
import { reporteOtrosConceptos, SessionExpiredError } from '../lib/api';

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

// Módulo "Reportes" (formulario COM_FOR)
export default function Reportes({ onLogout }: { onLogout: () => void }) {
  const [mes, setMes] = useState(() => new Date().getMonth() + 1);
  const [generando, setGenerando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);

  const generar = async () => {
    setMensaje(null);
    setGenerando(true);
    try {
      const archivo = await reporteOtrosConceptos(mes);
      setMensaje({ tipo: 'ok', texto: `Reporte generado: ${archivo}` });
    } catch (err) {
      if (err instanceof SessionExpiredError) return onLogout();
      setMensaje({ tipo: 'error', texto: (err as Error).message });
    } finally {
      setGenerando(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-end gap-4">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Mes</span>
            <select
              value={mes}
              onChange={(e) => setMes(Number(e.target.value))}
              disabled={generando}
              className="mt-1 block rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              {MESES.map((m, i) => (
                <option key={m} value={i + 1}>
                  {m}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-5 border-t border-slate-200 pt-5">
          <button
            type="button"
            onClick={generar}
            disabled={generando}
            className="rounded-lg bg-sky-700 px-5 py-2.5 font-semibold text-white hover:bg-sky-800 disabled:opacity-60"
          >
            {generando ? 'Generando reporte…' : 'Otros Conceptos Gasto de Personal'}
          </button>
          {generando && <p className="mt-2 text-sm text-slate-500">Esto puede tardar unos segundos.</p>}
        </div>

        {mensaje && (
          <p
            className={`mt-4 rounded-lg px-3 py-2 text-sm ${
              mensaje.tipo === 'ok' ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-600'
            }`}
          >
            {mensaje.texto}
          </p>
        )}
      </section>
    </div>
  );
}
