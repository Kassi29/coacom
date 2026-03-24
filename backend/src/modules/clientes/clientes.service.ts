import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Cliente } from './entities/cliente.entity';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';
import { QueryClientesDto } from './dto/query-clientes.dto';
import { ClienteResponseDto } from './dto/cliente-response.dto';
import { PaginatedResponse } from '../../common/interfaces/paginated-response.interface';
import { TipoCliente } from '../../common/enums/tipo-cliente.enum';

@Injectable()
export class ClientesService {
  constructor(
    @InjectRepository(Cliente)
    private readonly clientesRepository: Repository<Cliente>,
  ) {}

  async findAll(
    query: QueryClientesDto,
  ): Promise<PaginatedResponse<ClienteResponseDto>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const qb: SelectQueryBuilder<Cliente> = this.clientesRepository
      .createQueryBuilder('cliente')
      .leftJoinAndSelect('cliente.branch', 'branch')
      .loadRelationCountAndMap('cliente.equiposCount', 'cliente.equipos');

    if (query.tipo) {
      qb.andWhere('cliente.tipo = :tipo', { tipo: query.tipo });
    }

    if (query.branchId) {
      qb.andWhere('cliente.branchId = :branchId', {
        branchId: query.branchId,
      });
    }

    if (query.search) {
      qb.andWhere(
        '(cliente.firstName ILIKE :search OR cliente.lastName ILIKE :search OR cliente.razonSocial ILIKE :search OR cliente.nit ILIKE :search OR cliente.ci ILIKE :search OR cliente.codigo ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    qb.orderBy('cliente.createdAt', 'DESC');
    qb.skip(skip).take(limit);

    const [clientes, total] = await qb.getManyAndCount();
    const totalPages = Math.ceil(total / limit);

    console.log(
      `[AUDIT] Clientes list queried — page: ${page}, results: ${clientes.length}, total: ${total}`,
    );

    return {
      data: clientes.map((c) =>
        ClienteResponseDto.fromEntity(c, (c as unknown as Record<string, number>)['equiposCount'] ?? 0),
      ),
      meta: { total, page, limit, totalPages },
    };
  }

  async findOne(id: string): Promise<ClienteResponseDto> {
    const cliente = await this.findById(id);
    const equiposCount = await this.countEquipos(id);
    return ClienteResponseDto.fromEntity(cliente, equiposCount);
  }

  async findOneWithDetails(id: string): Promise<ClienteResponseDto> {
    const cliente = await this.clientesRepository.findOne({
      where: { id },
      relations: ['branch', 'equipos'],
    });
    if (!cliente) {
      throw new NotFoundException(`Cliente con id ${id} no encontrado`);
    }
    const equiposCount = cliente.equipos?.length ?? 0;
    return ClienteResponseDto.fromEntity(cliente, equiposCount);
  }

  async findById(id: string): Promise<Cliente> {
    const cliente = await this.clientesRepository.findOne({
      where: { id },
      relations: ['branch'],
    });
    if (!cliente) {
      throw new NotFoundException(`Cliente con id ${id} no encontrado`);
    }
    return cliente;
  }

  async create(dto: CreateClienteDto): Promise<ClienteResponseDto> {
    this.validateClienteData(dto);

    // Check NIT/CI uniqueness
    if (dto.nit) {
      const existing = await this.clientesRepository.findOne({
        where: { nit: dto.nit },
      });
      if (existing) {
        throw new ConflictException(
          `Ya existe un cliente con NIT: ${dto.nit}`,
        );
      }
    }

    if (dto.ci) {
      const existing = await this.clientesRepository.findOne({
        where: { ci: dto.ci },
      });
      if (existing) {
        throw new ConflictException(
          `Ya existe un cliente con CI: ${dto.ci}`,
        );
      }
    }

    const codigo = await this.generateCodigo();

    const cliente = this.clientesRepository.create({
      codigo,
      tipo: dto.tipo,
      nit: dto.nit ?? null,
      ci: dto.ci ?? null,
      razonSocial: dto.razonSocial ?? null,
      firstName: dto.firstName ?? null,
      lastName: dto.lastName ?? null,
      telefono: dto.telefono ?? null,
      email: dto.email ?? null,
      direccion: dto.direccion ?? null,
      branchId: dto.branchId,
      isActive: true,
    });

    const saved = await this.clientesRepository.save(cliente);
    const full = await this.findById(saved.id);

    console.log(
      `[AUDIT] Cliente created: ${full.id} (${full.codigo}), tipo: ${full.tipo}`,
    );

    return ClienteResponseDto.fromEntity(full, 0);
  }

  async update(
    id: string,
    dto: UpdateClienteDto,
  ): Promise<ClienteResponseDto> {
    const cliente = await this.findById(id);

    // Check NIT uniqueness if changing
    if (dto.nit && dto.nit !== cliente.nit) {
      const existing = await this.clientesRepository.findOne({
        where: { nit: dto.nit },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException(
          `Ya existe un cliente con NIT: ${dto.nit}`,
        );
      }
    }

    // Check CI uniqueness if changing
    if (dto.ci && dto.ci !== cliente.ci) {
      const existing = await this.clientesRepository.findOne({
        where: { ci: dto.ci },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException(
          `Ya existe un cliente con CI: ${dto.ci}`,
        );
      }
    }

    const updateData: Partial<Cliente> = {};

    if (dto.tipo !== undefined) updateData.tipo = dto.tipo;
    if (dto.nit !== undefined) updateData.nit = dto.nit ?? null;
    if (dto.ci !== undefined) updateData.ci = dto.ci ?? null;
    if (dto.razonSocial !== undefined) updateData.razonSocial = dto.razonSocial ?? null;
    if (dto.firstName !== undefined) updateData.firstName = dto.firstName ?? null;
    if (dto.lastName !== undefined) updateData.lastName = dto.lastName ?? null;
    if (dto.telefono !== undefined) updateData.telefono = dto.telefono ?? null;
    if (dto.email !== undefined) updateData.email = dto.email ?? null;
    if (dto.direccion !== undefined) updateData.direccion = dto.direccion ?? null;
    if (dto.branchId !== undefined) updateData.branchId = dto.branchId;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;

    await this.clientesRepository.update(id, updateData);

    const updated = await this.findById(id);
    const equiposCount = await this.countEquipos(id);

    console.log(
      `[AUDIT] Cliente updated: ${updated.id} (${updated.codigo}), fields: ${Object.keys(updateData).join(', ')}`,
    );

    return ClienteResponseDto.fromEntity(updated, equiposCount);
  }

  private validateClienteData(dto: CreateClienteDto): void {
    if (dto.tipo === TipoCliente.PERSONA) {
      if (!dto.ci) {
        throw new BadRequestException(
          'CI es requerido para clientes tipo Persona',
        );
      }
      if (!dto.firstName || !dto.lastName) {
        throw new BadRequestException(
          'Nombre y apellido son requeridos para clientes tipo Persona',
        );
      }
    } else if (dto.tipo === TipoCliente.EMPRESA) {
      if (!dto.nit) {
        throw new BadRequestException(
          'NIT es requerido para clientes tipo Empresa',
        );
      }
      if (!dto.razonSocial) {
        throw new BadRequestException(
          'Razón social es requerida para clientes tipo Empresa',
        );
      }
    }
  }

  private async generateCodigo(): Promise<string> {
    const lastCliente = await this.clientesRepository
      .createQueryBuilder('cliente')
      .orderBy('cliente.createdAt', 'DESC')
      .getOne();

    let nextNumber = 1;
    if (lastCliente) {
      const match = lastCliente.codigo.match(/COACOM-(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }

    return `COACOM-${nextNumber.toString().padStart(5, '0')}`;
  }

  async countEquipos(clienteId: string): Promise<number> {
    const result = await this.clientesRepository
      .createQueryBuilder('cliente')
      .leftJoin('cliente.equipos', 'equipo')
      .where('cliente.id = :clienteId', { clienteId })
      .select('COUNT(equipo.id)', 'count')
      .getRawOne();
    return parseInt(result?.count ?? '0', 10);
  }
}
