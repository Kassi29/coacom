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
import { TipoCliente } from '../../../common/enums/tipo-cliente.enum';
import { Branch } from '../../branches/entities/branch.entity';
import { Equipo } from '../../equipos/entities/equipo.entity';

@Entity('clientes')
export class Cliente {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 20, unique: true })
  codigo!: string;

  @Column({ type: 'enum', enum: TipoCliente })
  tipo!: TipoCliente;

  @Column({ type: 'varchar', length: 20, nullable: true })
  nit!: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  ci!: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true, name: 'razon_social' })
  razonSocial!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'nombre' })
  firstName!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'apellido' })
  lastName!: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  telefono!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email!: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  direccion!: string | null;

  @Column({ type: 'uuid', name: 'sucursal_id' })
  branchId!: string;

  @Column({ default: true, name: 'activo' })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @ManyToOne(() => Branch, { nullable: false })
  @JoinColumn({ name: 'sucursal_id' })
  branch!: Branch;

  @OneToMany(() => Equipo, (equipo) => equipo.cliente)
  equipos!: Equipo[];
}
