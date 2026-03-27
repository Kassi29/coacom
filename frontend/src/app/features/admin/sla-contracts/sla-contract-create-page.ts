import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  LucideAngularModule,
  ArrowLeft,
  Search,
  Trash2,
  Info,
  AlertTriangle,
} from 'lucide-angular';
import { Subject, debounceTime, takeUntil } from 'rxjs';
import { SlaContractsService, CreateSlaContractPayload } from '@shared/services/sla-contracts.service';
import { ClientesService } from '@shared/services/clientes.service';
import { Cliente } from '@shared/models/cliente.model';
import { SERVICE_OPTIONS } from '@shared/models/sla-contract.model';

@Component({
  selector: 'app-sla-contract-create-page',
  imports: [ReactiveFormsModule, LucideAngularModule],
  templateUrl: './sla-contract-create-page.html',
  styleUrl: './sla-contract-create-page.scss',
})
export class SlaContractCreatePage implements OnInit, OnDestroy {
  readonly #slaService = inject(SlaContractsService);
  readonly #clientesService = inject(ClientesService);
  readonly #router = inject(Router);
  readonly #destroy$ = new Subject<void>();

  protected readonly icons = {
    arrowLeft: ArrowLeft,
    search: Search,
    trash: Trash2,
    info: Info,
    alertTriangle: AlertTriangle,
  };

  protected readonly serviceOptions = SERVICE_OPTIONS;

  protected readonly clientSearchControl = new FormControl('', { nonNullable: true });
  protected readonly clientResults = signal<Cliente[]>([]);
  protected readonly selectedClient = signal<Cliente | null>(null);
  protected readonly showDropdown = signal(false);
  protected readonly isSubmitting = signal(false);
  protected readonly errorMessage = signal('');

  protected readonly form = new FormGroup({
    startDate: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    endDate: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    contractedHours: new FormControl<number | null>(null, { validators: [Validators.required, Validators.min(1)] }),
    responseTimeHrs: new FormControl<number | null>(null, { validators: [Validators.required, Validators.min(1)] }),
  });

  protected readonly selectedServices = signal<Set<string>>(new Set());

  ngOnInit(): void {
    this.clientSearchControl.valueChanges
      .pipe(debounceTime(300), takeUntil(this.#destroy$))
      .subscribe((value) => {
        const search = value.trim();
        if (search.length < 2) {
          this.clientResults.set([]);
          this.showDropdown.set(false);
          return;
        }
        this.#clientesService.getAll({ search, limit: 5 }).subscribe({
          next: (res) => {
            this.clientResults.set(res.data);
            this.showDropdown.set(res.data.length > 0);
          },
        });
      });
  }

  ngOnDestroy(): void {
    this.#destroy$.next();
    this.#destroy$.complete();
  }

  protected selectClient = (client: Cliente): void => {
    this.selectedClient.set(client);
    this.clientSearchControl.setValue('');
    this.showDropdown.set(false);
    this.clientResults.set([]);
  };

  protected clearClient = (): void => {
    this.selectedClient.set(null);
  };

  protected toggleService = (serviceValue: string): void => {
    const current = new Set(this.selectedServices());
    if (current.has(serviceValue)) {
      current.delete(serviceValue);
    } else {
      current.add(serviceValue);
    }
    this.selectedServices.set(current);
  };

  protected isServiceSelected = (serviceValue: string): boolean => {
    return this.selectedServices().has(serviceValue);
  };

  protected goBack = (): void => {
    this.#router.navigate(['/admin/contratos']);
  };

  protected onSubmit = (): void => {
    this.errorMessage.set('');

    const client = this.selectedClient();
    if (!client) {
      this.errorMessage.set('Debe seleccionar un cliente corporativo');
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorMessage.set('Complete todos los campos requeridos');
      return;
    }

    const val = this.form.getRawValue();

    if (new Date(val.endDate) <= new Date(val.startDate)) {
      this.errorMessage.set('La fecha fin debe ser posterior a la fecha de inicio');
      return;
    }

    if (this.selectedServices().size === 0) {
      this.errorMessage.set('Debe seleccionar al menos un servicio incluido');
      return;
    }

    this.isSubmitting.set(true);

    const payload: CreateSlaContractPayload = {
      clientId: client.id,
      startDate: val.startDate,
      endDate: val.endDate,
      contractedHours: val.contractedHours!,
      responseTimeHrs: val.responseTimeHrs!,
      includedServices: Array.from(this.selectedServices()),
    };

    this.#slaService.create(payload).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.#router.navigate(['/admin/contratos']);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(err.error?.message || 'Error al registrar contrato');
      },
    });
  };

  protected hideDropdown = (): void => {
    // Delay to allow click on dropdown item
    setTimeout(() => this.showDropdown.set(false), 200);
  };
}
