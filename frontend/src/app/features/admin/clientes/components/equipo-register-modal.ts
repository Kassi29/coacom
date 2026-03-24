import { Component, inject, input, output, signal } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import {
  LucideAngularModule,
  X,
  Plus,
  Upload,
} from 'lucide-angular';
import { EquiposService, CreateEquipoPayload } from '@shared/services/equipos.service';
import { TIPO_EQUIPO_OPTIONS, TipoEquipo } from '@shared/models/equipo.model';

@Component({
  selector: 'app-equipo-register-modal',
  imports: [ReactiveFormsModule, LucideAngularModule],
  templateUrl: './equipo-register-modal.html',
  styleUrl: './equipo-register-modal.scss',
})
export class EquipoRegisterModal {
  readonly #equiposService = inject(EquiposService);

  readonly clienteId = input.required<string>();
  readonly clienteLabel = input.required<string>();
  readonly close = output<void>();
  readonly created = output<void>();

  protected readonly icons = { x: X, plus: Plus, upload: Upload };
  protected readonly typeOptions = TIPO_EQUIPO_OPTIONS;

  protected readonly isSubmitting = signal(false);
  protected readonly errorMessage = signal('');

  protected readonly form = new FormGroup({
    numeroSerie: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    marca: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    modelo: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    tipoEquipo: new FormControl<TipoEquipo | ''>('', { nonNullable: true, validators: [Validators.required] }),
    descripcion: new FormControl('', { nonNullable: true }),
  });

  protected onClose = (): void => {
    this.close.emit();
  };

  protected onSubmit = (): void => {
    if (this.form.invalid) {
      this.errorMessage.set('Complete todos los campos requeridos');
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    const val = this.form.getRawValue();
    const payload: CreateEquipoPayload = {
      numeroSerie: val.numeroSerie.trim(),
      marca: val.marca.trim(),
      modelo: val.modelo.trim(),
      tipoEquipo: val.tipoEquipo as TipoEquipo,
      clienteId: this.clienteId(),
    };

    if (val.descripcion.trim()) {
      payload.descripcion = val.descripcion.trim();
    }

    this.#equiposService.create(payload).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.created.emit();
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(err.error?.message || 'Error al registrar equipo');
      },
    });
  };
}
