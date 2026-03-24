import { Routes } from '@angular/router';
import { authGuard } from '@core/auth/auth.guard';
import { noAuthGuard } from '@core/auth/no-auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('@features/auth/login-page').then((m) => m.LoginPage),
    canActivate: [noAuthGuard],
  },
  {
    path: 'admin',
    loadComponent: () => import('@core/layout/admin-layout').then((m) => m.AdminLayout),
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('@features/admin/dashboard/dashboard-page').then((m) => m.DashboardPage),
      },
      {
        path: 'usuarios',
        loadComponent: () =>
          import('@features/admin/users/users-page').then((m) => m.UsersPage),
      },
      {
        path: 'consultas',
        loadComponent: () =>
          import('@features/admin/search/search-page').then((m) => m.SearchPage),
      },
      {
        path: 'clientes',
        loadComponent: () =>
          import('@features/admin/clientes/clientes-page').then((m) => m.ClientesPage),
      },
      {
        path: 'clientes/nuevo',
        loadComponent: () =>
          import('@features/admin/clientes/cliente-create-page').then((m) => m.ClienteCreatePage),
      },
      {
        path: 'clientes/:id',
        loadComponent: () =>
          import('@features/admin/clientes/cliente-profile-page').then((m) => m.ClienteProfilePage),
      },
      {
        path: 'equipos/:id',
        loadComponent: () =>
          import('@features/admin/equipos/equipo-detail-page').then((m) => m.EquipoDetailPage),
      },
    ],
  },
];
