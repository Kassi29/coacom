import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import {
  LucideAngularModule,
  Plus,
  Search,
  Eye,
  Pencil,
  ChevronLeft,
  ChevronRight,
  FileText,
  Clock,
  AlertTriangle,
} from 'lucide-angular';
import { Subject, debounceTime, takeUntil } from 'rxjs';
import { SlaContractsService, SlaContractsQueryParams } from '@shared/services/sla-contracts.service';
import { BranchesService } from '@shared/services/branches.service';
import { SlaContract } from '@shared/models/sla-contract.model';
import { Branch } from '@shared/models/branch.model';

@Component({
  selector: 'app-sla-contracts-page',
  imports: [ReactiveFormsModule, LucideAngularModule],
  templateUrl: './sla-contracts-page.html',
  styleUrl: './sla-contracts-page.scss',
})
export class SlaContractsPage implements OnInit, OnDestroy {
  readonly #slaService = inject(SlaContractsService);
  readonly #branchesService = inject(BranchesService);
  readonly #router = inject(Router);
  readonly #destroy$ = new Subject<void>();

  protected readonly icons = {
    plus: Plus,
    search: Search,
    eye: Eye,
    pencil: Pencil,
    chevronLeft: ChevronLeft,
    chevronRight: ChevronRight,
    fileText: FileText,
    clock: Clock,
    alertTriangle: AlertTriangle,
  };

  protected readonly searchControl = new FormControl('', { nonNullable: true });
  protected readonly statusControl = new FormControl('active', { nonNullable: true });
  protected readonly branchControl = new FormControl('', { nonNullable: true });

  protected readonly contracts = signal<SlaContract[]>([]);
  protected readonly branches = signal<Branch[]>([]);
  protected readonly totalContracts = signal(0);
  protected readonly currentPage = signal(1);
  protected readonly pageSize = signal(8);
  protected readonly isLoading = signal(false);

  protected readonly totalPages = computed(() =>
    Math.ceil(this.totalContracts() / this.pageSize()) || 1
  );

  protected readonly paginationText = computed(() => {
    const total = this.totalContracts();
    const page = this.currentPage();
    const size = this.pageSize();
    const start = total > 0 ? (page - 1) * size + 1 : 0;
    const end = Math.min(page * size, total);
    return `${start}-${end} de ${total} contratos`;
  });

  protected readonly pages = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    const result: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, current - Math.floor(maxVisible / 2));
    const end = Math.min(total, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    for (let i = start; i <= end; i++) {
      result.push(i);
    }
    return result;
  });

  // Stats
  protected readonly activeCount = computed(() =>
    this.contracts().filter((c) => c.isActive).length
  );

  protected readonly expiringCount = computed(() => {
    const now = new Date();
    const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    return this.contracts().filter(
      (c) => c.isActive && new Date(c.endDate) <= thirtyDays && new Date(c.endDate) > now
    ).length;
  });

  protected readonly avgAvailableHours = computed(() => {
    const active = this.contracts().filter((c) => c.isActive);
    if (active.length === 0) return 0;
    const sum = active.reduce((acc, c) => acc + c.availableBalance, 0);
    return Math.round(sum / active.length);
  });

  ngOnInit(): void {
    this.loadContracts();
    this.loadBranches();

    this.searchControl.valueChanges
      .pipe(debounceTime(400), takeUntil(this.#destroy$))
      .subscribe(() => {
        this.currentPage.set(1);
        this.loadContracts();
      });
  }

  ngOnDestroy(): void {
    this.#destroy$.next();
    this.#destroy$.complete();
  }

  protected applyFilters = (): void => {
    this.currentPage.set(1);
    this.loadContracts();
  };

  protected goToPage = (page: number): void => {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.loadContracts();
    }
  };

  protected goToNew = (): void => {
    this.#router.navigate(['/admin/contratos/nuevo']);
  };

  protected goToDetail = (contract: SlaContract): void => {
    this.#router.navigate(['/admin/contratos', contract.id]);
  };

  protected formatDate = (dateStr: string): string => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  protected getUsagePercent = (contract: SlaContract): number => {
    if (contract.contractedHours === 0) return 0;
    return Math.round((contract.usedHours / contract.contractedHours) * 100);
  };

  protected getProgressColor = (contract: SlaContract): string => {
    const pct = this.getUsagePercent(contract);
    if (pct > 90) return '#DC2626';
    if (pct >= 70) return '#F59E0B';
    return '#16A34A';
  };

  protected getClientInitials = (contract: SlaContract): string => {
    const name = contract.client.displayName;
    const parts = name.split(' ').filter((p) => p.length > 0);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  protected getAvatarColor = (contract: SlaContract): string => {
    const colors = ['#AA1919', '#2563EB', '#7C3AED', '#0284C7', '#059669', '#D97706'];
    let hash = 0;
    for (const ch of contract.client.displayName) {
      hash = ch.charCodeAt(0) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  private loadContracts(): void {
    this.isLoading.set(true);
    const params: SlaContractsQueryParams = {
      page: this.currentPage(),
      limit: this.pageSize(),
    };

    const search = this.searchControl.value.trim();
    if (search) params.search = search;

    const status = this.statusControl.value;
    if (status && status !== 'all') params.status = status as 'active' | 'expired';

    const branchId = this.branchControl.value;
    if (branchId) params.branchId = branchId;

    this.#slaService.getAll(params).subscribe({
      next: (response) => {
        this.contracts.set(response.data);
        this.totalContracts.set(response.meta.total);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      },
    });
  }

  private loadBranches(): void {
    this.#branchesService.getAll().subscribe({
      next: (data) => this.branches.set(data),
    });
  }
}
