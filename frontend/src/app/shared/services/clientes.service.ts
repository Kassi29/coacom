import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Cliente, TipoCliente } from '@shared/models/cliente.model';
import { PaginatedResponse } from '@shared/models/api-response.model';

export interface CreateClientePayload {
  tipo: TipoCliente;
  nit?: string;
  ci?: string;
  razonSocial?: string;
  firstName?: string;
  lastName?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  branchId: string;
}

export interface UpdateClientePayload extends Partial<CreateClientePayload> {
  isActive?: boolean;
}

export interface ClientesQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  tipo?: TipoCliente;
  branchId?: string;
}

@Injectable({ providedIn: 'root' })
export class ClientesService {
  readonly #api = inject(ApiService);

  getAll = (params: ClientesQueryParams = {}): Observable<PaginatedResponse<Cliente>> => {
    const query: Record<string, string | number> = {};
    if (params.page) query['page'] = params.page;
    if (params.limit) query['limit'] = params.limit;
    if (params.search) query['search'] = params.search;
    if (params.tipo) query['tipo'] = params.tipo;
    if (params.branchId) query['branchId'] = params.branchId;
    return this.#api.get<PaginatedResponse<Cliente>>('/clientes', query);
  };

  getById = (id: string): Observable<Cliente> => {
    return this.#api.get<Cliente>(`/clientes/${id}`);
  };

  create = (payload: CreateClientePayload): Observable<Cliente> => {
    return this.#api.post<Cliente>('/clientes', payload as unknown as Record<string, unknown>);
  };

  update = (id: string, payload: UpdateClientePayload): Observable<Cliente> => {
    return this.#api.patch<Cliente>(`/clientes/${id}`, payload as unknown as Record<string, unknown>);
  };
}
