import { Equipo } from '../entities/equipo.entity';

export class EquipoResponseDto {
  id!: string;
  numeroSerie!: string;
  marca!: string;
  modelo!: string;
  tipoEquipo!: string;
  descripcion!: string | null;
  fotoUrl!: string | null;
  clienteId!: string;
  cliente!: { id: string; codigo: string; nombreCompleto: string } | null;
  isActive!: boolean;
  createdAt!: Date;
  updatedAt!: Date;

  static fromEntity(entity: Equipo): EquipoResponseDto {
    const dto = new EquipoResponseDto();
    dto.id = entity.id;
    dto.numeroSerie = entity.numeroSerie;
    dto.marca = entity.marca;
    dto.modelo = entity.modelo;
    dto.tipoEquipo = entity.tipoEquipo;
    dto.descripcion = entity.descripcion;
    dto.fotoUrl = entity.fotoUrl;
    dto.clienteId = entity.clienteId;
    dto.cliente = entity.cliente
      ? {
          id: entity.cliente.id,
          codigo: entity.cliente.codigo,
          nombreCompleto:
            entity.cliente.tipo === 'empresa'
              ? (entity.cliente.razonSocial ?? '')
              : `${entity.cliente.firstName ?? ''} ${entity.cliente.lastName ?? ''}`.trim(),
        }
      : null;
    dto.isActive = entity.isActive;
    dto.createdAt = entity.createdAt;
    dto.updatedAt = entity.updatedAt;
    return dto;
  }
}
