import { Component, inject, computed, signal } from '@angular/core';
import {
  LucideAngularModule,
  Users,
  Building2,
  Wrench,
  Shield,
  UserPlus,
  Settings,
  ArrowRight,
} from 'lucide-angular';
import { AuthService } from '@core/auth/auth.service';

interface StatCard {
  label: string;
  value: string;
  sub: string;
  subColor: string;
  icon: typeof Users;
  iconBg: string;
  iconColor: string;
}

interface ActivityItem {
  text: string;
  time: string;
  dotColor: string;
}

interface QuickAction {
  label: string;
  icon: typeof Users;
  route: string;
}

@Component({
  selector: 'app-dashboard-page',
  imports: [LucideAngularModule],
  templateUrl: './dashboard-page.html',
  styleUrl: './dashboard-page.scss',
})
export class DashboardPage {
  readonly #authService = inject(AuthService);

  protected readonly icons = {
    users: Users,
    building: Building2,
    wrench: Wrench,
    shield: Shield,
    userPlus: UserPlus,
    settings: Settings,
    arrowRight: ArrowRight,
  };

  protected readonly userName = computed(() => {
    const user = this.#authService.currentUser();
    return user ? user.firstName : 'Admin';
  });

  protected readonly stats: StatCard[] = [
    {
      label: 'Total Usuarios',
      value: '24',
      sub: '+3 este mes',
      subColor: '#16A34A',
      icon: Users,
      iconBg: '#FEF0E8',
      iconColor: '#E10E1A',
    },
    {
      label: 'Sucursales Activas',
      value: '3',
      sub: 'SCZ \u00B7 LPZ \u00B7 CBB',
      subColor: '#727272',
      icon: Building2,
      iconBg: '#DBEAFE',
      iconColor: '#3B82F6',
    },
    {
      label: 'Tecnicos Activos',
      value: '12',
      sub: '8 disponibles',
      subColor: '#16A34A',
      icon: Wrench,
      iconBg: '#FEF3C7',
      iconColor: '#F59E0B',
    },
    {
      label: 'Roles Configurados',
      value: '5',
      sub: 'Sistema completo',
      subColor: '#727272',
      icon: Shield,
      iconBg: '#DCFCE7',
      iconColor: '#16A34A',
    },
  ];

  protected readonly activities: ActivityItem[] = [
    { text: 'Nuevo usuario registrado: Carlos Mendez', time: 'Hace 2 horas', dotColor: '#16A34A' },
    { text: 'Sucursal La Paz actualizada', time: 'Hace 4 horas', dotColor: '#3B82F6' },
    { text: 'Tecnico Juan Perez asignado a orden #1042', time: 'Hace 6 horas', dotColor: '#F59E0B' },
    { text: 'Reporte mensual generado', time: 'Ayer', dotColor: '#727272' },
  ];

  protected readonly quickActions: QuickAction[] = [
    { label: 'Crear Usuario', icon: UserPlus, route: '/admin/usuarios' },
    { label: 'Ver Sucursales', icon: Building2, route: '/admin/sucursales' },
    { label: 'Configuracion', icon: Settings, route: '/admin/configuracion' },
  ];
}
