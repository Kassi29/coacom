import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  LucideAngularModule,
  ArrowLeft,
  Plus,
  Eye,
  Pencil,
} from 'lucide-angular';
import { ClientesService } from '@shared/services/clientes.service';
import { EquiposService } from '@shared/services/equipos.service';
import { Cliente, TIPO_CLIENTE_LABELS } from '@shared/models/cliente.model';
import { Equipo } from '@shared/models/equipo.model';
import { EquipoRegisterModal } from './components/equipo-register-modal';

type ProfileTab = 'equipos' | 'historial' | 'contratos';

const AVATAR_COLORS = [
  '#E10E1A', '#2563EB', '#7C3AED', '#059669', '#D97706',
  '#DC2626', '#4F46E5', '#0891B2', '#65A30D', '#C026D3',
];

@Component({
  selector: 'app-cliente-profile-page',
  imports: [LucideAngularModule, EquipoRegisterModal],
  templateUrl: './cliente-profile-page.html',
  styleUrl: './cliente-profile-page.scss',
})
export class ClienteProfilePage implements OnInit {
  readonly #route = inject(ActivatedRoute);
  readonly #router = inject(Router);
  readonly #clientesService = inject(ClientesService);
  readonly #equiposService = inject(EquiposService);

  protected readonly icons = { arrowLeft: ArrowLeft, plus: Plus, eye: Eye, pencil: Pencil };
  protected readonly typeLabels = TIPO_CLIENTE_LABELS;

  protected readonly client = signal<Cliente | null>(null);
  protected readonly equipment = signal<Equipo[]>([]);
  protected readonly activeTab = signal<ProfileTab>('equipos');
  protected readonly isLoading = signal(true);
  protected readonly showEquipmentModal = signal(false);

  protected readonly initials = computed(() => {
    const c = this.client();
    if (!c) return '';
    if (c.tipo === 'empresa') {
      const words = (c.razonSocial ?? '').split(' ');
      return words.slice(0, 2).map(w => w.charAt(0)).join('').toUpperCase();
    }
    return `${(c.firstName ?? '').charAt(0)}${(c.lastName ?? '').charAt(0)}`.toUpperCase();
  });

  protected readonly avatarColor = computed(() => {
    const c = this.client();
    if (!c) return AVATAR_COLORS[0];
    let hash = 0;
    const name = c.nombreCompleto;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
  });

  protected readonly stats = computed(() => {
    const c = this.client();
    return [
      { value: c?.equiposCount ?? 0, label: 'Equipos Registrados' },
      { value: 0, label: 'Servicios Totales' },
      { value: 0, label: 'Servicios Activos' },
      { value: '0', label: 'Frecuencia (visitas/mes)' },
    ];
  });

  ngOnInit(): void {
    const id = this.#route.snapshot.paramMap.get('id');
    if (id) {
      this.loadClient(id);
      this.loadEquipment(id);
    }
  }

  protected goBack = (): void => {
    this.#router.navigate(['/admin/clientes']);
  };

  protected setTab = (tab: ProfileTab): void => {
    this.activeTab.set(tab);
  };

  protected openEquipmentModal = (): void => {
    this.showEquipmentModal.set(true);
  };

  protected closeEquipmentModal = (): void => {
    this.showEquipmentModal.set(false);
  };

  protected onEquipmentCreated = (): void => {
    this.closeEquipmentModal();
    const c = this.client();
    if (c) {
      this.loadClient(c.id);
      this.loadEquipment(c.id);
    }
  };

  protected goToEquipmentDetail = (equipo: Equipo): void => {
    this.#router.navigate(['/admin/equipos', equipo.id]);
  };

  private loadClient(id: string): void {
    this.isLoading.set(true);
    this.#clientesService.getById(id).subscribe({
      next: (data) => {
        this.client.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      },
    });
  }

  private loadEquipment(clientId: string): void {
    this.#equiposService.getByClienteId(clientId).subscribe({
      next: (data) => this.equipment.set(data),
    });
  }
}
