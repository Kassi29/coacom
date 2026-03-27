import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { SlaContract, SlaContractDetail } from '@shared/models/sla-contract.model';
import { PaginatedResponse } from '@shared/models/api-response.model';

export type SlaContractStatus = 'active' | 'expired' | 'all';

export interface SlaContractsQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: SlaContractStatus;
  branchId?: string;
}

export interface CreateSlaContractPayload {
  clientId: string;
  startDate: string;
  endDate: string;
  contractedHours: number;
  responseTimeHrs: number;
  includedServices: string[];
}

export interface UpdateSlaContractPayload {
  startDate?: string;
  endDate?: string;
  contractedHours?: number;
  responseTimeHrs?: number;
  includedServices?: string[];
  alertThreshold?: number;
}

@Injectable({ providedIn: 'root' })
export class SlaContractsService {
  readonly #api = inject(ApiService);

  getAll = (params: SlaContractsQueryParams = {}): Observable<PaginatedResponse<SlaContract>> => {
    const query: Record<string, string | number> = {};
    if (params.page) query['page'] = params.page;
    if (params.limit) query['limit'] = params.limit;
    if (params.search) query['search'] = params.search;
    if (params.status) query['status'] = params.status;
    if (params.branchId) query['branchId'] = params.branchId;
    return this.#api.get<PaginatedResponse<SlaContract>>('/sla-contracts', query);
  };

  getById = (id: string): Observable<SlaContractDetail> => {
    return this.#api.get<SlaContractDetail>(`/sla-contracts/${id}`);
  };

  create = (payload: CreateSlaContractPayload): Observable<SlaContract> => {
    return this.#api.post<SlaContract>('/sla-contracts', payload as unknown as Record<string, unknown>);
  };

  update = (id: string, payload: UpdateSlaContractPayload): Observable<SlaContract> => {
    return this.#api.patch<SlaContract>(`/sla-contracts/${id}`, payload as unknown as Record<string, unknown>);
  };

  deactivate = (id: string): Observable<SlaContract> => {
    return this.#api.patch<SlaContract>(`/sla-contracts/${id}`, { isActive: false });
  };
}
