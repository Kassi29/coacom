import { Equipo } from '../entities/equipo.entity';

export interface TimelineEntry {
  id: string;
  date: string;
  type:
    | 'registered'
    | 'service_completed'
    | 'service_in_progress'
    | 'repair_with_parts'
    | 'diagnosis';
  title: string;
  description: string;
  ticketNumber: string | null;
  technicianName: string | null;
  status: string | null;
  statusColor: string | null;
}

export interface EquipmentDetailClient {
  id: string;
  code: string;
  displayName: string;
}

export interface EquipmentDetailResponse {
  id: string;
  serialNumber: string;
  brand: string;
  model: string;
  equipmentType: string;
  description: string | null;
  photoUrl: string | null;
  isActive: boolean;
  createdAt: string;
  client: EquipmentDetailClient;
  serviceCount: number;
  timeline: TimelineEntry[];
}

export function buildEquipmentDetailResponse(
  equipo: Equipo,
): EquipmentDetailResponse {
  const clientDisplayName = equipo.cliente
    ? equipo.cliente.tipo === 'empresa'
      ? (equipo.cliente.razonSocial ?? '')
      : `${equipo.cliente.firstName ?? ''} ${equipo.cliente.lastName ?? ''}`.trim()
    : '';

  // For now, only the "registered" entry since services module doesn't exist yet
  const timeline: TimelineEntry[] = [
    {
      id: `timeline-registered-${equipo.id}`,
      date: equipo.createdAt.toISOString(),
      type: 'registered',
      title: 'Equipo registrado',
      description: `Equipo ${equipo.marca} ${equipo.modelo} (S/N: ${equipo.numeroSerie}) registrado en el sistema.`,
      ticketNumber: null,
      technicianName: null,
      status: null,
      statusColor: null,
    },
  ];

  return {
    id: equipo.id,
    serialNumber: equipo.numeroSerie,
    brand: equipo.marca,
    model: equipo.modelo,
    equipmentType: equipo.tipoEquipo,
    description: equipo.descripcion,
    photoUrl: equipo.fotoUrl,
    isActive: equipo.isActive,
    createdAt: equipo.createdAt.toISOString(),
    client: {
      id: equipo.cliente?.id ?? equipo.clienteId,
      code: equipo.cliente?.codigo ?? '',
      displayName: clientDisplayName,
    },
    serviceCount: 0, // Will be populated when services module exists
    timeline,
  };
}
