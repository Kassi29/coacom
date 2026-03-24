import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import {
  LucideAngularModule,
  Search,
  Users,
  Monitor,
  ArrowRight,
} from 'lucide-angular';
import { debounceTime, distinctUntilChanged, filter, switchMap, tap } from 'rxjs';
import { SearchService } from '@shared/services/search.service';
import { SearchFilter, ClientSearchResult, EquipmentSearchResult } from '@shared/models/search.model';

const AVATAR_COLORS = [
  '#E10E1A', '#2563EB', '#7C3AED', '#059669', '#D97706',
  '#DC2626', '#4F46E5', '#0891B2', '#65A30D', '#C026D3',
];

@Component({
  selector: 'app-search-page',
  imports: [ReactiveFormsModule, LucideAngularModule],
  templateUrl: './search-page.html',
  styleUrl: './search-page.scss',
})
export class SearchPage {
  readonly #searchService = inject(SearchService);
  readonly #router = inject(Router);

  protected readonly icons = {
    search: Search,
    users: Users,
    monitor: Monitor,
    arrowRight: ArrowRight,
  };

  protected readonly searchControl = new FormControl('', { nonNullable: true });
  protected readonly filterControl = new FormControl<SearchFilter>('all', { nonNullable: true });

  protected readonly clients = signal<ClientSearchResult[]>([]);
  protected readonly equipment = signal<EquipmentSearchResult[]>([]);
  protected readonly totalClients = signal(0);
  protected readonly totalEquipment = signal(0);
  protected readonly searchTime = signal(0);
  protected readonly searchQuery = signal('');
  protected readonly isLoading = signal(false);
  protected readonly hasSearched = signal(false);

  constructor() {
    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      filter((q) => q.trim().length >= 2),
      tap(() => this.isLoading.set(true)),
      switchMap((q) => this.#searchService.search(q.trim(), this.filterControl.value)),
    ).subscribe({
      next: (res) => {
        this.#applyResults(res.clients, res.equipment, res.meta);
      },
      error: () => this.isLoading.set(false),
    });
  }

  protected doSearch = (): void => {
    const query = this.searchControl.value.trim();
    if (query.length < 2) return;
    this.isLoading.set(true);
    this.#searchService.search(query, this.filterControl.value).subscribe({
      next: (res) => {
        this.#applyResults(res.clients, res.equipment, res.meta);
      },
      error: () => this.isLoading.set(false),
    });
  };

  #applyResults(
    clients: ClientSearchResult[],
    equip: EquipmentSearchResult[],
    meta: { totalClients: number; totalEquipment: number; searchTime: number },
  ): void {
    this.clients.set(clients);
    this.equipment.set(equip);
    this.totalClients.set(meta.totalClients);
    this.totalEquipment.set(meta.totalEquipment);
    this.searchTime.set(meta.searchTime);
    this.searchQuery.set(this.searchControl.value.trim());
    this.isLoading.set(false);
    this.hasSearched.set(true);
  }

  protected goToClientProfile = (client: ClientSearchResult): void => {
    void this.#router.navigate(['/admin/clientes', client.id]);
  };

  protected goToEquipmentDetail = (item: EquipmentSearchResult): void => {
    void this.#router.navigate(['/admin/equipos', item.id]);
  };

  protected getInitials = (client: ClientSearchResult): string => {
    const words = client.displayName.split(' ');
    return words.slice(0, 2).map((w) => w.charAt(0)).join('').toUpperCase();
  };

  protected getAvatarColor = (client: ClientSearchResult): string => {
    let hash = 0;
    const name = client.displayName;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
  };
}
