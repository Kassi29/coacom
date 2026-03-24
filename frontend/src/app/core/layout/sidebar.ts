import { Component, inject, computed } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import {
  LucideAngularModule,
  Users,
  Building2,
  Settings,
  ShieldCheck,
  LogOut,
  Monitor,
  Wrench,
  FileText,
  Search,
} from 'lucide-angular';
import { AuthService } from '@core/auth/auth.service';
import { USER_ROLE_LABELS, UserRole } from '@shared/models/user.model';

interface NavItem {
  label: string;
  route: string;
  icon: typeof Users;
}

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, LucideAngularModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class Sidebar {
  readonly #authService = inject(AuthService);

  protected readonly icons = {
    users: Users,
    building: Building2,
    settings: Settings,
    shield: ShieldCheck,
    logout: LogOut,
    monitor: Monitor,
    wrench: Wrench,
    fileText: FileText,
    search: Search,
  };

  protected readonly adminItems: NavItem[] = [
    { label: 'Usuarios', route: '/admin/usuarios', icon: Users },
    { label: 'Sucursales', route: '/admin/sucursales', icon: Building2 },
    { label: 'Configuracion', route: '/admin/configuracion', icon: Settings },
    { label: 'Auditoria', route: '/admin/auditoria', icon: ShieldCheck },
  ];

  protected readonly gestionItems: NavItem[] = [
    { label: 'Consultas', route: '/admin/consultas', icon: Search },
    { label: 'Clientes', route: '/admin/clientes', icon: Users },
    { label: 'Equipos', route: '/admin/equipos', icon: Monitor },
    { label: 'Servicios', route: '/admin/servicios', icon: Wrench },
    { label: 'Contratos SLA', route: '/admin/contratos', icon: FileText },
  ];

  protected readonly userName = computed(() => {
    const user = this.#authService.currentUser();
    return user ? `${user.firstName} ${user.lastName}` : 'Usuario';
  });

  protected readonly userInitials = computed(() => {
    const user = this.#authService.currentUser();
    if (!user) return 'U';
    return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
  });

  protected readonly userRoleLabel = computed(() => {
    const role = this.#authService.userRole();
    return role ? USER_ROLE_LABELS[role as UserRole] : '';
  });

  protected handleLogout = (): void => {
    this.#authService.logout();
  };
}
