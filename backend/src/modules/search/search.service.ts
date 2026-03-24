import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Cliente } from '../clientes/entities/cliente.entity';
import { Equipo } from '../equipos/entities/equipo.entity';
import { UserRole } from '../../common/enums/user-role.enum';
import { SearchFilter } from './dto/search-query.dto';
import {
  SearchResponse,
  ClientSearchResult,
  EquipmentSearchResult,
} from './dto/search-results.dto';

const MAX_RESULTS_PER_CATEGORY = 20;

@Injectable()
export class SearchService {
  constructor(
    @InjectRepository(Cliente)
    private readonly clientesRepository: Repository<Cliente>,
    @InjectRepository(Equipo)
    private readonly equiposRepository: Repository<Equipo>,
  ) {}

  async search(
    query: string,
    filter: SearchFilter = SearchFilter.ALL,
    branchId: string | undefined,
    userRole: UserRole,
    userBranchId: string | null,
  ): Promise<SearchResponse> {
    const startTime = Date.now();

    // Branch managers can only see their own branch
    const effectiveBranchId =
      userRole === UserRole.BRANCH_MANAGER ? userBranchId : branchId;

    const searchTerm = `%${query}%`;

    const [clients, equipment] = await Promise.all([
      filter === SearchFilter.EQUIPMENT
        ? Promise.resolve([] as ClientSearchResult[])
        : this.searchClients(searchTerm, effectiveBranchId),
      filter === SearchFilter.CLIENTS
        ? Promise.resolve([] as EquipmentSearchResult[])
        : this.searchEquipment(searchTerm, effectiveBranchId),
    ]);

    const searchTime = Date.now() - startTime;

    console.log(
      `[AUDIT] Search performed — query: "${query}", filter: ${filter}, results: ${clients.length} clients, ${equipment.length} equipment, time: ${searchTime}ms`,
    );

    return {
      clients,
      equipment,
      meta: {
        totalClients: clients.length,
        totalEquipment: equipment.length,
        searchTime,
      },
    };
  }

  private async searchClients(
    searchTerm: string,
    branchId: string | null | undefined,
  ): Promise<ClientSearchResult[]> {
    const qb: SelectQueryBuilder<Cliente> = this.clientesRepository
      .createQueryBuilder('cliente')
      .leftJoinAndSelect('cliente.branch', 'branch')
      .loadRelationCountAndMap('cliente.equiposCount', 'cliente.equipos');

    qb.where(
      '(cliente.nit ILIKE :search OR cliente.ci ILIKE :search OR cliente.codigo ILIKE :search OR cliente.firstName ILIKE :search OR cliente.lastName ILIKE :search OR cliente.razonSocial ILIKE :search)',
      { search: searchTerm },
    );

    if (branchId) {
      qb.andWhere('cliente.branchId = :branchId', { branchId });
    }

    qb.orderBy('cliente.createdAt', 'DESC');
    qb.take(MAX_RESULTS_PER_CATEGORY);

    const clientes = await qb.getMany();

    return clientes.map((c): ClientSearchResult => {
      const equiposCount =
        (c as unknown as Record<string, number>)['equiposCount'] ?? 0;
      return {
        id: c.id,
        code: c.codigo,
        type: c.tipo === 'empresa' ? 'company' : 'person',
        displayName:
          c.tipo === 'empresa'
            ? (c.razonSocial ?? '')
            : `${c.firstName ?? ''} ${c.lastName ?? ''}`.trim(),
        nit: c.nit,
        ci: c.ci,
        branch: c.branch ? { id: c.branch.id, name: c.branch.name } : null,
        equipmentCount: equiposCount,
        isActive: c.isActive,
      };
    });
  }

  private async searchEquipment(
    searchTerm: string,
    branchId: string | null | undefined,
  ): Promise<EquipmentSearchResult[]> {
    const qb: SelectQueryBuilder<Equipo> = this.equiposRepository
      .createQueryBuilder('equipo')
      .leftJoinAndSelect('equipo.cliente', 'cliente')
      .leftJoin('cliente.branch', 'branch');

    qb.where(
      '(equipo.numeroSerie ILIKE :search OR equipo.marca ILIKE :search OR equipo.modelo ILIKE :search)',
      { search: searchTerm },
    );

    if (branchId) {
      qb.andWhere('cliente.branchId = :branchId', { branchId });
    }

    qb.orderBy('equipo.createdAt', 'DESC');
    qb.take(MAX_RESULTS_PER_CATEGORY);

    const equipos = await qb.getMany();

    return equipos.map((e): EquipmentSearchResult => {
      const clientName = e.cliente
        ? e.cliente.tipo === 'empresa'
          ? (e.cliente.razonSocial ?? '')
          : `${e.cliente.firstName ?? ''} ${e.cliente.lastName ?? ''}`.trim()
        : '';

      return {
        id: e.id,
        serialNumber: e.numeroSerie,
        brand: e.marca,
        model: e.modelo,
        equipmentType: e.tipoEquipo,
        clientName,
        clientId: e.clienteId,
        isActive: e.isActive,
      };
    });
  }
}
