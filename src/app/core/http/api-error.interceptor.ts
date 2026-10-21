import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { TokenService } from '@core/auth/token.service';
import { ApiErrorResponse } from '@core/models';
import { TenantContextService } from '@core/tenant/tenant-context.service';
import { catchError, throwError } from 'rxjs';

function translateErrorMessage(msg: string): string {
  if (!msg) return msg;

  if (/has already been taken/i.test(msg)) {
    if (/domain/i.test(msg)) return 'Este domínio já está em uso na plataforma.';
    if (/name/i.test(msg)) return 'Este nome já está em uso na plataforma.';
    if (/email/i.test(msg)) return 'Este e-mail já está em uso.';
    return 'Este valor já está em uso na plataforma.';
  }

  if (/field is required/i.test(msg) || /is required/i.test(msg)) {
    return 'Este campo é obrigatório.';
  }

  if (/The given data was invalid/i.test(msg)) {
    return 'Os dados informados contêm erros de validação.';
  }

  return msg;
}

export const apiErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenService = inject(TokenService);
  const tenantContext = inject(TenantContextService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse) {
        const retryAfterHeader = error.headers.get('Retry-After');
        const retryAfter = retryAfterHeader ? parseInt(retryAfterHeader, 10) : null;

        let rawMessage =
          error.error?.message || error.message || 'Erro inesperado na comunicação com o servidor.';
        let translatedErrors: Record<string, string[]> | undefined = undefined;

        if (error.error?.errors && typeof error.error.errors === 'object') {
          translatedErrors = {};
          for (const [key, messages] of Object.entries(
            error.error.errors as Record<string, string[]>,
          )) {
            translatedErrors[key] = Array.isArray(messages)
              ? messages.map((m) => translateErrorMessage(m))
              : [translateErrorMessage(String(messages))];
          }

          // Se a mensagem principal for genérica ou em inglês, usa a primeira mensagem traduzida do campo
          const firstKey = Object.keys(translatedErrors)[0];
          if (firstKey && translatedErrors[firstKey].length > 0) {
            rawMessage = translatedErrors[firstKey][0];
          }
        }

        const apiError: ApiErrorResponse = {
          status: error.status,
          statusText: error.statusText,
          message: translateErrorMessage(rawMessage),
          errors: translatedErrors,
          retryAfter,
        };

        // Tratamento de 401 Unauthorized
        if (error.status === 401 && !req.url.includes('/auth/login')) {
          if (tenantContext.isCentral()) {
            tokenService.clearCentralToken();
            router.navigate(['/admin/login']);
          } else {
            tokenService.clearTenantToken();
            router.navigate(['/auth/login']);
          }
        }

        return throwError(() => apiError);
      }

      const genericError: ApiErrorResponse = {
        status: 0,
        statusText: 'Unknown Error',
        message: 'Ocorreu um erro desconhecido.',
      };

      return throwError(() => genericError);
    }),
  );
};
