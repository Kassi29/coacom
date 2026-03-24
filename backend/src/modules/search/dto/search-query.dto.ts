import { IsString, MinLength, IsOptional, IsEnum, IsUUID } from 'class-validator';

export enum SearchFilter {
  ALL = 'all',
  CLIENTS = 'clients',
  EQUIPMENT = 'equipment',
}

export class SearchQueryDto {
  @IsString()
  @MinLength(2, { message: 'La búsqueda debe tener al menos 2 caracteres' })
  query!: string;

  @IsOptional()
  @IsEnum(SearchFilter, {
    message: 'El filtro debe ser: all, clients o equipment',
  })
  filter?: SearchFilter;

  @IsOptional()
  @IsUUID('4', { message: 'branchId debe ser un UUID válido' })
  branchId?: string;
}
