import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { TipoEquipo } from '../../../common/enums/tipo-equipo.enum';

export class CreateEquipoDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  numeroSerie!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  marca!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  modelo!: string;

  @IsEnum(TipoEquipo)
  @IsNotEmpty()
  tipoEquipo!: TipoEquipo;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  fotoUrl?: string;

  @IsUUID()
  @IsNotEmpty()
  clienteId!: string;
}
