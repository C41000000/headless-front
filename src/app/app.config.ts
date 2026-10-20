import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';
import { apiBaseUrlInterceptor, apiErrorInterceptor, authInterceptor } from '@core/http';
import { VisualIdentityService } from '@core/tenant';
import { ThemeService } from '@core/theme';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideAnimationsAsync(),
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([apiBaseUrlInterceptor, authInterceptor, apiErrorInterceptor]),
    ),
    // Aplica o tema salvo antes da primeira renderização
    provideAppInitializer(() => {
      inject(ThemeService);
    }),
    provideAppInitializer(() => {
      const visualIdentityService = inject(VisualIdentityService);
      return visualIdentityService.loadVisualIdentity();
    }),
  ],
};
