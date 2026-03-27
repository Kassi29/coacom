import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  ParseUUIDPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SlaContractsService } from './sla-contracts.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { CreateSlaContractDto } from './dto/create-sla-contract.dto';
import { UpdateSlaContractDto } from './dto/update-sla-contract.dto';
import { QuerySlaContractsDto } from './dto/query-sla-contracts.dto';
import { SlaContractResponseDto } from './dto/sla-contract-response.dto';
import { PaginatedResponse } from '../../common/interfaces/paginated-response.interface';
import { ContractMovement } from './entities/contract-movement.entity';

@Controller('sla-contracts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SlaContractsController {
  constructor(private readonly slaContractsService: SlaContractsService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.GENERAL_MANAGER, UserRole.BRANCH_MANAGER)
  async findAll(
    @Query() query: QuerySlaContractsDto,
  ): Promise<PaginatedResponse<SlaContractResponseDto>> {
    return this.slaContractsService.findAll(query);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.GENERAL_MANAGER, UserRole.BRANCH_MANAGER)
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<SlaContractResponseDto> {
    return this.slaContractsService.findOne(id);
  }

  @Get(':id/movements')
  @Roles(UserRole.ADMIN, UserRole.GENERAL_MANAGER, UserRole.BRANCH_MANAGER)
  async getMovements(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ContractMovement[]> {
    return this.slaContractsService.getMovements(id);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.BRANCH_MANAGER)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreateSlaContractDto,
  ): Promise<SlaContractResponseDto> {
    return this.slaContractsService.create(dto);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.BRANCH_MANAGER)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSlaContractDto,
  ): Promise<SlaContractResponseDto> {
    return this.slaContractsService.update(id, dto);
  }

  @Patch(':id/deactivate')
  @Roles(UserRole.ADMIN, UserRole.BRANCH_MANAGER)
  async deactivate(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<SlaContractResponseDto> {
    return this.slaContractsService.deactivate(id);
  }
}
