import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { LucideAngularModule, Settings, Mail, Lock, Eye, EyeOff } from 'lucide-angular';
import { AuthService } from '@core/auth/auth.service';
import { ApiError } from '@shared/models/api-response.model';

@Component({
  selector: 'app-login-page',
  imports: [ReactiveFormsModule, LucideAngularModule],
  templateUrl: './login-page.html',
  styleUrl: './login-page.scss',
})
export class LoginPage {
  readonly #authService = inject(AuthService);
  readonly #router = inject(Router);

  protected readonly icons = {
    settings: Settings,
    mail: Mail,
    lock: Lock,
    eye: Eye,
    eyeOff: EyeOff,
  };

  protected readonly form = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(6)],
    }),
  });

  protected readonly rememberMe = signal(false);
  protected readonly showPassword = signal(false);
  protected readonly isLoading = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly showForgotModal = signal(false);

  protected togglePassword = (): void => {
    this.showPassword.update((v) => !v);
  };

  protected toggleRememberMe = (): void => {
    this.rememberMe.update((v) => !v);
  };

  protected handleLogin = (): void => {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    const { email, password } = this.form.getRawValue();

    this.#authService.login({ email, password }, this.rememberMe()).subscribe({
      next: () => {
        this.isLoading.set(false);
        const role = this.#authService.userRole();
        switch (role) {
          case 'admin':
          case 'general_manager':
          case 'branch_manager':
            void this.#router.navigate(['/admin/dashboard']);
            break;
          case 'technician':
            void this.#router.navigate(['/tecnico/mis-servicios']);
            break;
          case 'client':
            void this.#router.navigate(['/portal/mis-servicios']);
            break;
          default:
            void this.#router.navigate(['/admin/dashboard']);
        }
      },
      error: (err: unknown) => {
        const apiError = err as ApiError;
        this.errorMessage.set(apiError.message || 'Credenciales inválidas');
        this.isLoading.set(false);
      },
    });
  };
}
