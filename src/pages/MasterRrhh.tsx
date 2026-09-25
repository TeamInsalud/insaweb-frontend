import { useRef, useState, type DragEvent } from 'react';
import { descargarModeloFicha, procesarFichaPersonal, SessionExpiredError } from '../lib/api';
import type { FilaFicha } from '../lib/types';

type Paso = 'inicio' | 'analizando' | 'revision' | 'aplicando' | 'resultado';

const ETIQUETA: Record<FilaFicha['estado'], { texto: string; clase: string }> = {
  con_cambios: { texto: 'Con cambios', clase: 'bg-sky-100 text-sky-800' },
  actualizado: { texto: 'Actualizado', clase: 'bg-emerald-100 text-emerald-800' },
  sin_cambios: { texto: 'Sin cambios', clase: 'bg-slate-100 text-slate-600' },
  no_encontrado: { texto: 'No encontrado', clase: 'bg-amber-100 text-amber-800' },
  error: { texto: 'Error', clase: 'bg-red-100 text-red-700' },
};

const plural = (n: number, singular: string, plural: string) => `${n} ${n === 1 ? singular : plural}`;

// Módulo "Master RRHH" (formulario FONO2301)
export default function MasterRrhh({ onLogout }: { onLogout: () => void }) {
  const [paso, setPaso] = useState<Paso>('inicio');
  const [mostrarCarga, setMostrarCarga] = useState(false);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [filas, setFilas] = useState<FilaFicha[]>([]);
  const [error, setError] = useState('');
  const [arrastrando, setArrastrando] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const manejarError = (err: unknown) => {
    if (err instanceof SessionExpiredError) return onLogout();
    setError((err as Error).message);
  };

  const reiniciar = () => {
    setPaso('inicio');
    setArchivo(null);
    setFilas([]);
    setError('');
    if (input.current) input.current.value = '';
  };

  const analizar = async (f: File) => {
    if (!/\.xlsx$/i.test(f.name)) {
      setError('Seleccione un archivo de Excel (.xlsx)');
      return;
    }
    setError('');
    setArchivo(f);
    setPaso('analizando');
    try {
      setFilas(await procesarFichaPersonal('analizar', f));
      setPaso('revision');
    } catch (err) {
      setPaso('inicio');
      manejarError(err);
    }
  };

  const aplicar = async () => {
    if (!archivo) return;
    setError('');
    setPaso('aplicando');
    try {
      setFilas(await procesarFichaPersonal('aplicar', archivo));
      setPaso('resultado');
    } catch (err) {
      setPaso('revision');
      manejarError(err);
    }
  };

  const soltar = (e: DragEvent) => {
    e.preventDefault();
    setArrastrando(false);
    const f = e.dataTransfer.files[0];
    if (f) analizar(f);
  };

  const cuenta = (estado: FilaFicha['estado']) => filas.filter((f) => f.estado === estado).length;
  const totalCambios = filas.reduce((s, f) => s + (f.estado === 'con_cambios' ? f.cambios.length : 0), 0);

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-800">Ficha Personal</h2>
        <p className="mt-1 text-sm text-slate-600">
          Actualiza en noda1100 los datos personales desde un Excel con el modelo de Ficha Personal. Solo se reemplazan
          los campos cuya celda tenga valor; las celdas vacías no modifican nada.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => descargarModeloFicha().catch(manejarError)}
            className="rounded-lg border border-sky-700 px-4 py-2 font-semibold text-sky-800 hover:bg-sky-50"
          >
            Descargar modelo de Ficha Personal
          </button>
          <button
            type="button"
            onClick={() => {
              reiniciar();
              setMostrarCarga(true);
            }}
            className="rounded-lg bg-sky-700 px-4 py-2 font-semibold text-white hover:bg-sky-800"
          >
            Extraer Ficha Personal
          </button>
        </div>

        {mostrarCarga && paso === 'inicio' && (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setArrastrando(true);
            }}
            onDragLeave={() => setArrastrando(false)}
            onDrop={soltar}
            onClick={() => input.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && input.current?.click()}
            className={`mt-5 cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
              arrastrando ? 'border-sky-500 bg-sky-50' : 'border-slate-300 hover:border-sky-400 hover:bg-slate-50'
            }`}
          >
            <p className="font-medium text-slate-700">Arrastre aquí el archivo de Excel o haga clic para buscarlo</p>
            <p className="mt-1 text-sm text-slate-500">Formato .xlsx con el modelo de Ficha Personal (datos desde la fila 2)</p>
            <input
              ref={input}
              type="file"
              accept=".xlsx"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && analizar(e.target.files[0])}
            />
          </div>
        )}

        {(paso === 'analizando' || paso === 'aplicando') && (
          <p className="mt-5 text-sm text-slate-500">
            {paso === 'analizando' ? 'Leyendo el archivo…' : 'Aplicando los cambios…'} ({archivo?.name})
          </p>
        )}

        {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
      </section>

      {(paso === 'revision' || paso === 'resultado') && (
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold text-slate-800">
                {paso === 'revision' ? 'Revisión de cambios' : 'Resultado'} · {archivo?.name}
              </h3>
              <p className="text-sm text-slate-600">
                {[
                  plural(filas.length, 'fila', 'filas'),
                  paso === 'revision'
                    ? `${plural(cuenta('con_cambios'), 'trabajador', 'trabajadores')} con cambios (${plural(totalCambios, 'campo', 'campos')})`
                    : plural(cuenta('actualizado'), 'trabajador actualizado', 'trabajadores actualizados'),
                  `${cuenta('sin_cambios')} sin cambios`,
                  plural(cuenta('no_encontrado'), 'no encontrado', 'no encontrados'),
                  `${cuenta('error')} con error`,
                ].join(' · ')}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={reiniciar}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                {paso === 'revision' ? 'Cancelar' : 'Procesar otro archivo'}
              </button>
              {paso === 'revision' && (
                <button
                  type="button"
                  onClick={aplicar}
                  disabled={cuenta('con_cambios') === 0}
                  className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
                >
                  Aplicar {plural(cuenta('con_cambios'), 'actualización', 'actualizaciones')}
                </button>
              )}
            </div>
          </div>

          <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-100 text-left text-xs uppercase tracking-wide text-slate-600">
                <tr>
                  <th className="px-3 py-2 font-semibold">Fila</th>
                  <th className="px-3 py-2 font-semibold">Cédula</th>
                  <th className="px-3 py-2 font-semibold">Trabajador</th>
                  <th className="px-3 py-2 font-semibold">Estado</th>
                  <th className="px-3 py-2 font-semibold">Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 align-top">
                {filas.map((f) => (
                  <tr key={f.fila}>
                    <td className="px-3 py-2 tabular-nums">{f.fila}</td>
                    <td className="px-3 py-2 font-mono text-xs">{f.cedula ?? '—'}</td>
                    <td className="px-3 py-2">{f.nombre ?? '—'}</td>
                    <td className="px-3 py-2">
                      <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold ${ETIQUETA[f.estado].clase}`}>
                        {ETIQUETA[f.estado].texto}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      {f.mensaje && <p className="text-slate-700">{f.mensaje}</p>}
                      {f.cambios.length > 0 && (
                        <ul className="space-y-0.5">
                          {f.cambios.map((c) => (
                            <li key={c.campo}>
                              <span className="font-medium text-slate-700">{c.titulo}:</span>{' '}
                              <span className="text-red-700 line-through">{c.anterior || '(vacío)'}</span> →{' '}
                              <span className="text-blue-700">{c.nuevo}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                      {f.avisos.map((a) => (
                        <p key={a} className="text-amber-700">
                          {a}
                        </p>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
