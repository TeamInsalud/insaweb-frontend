import type { DetalleActualizacion, DetallePago, FilaFicha, HistorialAnio, ResultadoBusqueda, TrabajadorResumen, Usuario } from './types';

// Dirección del backend. Vacía = mismo origen: en desarrollo Vite y en el servidor nginx envían /api al backend.
// Solo se define (VITE_API_URL al compilar) si la API se publica en otro nombre o puerto.
const API_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '');

const TOKEN_KEY = 'insaweb_token';
const USER_KEY = 'insaweb_user';

export function getSession(): { token: string; user: Usuario } | null {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    const user = localStorage.getItem(USER_KEY);
    return token && user ? { token, user: JSON.parse(user) } : null;
  } catch {
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export class SessionExpiredError extends Error {}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const token = localStorage.getItem(TOKEN_KEY);
  const res = await fetch(`${API_URL}${url}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });
  const data = await res.json().catch(() => ({}));
  // 401 = sesión vencida: se vuelve al login. Un 403 (sin permiso al módulo) se muestra como error normal.
  if (res.status === 401 && token) throw new SessionExpiredError(data.message || 'Sesión expirada');
  if (!res.ok) throw new Error(data.message || `Error ${res.status}`);
  return data as T;
}

export async function login(cedula: string, clave: string): Promise<Usuario> {
  clearSession();
  const data = await request<{ token: string; user: Usuario }>('/api/login', {
    method: 'POST',
    body: JSON.stringify({ cedula, clave }),
  });
  localStorage.setItem(TOKEN_KEY, data.token);
  localStorage.setItem(USER_KEY, JSON.stringify(data.user));
  return data.user;
}

// Descarga un archivo generado por el backend y lo guarda con el nombre que indica el servidor
export async function descargarArchivo(url: string, nombrePorDefecto: string) {
  const token = localStorage.getItem(TOKEN_KEY);
  const res = await fetch(`${API_URL}${url}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    if (res.status === 401 && token) throw new SessionExpiredError(data.message || 'Sesión expirada');
    throw new Error(data.message || `Error ${res.status}`);
  }
  const disposicion = res.headers.get('Content-Disposition') || '';
  const nombre = /filename\*=UTF-8''([^;]+)/.exec(disposicion)?.[1];
  const enlace = document.createElement('a');
  enlace.href = URL.createObjectURL(await res.blob());
  enlace.download = nombre ? decodeURIComponent(nombre) : nombrePorDefecto;
  enlace.click();
  setTimeout(() => URL.revokeObjectURL(enlace.href), 1000);
  return enlace.download;
}

export function reporteOtrosConceptos(mes: number) {
  return descargarArchivo(`/api/reportes/otros-conceptos?mes=${mes}`, 'OTROS CONCEPTOS GASTOS DE PERSONAL.xlsx');
}

export function descargarModeloFicha() {
  return descargarArchivo('/api/rrhh/ficha/modelo', 'FICHA PERSONAL - MODELO.xlsx');
}

// Envía el Excel de Ficha Personal: "analizar" solo muestra los cambios; "aplicar" los graba en noda1100
export function procesarFichaPersonal(accion: 'analizar' | 'aplicar', archivo: File) {
  return request<FilaFicha[]>(`/api/rrhh/ficha/${accion}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/octet-stream' },
    body: archivo,
  });
}

// Usuario y formularios (usuariofor.for_nom) asignados, para armar el menú
export function obtenerSesion() {
  return request<{ user: Usuario; pantallas: string[] }>('/api/sesion');
}

export function buscarTrabajador(nac: string, numero: string) {
  const qs = new URLSearchParams({ nac, numero });
  return request<ResultadoBusqueda>(`/api/trabajador?${qs}`);
}

export function buscarTrabajadorPorCedula(ced: string) {
  return request<ResultadoBusqueda>(`/api/trabajador?${new URLSearchParams({ ced })}`);
}

export function historialPagos(ced: string) {
  return request<HistorialAnio[]>(`/api/trabajador/historial?${new URLSearchParams({ ced })}`);
}

export function detalleActualizacion(ced: string, anio: number, act: number) {
  const qs = new URLSearchParams({ ced, anio: String(anio), act: String(act) });
  return request<DetalleActualizacion>(`/api/trabajador/historial/detalle?${qs}`);
}

export function detallePagoPreliminar(ced: string, nom: string, pag: string) {
  return request<DetallePago>(`/api/trabajador/preliminar/detalle?${new URLSearchParams({ ced, nom, pag })}`);
}

export function buscarPorNombre(q: string, signal?: AbortSignal) {
  return request<TrabajadorResumen[]>(`/api/trabajadores/buscar?${new URLSearchParams({ q })}`, { signal });
}
