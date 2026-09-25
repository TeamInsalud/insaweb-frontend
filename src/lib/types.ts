export interface Usuario {
  cedula: number;
  nombre: string;
  ubicacion: string;
}

export interface DatosPersonales {
  tra_ced: string;
  tra_ape: string;
  tra_nom: string;
  tra_fei: string;
  tra_fna: string;
  tra_sex: string;
  tra_dir: string;
  tra_cor: string;
  tra_tel: string;
  tra_cta: string;
  tra_pro: string;
  tra_det: string | null;
  tra_fco: string;
  tra_egr: string;
  tra_hij: number | null;
  tra_adm: number | null;
  tra_tit: string | null;
  tra_esp: string | null;
}

export interface DatosCargo {
  rac_cod: number;
  rac_nro: string;
  nom_cod: string;
  nom_nom: string | null;
  car_sue: string | number | null;
  ubi_cod: string;
  ubi_nom: string | null;
  car_cod: number;
  car_nom: string | null;
  tab_cod: string;
  tab_niv: number | null;
  tab_hor: number | null;
  car_sus: string;
  car_com: string;
  com_ubi: string;
  com_ubi_nom: string | null;
}

export interface TrabajadorResumen {
  tra_ced: string;
  tra_nom: string;
  tra_ape: string;
}

export interface Pago {
  act_nro: number;
  pag_nro: string;
  pag_cod: string;
  pag_des: string;
  pag_has: string;
  pag_nom: string;
  nom_cod: string;
  nom_nom: string | null;
  tra_net: string | number | null;
}

export interface HistorialAnio {
  anio: number;
  pagos: Pago[];
}

export interface PagoPreliminar {
  nom_cod: string;
  pag_nro: string;
  pag_cod: string;
  pag_des: string;
  pag_has: string;
  pag_nom: string;
  pag_dia: string | number | null;
  neto: string | number | null;
}

export interface Asignacion {
  asi_nro: number;
  ing_cod: string | null;
  asi_cod: string | null;
  ing_nom: string | null;
  asi_nom: string | null;
  asi_sus: string | null;
  asi_mon: string | number;
}

export interface Deduccion {
  ded_nro: number;
  egr_cod: string | null;
  egr_nom: string | null;
  ent_rif: string | null;
  ent_nom: string | null;
  ded_nom: string | null;
  ded_mon: string | number;
}

export interface DetallePago {
  asignaciones: Asignacion[];
  deducciones: Deduccion[];
}

export interface DetalleActualizacion {
  asignaciones: { asi_nro: number; mov_nom: string; asi_mon: string | number }[];
  deducciones: { ded_nro: number; mov_nom: string; ded_cod: string | null; ded_mon: string | number }[];
}

export interface FilaFicha {
  fila: number;
  cedula: string | null;
  nombre: string | null;
  estado: 'con_cambios' | 'sin_cambios' | 'no_encontrado' | 'error' | 'actualizado';
  mensaje?: string;
  cambios: { campo: string; titulo: string; anterior: string; nuevo: string }[];
  avisos: string[];
}

export interface ResultadoBusqueda {
  cedula: string;
  personal: DatosPersonales | null;
  cargos: DatosCargo[];
  preliminar: PagoPreliminar[];
}
