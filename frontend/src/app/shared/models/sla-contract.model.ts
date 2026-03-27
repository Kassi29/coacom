export interface SlaContract {
  id: string;
  clientId: string;
  client: { id: string; displayName: string; code: string; nit: string | null };
  startDate: string;
  endDate: string;
  contractedHours: number;
  usedHours: number;
  availableBalance: number;
  responseTimeHrs: number;
  includedServices: string[];
  isActive: boolean;
  alertThreshold: number;
  createdAt: string;
  updatedAt: string;
}

export interface ContractMovement {
  id: string;
  contractId: string;
  serviceId: string | null;
  type: 'deduction' | 'reversal';
  affectedHours: number;
  resultingBalance: number;
  reason: string;
  createdBy: string;
  createdAt: string;
}

export interface SlaContractDetail extends SlaContract {
  movements: ContractMovement[];
}

export const SERVICE_OPTIONS: { value: string; label: string }[] = [
  { value: 'hardware', label: 'Hardware' },
  { value: 'instalacion', label: 'Instalación' },
  { value: 'software', label: 'Software' },
  { value: 'mantenimiento_preventivo', label: 'Mantenimiento Preventivo' },
  { value: 'redes', label: 'Redes' },
  { value: 'soporte_remoto', label: 'Soporte Remoto' },
];

export const SERVICE_COLORS: Record<string, { bg: string; text: string }> = {
  hardware: { bg: '#FEE2E2', text: '#DC2626' },
  software: { bg: '#DCFCE7', text: '#16A34A' },
  redes: { bg: '#FEF3C7', text: '#F59E0B' },
  instalacion: { bg: '#DBEAFE', text: '#2563EB' },
  mantenimiento_preventivo: { bg: '#F3E8FF', text: '#7C3AED' },
  soporte_remoto: { bg: '#E0F2FE', text: '#0284C7' },
};
