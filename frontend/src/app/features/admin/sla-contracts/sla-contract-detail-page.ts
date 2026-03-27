import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  LucideAngularModule,
  ArrowLeft,
  Pencil,
  FileDown,
  ArrowDownCircle,
  ArrowUpCircle,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from 'lucide-angular';
import { SlaContractsService, UpdateSlaContractPayload } from '@shared/services/sla-contracts.service';
import { SlaContractDetail, ContractMovement, SERVICE_OPTIONS } from '@shared/models/sla-contract.model';
import { SlaContractEditModal } from './components/sla-contract-edit-modal';

interface ContractAlert {
  type: 'error' | 'warning' | 'success';
  title: string;
  message: string;
}

@Component({
  selector: 'app-sla-contract-detail-page',
  imports: [LucideAngularModule, SlaContractEditModal],
  templateUrl: './sla-contract-detail-page.html',
  styleUrl: './sla-contract-detail-page.scss',
})
export class SlaContractDetailPage implements OnInit {
  readonly #slaService = inject(SlaContractsService);
  readonly #route = inject(ActivatedRoute);
  readonly #router = inject(Router);

  protected readonly icons = {
    arrowLeft: ArrowLeft,
    pencil: Pencil,
    fileDown: FileDown,
    arrowDown: ArrowDownCircle,
    arrowUp: ArrowUpCircle,
    alertTriangle: AlertTriangle,
    checkCircle: CheckCircle,
    xCircle: XCircle,
  };

  protected readonly contract = signal<SlaContractDetail | null>(null);
  protected readonly isLoading = signal(true);
  protected readonly showEditModal = signal(false);

  protected readonly usagePercent = computed(() => {
    const c = this.contract();
    if (!c || c.contractedHours === 0) return 0;
    return Math.round((c.usedHours / c.contractedHours) * 1000) / 10;
  });

  protected readonly reservedPercent = computed(() => {
    // Reserved hours are not in model yet, default to 0
    return 0;
  });

  protected readonly daysRemaining = computed(() => {
    const c = this.contract();
    if (!c) return 0;
    const now = new Date();
    const end = new Date(c.endDate);
    const diff = end.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  });

  protected readonly balanceColor = computed(() => {
    const c = this.contract();
    if (!c || c.contractedHours === 0) return '#16A34A';
    const pct = (c.availableBalance / c.contractedHours) * 100;
    if (pct <= 20) return '#DC2626';
    return '#16A34A';
  });

  protected readonly alerts = computed((): ContractAlert[] => {
    const c = this.contract();
    if (!c) return [];
    const result: ContractAlert[] = [];

    const balancePct = c.contractedHours > 0
      ? (c.availableBalance / c.contractedHours) * 100
      : 100;

    if (balancePct <= 20) {
      result.push({
        type: 'error',
        title: 'Saldo Bajo',
        message: `El saldo actual es ${Math.round(balancePct)}% del total. Se recomienda renovar.`,
      });
    }

    const days = this.daysRemaining();
    if (days <= 30 && days > 0) {
      result.push({
        type: 'warning',
        title: 'Vencimiento Próximo',
        message: `Faltan ${days} días para el vencimiento del contrato.`,
      });
    }

    if (c.isActive && balancePct > 20 && days > 30) {
      result.push({
        type: 'success',
        title: 'Renovación OK',
        message: 'Contrato en estado de renovación y vigente del SLA.',
      });
    }

    return result;
  });

  ngOnInit(): void {
    const id = this.#route.snapshot.paramMap.get('id');
    if (id) {
      this.loadContract(id);
    }
  }

  protected goBack = (): void => {
    this.#router.navigate(['/admin/contratos']);
  };

  protected openEditModal = (): void => {
    this.showEditModal.set(true);
  };

  protected closeEditModal = (): void => {
    this.showEditModal.set(false);
  };

  protected onContractUpdated = (payload: UpdateSlaContractPayload): void => {
    const c = this.contract();
    if (!c) return;

    // Optimistic UI: apply changes locally
    const updated: SlaContractDetail = {
      ...c,
      ...(payload.startDate && { startDate: payload.startDate }),
      ...(payload.endDate && { endDate: payload.endDate }),
      ...(payload.contractedHours !== undefined && {
        contractedHours: payload.contractedHours,
        availableBalance: payload.contractedHours - c.usedHours,
      }),
      ...(payload.responseTimeHrs !== undefined && { responseTimeHrs: payload.responseTimeHrs }),
      ...(payload.includedServices && { includedServices: payload.includedServices }),
      ...(payload.alertThreshold !== undefined && { alertThreshold: payload.alertThreshold }),
    };
    this.contract.set(updated);
    this.showEditModal.set(false);

    // Background: persist to backend
    this.#slaService.update(c.id, payload).subscribe({
      error: () => {
        // Rollback on error
        this.contract.set(c);
      },
    });
  };

  protected onContractDeactivated = (): void => {
    const c = this.contract();
    if (!c) return;

    // Optimistic
    this.contract.set({ ...c, isActive: false });
    this.showEditModal.set(false);

    this.#slaService.deactivate(c.id).subscribe({
      error: () => {
        this.contract.set(c);
      },
    });
  };

  protected formatDate = (dateStr: string): string => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  protected formatMovementDate = (dateStr: string): string => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  protected getClientInitials = (): string => {
    const c = this.contract();
    if (!c) return '';
    const name = c.client.displayName;
    const parts = name.split(' ').filter((p) => p.length > 0);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  protected getAvatarColor = (): string => {
    const c = this.contract();
    if (!c) return '#AA1919';
    const colors = ['#AA1919', '#2563EB', '#7C3AED', '#0284C7', '#059669', '#D97706'];
    let hash = 0;
    for (const ch of c.client.displayName) {
      hash = ch.charCodeAt(0) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  protected getMovementIcon = (movement: ContractMovement): typeof ArrowDownCircle => {
    return movement.type === 'deduction' ? this.icons.arrowDown : this.icons.arrowUp;
  };

  protected getMovementColor = (movement: ContractMovement): string => {
    return movement.type === 'deduction' ? '#DC2626' : '#16A34A';
  };

  protected getMovementSign = (movement: ContractMovement): string => {
    return movement.type === 'deduction'
      ? `-${movement.affectedHours}h`
      : `+${movement.affectedHours}h`;
  };

  protected getAlertIcon = (type: string): typeof AlertTriangle => {
    if (type === 'error') return this.icons.xCircle;
    if (type === 'warning') return this.icons.alertTriangle;
    return this.icons.checkCircle;
  };

  protected getAlertColor = (type: string): string => {
    if (type === 'error') return '#DC2626';
    if (type === 'warning') return '#F59E0B';
    return '#16A34A';
  };

  protected exportPdf = (): void => {
    // TODO: Implement PDF export
  };

  private loadContract(id: string): void {
    this.isLoading.set(true);
    this.#slaService.getById(id).subscribe({
      next: (data) => {
        this.contract.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      },
    });
  }
}
