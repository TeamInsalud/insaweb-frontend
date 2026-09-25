import type { DatosCargo } from '../lib/types';
import { formatMonto, texto } from '../lib/format';
import { Aviso, Field, Grid, Section } from './Section';

const conCodigo = (codigo: string | number | null, nombre: string | null) =>
  nombre ? `${texto(codigo)} - ${nombre}` : `${texto(codigo)} (no encontrado)`;

function Cargo({ c }: { c: DatosCargo }) {
  const suspendido = c.car_sus === 'V';
  const comision = c.car_com === 'V';
  return (
    <div className="space-y-4">
      {(suspendido || comision) && (
        <div className="flex flex-wrap gap-2">
          {suspendido && (
            <span className="rounded-full bg-red-100 px-3 py-1 text-sm font-semibold text-red-700">
              Cargo suspendido
            </span>
          )}
          {comision && (
            <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-800">
              En comisión de servicio en: {c.com_ubi_nom ?? (c.com_ubi ? `ubicación ${c.com_ubi} (no encontrada)` : 'ubicación no registrada')}
            </span>
          )}
        </div>
      )}
      <Grid>
        <Field label="RAC interno INSALUD" value={texto(c.rac_cod)} />
        <Field label="Código Ministerio" value={texto(c.rac_nro)} />
        <Field label="Cargo" value={conCodigo(c.car_cod, c.car_nom)} />
        <Field label="Nómina" value={conCodigo(c.nom_cod, c.nom_nom)} />
        <Field label="Ubicación" value={conCodigo(c.ubi_cod, c.ubi_nom)} />
        <Field label="Sueldo mensual" value={formatMonto(c.car_sue)} />
        <Field label="Código de tabla" value={texto(c.tab_cod)} />
        <Field label="Nivel" value={texto(c.tab_niv)} />
        <Field label="Número de horas" value={texto(c.tab_hor)} />
      </Grid>
    </div>
  );
}

export default function DatosCargoCard({ cargos }: { cargos: DatosCargo[] }) {
  return (
    <Section
      title="Datos del Cargo"
      actions={cargos.length > 1 && <span className="text-sm text-sky-100">{cargos.length} cargos</span>}
    >
      {cargos.length === 0 ? (
        <Aviso tone="warn">No tiene cargo en INSALUD.</Aviso>
      ) : (
        <div className="divide-y divide-slate-200">
          {cargos.map((c) => (
            <div key={c.rac_cod} className="py-5 first:pt-0 last:pb-0">
              <Cargo c={c} />
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}
