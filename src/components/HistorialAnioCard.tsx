import { detalleActualizacion } from '../lib/api';
import type { DetalleActualizacion, HistorialAnio } from '../lib/types';
import { formatFecha, formatMonto, texto } from '../lib/format';
import { Section } from './Section';
import DetalleActualizacionTabla from './DetalleActualizacionTabla';
import LineaExpandible, { useDetalles } from './LineaExpandible';

interface Props {
  cedula: string;
  historial: HistorialAnio;
  onSessionExpired: () => void;
}

export default function HistorialAnioCard({ cedula, historial, onSessionExpired }: Props) {
  const { abiertos, detalles, alternar } = useDetalles<DetalleActualizacion>(onSessionExpired);
  // Se suma en céntimos para evitar errores de redondeo
  const totalNeto = historial.pagos.reduce((s, p) => s + Math.round(Number(p.tra_net || 0) * 100), 0) / 100;
  return (
    <Section
      title={`Año ${historial.anio}`}
      actions={
        <span className="text-sm text-sky-100">
          {historial.pagos.length} actualizaciones ·{' '}
          <span className="font-semibold text-white tabular-nums">Total neto: {formatMonto(totalNeto)}</span>
        </span>
      }
    >
      <ul className="divide-y divide-slate-100 text-sm">
        {historial.pagos.map((p) => {
          const clave = String(p.act_nro);
          return (
            <LineaExpandible
              key={clave}
              abierta={abiertos.has(clave)}
              estado={detalles[clave]}
              onClick={() => alternar(clave, () => detalleActualizacion(cedula, historial.anio, p.act_nro))}
              texto={[
                texto(p.act_nro),
                texto(p.pag_nro),
                texto(p.pag_cod),
                `${formatFecha(p.pag_des)} al ${formatFecha(p.pag_has)}`,
                texto(p.pag_nom),
                p.nom_nom ?? `Nómina ${p.nom_cod}`,
              ].join(' - ')}
              monto={`Neto: ${formatMonto(p.tra_net)}`}
              renderDetalle={(data) => <DetalleActualizacionTabla detalle={data} />}
            />
          );
        })}
      </ul>
    </Section>
  );
}
