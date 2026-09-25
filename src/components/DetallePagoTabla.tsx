import type { Asignacion, Deduccion, DetallePago } from '../lib/types';
import TablaMovimientos, { unir, type FilaMovimiento } from './TablaMovimientos';

function detalleAsignacion(a: Asignacion) {
  const d = unir([a.ing_cod, a.asi_cod, a.ing_nom, a.asi_nom]) || 'Sin detalle';
  return a.asi_sus === 'V' ? `${d} suspendida` : d;
}

function detalleDeduccion(d: Deduccion) {
  const entidad = unir([d.ent_rif, d.ent_nom, d.ded_nom]);
  const base = unir([d.egr_cod, d.egr_nom]) || 'Sin detalle';
  return entidad ? `${base} (${entidad})` : base;
}

// Detalle de un pago del Preliminar de la Nómina
export default function DetallePagoTabla({ detalle }: { detalle: DetallePago }) {
  const filas: FilaMovimiento[] = [
    ...detalle.asignaciones.map((a) => ({
      clave: `a${a.asi_nro}`,
      codigo: a.asi_nro,
      detalle: detalleAsignacion(a),
      asignacion: a.asi_mon,
      suspendida: a.asi_sus === 'V',
    })),
    ...detalle.deducciones.map((d) => ({
      clave: `d${d.ded_nro}`,
      codigo: d.ded_nro,
      detalle: detalleDeduccion(d),
      deduccion: d.ded_mon,
    })),
  ];
  return <TablaMovimientos filas={filas} mostrarCodigo />;
}
