import {
  IsEnum,
  IsOptional,
  IsString,
  IsBoolean,
  MaxLength,
} from 'class-validator';
import { TipoEquipo } from '../../../common/enums/tipo-equipo.enum';

export class UpdateEquipoDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  marca?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  modelo?: string;

  @IsEnum(TipoEquipo)
  @IsOptional()
  tipoEquipo?: TipoEquipo;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  fotoUrl?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
