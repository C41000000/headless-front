import { Component, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { TenantContextService } from '@core/tenant';
import { TenantAuthService } from '../../../auth/services/tenant-auth.service';

@Component({
  selector: 'app-tenant-home',
  standalone: true,
  imports: [MatCardModule, MatIconModule],
  templateUrl: './tenant-home.component.html',
  styleUrl: './tenant-home.component.scss',
})
export class TenantHomeComponent {
  protected readonly authService = inject(TenantAuthService);
  protected readonly tenantContext = inject(TenantContextService);
}
