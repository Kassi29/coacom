import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { UserRole } from '../../../common/enums/user-role.enum';
import { Branch } from '../../branches/entities/branch.entity';

@Entity('usuarios')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'auth_id', unique: true })
  authId!: string;

  @Column({ name: 'nombre', length: 100 })
  firstName!: string;

  @Column({ name: 'apellido', length: 100 })
  lastName!: string;

  @Column({ unique: true })
  email!: string;

  @Column({ name: 'rol', type: 'enum', enum: UserRole })
  role!: UserRole;

  @Column({ type: 'uuid', name: 'sucursal_id', nullable: true })
  branchId!: string | null;

  @Column({ name: 'especialidad', type: 'varchar', length: 100, nullable: true })
  specialty!: string | null;

  @Column({ name: 'activo', default: true })
  isActive!: boolean;

  @Column({ name: 'must_change_password', default: true })
  mustChangePassword!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @ManyToOne(() => Branch, (branch) => branch.users, {
    nullable: true,
  })
  @JoinColumn({ name: 'sucursal_id' })
  branch!: Branch | null;
}
