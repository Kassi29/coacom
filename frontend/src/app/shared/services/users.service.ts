import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { User } from '@shared/models/user.model';
import { PaginatedResponse } from '@shared/models/api-response.model';

export interface CreateUserPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: string;
  branchId?: string;
  specialty?: string;
}

export interface UpdateUserPayload extends Partial<CreateUserPayload> {
  isActive?: boolean;
}

export interface UsersQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  branchId?: string;
  isActive?: boolean;
}

@Injectable({ providedIn: 'root' })
export class UsersService {
  readonly #api = inject(ApiService);

  getAll = (params: UsersQueryParams = {}): Observable<PaginatedResponse<User>> => {
    const query: Record<string, string | number> = {};
    if (params.page) query['page'] = params.page;
    if (params.limit) query['limit'] = params.limit;
    if (params.search) query['search'] = params.search;
    if (params.role) query['role'] = params.role;
    if (params.branchId) query['branchId'] = params.branchId;
    if (params.isActive !== undefined) query['isActive'] = params.isActive ? 'true' : 'false';
    return this.#api.get<PaginatedResponse<User>>('/users', query);
  };

  getById = (id: string): Observable<User> => {
    return this.#api.get<User>(`/users/${id}`);
  };

  create = (payload: CreateUserPayload): Observable<User> => {
    return this.#api.post<User>('/users', payload as unknown as Record<string, unknown>);
  };

  update = (id: string, payload: UpdateUserPayload): Observable<User> => {
    return this.#api.patch<User>(`/users/${id}`, payload as unknown as Record<string, unknown>);
  };

  toggleStatus = (id: string, isActive: boolean): Observable<User> => {
    return this.#api.patch<User>(`/users/${id}`, { isActive } as Record<string, unknown>);
  };

  resetPassword = (id: string, newPassword: string): Observable<{ message: string }> => {
    return this.#api.post<{ message: string }>(`/users/${id}/reset-password`, { newPassword });
  };
}
