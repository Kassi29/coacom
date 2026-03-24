import { Cliente } from '../entities/cliente.entity';

export class ClienteResponseDto {
  id!: string;
  codigo!: string;
  tipo!: string;
  nit!: string | null;
  ci!: string | null;
  razonSocial!: string | null;
  firstName!: string | null;
  lastName!: string | null;
  nombreCompleto!: string;
  telefono!: string | null;
  email!: string | null;
  direccion!: string | null;
  branchId!: string;
  branch!: { id: string; name: string; city: string } | null;
  isActive!: boolean;
  equiposCount!: number;
  createdAt!: Date;
  updatedAt!: Date;

  static fromEntity(entity: Cliente, equiposCount = 0): ClienteResponseDto {
    const dto = new ClienteResponseDto();
    dto.id = entity.id;
    dto.codigo = entity.codigo;
    dto.tipo = entity.tipo;
    dto.nit = entity.nit;
    dto.ci = entity.ci;
    dto.razonSocial = entity.razonSocial;
    dto.firstName = entity.firstName;
    dto.lastName = entity.lastName;
    dto.nombreCompleto =
      entity.tipo === 'empresa'
        ? (entity.razonSocial ?? '')
        : `${entity.firstName ?? ''} ${entity.lastName ?? ''}`.trim();
    dto.telefono = entity.telefono;
    dto.email = entity.email;
    dto.direccion = entity.direccion;
    dto.branchId = entity.branchId;
    dto.branch = entity.branch
      ? {
          id: entity.branch.id,
          name: entity.branch.name,
          city: entity.branch.city,
        }
      : null;
    dto.isActive = entity.isActive;
    dto.equiposCount = equiposCount;
    dto.createdAt = entity.createdAt;
    dto.updatedAt = entity.updatedAt;
    return dto;
  }
}
