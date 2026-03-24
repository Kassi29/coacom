export type TipoEquipo =
  | 'Laptop'
  | 'Desktop'
  | 'Servidor'
  | 'Switch'
  | 'Router'
  | 'Impresora'
  | 'UPS'
  | 'Access Point'
  | 'Otro';

export const TIPO_EQUIPO_OPTIONS: TipoEquipo[] = [
  'Laptop',
  'Desktop',
  'Servidor',
  'Switch',
  'Router',
  'Impresora',
  'UPS',
  'Access Point',
  'Otro',
];

export interface Equipo {
  id: string;
  numeroSerie: string;
  marca: string;
  modelo: string;
  tipoEquipo: TipoEquipo;
  descripcion: string | null;
  fotoUrl: string | null;
  clienteId: string;
  cliente: { id: string; codigo: string; nombreCompleto: string } | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
