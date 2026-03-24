import { Injectable, Inject, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../../config/supabase.config';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { User } from '../users/entities/user.entity';

export interface LoginResponse {
  accessToken: string;
  mustChangePassword: boolean;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    branchId: string | null;
    specialty: string | null;
  };
}

export interface ProfileResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  branchId: string | null;
  branch: { id: string; name: string; city: string } | null;
  specialty: string | null;
  isActive: boolean;
  createdAt: Date;
}

@Injectable()
export class AuthService {
  constructor(
    @Inject(SUPABASE_CLIENT)
    private readonly supabase: SupabaseClient,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto): Promise<LoginResponse> {
    // Step 1: Authenticate with Supabase
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email: loginDto.email,
      password: loginDto.password,
    });

    if (error || !data.user) {
      console.log(
        `[AUDIT] Login failed for email: ${loginDto.email} — ${error?.message ?? 'unknown error'}`,
      );
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Step 2: Find user in local DB
    const user = await this.usersService.findByAuthId(data.user.id);
    if (!user) {
      console.log(
        `[AUDIT] Login failed — user not found in local DB for authId: ${data.user.id}`,
      );
      throw new UnauthorizedException('Usuario no encontrado en el sistema');
    }

    if (!user.isActive) {
      console.log(
        `[AUDIT] Login failed — inactive user: ${user.id} (${user.email})`,
      );
      throw new UnauthorizedException(
        'Usuario inactivo. Contacte al administrador.',
      );
    }

    // Step 3: Generate JWT
    const payload: JwtPayload = {
      sub: user.authId,
      email: user.email,
      role: user.role,
      branchId: user.branchId,
    };

    const accessToken = this.jwtService.sign(payload);

    console.log(
      `[AUDIT] Login successful for user: ${user.id} (${user.email}), role: ${user.role}`,
    );

    return {
      accessToken,
      mustChangePassword: user.mustChangePassword,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        branchId: user.branchId,
        specialty: user.specialty,
      },
    };
  }

  async changePassword(
    user: User,
    currentPassword: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    // Verify current password against Supabase
    const { error: signInError } =
      await this.supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

    if (signInError) {
      throw new UnauthorizedException('La contraseña actual es incorrecta');
    }

    // Update password in Supabase
    const { error: updateError } =
      await this.supabase.auth.admin.updateUserById(user.authId, {
        password: newPassword,
      });

    if (updateError) {
      throw new BadRequestException(
        `Error al cambiar contraseña: ${updateError.message}`,
      );
    }

    // Mark mustChangePassword as false
    await this.usersService.markPasswordChanged(user.id);

    console.log(
      `[AUDIT] Password changed for user: ${user.id} (${user.email})`,
    );

    return { message: 'Contraseña actualizada exitosamente' };
  }

  getProfile(user: User): ProfileResponse {
    console.log(
      `[AUDIT] Profile accessed by user: ${user.id} (${user.email})`,
    );

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      branchId: user.branchId,
      branch: user.branch
        ? {
            id: user.branch.id,
            name: user.branch.name,
            city: user.branch.city,
          }
        : null,
      specialty: user.specialty,
      isActive: user.isActive,
      createdAt: user.createdAt,
    };
  }
}
