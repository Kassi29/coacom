import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import {
  LucideAngularModule,
  ArrowLeft,
  Pencil,
  Printer,
  ChevronRight,
  Monitor,
  Users,
  Calendar,
  Wrench,
} from 'lucide-angular';
import { EquiposService } from '@shared/services/equipos.service';
import { Equipo } from '@shared/models/equipo.model';

interface TimelineEntry {
  date: string;
  title: string;
  description: string;
  status: string;
  statusColor: 'green' | 'yellow' | 'blue' | 'red' | 'gray';
}

@Component({
  selector: 'app-equipo-detail-page',
  imports: [LucideAngularModule, DatePipe],
  templateUrl: './equipo-detail-page.html',
  styleUrl: './equipo-detail-page.scss',
})
export class EquipoDetailPage implements OnInit {
  readonly #route = inject(ActivatedRoute);
  readonly #router = inject(Router);
  readonly #equiposService = inject(EquiposService);

  protected readonly icons = {
    arrowLeft: ArrowLeft,
    pencil: Pencil,
    printer: Printer,
    chevronRight: ChevronRight,
    monitor: Monitor,
    users: Users,
    calendar: Calendar,
    wrench: Wrench,
  };

  protected readonly equipment = signal<Equipo | null>(null);
  protected readonly isLoading = signal(true);

  protected readonly breadcrumbs = computed(() => {
    const e = this.equipment();
    if (!e) return [];
    return [
      { label: 'Clientes', link: '/admin/clientes' },
      { label: e.cliente?.nombreCompleto ?? '', link: e.cliente ? `/admin/clientes/${e.clienteId}` : '' },
      { label: e.numeroSerie, link: '' },
    ];
  });

  protected readonly statusBadge = computed(() => {
    const e = this.equipment();
    if (!e) return { label: '', cssClass: '' };
    return e.isActive
      ? { label: 'Activo', cssClass: 'status-active' }
      : { label: 'Inactivo', cssClass: 'status-inactive' };
  });

  protected readonly timeline = computed((): TimelineEntry[] => {
    const e = this.equipment();
    if (!e) return [];
    return [
      {
        date: e.createdAt,
        title: 'Equipo Registrado',
        description: `Se registró el equipo ${e.marca} ${e.modelo} (S/N: ${e.numeroSerie}) en el sistema.`,
        status: 'Registrado',
        statusColor: 'gray' as const,
      },
    ];
  });

  ngOnInit(): void {
    const id = this.#route.snapshot.paramMap.get('id');
    if (id) {
      this.loadEquipment(id);
    }
  }

  protected goBack = (): void => {
    const e = this.equipment();
    if (e) {
      this.#router.navigate(['/admin/clientes', e.clienteId]);
    } else {
      this.#router.navigate(['/admin/clientes']);
    }
  };

  protected navigateTo = (link: string): void => {
    if (link) this.#router.navigate([link]);
  };

  private loadEquipment(id: string): void {
    this.isLoading.set(true);
    this.#equiposService.getById(id).subscribe({
      next: (data) => {
        this.equipment.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      },
    });
  }
}
