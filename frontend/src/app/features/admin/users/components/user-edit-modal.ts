import { Component, inject, input, output, signal, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { LucideAngularModule, X, Mail, UserX } from 'lucide-angular';
import { UsersService, UpdateUserPayload } from '@shared/services/users.service';
import { User, UserRole } from '@shared/models/user.model';
import { Branch } from '@shared/models/branch.model';
import { ApiError } from '@shared/models/api-response.model';

@Component({
  selector: 'app-user-edit-modal',
  imports: [ReactiveFormsModule, LucideAngularModule],
  templateUrl: './user-edit-modal.html',
  styleUrl: './user-edit-modal.scss',
})
export class UserEditModal implements OnInit {
  readonly #usersService = inject(UsersService);

  readonly user = input.required<User>();
  readonly branches = input.required<Branch[]>();
  readonly close = output<void>();
  readonly updated = output<void>();

  protected readonly icons = { x: X, mail: Mail, userX: UserX };

  protected readonly form = new FormGroup({
    firstName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    lastName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    role: new FormControl<UserRole | ''>('', { nonNullable: true, validators: [Validators.required] }),
    branchId: new FormControl('', { nonNullable: true }),
    specialty: new FormControl('', { nonNullable: true }),
  });

  protected readonly isLoading = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly selectedRole = signal<string>('');

  protected readonly roleOptions: { value: UserRole; label: string }[] = [
    { value: 'admin', label: 'Administrador' },
    { value: 'general_manager', label: 'Gerente General' },
    { value: 'branch_manager', label: 'Gerente Sucursal' },
    { value: 'technician', label: 'Tecnico' },
    { value: 'client', label: 'Cliente' },
  ];

  protected readonly specialtyOptions = [
    'Electricidad',
    'Plomeria',
    'Aire Acondicionado',
    'Refrigeracion',
    'Electronica',
    'General',
  ];

  ngOnInit(): void {
    const u = this.user();
    this.form.patchValue({
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      role: u.role,
      branchId: u.branchId ?? '',
      specialty: u.specialty ?? '',
    });
    this.selectedRole.set(u.role);
  }

  protected getUserInitials = (): string => {
    const u = this.user();
    return `${u.firstName.charAt(0)}${u.lastName.charAt(0)}`.toUpperCase();
  };

  protected getUserFullName = (): string => {
    const u = this.user();
    return `${u.firstName} ${u.lastName}`;
  };

  protected getUserCreatedDate = (): string => {
    const date = new Date(this.user().createdAt);
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  protected onRoleChange = (): void => {
    this.selectedRole.set(this.form.controls.role.value);
  };

  protected showBranch = (): boolean => {
    const role = this.selectedRole();
    return role === 'branch_manager' || role === 'technician';
  };

  protected showSpecialty = (): boolean => {
    return this.selectedRole() === 'technician';
  };

  protected handleSubmit = (): void => {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    const values = this.form.getRawValue();
    const payload: UpdateUserPayload = {
      firstName: values.firstName,
      lastName: values.lastName,
      email: values.email,
      role: values.role,
    };

    if (this.showBranch() && values.branchId) {
      payload.branchId = values.branchId;
    }

    if (this.showSpecialty() && values.specialty) {
      payload.specialty = values.specialty;
    }

    this.#usersService.update(this.user().id, payload).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.updated.emit();
      },
      error: (err: ApiError) => {
        this.errorMessage.set(err.message || 'Error al actualizar usuario');
        this.isLoading.set(false);
      },
    });
  };

  protected handleDeactivate = (): void => {
    this.isLoading.set(true);
    const u = this.user();
    this.#usersService.toggleStatus(u.id, !u.isActive).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.updated.emit();
      },
      error: (err: ApiError) => {
        this.errorMessage.set(err.message || 'Error al cambiar estado');
        this.isLoading.set(false);
      },
    });
  };

  protected handleClose = (): void => {
    this.close.emit();
  };

  protected onOverlayClick = (event: MouseEvent): void => {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.handleClose();
    }
  };
}
