import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../../config/supabase.config';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { PaginatedResponse } from '../../common/interfaces/paginated-response.interface';
import { UserRole } from '../../common/enums/user-role.enum';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @Inject(SUPABASE_CLIENT)
    private readonly supabase: SupabaseClient,
  ) {}

  async findAll(
    query: QueryUsersDto,
  ): Promise<PaginatedResponse<UserResponseDto>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const qb: SelectQueryBuilder<User> = this.usersRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.branch', 'branch');

    // Filter by role
    if (query.role) {
      qb.andWhere('user.role = :role', { role: query.role });
    }

    // Filter by branch
    if (query.branchId) {
      qb.andWhere('user.branchId = :branchId', {
        branchId: query.branchId,
      });
    }

    // Filter by active status
    if (query.isActive !== undefined) {
      const isActiveBoolean = query.isActive === 'true';
      qb.andWhere('user.isActive = :isActive', { isActive: isActiveBoolean });
    }

    // Search by firstName, lastName, or email
    if (query.search) {
      qb.andWhere(
        '(user.firstName ILIKE :search OR user.lastName ILIKE :search OR user.email ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    qb.orderBy('user.createdAt', 'DESC');
    qb.skip(skip).take(limit);

    const [users, total] = await qb.getManyAndCount();
    const totalPages = Math.ceil(total / limit);

    console.log(
      `[AUDIT] Users list queried — page: ${page}, results: ${users.length}, total: ${total}`,
    );

    return {
      data: users.map((user) => UserResponseDto.fromEntity(user)),
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  async findOne(id: string): Promise<UserResponseDto> {
    const user = await this.findById(id);
    return UserResponseDto.fromEntity(user);
  }

  async findById(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['branch'],
    });
    if (!user) {
      throw new NotFoundException(`Usuario con id ${id} no encontrado`);
    }
    return user;
  }

  async findByAuthId(authId: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { authId },
      relations: ['branch'],
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { email },
    });
  }

  async create(dto: CreateUserDto): Promise<UserResponseDto> {
    // Check for duplicate email in local DB
    const existingUser = await this.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException(
        `Ya existe un usuario con el email: ${dto.email}`,
      );
    }

    // Validate branchId requirement for certain roles
    this.validateRoleBranch(dto.role, dto.branchId);

    // Create user in Supabase Auth with password
    const { data: authData, error: authError } =
      await this.supabase.auth.admin.createUser({
        email: dto.email,
        password: dto.password,
        email_confirm: true,
        user_metadata: {
          firstName: dto.firstName,
          lastName: dto.lastName,
          role: dto.role,
        },
      });

    if (authError || !authData.user) {
      console.log(
        `[AUDIT] Supabase user creation failed for ${dto.email}: ${authError?.message ?? 'unknown error'}`,
      );
      throw new BadRequestException(
        `Error al crear usuario en autenticación: ${authError?.message ?? 'Error desconocido'}`,
      );
    }

    // Create user in local DB with mustChangePassword = true
    const user = this.usersRepository.create({
      authId: authData.user.id,
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      role: dto.role,
      branchId: dto.branchId ?? null,
      specialty: dto.specialty ?? null,
      isActive: true,
      mustChangePassword: true,
    });

    const savedUser = await this.usersRepository.save(user);
    const fullUser = await this.findById(savedUser.id);

    console.log(
      `[AUDIT] User created: ${fullUser.id} (${fullUser.email}), role: ${fullUser.role}, mustChangePassword: true`,
    );

    return UserResponseDto.fromEntity(fullUser);
  }

  async createAdmin(dto: CreateAdminDto): Promise<UserResponseDto> {
    const existingUser = await this.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException(
        `Ya existe un usuario con el email: ${dto.email}`,
      );
    }

    // Create admin in Supabase Auth with password
    const { data: authData, error: authError } =
      await this.supabase.auth.admin.createUser({
        email: dto.email,
        password: dto.password,
        email_confirm: true,
        user_metadata: {
          firstName: dto.firstName,
          lastName: dto.lastName,
          role: UserRole.ADMIN,
        },
      });

    if (authError || !authData.user) {
      console.log(
        `[AUDIT] Supabase admin creation failed for ${dto.email}: ${authError?.message ?? 'unknown error'}`,
      );
      throw new BadRequestException(
        `Error al crear administrador: ${authError?.message ?? 'Error desconocido'}`,
      );
    }

    const user = this.usersRepository.create({
      authId: authData.user.id,
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      role: UserRole.ADMIN,
      branchId: null,
      specialty: null,
      isActive: true,
      mustChangePassword: false,
    });

    const savedUser = await this.usersRepository.save(user);
    const fullUser = await this.findById(savedUser.id);

    console.log(
      `[AUDIT] Admin created: ${fullUser.id} (${fullUser.email})`,
    );

    return UserResponseDto.fromEntity(fullUser);
  }

  async update(id: string, dto: UpdateUserDto): Promise<UserResponseDto> {
    const user = await this.findById(id);

    // If role is being changed, validate branch requirement
    if (dto.role !== undefined) {
      const branchId = dto.branchId !== undefined ? dto.branchId : user.branchId;
      this.validateRoleBranch(dto.role, branchId ?? undefined);
    }

    // Build update object (only defined fields)
    const updateData: Partial<User> = {};

    if (dto.firstName !== undefined) updateData.firstName = dto.firstName;
    if (dto.lastName !== undefined) updateData.lastName = dto.lastName;
    if (dto.role !== undefined) updateData.role = dto.role;
    if (dto.branchId !== undefined) updateData.branchId = dto.branchId ?? null;
    if (dto.specialty !== undefined) updateData.specialty = dto.specialty ?? null;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;

    await this.usersRepository.update(id, updateData);

    const updatedUser = await this.findById(id);

    console.log(
      `[AUDIT] User updated: ${updatedUser.id} (${updatedUser.email}), fields: ${Object.keys(updateData).join(', ')}`,
    );

    return UserResponseDto.fromEntity(updatedUser);
  }

  async deactivate(id: string): Promise<UserResponseDto> {
    const user = await this.findById(id);

    if (!user.isActive) {
      throw new BadRequestException('El usuario ya se encuentra inactivo');
    }

    // TODO: Validate no active services linked when services module is ready

    await this.usersRepository.update(id, { isActive: false });

    const updatedUser = await this.findById(id);

    console.log(
      `[AUDIT] User deactivated: ${updatedUser.id} (${updatedUser.email})`,
    );

    return UserResponseDto.fromEntity(updatedUser);
  }

  async activate(id: string): Promise<UserResponseDto> {
    const user = await this.findById(id);

    if (user.isActive) {
      throw new BadRequestException('El usuario ya se encuentra activo');
    }

    await this.usersRepository.update(id, { isActive: true });

    const updatedUser = await this.findById(id);

    console.log(
      `[AUDIT] User activated: ${updatedUser.id} (${updatedUser.email})`,
    );

    return UserResponseDto.fromEntity(updatedUser);
  }

  async markPasswordChanged(id: string): Promise<void> {
    await this.usersRepository.update(id, { mustChangePassword: false });
    console.log(`[AUDIT] Password changed flag cleared for user: ${id}`);
  }

  /**
   * Validates that roles requiring a branch have one assigned.
   * BRANCH_MANAGER and TECHNICIAN must have a branchId.
   */
  private validateRoleBranch(
    role: UserRole,
    branchId: string | undefined,
  ): void {
    const rolesRequiringBranch: UserRole[] = [
      UserRole.BRANCH_MANAGER,
      UserRole.TECHNICIAN,
    ];

    if (rolesRequiringBranch.includes(role) && !branchId) {
      throw new BadRequestException(
        `El rol "${role}" requiere una sucursal asignada`,
      );
    }
  }
}
