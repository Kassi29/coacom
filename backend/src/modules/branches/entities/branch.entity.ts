import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('sucursales')
export class Branch {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'nombre', length: 100 })
  name!: string;

  @Column({ name: 'ciudad', length: 100 })
  city!: string;

  @Column({ name: 'direccion', type: 'varchar', length: 255, nullable: true })
  address!: string | null;

  @Column({ name: 'telefono', type: 'varchar', length: 20, nullable: true })
  phone!: string | null;

  @Column({ name: 'activo', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @OneToMany(() => User, (user) => user.branch)
  users!: User[];
}
