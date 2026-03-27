import {
  IsUUID,
  IsNotEmpty,
  IsDateString,
  IsNumber,
  IsArray,
  IsOptional,
  Min,
  Max,
  ArrayMinSize,
  IsString,
} from 'class-validator';

export class CreateSlaContractDto {
  @IsUUID()
  @IsNotEmpty()
  clientId!: string;

  @IsDateString()
  @IsNotEmpty()
  startDate!: string;

  @IsDateString()
  @IsNotEmpty()
  endDate!: string;

  @IsNumber()
  @Min(1)
  contractedHours!: number;

  @IsNumber()
  @Min(1)
  responseTimeHrs!: number;

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  includedServices!: string[];

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  alertThreshold?: number;
}
