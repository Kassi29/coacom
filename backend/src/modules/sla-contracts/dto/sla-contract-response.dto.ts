import { SlaContract } from '../entities/sla-contract.entity';
import { ContractMovement } from '../entities/contract-movement.entity';

interface MovementDto {
  id: string;
  contractId: string;
  serviceId: string | null;
  type: string;
  affectedHours: number;
  resultingBalance: number;
  reason: string;
  createdBy: string;
  createdAt: Date;
}

export class SlaContractResponseDto {
  id!: string;
  clientId!: string;
  client!: {
    id: string;
    displayName: string;
    code: string;
    nit: string | null;
  } | null;
  startDate!: Date;
  endDate!: Date;
  contractedHours!: number;
  usedHours!: number;
  availableBalance!: number;
  responseTimeHrs!: number;
  includedServices!: string[];
  isActive!: boolean;
  alertThreshold!: number;
  usagePercentage!: number;
  movements!: MovementDto[];
  createdAt!: Date;
  updatedAt!: Date;

  static fromEntity(entity: SlaContract): SlaContractResponseDto {
    const dto = new SlaContractResponseDto();
    dto.id = entity.id;
    dto.clientId = entity.clientId;

    if (entity.client) {
      const client = entity.client;
      const displayName =
        client.tipo === 'empresa'
          ? (client.razonSocial ?? '')
          : `${client.firstName ?? ''} ${client.lastName ?? ''}`.trim();

      dto.client = {
        id: client.id,
        displayName,
        code: client.codigo,
        nit: client.nit,
      };
    } else {
      dto.client = null;
    }

    dto.startDate = entity.startDate;
    dto.endDate = entity.endDate;
    dto.contractedHours = Number(entity.contractedHours);
    dto.usedHours = Number(entity.usedHours);
    dto.availableBalance = Number(entity.availableBalance);
    dto.responseTimeHrs = entity.responseTimeHrs;
    dto.includedServices = entity.includedServices ?? [];
    dto.isActive = entity.isActive;
    dto.alertThreshold = entity.alertThreshold;
    dto.usagePercentage =
      dto.contractedHours > 0
        ? Math.round((dto.usedHours / dto.contractedHours) * 10000) / 100
        : 0;
    dto.movements = (entity.movements ?? []).map((m: ContractMovement) => ({
      id: m.id,
      contractId: m.contractId,
      serviceId: m.serviceId,
      type: m.type,
      affectedHours: Number(m.affectedHours),
      resultingBalance: Number(m.resultingBalance),
      reason: m.reason,
      createdBy: m.createdBy,
      createdAt: m.createdAt,
    }));
    dto.createdAt = entity.createdAt;
    dto.updatedAt = entity.updatedAt;

    return dto;
  }
}
