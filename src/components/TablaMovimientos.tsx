import { formatMonto } from '../lib/format';

export interface FilaMovimiento {
  clave: string;
  codigo?: string | number;
  detalle: string;
  asignacion?: string | number;
  deduccion?: string | number;
  suspendida?: boolean; // asignación suspendida: se muestra en cursiva
}

// Toda la fila en azul si es asignación y en rojo si es deducción
const colorFila = (f: FilaMovimiento) =>
  f.deduccion !== undefined ? 'text-red-700' : f.asignacion !== undefined ? 'text-blue-700' : '';

// Suma en céntimos para evitar errores de redondeo
const sumar = (valores: (string | number | undefined)[]) =>
  valores.reduce<number>((s, v) => s + (v === undefined ? 0 : Math.round(Number(v) * 100)), 0) / 100;

export default function TablaMovimientos({ filas, mostrarCodigo }: { filas: FilaMovimiento[]; mostrarCodigo?: boolean }) {
  if (filas.length === 0) {
    return <p className="text-sm text-slate-500">No hay asignaciones ni deducciones.</p>;
  }
  const totalAsi = sumar(filas.map((f) => f.asignacion));
  const totalDed = sumar(filas.map((f) => f.deduccion));

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="w-full text-sm">
        <thead className="bg-slate-100 text-left text-xs uppercase tracking-wide text-slate-600">
          <tr>
            {mostrarCodigo && <th className="px-3 py-2 font-semibold">Código</th>}
            <th className="px-3 py-2 font-semibold">Detalle</th>
            <th className="px-3 py-2 text-right font-semibold">Asignación</th>
            <th className="px-3 py-2 text-right font-semibold">Deducción</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {filas.map((f) => (
            <tr key={f.clave} className={colorFila(f)}>
              {mostrarCodigo && <td className="px-3 py-1.5 tabular-nums">{f.codigo}</td>}
              <td className={`px-3 py-1.5 ${f.suspendida ? 'italic' : ''}`}>{f.detalle}</td>
              <td className="px-3 py-1.5 text-right tabular-nums">
                {f.asignacion !== undefined && formatMonto(f.asignacion)}
              </td>
              <td className="px-3 py-1.5 text-right tabular-nums">
                {f.deduccion !== undefined && formatMonto(f.deduccion)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot className="border-t-2 border-slate-200 bg-slate-50 font-semibold">
          <tr>
            <td className="px-3 py-2" colSpan={mostrarCodigo ? 2 : 1}>
              Totales
            </td>
            <td className="px-3 py-2 text-right tabular-nums text-blue-700">{formatMonto(totalAsi)}</td>
            <td className="px-3 py-2 text-right tabular-nums text-red-700">{formatMonto(totalDed)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

export const unir = (partes: (string | number | null | undefined)[], sep = ' - ') =>
  partes
    .map((p) => String(p ?? '').trim())
    .filter(Boolean)
    .join(sep);
