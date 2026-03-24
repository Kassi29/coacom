import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { SearchResponse, SearchFilter } from '@shared/models/search.model';

@Injectable({ providedIn: 'root' })
export class SearchService {
  readonly #api = inject(ApiService);

  search = (query: string, filter: SearchFilter = 'all'): Observable<SearchResponse> => {
    return this.#api.get<SearchResponse>('/search', { query, filter });
  };
}
