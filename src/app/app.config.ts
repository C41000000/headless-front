import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { apiBaseUrlInterceptor, apiErrorInterceptor, authInterceptor } from '@core/http';
import { VisualIdentityService } from '@core/tenant';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([apiBaseUrlInterceptor, authInterceptor, apiErrorInterceptor]),
    ),
    provideAppInitializer(() => {
      const visualIdentityService = inject(VisualIdentityService);
      return visualIdentityService.loadVisualIdentity();
    }),
  ],
};
