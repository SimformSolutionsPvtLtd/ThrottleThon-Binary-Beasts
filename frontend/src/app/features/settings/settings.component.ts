import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'ss-settings',
  standalone: true,
  imports: [MatCardModule],
  template: `
    <h1 class="text-2xl font-semibold mb-4">Settings</h1>
    <mat-card class="p-4">Configure integrations, AI provider, tenancy.</mat-card>
  `,
})
export class SettingsComponent {}
