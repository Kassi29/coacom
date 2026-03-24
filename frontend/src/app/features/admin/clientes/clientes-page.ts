import { Component, inject, signal, computed, OnInit } from '@angular/core';
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
} from 'lucide-angular';
import { ClientesService, ClientesQueryParams } from '@shared/services/clientes.service';
import { BranchesService } from '@shared/services/branches.service';
import { Cliente, TIPO_CLIENTE_LABELS, TIPO_CLIENTE_COLORS } from '@shared/models/cliente.model';
import { Branch } from '@shared/models/branch.model';

@Component({
  selector: 'app-clientes-page',
  imports: [ReactiveFormsModule, LucideAngularModule],
  templateUrl: './clientes-page.html',
  styleUrl: './clientes-page.scss',
})
export class ClientesPage implements OnInit {
  readonly #clientesService = inject(ClientesService);
  readonly #branchesService = inject(BranchesService);
  readonly #router = inject(Router);

  protected readonly icons = {
    plus: Plus,
    search: Search,
    eye: Eye,
    pencil: Pencil,
    chevronLeft: ChevronLeft,
    chevronRight: ChevronRight,
  };

  protected readonly typeLabels = TIPO_CLIENTE_LABELS;
  protected readonly typeColors = TIPO_CLIENTE_COLORS;

  protected readonly searchControl = new FormControl('', { nonNullable: true });
  protected readonly typeControl = new FormControl('', { nonNullable: true });
  protected readonly branchControl = new FormControl('', { nonNullable: true });

  protected readonly clients = signal<Cliente[]>([]);
  protected readonly branches = signal<Branch[]>([]);
  protected readonly totalClients = signal(0);
  protected readonly currentPage = signal(1);
  protected readonly pageSize = signal(6);
  protected readonly isLoading = signal(false);

  protected readonly totalPages = computed(() =>
    Math.ceil(this.totalClients() / this.pageSize()) || 1
  );

  protected readonly paginationText = computed(() => {
    const total = this.totalClients();
    const page = this.currentPage();
    const size = this.pageSize();
    const start = total > 0 ? (page - 1) * size + 1 : 0;
    const end = Math.min(page * size, total);
    return `${start}-${end} de ${total} clientes`;
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

  ngOnInit(): void {
    this.loadClients();
    this.loadBranches();
  }

  protected applyFilters = (): void => {
    this.currentPage.set(1);
    this.loadClients();
  };

  protected goToPage = (page: number): void => {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.loadClients();
    }
  };

  protected goToNew = (): void => {
    this.#router.navigate(['/admin/clientes/nuevo']);
  };

  protected goToProfile = (client: Cliente): void => {
    this.#router.navigate(['/admin/clientes', client.id]);
  };

  private loadClients(): void {
    this.isLoading.set(true);
    const params: ClientesQueryParams = {
      page: this.currentPage(),
      limit: this.pageSize(),
    };

    const search = this.searchControl.value.trim();
    if (search) params.search = search;

    const tipo = this.typeControl.value;
    if (tipo) params.tipo = tipo as 'persona' | 'empresa';

    const branchId = this.branchControl.value;
    if (branchId) params.branchId = branchId;

    this.#clientesService.getAll(params).subscribe({
      next: (response) => {
        this.clients.set(response.data);
        this.totalClients.set(response.meta.total);
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
