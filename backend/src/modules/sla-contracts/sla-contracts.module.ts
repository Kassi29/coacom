import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SlaContractsController } from './sla-contracts.controller';
import { SlaContractsService } from './sla-contracts.service';
import { SlaContract } from './entities/sla-contract.entity';
import { ContractMovement } from './entities/contract-movement.entity';
import { ClientesModule } from '../clientes/clientes.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SlaContract, ContractMovement]),
    ClientesModule,
  ],
  controllers: [SlaContractsController],
  providers: [SlaContractsService],
  exports: [SlaContractsService],
})
export class SlaContractsModule {}
