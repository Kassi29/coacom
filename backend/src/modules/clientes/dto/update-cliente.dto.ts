import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  IsEmail,
  IsBoolean,
  MaxLength,
} from 'class-validator';
import { TipoCliente } from '../../../common/enums/tipo-cliente.enum';

export class UpdateClienteDto {
  @IsEnum(TipoCliente)
  @IsOptional()
  tipo?: TipoCliente;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  nit?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  ci?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  razonSocial?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  firstName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  lastName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  telefono?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  direccion?: string;

  @IsUUID()
  @IsOptional()
  branchId?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
