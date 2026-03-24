import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { TipoEquipo } from '../../../common/enums/tipo-equipo.enum';
import { Cliente } from '../../clientes/entities/cliente.entity';

@Entity('equipos')
export class Equipo {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'numero_serie', length: 100, unique: true })
  numeroSerie!: string;

  @Column({ length: 100 })
  marca!: string;

  @Column({ length: 100 })
  modelo!: string;

  @Column({ type: 'enum', enum: TipoEquipo, name: 'tipo_equipo' })
  tipoEquipo!: TipoEquipo;

  @Column({ type: 'text', nullable: true })
  descripcion!: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'foto_url' })
  fotoUrl!: string | null;

  @Column({ type: 'uuid', name: 'cliente_id' })
  clienteId!: string;

  @Column({ default: true, name: 'activo' })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @ManyToOne(() => Cliente, (cliente) => cliente.equipos, { nullable: false })
  @JoinColumn({ name: 'cliente_id' })
  cliente!: Cliente;
}
