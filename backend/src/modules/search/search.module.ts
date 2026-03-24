import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { Cliente } from '../clientes/entities/cliente.entity';
import { Equipo } from '../equipos/entities/equipo.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Cliente, Equipo])],
  controllers: [SearchController],
  providers: [SearchService],
})
export class SearchModule {}
