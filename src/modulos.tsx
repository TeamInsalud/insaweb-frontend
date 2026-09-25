import type { ReactNode } from 'react';
import Consulta from './pages/Consulta';
import Reportes from './pages/Reportes';
import MasterRrhh from './pages/MasterRrhh';

export interface Modulo {
  id: string; // nombre del formulario en usuariofor.for_nom
  titulo: string;
  render: (ctx: { onLogout: () => void }) => ReactNode;
}

// Módulos del sistema. Cada uno aparece en el menú solo si el usuario tiene su formulario en usuariofor.
// Para agregar un módulo nuevo: crear su página y registrarla aquí con su nombre de formulario.
export const MODULOS: Modulo[] = [
  { id: 'CNFO1203', titulo: 'Consulta Nómina', render: ({ onLogout }) => <Consulta onLogout={onLogout} /> },
  { id: 'COM_FOR', titulo: 'Reportes', render: ({ onLogout }) => <Reportes onLogout={onLogout} /> },
  { id: 'FONO2301', titulo: 'Master RRHH', render: ({ onLogout }) => <MasterRrhh onLogout={onLogout} /> },
];
