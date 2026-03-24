import { Component, inject, signal, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  LucideAngularModule,
  ArrowLeft,
  UserPlus,
  Info,
} from 'lucide-angular';
import { ClientesService, CreateClientePayload } from '@shared/services/clientes.service';
import { BranchesService } from '@shared/services/branches.service';
import { TipoCliente } from '@shared/models/cliente.model';
import { Branch } from '@shared/models/branch.model';

@Component({
  selector: 'app-cliente-create-page',
  imports: [ReactiveFormsModule, LucideAngularModule],
  templateUrl: './cliente-create-page.html',
  styleUrl: './cliente-create-page.scss',
})
export class ClienteCreatePage implements OnInit {
  readonly #clientesService = inject(ClientesService);
  readonly #branchesService = inject(BranchesService);
  readonly #router = inject(Router);

  protected readonly icons = { arrowLeft: ArrowLeft, userPlus: UserPlus, info: Info };

  protected readonly branches = signal<Branch[]>([]);
  protected readonly clientType = signal<TipoCliente>('persona');
  protected readonly isSubmitting = signal(false);
  protected readonly errorMessage = signal('');

  protected readonly form = new FormGroup({
    ci: new FormControl('', { nonNullable: true }),
    nit: new FormControl('', { nonNullable: true }),
    firstName: new FormControl('', { nonNullable: true }),
    lastName: new FormControl('', { nonNullable: true }),
    companyName: new FormControl('', { nonNullable: true }),
    phone: new FormControl('', { nonNullable: true }),
    email: new FormControl('', { nonNullable: true, validators: [Validators.email] }),
    address: new FormControl('', { nonNullable: true }),
    branchId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  ngOnInit(): void {
    this.#branchesService.getAll().subscribe({
      next: (data) => this.branches.set(data),
    });
  }

  protected setType = (tipo: TipoCliente): void => {
    this.clientType.set(tipo);
    this.errorMessage.set('');
  };

  protected goBack = (): void => {
    this.#router.navigate(['/admin/clientes']);
  };

  protected onSubmit = (): void => {
    const tipo = this.clientType();
    const val = this.form.getRawValue();

    // Validations
    if (tipo === 'persona') {
      if (!val.ci.trim()) {
        this.errorMessage.set('CI es requerido para clientes tipo Persona');
        return;
      }
      if (!val.firstName.trim() || !val.lastName.trim()) {
        this.errorMessage.set('Nombre y apellido son requeridos');
        return;
      }
    } else {
      if (!val.nit.trim()) {
        this.errorMessage.set('NIT es requerido para clientes tipo Empresa');
        return;
      }
      if (!val.companyName.trim()) {
        this.errorMessage.set('Razon social es requerida');
        return;
      }
    }

    if (!val.branchId) {
      this.errorMessage.set('Debe seleccionar una sucursal');
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    const payload: CreateClientePayload = {
      tipo,
      branchId: val.branchId,
    };

    if (tipo === 'persona') {
      payload.ci = val.ci.trim();
      payload.firstName = val.firstName.trim();
      payload.lastName = val.lastName.trim();
    } else {
      payload.nit = val.nit.trim();
      payload.razonSocial = val.companyName.trim();
    }

    if (val.phone.trim()) payload.telefono = val.phone.trim();
    if (val.email.trim()) payload.email = val.email.trim();
    if (val.address.trim()) payload.direccion = val.address.trim();

    this.#clientesService.create(payload).subscribe({
      next: (created) => {
        this.isSubmitting.set(false);
        this.#router.navigate(['/admin/clientes', created.id]);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(err.error?.message || 'Error al registrar cliente');
      },
    });
  };
}
