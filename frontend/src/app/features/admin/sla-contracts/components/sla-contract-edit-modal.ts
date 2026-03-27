import { Component, input, output, signal, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { LucideAngularModule, X } from 'lucide-angular';
import { SlaContract, SlaContractDetail, SERVICE_OPTIONS, SERVICE_COLORS } from '@shared/models/sla-contract.model';
import { UpdateSlaContractPayload } from '@shared/services/sla-contracts.service';

@Component({
  selector: 'app-sla-contract-edit-modal',
  imports: [ReactiveFormsModule, LucideAngularModule],
  templateUrl: './sla-contract-edit-modal.html',
  styleUrl: './sla-contract-edit-modal.scss',
})
export class SlaContractEditModal implements OnInit {
  readonly contract = input.required<SlaContract | SlaContractDetail>();
  readonly close = output<void>();
  readonly updated = output<UpdateSlaContractPayload>();
  readonly deactivated = output<void>();

  protected readonly icons = { x: X };
  protected readonly serviceOptions = SERVICE_OPTIONS;
  protected readonly serviceColors = SERVICE_COLORS;

  protected readonly form = new FormGroup({
    startDate: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    endDate: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    contractedHours: new FormControl<number | null>(null, { validators: [Validators.required, Validators.min(1)] }),
    responseTimeHrs: new FormControl<number | null>(null, { validators: [Validators.required, Validators.min(1)] }),
    alertThreshold: new FormControl(20, { nonNullable: true, validators: [Validators.min(0), Validators.max(100)] }),
  });

  protected readonly selectedServices = signal<Set<string>>(new Set());
  protected readonly errorMessage = signal('');

  ngOnInit(): void {
    const c = this.contract();
    this.form.patchValue({
      startDate: c.startDate.substring(0, 10),
      endDate: c.endDate.substring(0, 10),
      contractedHours: c.contractedHours,
      responseTimeHrs: c.responseTimeHrs,
      alertThreshold: c.alertThreshold,
    });
    this.selectedServices.set(new Set(c.includedServices));
  }

  protected getClientInitials = (): string => {
    const name = this.contract().client.displayName;
    const parts = name.split(' ').filter((p) => p.length > 0);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  protected getAvatarColor = (): string => {
    const colors = ['#AA1919', '#2563EB', '#7C3AED', '#0284C7', '#059669', '#D97706'];
    let hash = 0;
    for (const ch of this.contract().client.displayName) {
      hash = ch.charCodeAt(0) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
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

  protected getServiceColor = (serviceValue: string): { bg: string; text: string } => {
    return this.serviceColors[serviceValue] ?? { bg: '#F5F5F5', text: '#171717' };
  };

  protected handleSubmit = (): void => {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const val = this.form.getRawValue();

    if (new Date(val.endDate) <= new Date(val.startDate)) {
      this.errorMessage.set('La fecha fin debe ser posterior a la fecha de inicio');
      return;
    }

    const payload: UpdateSlaContractPayload = {
      startDate: val.startDate,
      endDate: val.endDate,
      contractedHours: val.contractedHours!,
      responseTimeHrs: val.responseTimeHrs!,
      includedServices: Array.from(this.selectedServices()),
      alertThreshold: val.alertThreshold,
    };

    this.updated.emit(payload);
  };

  protected handleDeactivate = (): void => {
    this.deactivated.emit();
  };

  protected handleClose = (): void => {
    this.close.emit();
  };

  protected onOverlayClick = (event: MouseEvent): void => {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.handleClose();
    }
  };
}
