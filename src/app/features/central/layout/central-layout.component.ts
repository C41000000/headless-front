import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CentralAuthService } from '../auth/services/central-auth.service';

@Component({
  selector: 'app-central-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './central-layout.component.html',
  styleUrl: './central-layout.component.scss',
})
export class CentralLayoutComponent {
  protected readonly authService = inject(CentralAuthService);

  public onLogout(): void {
    this.authService.logout();
  }
}
