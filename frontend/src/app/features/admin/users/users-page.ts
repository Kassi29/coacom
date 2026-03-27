import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import {
  LucideAngularModule,
  Plus,
  Search,
  Pencil,
  UserX,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  KeyRound,
} from 'lucide-angular';
import { UsersService, UsersQueryParams, UpdateUserPayload } from '@shared/services/users.service';
import { BranchesService } from '@shared/services/branches.service';
import { User, UserRole, USER_ROLE_LABELS, USER_ROLE_COLORS } from '@shared/models/user.model';
import { Branch } from '@shared/models/branch.model';
import { UserCreateModal } from './components/user-create-modal';
import { UserEditModal } from './components/user-edit-modal';
import { UserResetPasswordModal } from './components/user-reset-password-modal';

const AVATAR_COLORS = ['#E10E1A', '#3B82F6', '#F59E0B', '#16A34A', '#8B5CF6', '#EC4899'];

@Component({
  selector: 'app-users-page',
  imports: [ReactiveFormsModule, LucideAngularModule, UserCreateModal, UserEditModal, UserResetPasswordModal],
  templateUrl: './users-page.html',
  styleUrl: './users-page.scss',
})
export class UsersPage implements OnInit {
  readonly #usersService = inject(UsersService);
  readonly #branchesService = inject(BranchesService);

  protected readonly icons = {
    plus: Plus,
    search: Search,
    pencil: Pencil,
    userX: UserX,
    userCheck: UserCheck,
    chevronLeft: ChevronLeft,
    chevronRight: ChevronRight,
    keyRound: KeyRound,
  };

  protected readonly roleLabels = USER_ROLE_LABELS;
  protected readonly roleColors = USER_ROLE_COLORS;
  protected readonly roleOptions: { value: string; label: string }[] = [
    { value: '', label: 'Todos los roles' },
    { value: 'admin', label: 'Administrador' },
    { value: 'general_manager', label: 'Gerente General' },
    { value: 'branch_manager', label: 'Gerente Sucursal' },
    { value: 'technician', label: 'Tecnico' },
    { value: 'client', label: 'Cliente' },
  ];

  // Form controls
  protected readonly searchControl = new FormControl('', { nonNullable: true });
  protected readonly roleControl = new FormControl('', { nonNullable: true });
  protected readonly branchControl = new FormControl('', { nonNullable: true });
  protected readonly activeFilter = signal<boolean | null>(null);

  // Data
  protected readonly users = signal<User[]>([]);
  protected readonly branches = signal<Branch[]>([]);
  protected readonly totalUsers = signal(0);
  protected readonly currentPage = signal(1);
  protected readonly pageSize = signal(6);
  protected readonly isLoading = signal(false);

  // Modals
  protected readonly showCreateModal = signal(false);
  protected readonly showEditModal = signal(false);
  protected readonly showResetModal = signal(false);
  protected readonly editingUser = signal<User | null>(null);
  protected readonly resettingUser = signal<User | null>(null);

  protected readonly totalPages = computed(() =>
    Math.ceil(this.totalUsers() / this.pageSize()) || 1
  );

  protected readonly paginationText = computed(() => {
    const total = this.totalUsers();
    if (total === 0) return '0 usuarios encontrados';
    const page = this.currentPage();
    const size = this.pageSize();
    const start = (page - 1) * size + 1;
    const end = Math.min(page * size, total);
    return `Mostrando ${start}-${end} de ${total} usuarios`;
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
    this.loadUsers();
    this.loadBranches();
  }

  protected getAvatarColor = (user: User): string => {
    const hash = user.firstName.charCodeAt(0) + user.lastName.charCodeAt(0);
    return AVATAR_COLORS[hash % AVATAR_COLORS.length];
  };

  protected getInitials = (user: User): string => {
    return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
  };

  protected setActiveFilter = (value: boolean | null): void => {
    this.activeFilter.set(value);
    this.currentPage.set(1);
    this.loadUsers();
  };

  protected applyFilters = (): void => {
    this.currentPage.set(1);
    this.loadUsers();
  };

  protected goToPage = (page: number): void => {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.loadUsers();
    }
  };

  protected openCreateModal = (): void => {
    this.showCreateModal.set(true);
  };

  protected closeCreateModal = (): void => {
    this.showCreateModal.set(false);
  };

  protected openEditModal = (user: User): void => {
    this.editingUser.set(user);
    this.showEditModal.set(true);
  };

  protected closeEditModal = (): void => {
    this.showEditModal.set(false);
    this.editingUser.set(null);
  };

  protected openResetModal = (user: User): void => {
    this.resettingUser.set(user);
    this.showResetModal.set(true);
  };

  protected closeResetModal = (): void => {
    this.showResetModal.set(false);
    this.resettingUser.set(null);
  };

  protected onPasswordReset = (): void => {
    this.closeResetModal();
  };

  protected onUserCreated = (): void => {
    this.closeCreateModal();
    this.loadUsers();
  };

  protected onUserUpdated = (payload: UpdateUserPayload): void => {
    const userId = this.editingUser()?.id;
    if (!userId) return;

    // Optimistic: close modal immediately, resolve branch for local update
    const branch = payload.branchId
      ? this.branches().find((b) => b.id === payload.branchId) ?? null
      : null;
    this.users.update((list) =>
      list.map((u) => u.id === userId ? { ...u, ...payload, branch } as User : u),
    );
    this.closeEditModal();

    // Sync with backend — reload on error to get fresh data
    this.#usersService.update(userId, payload).subscribe({
      error: () => this.loadUsers(),
    });
  };

  protected onStatusToggled = (newStatus: boolean): void => {
    const userId = this.editingUser()?.id;
    if (!userId) return;

    this.users.update((list) =>
      list.map((u) => u.id === userId ? { ...u, isActive: newStatus } : u),
    );
    this.closeEditModal();

    this.#usersService.toggleStatus(userId, newStatus).subscribe({
      error: () => this.loadUsers(),
    });
  };

  protected toggleUserStatus = (user: User): void => {
    const newStatus = !user.isActive;

    // Optimistic: toggle in the local list immediately
    const snapshot = [...this.users()];
    this.users.update((list) =>
      list.map((u) => u.id === user.id ? { ...u, isActive: newStatus } : u),
    );

    this.#usersService.toggleStatus(user.id, newStatus).subscribe({
      error: () => {
        this.users.set(snapshot);
        this.loadUsers();
      },
    });
  };

  private loadUsers(): void {
    this.isLoading.set(true);
    const params: UsersQueryParams = {
      page: this.currentPage(),
      limit: this.pageSize(),
      ...(this.activeFilter() !== null ? { isActive: this.activeFilter() as boolean } : {}),
    };

    const search = this.searchControl.value.trim();
    if (search) params.search = search;

    const role = this.roleControl.value;
    if (role) params.role = role;

    const branchId = this.branchControl.value;
    if (branchId) params.branchId = branchId;

    this.#usersService.getAll(params).subscribe({
      next: (response) => {
        this.users.set(response.data);
        this.totalUsers.set(response.meta.total);
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
