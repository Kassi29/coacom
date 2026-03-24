import { UserRole } from '../../../common/enums/user-role.enum';
import { User } from '../entities/user.entity';

export interface BranchInfo {
  id: string;
  name: string;
  city: string;
}

export class UserResponseDto {
  id!: string;
  firstName!: string;
  lastName!: string;
  email!: string;
  role!: UserRole;
  branchId!: string | null;
  branch!: BranchInfo | null;
  specialty!: string | null;
  isActive!: boolean;
  mustChangePassword!: boolean;
  createdAt!: Date;
  updatedAt!: Date;

  static fromEntity(user: User): UserResponseDto {
    const dto = new UserResponseDto();
    dto.id = user.id;
    dto.firstName = user.firstName;
    dto.lastName = user.lastName;
    dto.email = user.email;
    dto.role = user.role;
    dto.branchId = user.branchId;
    dto.branch = user.branch
      ? {
          id: user.branch.id,
          name: user.branch.name,
          city: user.branch.city,
        }
      : null;
    dto.specialty = user.specialty;
    dto.isActive = user.isActive;
    dto.mustChangePassword = user.mustChangePassword;
    dto.createdAt = user.createdAt;
    dto.updatedAt = user.updatedAt;
    return dto;
  }
}
