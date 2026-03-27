import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Cliente } from '../../clientes/entities/cliente.entity';
import { ContractMovement } from './contract-movement.entity';

@Entity('contratos_sla')
export class SlaContract {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'cliente_id' })
  clientId!: string;

  @Column({ type: 'date', name: 'fecha_inicio' })
  startDate!: Date;

  @Column({ type: 'date', name: 'fecha_fin' })
  endDate!: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'horas_contratadas' })
  contractedHours!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'horas_utilizadas', default: 0 })
  usedHours!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'saldo_disponible' })
  availableBalance!: number;

  @Column({ type: 'int', name: 'tiempo_respuesta_hrs' })
  responseTimeHrs!: number;

  @Column({ type: 'simple-array', name: 'servicios_incluidos' })
  includedServices!: string[];

  @Column({ default: true, name: 'activo' })
  isActive!: boolean;

  @Column({ type: 'int', name: 'umbral_alerta', default: 20 })
  alertThreshold!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @ManyToOne(() => Cliente, { nullable: false })
  @JoinColumn({ name: 'cliente_id' })
  client!: Cliente;

  @OneToMany(() => ContractMovement, (movement) => movement.contract)
  movements!: ContractMovement[];
}
