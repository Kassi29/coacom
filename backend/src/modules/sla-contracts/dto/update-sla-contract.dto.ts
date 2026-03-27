import {
  IsDateString,
  IsNumber,
  IsArray,
  IsOptional,
  Min,
  Max,
  ArrayMinSize,
  IsString,
  IsBoolean,
} from 'class-validator';

export class UpdateSlaContractDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  contractedHours?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  responseTimeHrs?: number;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  includedServices?: string[];

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  alertThreshold?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
