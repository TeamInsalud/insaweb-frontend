import { useEffect, useRef, useState } from 'react';
import { buscarPorNombre, SessionExpiredError } from '../lib/api';
import type { TrabajadorResumen } from '../lib/types';

interface Props {
  texto: string;
  onTextoChange: (texto: string) => void;
  onSelect: (t: TrabajadorResumen) => void;
  onSessionExpired: () => void;
}

export default function BuscadorNombre({ texto, onTextoChange, onSelect, onSessionExpired }: Props) {
  // Solo lo que escribe el usuario dispara la búsqueda; si el texto lo coloca la pantalla, no se busca
  const [consulta, setConsulta] = useState('');
  const [resultados, setResultados] = useState<TrabajadorResumen[]>([]);
  const [abierto, setAbierto] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [activo, setActivo] = useState(-1);
  const contenedor = useRef<HTMLDivElement>(null);

  // Busca automáticamente mientras se escribe (con retardo de 300 ms)
  useEffect(() => {
    const q = consulta.trim();
    if (q.replace(/\s/g, '').length < 3) {
      setResultados([]);
      setCargando(false);
      return;
    }
    const ctrl = new AbortController();
    setCargando(true);
    const timer = setTimeout(async () => {
      try {
        setResultados(await buscarPorNombre(q, ctrl.signal));
        setActivo(-1);
        setCargando(false);
      } catch (err) {
        if (ctrl.signal.aborted) return;
        if (err instanceof SessionExpiredError) return onSessionExpired();
        setResultados([]);
        setCargando(false);
      }
    }, 300);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [consulta, onSessionExpired]);

  useEffect(() => {
    const cerrar = (e: MouseEvent) => {
      if (!contenedor.current?.contains(e.target as Node)) setAbierto(false);
    };
    document.addEventListener('mousedown', cerrar);
    return () => document.removeEventListener('mousedown', cerrar);
  }, []);

  const seleccionar = (t: TrabajadorResumen) => {
    setConsulta('');
    setAbierto(false);
    onSelect(t);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') e.preventDefault(); // no enviar el formulario de cédula
    if (!abierto || resultados.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActivo((i) => Math.min(i + 1, resultados.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActivo((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && activo >= 0) {
      e.preventDefault();
      seleccionar(resultados[activo]);
    } else if (e.key === 'Escape') {
      setAbierto(false);
    }
  };

  const mostrarLista = abierto && consulta.trim().replace(/\s/g, '').length >= 3;

  return (
    <div ref={contenedor} className="relative">
      <label className="block">
        <span className="text-sm font-medium text-slate-700">Buscar por nombre</span>
        <input
          value={texto}
          onChange={(e) => {
            onTextoChange(e.target.value);
            setConsulta(e.target.value);
            setAbierto(true);
          }}
          onFocus={() => setAbierto(consulta !== '')}
          onKeyDown={onKeyDown}
          placeholder="Escriba nombre y/o apellido (mínimo 3 letras)"
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
          autoComplete="off"
        />
      </label>
      {mostrarLista && (
        <ul className="absolute z-10 mt-1 max-h-80 w-full overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg">
          {cargando && resultados.length === 0 ? (
            <li className="px-3 py-2 text-sm text-slate-500">Buscando…</li>
          ) : resultados.length === 0 ? (
            <li className="px-3 py-2 text-sm text-slate-500">Sin coincidencias</li>
          ) : (
            resultados.map((t, i) => (
              <li key={t.tra_ced}>
                <button
                  type="button"
                  onClick={() => seleccionar(t)}
                  onMouseEnter={() => setActivo(i)}
                  className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm ${
                    i === activo ? 'bg-sky-50' : ''
                  }`}
                >
                  <span className="text-slate-900">
                    {t.tra_nom} {t.tra_ape}
                  </span>
                  <span className="shrink-0 font-mono text-xs text-slate-500">{t.tra_ced}</span>
                </button>
              </li>
            ))
          )}
          {resultados.length === 30 && (
            <li className="border-t border-slate-100 px-3 py-2 text-xs text-slate-500">
              Se muestran los primeros 30 resultados. Escriba más para afinar la búsqueda.
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
