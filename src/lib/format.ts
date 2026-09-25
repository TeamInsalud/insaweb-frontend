// Fechas almacenadas como YYYYMMDD; "00000000" o vacío = sin fecha
export function formatFecha(v?: string | null): string {
  if (!v || !/^\d{8}$/.test(v) || v === '00000000') return '—';
  return `${v.slice(6, 8)}/${v.slice(4, 6)}/${v.slice(0, 4)}`;
}

export function formatMonto(v?: string | number | null): string {
  if (v === null || v === undefined || v === '') return '—';
  const n = Number(v);
  if (Number.isNaN(n)) return String(v);
  return `Bs. ${n.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatSexo(v?: string | null): string {
  if (v === 'M') return 'Masculino';
  if (v === 'F') return 'Femenino';
  return '—';
}

const PROFESION: Record<string, string> = {
  '0': 'Otros',
  '1': 'Otros',
  '2': 'T.S.U.',
  '3': 'Universitario',
  '4': 'Especialista',
  '5': 'Maestría',
  '6': 'Doctorado',
};

export function formatProfesion(v?: string | null): string {
  if (!v) return '—';
  return PROFESION[v] ?? `Código ${v}`;
}

export function texto(v?: string | number | null): string {
  if (v === null || v === undefined) return '—';
  const s = String(v).trim();
  return s === '' ? '—' : s;
}
