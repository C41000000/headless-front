import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CentralAuthService } from '../auth/services/central-auth.service';

@Component({
  selector: 'app-central-layout',
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
  templateUrl: './central-layout.component.html',
  styleUrl: './central-layout.component.scss',
})
export class CentralLayoutComponent {
  protected readonly authService = inject(CentralAuthService);

  public onLogout(): void {
    this.authService.logout();
  }
}
