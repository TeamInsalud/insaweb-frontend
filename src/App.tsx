import { useCallback, useEffect, useState } from 'react';
import { clearSession, getSession, obtenerSesion, SessionExpiredError } from './lib/api';
import type { Usuario } from './lib/types';
import { MODULOS } from './modulos';
import Login from './pages/Login';
import Layout from './components/Layout';

export default function App() {
  const [user, setUser] = useState<Usuario | null>(() => getSession()?.user ?? null);
  const [pantallas, setPantallas] = useState<string[] | null>(null);
  const [activo, setActivo] = useState<string | null>(null);
  const [error, setError] = useState('');

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
    setPantallas(null);
    setActivo(null);
  }, []);

  // Al entrar (o recargar la página) se consultan los formularios asignados al usuario para armar el menú
  useEffect(() => {
    if (!user) return;
    let vigente = true;
    setError('');
    obtenerSesion()
      .then(({ pantallas }) => {
        if (!vigente) return;
        setPantallas(pantallas);
        setActivo((a) => a ?? MODULOS.find((m) => pantallas.includes(m.id))?.id ?? null);
      })
      .catch((err) => {
        if (!vigente) return;
        if (err instanceof SessionExpiredError) return logout();
        setError((err as Error).message);
      });
    return () => {
      vigente = false;
    };
  }, [user, logout]);

  if (!user) return <Login onLogin={setUser} />;

  const modulos = MODULOS.filter((m) => pantallas?.includes(m.id));
  const modulo = modulos.find((m) => m.id === activo);

  return (
    <Layout user={user} modulos={modulos} activo={activo} onSelect={setActivo} onLogout={logout}>
      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">{error}</p>
      ) : pantallas === null ? (
        <p className="text-center text-sm text-slate-500">Cargando…</p>
      ) : modulo ? (
        modulo.render({ onLogout: logout })
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-600 shadow-sm">
          <p className="text-lg font-semibold text-slate-800">Bienvenido(a), {user.nombre}</p>
          <p className="mt-1 text-sm">Usted no tiene módulos asignados en el sistema.</p>
        </div>
      )}
    </Layout>
  );
}
