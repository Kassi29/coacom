import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Equipo, TipoEquipo } from '@shared/models/equipo.model';
import { PaginatedResponse } from '@shared/models/api-response.model';

export interface CreateEquipoPayload {
  numeroSerie: string;
  marca: string;
  modelo: string;
  tipoEquipo: TipoEquipo;
  descripcion?: string;
  fotoUrl?: string;
  clienteId: string;
}

export interface UpdateEquipoPayload {
  marca?: string;
  modelo?: string;
  tipoEquipo?: TipoEquipo;
  descripcion?: string;
  fotoUrl?: string;
  isActive?: boolean;
}

export interface EquiposQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  clienteId?: string;
  tipoEquipo?: TipoEquipo;
}

@Injectable({ providedIn: 'root' })
export class EquiposService {
  readonly #api = inject(ApiService);

  getAll = (params: EquiposQueryParams = {}): Observable<PaginatedResponse<Equipo>> => {
    const query: Record<string, string | number> = {};
    if (params.page) query['page'] = params.page;
    if (params.limit) query['limit'] = params.limit;
    if (params.search) query['search'] = params.search;
    if (params.clienteId) query['clienteId'] = params.clienteId;
    if (params.tipoEquipo) query['tipoEquipo'] = params.tipoEquipo;
    return this.#api.get<PaginatedResponse<Equipo>>('/equipos', query);
  };

  getByClienteId = (clienteId: string): Observable<Equipo[]> => {
    return this.#api.get<Equipo[]>(`/equipos/cliente/${clienteId}`);
  };

  getById = (id: string): Observable<Equipo> => {
    return this.#api.get<Equipo>(`/equipos/${id}`);
  };

  create = (payload: CreateEquipoPayload): Observable<Equipo> => {
    return this.#api.post<Equipo>('/equipos', payload as unknown as Record<string, unknown>);
  };

  update = (id: string, payload: UpdateEquipoPayload): Observable<Equipo> => {
    return this.#api.patch<Equipo>(`/equipos/${id}`, payload as unknown as Record<string, unknown>);
  };
}
