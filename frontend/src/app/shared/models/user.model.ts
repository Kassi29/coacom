import { Branch } from './branch.model';

export type UserRole = 'admin' | 'general_manager' | 'branch_manager' | 'technician' | 'client';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  branchId: string | null;
  branch: Branch | null;
  specialty: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrador',
  general_manager: 'Gerente General',
  branch_manager: 'Gerente Sucursal',
  technician: 'Tecnico',
  client: 'Cliente',
};

export const USER_ROLE_COLORS: Record<UserRole, { bg: string; text: string }> = {
  admin: { bg: '#FEF0E8', text: '#AA1919' },
  general_manager: { bg: '#DBEAFE', text: '#3B82F6' },
  branch_manager: { bg: '#DBEAFE', text: '#3B82F6' },
  technician: { bg: '#FEF3C7', text: '#F59E0B' },
  client: { bg: '#F0FDF4', text: '#16A34A' },
};
