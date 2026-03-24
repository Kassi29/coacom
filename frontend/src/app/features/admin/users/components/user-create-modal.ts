import { Component, inject, input, output, signal } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { LucideAngularModule, X, Mail, Eye, EyeOff } from 'lucide-angular';
import { UsersService, CreateUserPayload } from '@shared/services/users.service';
import { Branch } from '@shared/models/branch.model';
import { UserRole } from '@shared/models/user.model';
import { ApiError } from '@shared/models/api-response.model';

@Component({
  selector: 'app-user-create-modal',
  imports: [ReactiveFormsModule, LucideAngularModule],
  templateUrl: './user-create-modal.html',
  styleUrl: './user-create-modal.scss',
})
export class UserCreateModal {
  readonly #usersService = inject(UsersService);

  readonly branches = input.required<Branch[]>();
  readonly close = output<void>();
  readonly created = output<void>();

  protected readonly icons = { x: X, mail: Mail, eye: Eye, eyeOff: EyeOff };

  protected readonly form = new FormGroup({
    firstName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    lastName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(6)] }),
    role: new FormControl<UserRole | ''>('', { nonNullable: true, validators: [Validators.required] }),
    branchId: new FormControl('', { nonNullable: true }),
    specialty: new FormControl('', { nonNullable: true }),
  });

  protected readonly isLoading = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly showPassword = signal(false);
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

  protected togglePassword = (): void => {
    this.showPassword.update((v) => !v);
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
    const payload: CreateUserPayload = {
      firstName: values.firstName,
      lastName: values.lastName,
      email: values.email,
      password: values.password,
      role: values.role,
    };

    if (this.showBranch() && values.branchId) {
      payload.branchId = values.branchId;
    }

    if (this.showSpecialty() && values.specialty) {
      payload.specialty = values.specialty;
    }

    this.#usersService.create(payload).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.created.emit();
      },
      error: (err: ApiError) => {
        this.errorMessage.set(err.message || 'Error al crear usuario');
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
