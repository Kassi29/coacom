import { Component, inject, input, output, signal } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { LucideAngularModule, X, AlertTriangle, Eye, EyeOff, Mail } from 'lucide-angular';
import { UsersService } from '@shared/services/users.service';
import { User } from '@shared/models/user.model';

@Component({
  selector: 'app-user-reset-password-modal',
  imports: [ReactiveFormsModule, LucideAngularModule],
  templateUrl: './user-reset-password-modal.html',
  styleUrl: './user-reset-password-modal.scss',
})
export class UserResetPasswordModal {
  readonly #usersService = inject(UsersService);

  readonly user = input.required<User>();
  readonly close = output<void>();
  readonly reset = output<void>();

  protected readonly icons = { x: X, alert: AlertTriangle, eye: Eye, eyeOff: EyeOff, mail: Mail };

  protected readonly form = new FormGroup({
    newPassword: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(6)] }),
    confirmPassword: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  protected readonly showPassword = signal(false);
  protected readonly showConfirm = signal(false);
  protected readonly isLoading = signal(false);
  protected readonly errorMessage = signal('');
  // TODO: Enable when email sending is implemented
  protected readonly sendEmail = signal(false);

  protected readonly passwordMismatch = signal(false);

  protected togglePassword = (): void => {
    this.showPassword.update((v) => !v);
  };

  protected toggleConfirm = (): void => {
    this.showConfirm.update((v) => !v);
  };

  protected getInitials = (): string => {
    const u = this.user();
    return `${u.firstName.charAt(0)}${u.lastName.charAt(0)}`.toUpperCase();
  };

  protected handleSubmit = (): void => {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { newPassword, confirmPassword } = this.form.getRawValue();

    if (newPassword !== confirmPassword) {
      this.passwordMismatch.set(true);
      return;
    }
    this.passwordMismatch.set(false);

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.#usersService.resetPassword(this.user().id, newPassword).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.reset.emit();
      },
      error: (err: { message?: string }) => {
        this.errorMessage.set(err.message || 'Error al resetear contraseña');
        this.isLoading.set(false);
      },
    });
  };
}
