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
import { EquiposService } from './equipos.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { CreateEquipoDto } from './dto/create-equipo.dto';
import { UpdateEquipoDto } from './dto/update-equipo.dto';
import { QueryEquiposDto } from './dto/query-equipos.dto';
import { EquipoResponseDto } from './dto/equipo-response.dto';
import { EquipmentDetailResponse } from './dto/equipo-detail-response.dto';
import { PaginatedResponse } from '../../common/interfaces/paginated-response.interface';

@Controller('equipos')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EquiposController {
  constructor(private readonly equiposService: EquiposService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.GENERAL_MANAGER, UserRole.BRANCH_MANAGER)
  async findAll(
    @Query() query: QueryEquiposDto,
  ): Promise<PaginatedResponse<EquipoResponseDto>> {
    return this.equiposService.findAll(query);
  }

  @Get(':id/detail')
  @Roles(UserRole.ADMIN, UserRole.GENERAL_MANAGER, UserRole.BRANCH_MANAGER)
  async findOneWithTimeline(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<EquipmentDetailResponse> {
    return this.equiposService.findOneWithTimeline(id);
  }

  @Get('cliente/:clienteId')
  @Roles(UserRole.ADMIN, UserRole.GENERAL_MANAGER, UserRole.BRANCH_MANAGER)
  async findByCliente(
    @Param('clienteId', ParseUUIDPipe) clienteId: string,
  ): Promise<EquipoResponseDto[]> {
    return this.equiposService.findByClienteId(clienteId);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.GENERAL_MANAGER, UserRole.BRANCH_MANAGER)
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<EquipoResponseDto> {
    return this.equiposService.findOne(id);
  }

  @Post()
  @Roles(UserRole.BRANCH_MANAGER)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateEquipoDto): Promise<EquipoResponseDto> {
    return this.equiposService.create(dto);
  }

  @Patch(':id')
  @Roles(UserRole.BRANCH_MANAGER)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEquipoDto,
  ): Promise<EquipoResponseDto> {
    return this.equiposService.update(id, dto);
  }
}
