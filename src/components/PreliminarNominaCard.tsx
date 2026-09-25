import { detallePagoPreliminar } from '../lib/api';
import type { DetallePago, PagoPreliminar } from '../lib/types';
import { formatFecha, formatMonto, texto } from '../lib/format';
import { Aviso, Section } from './Section';
import DetallePagoTabla from './DetallePagoTabla';
import LineaExpandible, { useDetalles } from './LineaExpandible';

const formatDias = (v: string | number | null) => {
  if (v === null || v === '') return '—';
  const n = Number(v);
  return Number.isNaN(n) ? String(v) : `${n.toLocaleString('es-VE', { maximumFractionDigits: 2 })} días`;
};

interface Props {
  cedula: string;
  pagos: PagoPreliminar[];
  onSessionExpired: () => void;
}

export default function PreliminarNominaCard({ cedula, pagos, onSessionExpired }: Props) {
  const { abiertos, detalles, alternar } = useDetalles<DetallePago>(onSessionExpired);

  return (
    <Section
      title="Preliminar de la Nómina"
      actions={pagos.length > 0 && <span className="text-sm text-sky-100">{pagos.length} pagos</span>}
    >
      {pagos.length === 0 ? (
        <Aviso tone="warn">No tiene pagos en el preliminar de la nómina.</Aviso>
      ) : (
        <ul className="divide-y divide-slate-100 text-sm">
          {pagos.map((p) => {
            const clave = `${p.nom_cod}-${p.pag_nro}`;
            return (
              <LineaExpandible
                key={clave}
                abierta={abiertos.has(clave)}
                estado={detalles[clave]}
                onClick={() => alternar(clave, () => detallePagoPreliminar(cedula, p.nom_cod, p.pag_nro))}
                texto={[
                  texto(p.pag_nro),
                  texto(p.pag_cod),
                  `${formatFecha(p.pag_des)} al ${formatFecha(p.pag_has)}`,
                  texto(p.pag_nom),
                  formatDias(p.pag_dia),
                ].join(' - ')}
                monto={`Neto: ${formatMonto(p.neto)}`}
                renderDetalle={(data) => <DetallePagoTabla detalle={data} />}
              />
            );
          })}
        </ul>
      )}
    </Section>
  );
}
