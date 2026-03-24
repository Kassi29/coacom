import { UserRole } from './user.model';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  branchId: string | null;
  specialty: string | null;
}

export interface LoginResponse {
  accessToken: string;
  mustChangePassword: boolean;
  user: LoginUser;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}
