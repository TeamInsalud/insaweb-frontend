import { useState, type ReactNode } from 'react';

export function Section({ title, children, actions }: { title: string; children: ReactNode; actions?: ReactNode }) {
  const [abierta, setAbierta] = useState(true);
  return (
    <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <header className="flex items-center justify-between gap-2 bg-sky-800 px-5 py-3">
        <h2 className="font-semibold text-white">{title}</h2>
        <div className="flex items-center gap-3">
          {actions}
          <button
            type="button"
            onClick={() => setAbierta((a) => !a)}
            aria-expanded={abierta}
            title={abierta ? 'Ocultar sección' : 'Expandir sección'}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-sm text-sky-100 hover:bg-sky-700 hover:text-white"
          >
            {abierta ? 'Ocultar' : 'Expandir'}
            <svg
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
              className={`h-4 w-4 transition-transform ${abierta ? 'rotate-180' : ''}`}
            >
              <path
                fillRule="evenodd"
                d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.17l3.71-3.94a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </header>
      {abierta && <div className="p-5">{children}</div>}
    </section>
  );
}

export function Field({ label, value, wide }: { label: string; value: ReactNode; wide?: boolean }) {
  return (
    <div className={wide ? 'sm:col-span-2 lg:col-span-3' : ''}>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-0.5 text-slate-900 break-words whitespace-pre-line">{value}</dd>
    </div>
  );
}

export function Grid({ children }: { children: ReactNode }) {
  return <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">{children}</dl>;
}

export function Aviso({ tone, children }: { tone: 'warn' | 'error'; children: ReactNode }) {
  const cls = tone === 'error' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-amber-50 text-amber-800 border-amber-200';
  return <p className={`rounded-lg border px-4 py-3 font-medium ${cls}`}>{children}</p>;
}
