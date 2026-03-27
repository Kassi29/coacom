import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { MovementType } from '../../../common/enums/movement-type.enum';
import { SlaContract } from './sla-contract.entity';

@Entity('contrato_movimientos')
export class ContractMovement {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'contrato_id' })
  contractId!: string;

  @Column({ type: 'uuid', nullable: true, name: 'servicio_id' })
  serviceId!: string | null;

  @Column({ type: 'enum', enum: MovementType, name: 'tipo' })
  type!: MovementType;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'horas_afectadas' })
  affectedHours!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'saldo_resultante' })
  resultingBalance!: number;

  @Column({ type: 'varchar', length: 500, name: 'motivo' })
  reason!: string;

  @Column({ type: 'uuid', name: 'created_by' })
  createdBy!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @ManyToOne(() => SlaContract, (contract) => contract.movements, { nullable: false })
  @JoinColumn({ name: 'contrato_id' })
  contract!: SlaContract;
}
