import { useEffect, useState, type ReactNode } from 'react';
import type { Modulo } from '../modulos';
import type { Usuario } from '../lib/types';

interface Props {
  user: Usuario;
  modulos: Modulo[];
  activo: string | null;
  onSelect: (id: string) => void;
  onLogout: () => void;
  children: ReactNode;
}

export default function Layout({ user, modulos, activo, onSelect, onLogout, children }: Props) {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const titulo = modulos.find((m) => m.id === activo)?.titulo;

  useEffect(() => {
    if (!menuAbierto) return;
    const cerrar = (e: KeyboardEvent) => e.key === 'Escape' && setMenuAbierto(false);
    document.addEventListener('keydown', cerrar);
    return () => document.removeEventListener('keydown', cerrar);
  }, [menuAbierto]);

  const itemClase = 'flex w-full items-center rounded-lg px-3 py-2.5 text-left text-sm font-medium';

  return (
    <div className="min-h-screen">
      <header className="bg-sky-900 text-white">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <button
            type="button"
            onClick={() => setMenuAbierto(true)}
            aria-label="Abrir menú"
            aria-expanded={menuAbierto}
            className="-ml-1 rounded-lg p-2 hover:bg-sky-800"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-6 w-6" aria-hidden="true">
              <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold">INSALUD{titulo && ` · ${titulo}`}</h1>
            <p className="truncate text-sm text-sky-200">
              {user.nombre}
              {user.ubicacion && ` · ${user.ubicacion}`}
            </p>
          </div>
        </div>
      </header>

      {/* Menú lateral */}
      <div
        className={`fixed inset-0 z-40 bg-slate-900/50 transition-opacity ${
          menuAbierto ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={() => setMenuAbierto(false)}
        aria-hidden="true"
      />
      <nav
        aria-label="Menú principal"
        inert={!menuAbierto}
        className={`fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col bg-white shadow-xl transition-transform ${
          menuAbierto ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between bg-sky-900 px-4 py-4 text-white">
          <div className="min-w-0">
            <p className="font-bold">INSALUD</p>
            <p className="truncate text-sm text-sky-200">{user.nombre}</p>
          </div>
          <button
            type="button"
            onClick={() => setMenuAbierto(false)}
            aria-label="Cerrar menú"
            className="rounded-lg p-2 hover:bg-sky-800"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5" aria-hidden="true">
              <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        <ul className="flex-1 space-y-1 overflow-y-auto p-3">
          {modulos.map((m) => (
            <li key={m.id}>
              <button
                type="button"
                onClick={() => {
                  onSelect(m.id);
                  setMenuAbierto(false);
                }}
                aria-current={m.id === activo ? 'page' : undefined}
                className={`${itemClase} ${m.id === activo ? 'bg-sky-100 text-sky-900' : 'text-slate-700 hover:bg-slate-100'}`}
              >
                {m.titulo}
              </button>
            </li>
          ))}
        </ul>
        <div className="border-t border-slate-200 p-3">
          <button type="button" onClick={onLogout} className={`${itemClase} text-red-700 hover:bg-red-50`}>
            Salir
          </button>
        </div>
      </nav>

      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
