import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { LucideAngularModule, Bell, Search } from 'lucide-angular';
import { Sidebar } from './sidebar';

@Component({
  selector: 'app-admin-layout',
  imports: [RouterOutlet, Sidebar, LucideAngularModule, ReactiveFormsModule],
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.scss',
})
export class AdminLayout {
  protected readonly icons = {
    bell: Bell,
    search: Search,
  };

  protected readonly searchControl = new FormControl('', { nonNullable: true });
  protected readonly notificationCount = signal(3);
}
