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
import { ClientesService } from './clientes.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';
import { QueryClientesDto } from './dto/query-clientes.dto';
import { ClienteResponseDto } from './dto/cliente-response.dto';
import { PaginatedResponse } from '../../common/interfaces/paginated-response.interface';

@Controller('clientes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClientesController {
  constructor(private readonly clientesService: ClientesService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.GENERAL_MANAGER, UserRole.BRANCH_MANAGER)
  async findAll(
    @Query() query: QueryClientesDto,
  ): Promise<PaginatedResponse<ClienteResponseDto>> {
    return this.clientesService.findAll(query);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.GENERAL_MANAGER, UserRole.BRANCH_MANAGER)
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ClienteResponseDto> {
    return this.clientesService.findOne(id);
  }

  @Post()
  @Roles(UserRole.BRANCH_MANAGER)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateClienteDto): Promise<ClienteResponseDto> {
    return this.clientesService.create(dto);
  }

  @Patch(':id')
  @Roles(UserRole.BRANCH_MANAGER)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateClienteDto,
  ): Promise<ClienteResponseDto> {
    return this.clientesService.update(id, dto);
  }
}
