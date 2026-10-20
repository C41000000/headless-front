import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TenantContextService, VisualIdentityService } from '@core/tenant';
import { TenantAuthService } from '../auth/services/tenant-auth.service';

@Component({
  selector: 'app-tenant-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatDividerModule,
  ],
  templateUrl: './tenant-layout.component.html',
  styleUrl: './tenant-layout.component.scss',
})
export class TenantLayoutComponent {
  protected readonly authService = inject(TenantAuthService);
  protected readonly tenantContext = inject(TenantContextService);
  protected readonly visualIdentityService = inject(VisualIdentityService);

  public onLogout(): void {
    this.authService.logout();
  }
}
