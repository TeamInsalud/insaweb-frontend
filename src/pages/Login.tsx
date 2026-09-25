import { useState, type FormEvent } from 'react';
import { login } from '../lib/api';
import type { Usuario } from '../lib/types';

export default function Login({ onLogin }: { onLogin: (u: Usuario) => void }) {
  const [cedula, setCedula] = useState('');
  const [clave, setClave] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      onLogin(await login(cedula, clave));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-sky-800 to-slate-900">
      <form onSubmit={submit} className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-8 space-y-5">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-sky-800">INSALUD</h1>
          <p className="text-sm text-slate-500">Consulta de Trabajadores</p>
        </div>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Cédula</span>
          <input
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
            inputMode="numeric"
            value={cedula}
            onChange={(e) => setCedula(e.target.value.replace(/\D/g, ''))}
            autoFocus
            required
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Clave</span>
          <input
            type="password"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
            value={clave}
            onChange={(e) => setClave(e.target.value)}
            required
          />
        </label>
        {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
        <button
          disabled={loading}
          className="w-full rounded-lg bg-sky-700 py-2.5 font-semibold text-white hover:bg-sky-800 disabled:opacity-60"
        >
          {loading ? 'Ingresando…' : 'Ingresar'}
        </button>
      </form>
    </div>
  );
}
