import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, IsNull } from 'typeorm';
import { SlaContract } from './entities/sla-contract.entity';
import { ContractMovement } from './entities/contract-movement.entity';
import { CreateSlaContractDto } from './dto/create-sla-contract.dto';
import { UpdateSlaContractDto } from './dto/update-sla-contract.dto';
import { QuerySlaContractsDto } from './dto/query-sla-contracts.dto';
import { SlaContractResponseDto } from './dto/sla-contract-response.dto';
import { PaginatedResponse } from '../../common/interfaces/paginated-response.interface';
import { MovementType } from '../../common/enums/movement-type.enum';
import { ClientesService } from '../clientes/clientes.service';

@Injectable()
export class SlaContractsService {
  private readonly logger = new Logger(SlaContractsService.name);

  constructor(
    @InjectRepository(SlaContract)
    private readonly contractsRepository: Repository<SlaContract>,
    @InjectRepository(ContractMovement)
    private readonly movementsRepository: Repository<ContractMovement>,
    private readonly clientesService: ClientesService,
  ) {}

  async findAll(
    query: QuerySlaContractsDto,
  ): Promise<PaginatedResponse<SlaContractResponseDto>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const qb: SelectQueryBuilder<SlaContract> = this.contractsRepository
      .createQueryBuilder('contract')
      .leftJoinAndSelect('contract.client', 'client')
      .leftJoinAndSelect('client.branch', 'branch');

    if (query.clientId) {
      qb.andWhere('contract.clientId = :clientId', {
        clientId: query.clientId,
      });
    }

    if (query.branchId) {
      qb.andWhere('client.branchId = :branchId', {
        branchId: query.branchId,
      });
    }

    if (query.search) {
      qb.andWhere(
        '(client.firstName ILIKE :search OR client.lastName ILIKE :search OR client.razonSocial ILIKE :search OR client.nit ILIKE :search OR client.codigo ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    if (query.status && query.status !== 'all') {
      const today = new Date().toISOString().split('T')[0];
      if (query.status === 'active') {
        qb.andWhere('contract.isActive = true');
        qb.andWhere('contract.endDate >= :today', { today });
      } else if (query.status === 'expired') {
        qb.andWhere('contract.endDate < :today', { today });
      }
    }

    qb.orderBy('contract.createdAt', 'DESC');
    qb.skip(skip).take(limit);

    const [contracts, total] = await qb.getManyAndCount();
    const totalPages = Math.ceil(total / limit);

    console.log(
      `[AUDIT] SLA Contracts list queried — page: ${page}, results: ${contracts.length}, total: ${total}`,
    );

    return {
      data: contracts.map((c) => SlaContractResponseDto.fromEntity(c)),
      meta: { total, page, limit, totalPages },
    };
  }

  async findOne(id: string): Promise<SlaContractResponseDto> {
    const contract = await this.contractsRepository.findOne({
      where: { id },
      relations: ['client', 'client.branch', 'movements'],
    });
    if (!contract) {
      throw new NotFoundException(`Contrato SLA con id ${id} no encontrado`);
    }
    return SlaContractResponseDto.fromEntity(contract);
  }

  async findById(id: string): Promise<SlaContract> {
    const contract = await this.contractsRepository.findOne({
      where: { id },
      relations: ['client', 'client.branch'],
    });
    if (!contract) {
      throw new NotFoundException(`Contrato SLA con id ${id} no encontrado`);
    }
    return contract;
  }

  async create(dto: CreateSlaContractDto): Promise<SlaContractResponseDto> {
    // Validate client exists
    await this.clientesService.findById(dto.clientId);

    // Validate dates
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);
    if (endDate <= startDate) {
      throw new BadRequestException(
        'La fecha de fin debe ser posterior a la fecha de inicio',
      );
    }

    const contract = this.contractsRepository.create({
      clientId: dto.clientId,
      startDate: startDate,
      endDate: endDate,
      contractedHours: dto.contractedHours,
      usedHours: 0,
      availableBalance: dto.contractedHours,
      responseTimeHrs: dto.responseTimeHrs,
      includedServices: dto.includedServices,
      isActive: true,
      alertThreshold: dto.alertThreshold ?? 20,
    });

    const saved = await this.contractsRepository.save(contract);
    const full = await this.findById(saved.id);

    console.log(
      `[AUDIT] SLA Contract created: ${full.id}, client: ${full.clientId}, hours: ${full.contractedHours}`,
    );

    return SlaContractResponseDto.fromEntity(full);
  }

  async update(
    id: string,
    dto: UpdateSlaContractDto,
  ): Promise<SlaContractResponseDto> {
    const contract = await this.findById(id);

    const updateData: Partial<SlaContract> = {};

    if (dto.startDate !== undefined) {
      updateData.startDate = new Date(dto.startDate);
    }
    if (dto.endDate !== undefined) {
      updateData.endDate = new Date(dto.endDate);
    }

    // Validate dates after applying changes
    const effectiveStart = updateData.startDate ?? contract.startDate;
    const effectiveEnd = updateData.endDate ?? contract.endDate;
    if (new Date(effectiveEnd) <= new Date(effectiveStart)) {
      throw new BadRequestException(
        'La fecha de fin debe ser posterior a la fecha de inicio',
      );
    }

    if (dto.contractedHours !== undefined) {
      updateData.contractedHours = dto.contractedHours;
      // Recalculate available balance
      const currentUsed = Number(contract.usedHours);
      updateData.availableBalance = dto.contractedHours - currentUsed;
      if (updateData.availableBalance < 0) {
        throw new BadRequestException(
          `Las horas contratadas no pueden ser menores a las horas ya utilizadas (${currentUsed})`,
        );
      }
    }

    if (dto.responseTimeHrs !== undefined) {
      updateData.responseTimeHrs = dto.responseTimeHrs;
    }
    if (dto.includedServices !== undefined) {
      updateData.includedServices = dto.includedServices;
    }
    if (dto.alertThreshold !== undefined) {
      updateData.alertThreshold = dto.alertThreshold;
    }
    if (dto.isActive !== undefined) {
      updateData.isActive = dto.isActive;
    }

    await this.contractsRepository.update(id, updateData);

    const updated = await this.findById(id);

    console.log(
      `[AUDIT] SLA Contract updated: ${updated.id}, fields: ${Object.keys(updateData).join(', ')}`,
    );

    return SlaContractResponseDto.fromEntity(updated);
  }

  async deactivate(id: string): Promise<SlaContractResponseDto> {
    const contract = await this.findById(id);
    if (!contract.isActive) {
      throw new BadRequestException('El contrato ya se encuentra desactivado');
    }

    await this.contractsRepository.update(id, { isActive: false });
    const updated = await this.findById(id);

    console.log(`[AUDIT] SLA Contract deactivated: ${updated.id}`);

    return SlaContractResponseDto.fromEntity(updated);
  }

  async getMovements(contractId: string): Promise<ContractMovement[]> {
    // Verify contract exists
    await this.findById(contractId);

    return this.movementsRepository.find({
      where: { contractId },
      order: { createdAt: 'DESC' },
    });
  }

  async addDeduction(
    contractId: string,
    serviceId: string | null,
    hours: number,
    reason: string,
    userId: string,
  ): Promise<ContractMovement> {
    const contract = await this.findById(contractId);

    const currentBalance = Number(contract.availableBalance);
    if (hours > currentBalance) {
      throw new BadRequestException(
        `Horas insuficientes. Saldo disponible: ${currentBalance}, solicitado: ${hours}`,
      );
    }

    const newUsed = Number(contract.usedHours) + hours;
    const newBalance = Number(contract.contractedHours) - newUsed;

    await this.contractsRepository.update(contractId, {
      usedHours: newUsed,
      availableBalance: newBalance,
    });

    const movement = this.movementsRepository.create({
      contractId,
      serviceId,
      type: MovementType.DEDUCTION,
      affectedHours: hours,
      resultingBalance: newBalance,
      reason,
      createdBy: userId,
    });

    const saved = await this.movementsRepository.save(movement);

    // Check alert threshold
    const usagePercent =
      Number(contract.contractedHours) > 0
        ? (newBalance / Number(contract.contractedHours)) * 100
        : 0;

    if (usagePercent < contract.alertThreshold) {
      this.logger.warn(
        `[ALERT] Contrato SLA ${contractId}: saldo disponible (${newBalance}h) por debajo del umbral (${contract.alertThreshold}%). Uso: ${Math.round(10000 - usagePercent * 100) / 100}%`,
      );
    }

    console.log(
      `[AUDIT] SLA Deduction: contract=${contractId}, hours=${hours}, newBalance=${newBalance}`,
    );

    return saved;
  }

  async addReversal(
    contractId: string,
    serviceId: string | null,
    reason: string,
    userId: string,
  ): Promise<ContractMovement> {
    const contract = await this.findById(contractId);

    // Find the original deduction for this service
    const originalDeduction = await this.movementsRepository.findOne({
      where: {
        contractId,
        serviceId: serviceId ?? IsNull(),
        type: MovementType.DEDUCTION,
      },
      order: { createdAt: 'DESC' },
    });

    if (!originalDeduction) {
      throw new NotFoundException(
        'No se encontró una deducción original para revertir',
      );
    }

    const hoursToReverse = Number(originalDeduction.affectedHours);
    const newUsed = Number(contract.usedHours) - hoursToReverse;
    const newBalance = Number(contract.contractedHours) - newUsed;

    await this.contractsRepository.update(contractId, {
      usedHours: newUsed,
      availableBalance: newBalance,
    });

    const movement = this.movementsRepository.create({
      contractId,
      serviceId,
      type: MovementType.REVERSAL,
      affectedHours: hoursToReverse,
      resultingBalance: newBalance,
      reason,
      createdBy: userId,
    });

    const saved = await this.movementsRepository.save(movement);

    console.log(
      `[AUDIT] SLA Reversal: contract=${contractId}, hours=${hoursToReverse}, newBalance=${newBalance}`,
    );

    return saved;
  }
}
