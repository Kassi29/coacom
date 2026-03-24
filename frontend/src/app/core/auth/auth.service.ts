import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { ApiService } from '@shared/services/api.service';
import { UserRole } from '@shared/models/user.model';
import { LoginRequest, LoginResponse, LoginUser, JwtPayload } from '@shared/models/auth.model';

const TOKEN_KEY = 'access_token';
const USER_KEY = 'current_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly #api = inject(ApiService);
  readonly #router = inject(Router);

  readonly #token = signal<string | null>(localStorage.getItem(TOKEN_KEY));
  readonly currentUser = signal<LoginUser | null>(this.#loadUserFromStorage());
  readonly userRole = computed<UserRole | null>(() => this.currentUser()?.role ?? null);
  readonly isAuthenticated = computed<boolean>(() => {
    const token = this.#token();
    if (!token) return false;
    return !this.#isTokenExpired(token);
  });
  readonly mustChangePassword = signal(false);

  login = (credentials: LoginRequest): Observable<LoginResponse> => {
    return this.#api.post<LoginResponse>('/auth/login', credentials as unknown as Record<string, unknown>).pipe(
      tap((response) => {
        localStorage.setItem(TOKEN_KEY, response.accessToken);
        localStorage.setItem(USER_KEY, JSON.stringify(response.user));
        this.#token.set(response.accessToken);
        this.currentUser.set(response.user);
        this.mustChangePassword.set(response.mustChangePassword);
      })
    );
  };

  logout = (): void => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.#token.set(null);
    this.currentUser.set(null);
    void this.#router.navigate(['/login']);
  };

  getToken = (): string | null => {
    return this.#token();
  };

  #loadUserFromStorage(): LoginUser | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as LoginUser;
    } catch {
      return null;
    }
  }

  #isTokenExpired(token: string): boolean {
    try {
      const payload = this.#decodeToken(token);
      const now = Math.floor(Date.now() / 1000);
      return payload.exp < now;
    } catch {
      return true;
    }
  }

  #decodeToken(token: string): JwtPayload {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload) as JwtPayload;
  }
}
