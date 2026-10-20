---
trigger: always_on
---

# Regras essenciais do projeto

O guia completo está em `AGENTS.md` na raiz. Leia-o antes de qualquer alteração de código.

Regras inegociáveis:

1. **Decida o contexto primeiro**: Central (`features/central/`, rotas `/admin`) ou Tenant (`features/tenant/`). O `TenantContextService` resolve qual é em tempo de execução.
2. **Componentes standalone**, `inject()` em campos `private readonly`, estado em `signal()`, templates com `@if`/`@for (...; track ...)`. Nada de `NgModule`, `*ngIf` ou `*ngFor`.
3. **Serviços HTTP** usam URLs relativas `/api/v1/...` e retornam `Observable<T>` tipado com interfaces de `@core/models`. Não monte URL absoluta nem adicione headers de auth à mão.
4. **Respostas**: objetos e listas simples sem wrapper `data`; listas paginadas como `PaginatedResponse<T>`. Recursos são identificados por `uuid`.
5. **Erros**: trate no componente como `ApiErrorResponse`; mostre com `ToastService` e exiba `errors` (422) nos `<mat-error>` dos campos.
6. **UI só com Angular Material.** Ações destrutivas passam pelo `ConfirmDialogComponent`.
7. Textos de interface e comentários em pt-BR. Imports por alias (`@core/...`, `@shared/...`).
8. Imite as páginas de `src/app/features/central/tenants/` ao criar telas novas — leia esses arquivos antes de escrever.
9. Antes de concluir: rode o workflow `/check` (Prettier, build, testes). Não diga que passou sem ter rodado.
10. Não edite `dist/`, `.angular/`, `node_modules/` nem `environment.ts` sem pedir.
