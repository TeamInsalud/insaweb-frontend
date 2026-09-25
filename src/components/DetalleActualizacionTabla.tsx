import type { DetalleActualizacion } from '../lib/types';
import TablaMovimientos, { unir, type FilaMovimiento } from './TablaMovimientos';

// Detalle de una actualización del historial por año (noda2700 / noda2800 descritos en noda3000)
export default function DetalleActualizacionTabla({ detalle }: { detalle: DetalleActualizacion }) {
  const filas: FilaMovimiento[] = [
    ...detalle.asignaciones.map((a) => ({
      clave: `a${a.asi_nro}`,
      detalle: unir([a.asi_nro, a.mov_nom]),
      asignacion: a.asi_mon,
    })),
    ...detalle.deducciones.map((d) => ({
      clave: `d${d.ded_nro}`,
      detalle: unir([d.ded_nro, d.mov_nom, d.ded_cod]),
      deduccion: d.ded_mon,
    })),
  ];
  return <TablaMovimientos filas={filas} />;
}
