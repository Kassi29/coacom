import {
  IsOptional,
  IsString,
  IsUUID,
  IsInt,
  IsIn,
  Min,
  Max,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class QuerySlaContractsDto {
  @IsOptional()
  @Transform(({ value }: { value: string }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }: { value: string }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(['active', 'expired', 'all'])
  status?: 'active' | 'expired' | 'all';

  @IsOptional()
  @IsUUID()
  clientId?: string;

  @IsOptional()
  @IsUUID()
  branchId?: string;
}
