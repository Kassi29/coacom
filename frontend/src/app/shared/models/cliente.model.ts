export type TipoCliente = 'persona' | 'empresa';

export interface Cliente {
  id: string;
  codigo: string;
  tipo: TipoCliente;
  nit: string | null;
  ci: string | null;
  razonSocial: string | null;
  firstName: string | null;
  lastName: string | null;
  nombreCompleto: string;
  telefono: string | null;
  email: string | null;
  direccion: string | null;
  branchId: string;
  branch: { id: string; name: string; city: string } | null;
  isActive: boolean;
  equiposCount: number;
  createdAt: string;
  updatedAt: string;
}

export const TIPO_CLIENTE_LABELS: Record<TipoCliente, string> = {
  persona: 'Persona',
  empresa: 'Empresa',
};

export const TIPO_CLIENTE_COLORS: Record<TipoCliente, { bg: string; text: string }> = {
  persona: { bg: '#F5F5F5', text: '#171717' },
  empresa: { bg: '#DBEAFE', text: '#2563EB' },
};
