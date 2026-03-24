import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Branch } from '@shared/models/branch.model';

@Injectable({ providedIn: 'root' })
export class BranchesService {
  readonly #api = inject(ApiService);

  getAll = (): Observable<Branch[]> => {
    return this.#api.get<Branch[]>('/branches');
  };
}
