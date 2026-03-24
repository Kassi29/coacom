import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Equipo } from './entities/equipo.entity';
import { CreateEquipoDto } from './dto/create-equipo.dto';
import { UpdateEquipoDto } from './dto/update-equipo.dto';
import { QueryEquiposDto } from './dto/query-equipos.dto';
import { EquipoResponseDto } from './dto/equipo-response.dto';
import {
  EquipmentDetailResponse,
  buildEquipmentDetailResponse,
} from './dto/equipo-detail-response.dto';
import { PaginatedResponse } from '../../common/interfaces/paginated-response.interface';

@Injectable()
export class EquiposService {
  constructor(
    @InjectRepository(Equipo)
    private readonly equiposRepository: Repository<Equipo>,
  ) {}

  async findAll(
    query: QueryEquiposDto,
  ): Promise<PaginatedResponse<EquipoResponseDto>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const qb: SelectQueryBuilder<Equipo> = this.equiposRepository
      .createQueryBuilder('equipo')
      .leftJoinAndSelect('equipo.cliente', 'cliente');

    if (query.clienteId) {
      qb.andWhere('equipo.clienteId = :clienteId', {
        clienteId: query.clienteId,
      });
    }

    if (query.tipoEquipo) {
      qb.andWhere('equipo.tipoEquipo = :tipoEquipo', {
        tipoEquipo: query.tipoEquipo,
      });
    }

    if (query.search) {
      qb.andWhere(
        '(equipo.numeroSerie ILIKE :search OR equipo.marca ILIKE :search OR equipo.modelo ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    qb.orderBy('equipo.createdAt', 'DESC');
    qb.skip(skip).take(limit);

    const [equipos, total] = await qb.getManyAndCount();
    const totalPages = Math.ceil(total / limit);

    console.log(
      `[AUDIT] Equipos list queried — page: ${page}, results: ${equipos.length}, total: ${total}`,
    );

    return {
      data: equipos.map((e) => EquipoResponseDto.fromEntity(e)),
      meta: { total, page, limit, totalPages },
    };
  }

  async findOne(id: string): Promise<EquipoResponseDto> {
    const equipo = await this.findById(id);
    return EquipoResponseDto.fromEntity(equipo);
  }

  async findById(id: string): Promise<Equipo> {
    const equipo = await this.equiposRepository.findOne({
      where: { id },
      relations: ['cliente'],
    });
    if (!equipo) {
      throw new NotFoundException(`Equipo con id ${id} no encontrado`);
    }
    return equipo;
  }

  async findByNumeroSerie(numeroSerie: string): Promise<Equipo | null> {
    return this.equiposRepository.findOne({
      where: { numeroSerie },
      relations: ['cliente'],
    });
  }

  async findByClienteId(clienteId: string): Promise<EquipoResponseDto[]> {
    const equipos = await this.equiposRepository.find({
      where: { clienteId },
      relations: ['cliente'],
      order: { createdAt: 'DESC' },
    });
    return equipos.map((e) => EquipoResponseDto.fromEntity(e));
  }

  async findOneWithTimeline(id: string): Promise<EquipmentDetailResponse> {
    const equipo = await this.findById(id);
    return buildEquipmentDetailResponse(equipo);
  }

  async countByClienteId(clienteId: string): Promise<number> {
    return this.equiposRepository.count({ where: { clienteId } });
  }

  async create(dto: CreateEquipoDto): Promise<EquipoResponseDto> {
    const existing = await this.findByNumeroSerie(dto.numeroSerie);
    if (existing) {
      throw new ConflictException(
        `Ya existe un equipo con número de serie: ${dto.numeroSerie}`,
      );
    }

    const equipo = this.equiposRepository.create({
      numeroSerie: dto.numeroSerie,
      marca: dto.marca,
      modelo: dto.modelo,
      tipoEquipo: dto.tipoEquipo,
      descripcion: dto.descripcion ?? null,
      fotoUrl: dto.fotoUrl ?? null,
      clienteId: dto.clienteId,
      isActive: true,
    });

    const saved = await this.equiposRepository.save(equipo);
    const full = await this.findById(saved.id);

    console.log(
      `[AUDIT] Equipo created: ${full.id} (${full.numeroSerie}), cliente: ${full.clienteId}`,
    );

    return EquipoResponseDto.fromEntity(full);
  }

  async update(
    id: string,
    dto: UpdateEquipoDto,
  ): Promise<EquipoResponseDto> {
    await this.findById(id);

    const updateData: Partial<Equipo> = {};

    if (dto.marca !== undefined) updateData.marca = dto.marca;
    if (dto.modelo !== undefined) updateData.modelo = dto.modelo;
    if (dto.tipoEquipo !== undefined) updateData.tipoEquipo = dto.tipoEquipo;
    if (dto.descripcion !== undefined) updateData.descripcion = dto.descripcion ?? null;
    if (dto.fotoUrl !== undefined) updateData.fotoUrl = dto.fotoUrl ?? null;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;

    await this.equiposRepository.update(id, updateData);

    const updated = await this.findById(id);

    console.log(
      `[AUDIT] Equipo updated: ${updated.id} (${updated.numeroSerie}), fields: ${Object.keys(updateData).join(', ')}`,
    );

    return EquipoResponseDto.fromEntity(updated);
  }
}
