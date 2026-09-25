import type { DatosPersonales } from '../lib/types';
import { formatFecha, formatProfesion, formatSexo, texto } from '../lib/format';
import { Aviso, Field, Grid, Section } from './Section';

export default function DatosPersonalesCard({ datos }: { datos: DatosPersonales | null }) {
  return (
    <Section title="Datos Personales">
      {!datos ? (
        <Aviso tone="error">El trabajador no existe en los datos internos de INSALUD.</Aviso>
      ) : (
        <Grid>
          <Field label="Número de cédula" value={texto(datos.tra_ced)} />
          <Field label="Apellido" value={texto(datos.tra_ape)} />
          <Field label="Nombre" value={texto(datos.tra_nom)} />
          <Field label="Fecha de ingreso" value={formatFecha(datos.tra_fei)} />
          <Field label="Fecha de nacimiento" value={formatFecha(datos.tra_fna)} />
          <Field label="Sexo" value={formatSexo(datos.tra_sex)} />
          <Field label="Correo electrónico" value={texto(datos.tra_cor)} />
          <Field label="Teléfono" value={texto(datos.tra_tel)} />
          <Field label="Cuenta bancaria" value={texto(datos.tra_cta)} />
          <Field label="Nivel académico" value={formatProfesion(datos.tra_pro)} />
          <Field label="Título" value={texto(datos.tra_tit)} />
          <Field label="Especialidad" value={texto(datos.tra_esp)} />
          <Field label="Ingreso Administración Pública" value={formatFecha(datos.tra_fco)} />
          <Field label="Otros años Administración Pública" value={texto(datos.tra_adm)} />
          <Field label="Fecha de egreso" value={formatFecha(datos.tra_egr)} />
          <Field label="Número de hijos" value={texto(datos.tra_hij)} />
          <Field label="Dirección" value={texto(datos.tra_dir)} wide />
          <Field label="Observación" value={texto(datos.tra_det)} wide />
        </Grid>
      )}
    </Section>
  );
}
