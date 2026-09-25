import { useState, type ReactNode } from 'react';
import { SessionExpiredError } from '../lib/api';

type Estado<T> = { estado: 'cargando' } | { estado: 'ok'; data: T } | { estado: 'error'; mensaje: string };

// Estado de líneas que se abren con un clic y cargan su detalle la primera vez que se abren
export function useDetalles<T>(onSessionExpired: () => void) {
  const [abiertos, setAbiertos] = useState<Set<string>>(new Set());
  const [detalles, setDetalles] = useState<Record<string, Estado<T>>>({});

  const alternar = async (clave: string, cargar: () => Promise<T>) => {
    const abrir = !abiertos.has(clave);
    setAbiertos((prev) => {
      const s = new Set(prev);
      if (abrir) s.add(clave);
      else s.delete(clave);
      return s;
    });
    const actual = detalles[clave]?.estado;
    if (!abrir || actual === 'ok' || actual === 'cargando') return;
    setDetalles((d) => ({ ...d, [clave]: { estado: 'cargando' } }));
    try {
      const data = await cargar();
      setDetalles((d) => ({ ...d, [clave]: { estado: 'ok', data } }));
    } catch (err) {
      if (err instanceof SessionExpiredError) return onSessionExpired();
      setDetalles((d) => ({ ...d, [clave]: { estado: 'error', mensaje: (err as Error).message } }));
    }
  };

  return { abiertos, detalles, alternar };
}

interface Props<T> {
  abierta: boolean;
  estado?: Estado<T>;
  onClick: () => void;
  texto: ReactNode;
  monto: ReactNode;
  renderDetalle: (data: T) => ReactNode;
}

export default function LineaExpandible<T>({ abierta, estado, onClick, texto, monto, renderDetalle }: Props<T>) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        aria-expanded={abierta}
        className={`flex w-full flex-wrap items-baseline gap-x-4 rounded px-1 py-1.5 text-left text-slate-800 hover:bg-sky-50 ${
          abierta ? 'bg-sky-50' : ''
        }`}
      >
        <svg
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
          className={`h-4 w-4 shrink-0 self-center text-sky-700 transition-transform ${abierta ? 'rotate-90' : ''}`}
        >
          <path
            fillRule="evenodd"
            d="M7.21 14.77a.75.75 0 0 1 .02-1.06L11.17 10 7.23 6.29a.75.75 0 1 1 1.04-1.08l4.5 4.25a.75.75 0 0 1 0 1.08l-4.5 4.25a.75.75 0 0 1-1.06-.02Z"
            clipRule="evenodd"
          />
        </svg>
        <span className="flex-1">{texto}</span>
        <span className="ml-auto shrink-0 font-semibold tabular-nums">{monto}</span>
      </button>
      {abierta && (
        <div className="py-3 pl-6">
          {!estado || estado.estado === 'cargando' ? (
            <p className="text-sm text-slate-500">Cargando detalle…</p>
          ) : estado.estado === 'error' ? (
            <p className="text-sm text-red-600">{estado.mensaje}</p>
          ) : (
            renderDetalle(estado.data)
          )}
        </div>
      )}
    </li>
  );
}
